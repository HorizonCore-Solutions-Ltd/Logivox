export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const quarantineSchema = z.object({
  reason: z.string().min(1),
});

// POST /api/lots/[id]/quarantine - Quarantine a lot
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        role: { in: ["ADMIN", "MANAGER"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const lot = await prisma.lot.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    if (lot.isQuarantined) {
      return NextResponse.json(
        { error: "Lot is already quarantined" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { reason } = quarantineSchema.parse(body);

    const updated = await prisma.lot.update({
      where: { id: params.id },
      data: {
        isQuarantined: true,
        quarantineReason: reason,
        quarantineDate: new Date(),
        status: "QUARANTINED",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "LOT_QUARANTINED",
        entityType: "LOT",
        entityId: lot.id,
        metadata: {
          lotNumber: lot.lotNumber,
          reason,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error quarantining lot:", error);
    return NextResponse.json(
      { error: "Failed to quarantine lot" },
      { status: 500 },
    );
  }
}

// DELETE /api/lots/[id]/quarantine - Release from quarantine
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        role: { in: ["ADMIN", "MANAGER"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const lot = await prisma.lot.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    if (!lot.isQuarantined) {
      return NextResponse.json(
        { error: "Lot is not quarantined" },
        { status: 400 },
      );
    }

    const updated = await prisma.lot.update({
      where: { id: params.id },
      data: {
        isQuarantined: false,
        status: lot.currentQuantity > 0 ? "AVAILABLE" : "DEPLETED",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "LOT_RELEASED_FROM_QUARANTINE",
        entityType: "LOT",
        entityId: lot.id,
        metadata: {
          lotNumber: lot.lotNumber,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error releasing lot from quarantine:", error);
    return NextResponse.json(
      { error: "Failed to release lot from quarantine" },
      { status: 500 },
    );
  }
}
