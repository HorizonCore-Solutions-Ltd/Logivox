import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CheckinSchema = z.object({
  returnedBy: z.string(),
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "BROKEN"]),
  notes: z.string().optional(),
});

// POST /api/security/equipment/[id]/checkin - Checkin equipment
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
    const body = CheckinSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    // Get equipment
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 },
      );
    }

    if (equipment.status !== "IN_USE") {
      return NextResponse.json(
        { error: "Equipment is not checked out" },
        { status: 400 },
      );
    }

    // Find active checkout
    const activeCheckout = await prisma.equipmentCheckout.findFirst({
      where: {
        equipmentId: params.id,
        returnTime: null,
      },
      orderBy: { checkoutTime: "desc" },
    });

    if (!activeCheckout) {
      return NextResponse.json(
        { error: "No active checkout found" },
        { status: 404 },
      );
    }

    // Update checkout record
    await prisma.equipmentCheckout.update({
      where: { id: activeCheckout.id },
      data: {
        returnTime: new Date(),
        returnedBy: body.returnedBy,
        condition: body.condition,
        notes: body.notes,
      },
    });

    // Determine new status based on condition
    let newStatus: "AVAILABLE" | "MAINTENANCE" | "DAMAGED" = "AVAILABLE";
    if (body.condition === "BROKEN") {
      newStatus = "DAMAGED";
    } else if (body.condition === "POOR") {
      newStatus = "MAINTENANCE";
    }

    // Update equipment
    await prisma.equipment.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        currentGuardId: null,
        condition: body.condition,
      },
    });

    return NextResponse.json({ success: true, newStatus });
  } catch (error: any) {
    console.error("Error checking in equipment:", error);
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
