export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTransferSchema = z.object({
  status: z
    .enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  scheduledDate: z.string().nullable().optional(),
});

// GET /api/warehouse-transfers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const transfer = await prisma.warehouseTransfer.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        fromLocation: true,
        toLocation: true,
        inventoryItem: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(transfer);
  } catch (error: any) {
    console.error("Error fetching transfer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transfer" },
      { status: 500 },
    );
  }
}

// PUT /api/warehouse-transfers/[id] - Update transfer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const existingTransfer = await prisma.warehouseTransfer.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
    });

    if (!existingTransfer) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 },
      );
    }

    // Cannot update completed or cancelled transfers
    if (["COMPLETED", "CANCELLED"].includes(existingTransfer.status)) {
      return NextResponse.json(
        { error: "Cannot update completed or cancelled transfer" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateTransferSchema.parse(body);

    const transfer = await prisma.warehouseTransfer.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        scheduledDate: validatedData.scheduledDate
          ? new Date(validatedData.scheduledDate)
          : undefined,
      },
      include: {
        fromLocation: true,
        toLocation: true,
        inventoryItem: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "TRANSFER_UPDATED",
        entityType: "WAREHOUSE_TRANSFER",
        entityId: transfer.id,
        metadata: {
          transferNumber: transfer.transferNumber,
          changes: validatedData,
        },
      },
    });

    return NextResponse.json(transfer);
  } catch (error: any) {
    console.error("Error updating transfer:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update transfer" },
      { status: 500 },
    );
  }
}
