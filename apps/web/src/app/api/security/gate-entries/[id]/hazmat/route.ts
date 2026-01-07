import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createHazmatSchema = z.object({
  unNumber: z.string().min(1),
  hazmatClass: z.string().min(1),
  properShippingName: z.string().min(1),
  packingGroup: z.string().optional(),
  quantity: z.number().positive(),
  quantityUnit: z.string(),
  permitNumber: z.string().optional(),
  permitExpiryDate: z.string().datetime().optional(),
  emergencyContact: z.string().min(1),
  emergencyPhone: z.string().min(1),
  spillProcedure: z.string().optional(),
  requiresSpecialParking: z.boolean().default(true),
  specialParkingZone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gateEntryId = params.id;

    // Verify gate entry exists and belongs to organization
    const gateEntry = await prisma.gateEntry.findFirst({
      where: {
        id: gateEntryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!gateEntry) {
      return NextResponse.json(
        { error: "Gate entry not found" },
        { status: 404 },
      );
    }

    // Check if entry already has hazmat record
    const existingHazmat = await prisma.hazmatRecord.findFirst({
      where: { gateEntryId },
    });

    if (existingHazmat) {
      return NextResponse.json(
        { error: "Hazmat record already exists for this entry" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const data = createHazmatSchema.parse(body);

    // Check if permit is expired
    const isPermitExpired = data.permitExpiryDate
      ? new Date(data.permitExpiryDate) < new Date()
      : false;

    if (isPermitExpired) {
      return NextResponse.json(
        { error: "Hazmat permit has expired" },
        { status: 400 },
      );
    }

    // Create hazmat record
    const hazmatRecord = await prisma.hazmatRecord.create({
      data: {
        gateEntryId,
        organizationId: session.user.organizationId,
        unNumber: data.unNumber,
        hazmatClass: data.hazmatClass,
        properShippingName: data.properShippingName,
        packingGroup: data.packingGroup,
        quantity: data.quantity,
        quantityUnit: data.quantityUnit,
        permitNumber: data.permitNumber,
        permitExpiryDate: data.permitExpiryDate
          ? new Date(data.permitExpiryDate)
          : null,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        spillProcedure: data.spillProcedure,
        requiresSpecialParking: data.requiresSpecialParking,
        specialParkingZone: data.specialParkingZone,
        recordedBy: session.user.id,
        notes: data.notes,
      },
    });

    // Update gate entry to mark hazardous goods
    await prisma.gateEntry.update({
      where: { id: gateEntryId },
      data: {
        hasDangerousGoods: true,
      },
    });

    // Create alert for high-risk hazmat classes
    const highRiskClasses = ["1", "2.1", "2.3", "5.2", "6.1", "6.2", "7"];
    if (highRiskClasses.some((cls) => data.hazmatClass.startsWith(cls))) {
      await prisma.securityAlert.create({
        data: {
          organizationId: session.user.organizationId,
          type: "HAZMAT_ARRIVAL",
          severity: "HIGH",
          message: `High-risk hazmat vehicle arrived: UN${data.unNumber} - ${data.properShippingName} (Class ${data.hazmatClass})`,
          metadata: {
            gateEntryId,
            unNumber: data.unNumber,
            hazmatClass: data.hazmatClass,
            licensePlate: gateEntry.licensePlate,
          },
        },
      });
    }

    // Find suitable hazmat-approved parking if requested
    let recommendedParking = null;
    if (data.requiresSpecialParking && gateEntry.warehouseId) {
      const availableSpot = await prisma.parkingSpot.findFirst({
        where: {
          organizationId: session.user.organizationId,
          warehouseId: gateEntry.warehouseId,
          hazmatApproved: true,
          status: "AVAILABLE",
        },
        orderBy: { spotNumber: "asc" },
      });

      recommendedParking = availableSpot;
    }

    return NextResponse.json(
      {
        hazmatRecord,
        recommendedParking,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error creating hazmat record:", error);
    return NextResponse.json(
      { error: "Failed to create hazmat record" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gateEntryId = params.id;

    // Verify gate entry exists and belongs to organization
    const gateEntry = await prisma.gateEntry.findFirst({
      where: {
        id: gateEntryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!gateEntry) {
      return NextResponse.json(
        { error: "Gate entry not found" },
        { status: 404 },
      );
    }

    const hazmatRecords = await prisma.hazmatRecord.findMany({
      where: { gateEntryId },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json({ hazmatRecords });
  } catch (error) {
    console.error("Error fetching hazmat records:", error);
    return NextResponse.json(
      { error: "Failed to fetch hazmat records" },
      { status: 500 },
    );
  }
}
