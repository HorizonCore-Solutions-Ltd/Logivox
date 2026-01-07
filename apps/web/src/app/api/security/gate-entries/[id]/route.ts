import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateGateEntrySchema = z.object({
  exitTime: z.string().datetime().optional(),
  securityCheckPassed: z.boolean().optional(),
  securityCheckNotes: z.string().optional(),
  cargoInspected: z.boolean().optional(),
  cargoDetails: z.string().optional(),
  sealVerified: z.boolean().optional(),
  parkingLocation: z.string().optional(),
  notes: z.string().optional(),
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

    const entry = await prisma.gateEntry.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        securityPersonnel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeNumber: true,
            clearanceLevel: true,
          },
        },
        appointment: {
          include: {
            yardLocation: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Gate entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching gate entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch gate entry" },
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
    const validatedData = updateGateEntrySchema.parse(body);

    const entry = await prisma.gateEntry.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: {
        ...validatedData,
        exitTime: validatedData.exitTime
          ? new Date(validatedData.exitTime)
          : undefined,
      },
      include: {
        securityPersonnel: true,
        appointment: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "GATE_ENTRY",
        entityId: entry.id,
        description: `Updated gate entry ${entry.entryNumber}`,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error updating gate entry:", error);
    return NextResponse.json(
      { error: "Failed to update gate entry" },
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

    const entry = await prisma.gateEntry.delete({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "DELETE",
        entity: "GATE_ENTRY",
        entityId: entry.id,
        description: `Deleted gate entry ${entry.entryNumber}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting gate entry:", error);
    return NextResponse.json(
      { error: "Failed to delete gate entry" },
      { status: 500 },
    );
  }
}
