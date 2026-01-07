import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/services/email-service";

const approvalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

const checkInSchema = z.object({
  qrCode: z.string(),
  securityPersonnelId: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const registration = await prisma.visitorPreRegistration.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        visitor: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Pre-registration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(registration);
  } catch (error) {
    console.error("Error fetching pre-registration:", error);
    return NextResponse.json(
      { error: "Failed to fetch pre-registration" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = approvalSchema.parse(body);

    const registration = await prisma.visitorPreRegistration.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: {
        status: validatedData.status,
        approvedBy: session.user.id,
        approvedAt: new Date(),
        rejectionReason: validatedData.rejectionReason,
      },
    });

    // Send email notification
    if (registration.email) {
      const statusMessage =
        validatedData.status === "APPROVED"
          ? "approved"
          : `rejected${validatedData.rejectionReason ? ": " + validatedData.rejectionReason : ""}`;

      await sendEmail({
        to: registration.email,
        subject: `Pre-Registration ${validatedData.status}`,
        html: `
          <h2>Pre-Registration Update</h2>
          <p>Dear ${registration.visitorName},</p>
          <p>Your pre-registration (${registration.registrationNumber}) has been ${statusMessage}.</p>
          ${
            validatedData.status === "APPROVED"
              ? `
            <p><strong>Visit Details:</strong></p>
            <ul>
              <li>Date: ${registration.visitDate.toLocaleDateString()}</li>
              <li>Purpose: ${registration.purpose}</li>
              <li>QR Code: ${registration.qrCode}</li>
            </ul>
          `
              : ""
          }
        `,
      });
    }

    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "VISITOR_PRE_REGISTRATION",
        entityId: registration.id,
        description: `${validatedData.status} pre-registration ${registration.registrationNumber}`,
      },
    });

    return NextResponse.json(registration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error updating pre-registration:", error);
    return NextResponse.json(
      { error: "Failed to update pre-registration" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const registration = await prisma.visitorPreRegistration.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: { status: "CANCELLED" },
    });

    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "DELETE",
        entity: "VISITOR_PRE_REGISTRATION",
        entityId: registration.id,
        description: `Cancelled pre-registration ${registration.registrationNumber}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling pre-registration:", error);
    return NextResponse.json(
      { error: "Failed to cancel pre-registration" },
      { status: 500 },
    );
  }
}
