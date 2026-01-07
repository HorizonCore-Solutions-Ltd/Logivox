import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MaintenanceSchema = z.object({
  maintenanceType: z.enum([
    "ROUTINE",
    "REPAIR",
    "CALIBRATION",
    "BATTERY_REPLACEMENT",
    "SOFTWARE_UPDATE",
    "INSPECTION",
  ]),
  performedBy: z.string(),
  nextDueDate: z.string().optional(),
  cost: z.number().optional(),
  description: z.string(),
  partsReplaced: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/security/equipment/[id]/maintenance - Log maintenance
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = MaintenanceSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const maintenance = await prisma.equipmentMaintenance.create({
      data: {
        organizationId,
        equipmentId: params.id,
        maintenanceType: body.maintenanceType,
        performedBy: body.performedBy,
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
        cost: body.cost,
        description: body.description,
        partsReplaced: body.partsReplaced,
        notes: body.notes,
      },
    });

    // Update equipment's last/next maintenance dates
    await prisma.equipment.update({
      where: { id: params.id },
      data: {
        lastMaintenanceDate: new Date(),
        nextMaintenanceDate: body.nextDueDate
          ? new Date(body.nextDueDate)
          : null,
        ...(body.maintenanceType === "REPAIR" && {
          status: "AVAILABLE",
          condition: "GOOD",
        }),
      },
    });

    return NextResponse.json(maintenance);
  } catch (error: any) {
    console.error("Error logging maintenance:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/security/equipment/[id]/maintenance - Get maintenance history
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const logs = await prisma.equipmentMaintenance.findMany({
      where: {
        organizationId,
        equipmentId: params.id,
      },
      orderBy: { maintenanceDate: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Error fetching maintenance history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
