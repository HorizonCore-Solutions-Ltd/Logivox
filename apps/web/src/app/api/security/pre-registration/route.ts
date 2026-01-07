import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/services/email-service";
import crypto from "crypto";

const preRegistrationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  visitorType: z
    .enum([
      "CONTRACTOR",
      "VENDOR",
      "CUSTOMER",
      "AUDITOR",
      "CANDIDATE",
      "GUEST",
      "OTHER",
    ])
    .default("GUEST"),
  visitDate: z.string().datetime(),
  visitPurpose: z.string().min(1),
  expectedDuration: z.number().optional(),
  hostEmployeeId: z.string().optional(),
  hostName: z.string().min(1),
  hostEmail: z.string().email().optional(),
  hostDepartment: z.string().optional(),
  escortRequired: z.boolean().default(false),
  allowedAreas: z.array(z.string()).optional(),
  specialInstructions: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const search = searchParams.get("search");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) where.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.visitDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { registrationNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [registrations, total] = await Promise.all([
      prisma.visitorPreRegistration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { visitDate: "desc" },
        include: {
          visitor: {
            select: {
              id: true,
              badgeNumber: true,
              status: true,
              checkInTime: true,
            },
          },
        },
      }),
      prisma.visitorPreRegistration.count({ where }),
    ]);

    return NextResponse.json({
      data: registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pre-registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch pre-registrations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = preRegistrationSchema.parse(body);

    // Generate unique registration number
    const lastReg = await prisma.visitorPreRegistration.findFirst({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      select: { registrationNumber: true },
    });

    const lastNumber = lastReg?.registrationNumber
      ? parseInt(lastReg.registrationNumber.replace(/\D/g, ""))
      : 0;
    const registrationNumber = `REG${String(lastNumber + 1).padStart(6, "0")}`;

    // Generate QR code data (unique hash)
    const qrCodeData = crypto
      .createHash("sha256")
      .update(`${registrationNumber}-${validatedData.email}-${Date.now()}`)
      .digest("hex")
      .substring(0, 16);

    // Calculate expiry (visit date + 1 day)
    const visitDate = new Date(validatedData.visitDate);
    const expiresAt = new Date(visitDate);
    expiresAt.setDate(expiresAt.getDate() + 1);

    const registration = await prisma.visitorPreRegistration.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
        registrationNumber,
        qrCode: qrCodeData,
        visitDate: new Date(validatedData.visitDate),
        expiresAt,
        status: "PENDING",
      },
    });

    // Send email with QR code
    await this.sendPreRegistrationEmail(registration);

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "CREATE",
        entity: "VISITOR_PRE_REGISTRATION",
        entityId: registration.id,
        description: `Pre-registered visitor ${validatedData.firstName} ${validatedData.lastName}`,
        metadata: {
          registrationNumber,
          visitDate: validatedData.visitDate,
        },
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error creating pre-registration:", error);
    return NextResponse.json(
      { error: "Failed to create pre-registration" },
      { status: 500 },
    );
  }

  async function sendPreRegistrationEmail(registration: any) {
    if (registration.email) {
      await sendEmail({
        to: registration.email,
        subject: "Visitor Pre-Registration Confirmation",
        html: `
          <h2>Pre-Registration Confirmed</h2>
          <p>Dear ${registration.visitorName},</p>
          <p>Your visitor pre-registration has been confirmed:</p>
          <ul>
            <li><strong>Registration Number:</strong> ${registration.registrationNumber}</li>
            <li><strong>Visit Date:</strong> ${registration.visitDate.toLocaleDateString()}</li>
            <li><strong>Purpose:</strong> ${registration.purpose}</li>
            <li><strong>QR Code:</strong> ${registration.qrCode}</li>
          </ul>
          <p>Please present this QR code at the gate for expedited entry.</p>
        `,
      });
    }
  }
}
