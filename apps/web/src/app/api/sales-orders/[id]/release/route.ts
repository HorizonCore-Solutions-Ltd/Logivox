/**
 * POST /api/sales-orders/[id]/release
 *
 * Transitions an APPROVED order to RELEASED and optionally creates / assigns
 * it to a wave.  This is the entry point for fulfilment.
 *
 * Body (all optional):
 *   addToWave    boolean   – auto-create or assign to existing open wave
 *   waveId       string    – assign to a specific existing wave
 *   warehouseId  string    – warehouse to fulfil from (overrides order value)
 *   notes        string    – release notes stored internally
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const order = await prisma.salesOrder.findFirst({
      where: { id: params.id, organizationId },
      include: { items: true, customer: true, warehouse: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!["APPROVED", "DRAFT"].includes(order.status)) {
      return NextResponse.json(
        {
          error: `Cannot release an order with status "${order.status}". Must be APPROVED or DRAFT.`,
        },
        { status: 422 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { addToWave = false, waveId, warehouseId, notes } = body;

    // Determine warehouse
    const effectiveWarehouseId = warehouseId || order.warehouseId;
    if (!effectiveWarehouseId) {
      return NextResponse.json(
        { error: "No warehouse assigned. Provide warehouseId in body." },
        { status: 422 },
      );
    }

    let assignedWaveId: string | undefined;

    if (addToWave || waveId) {
      if (waveId) {
        // Verify wave exists and is still open
        const wave = await prisma.wavePickingBatch.findFirst({
          where: {
            id: waveId,
            status: { in: ["PENDING", "PLANNED"] },
          },
        });
        if (!wave) {
          return NextResponse.json(
            { error: "Wave not found or already started" },
            { status: 404 },
          );
        }
        assignedWaveId = waveId;
      } else {
        // Auto-assign to or create today's open wave for this warehouse
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let openWave = await prisma.wavePickingBatch.findFirst({
          where: {
            warehouseId: effectiveWarehouseId,
            status: "PENDING",
            createdAt: { gte: today },
          },
          orderBy: { createdAt: "asc" },
        });

        if (!openWave) {
          const dateStr = new Date()
            .toISOString()
            .split("T")[0]
            .replace(/-/g, "");
          const waveCount = await prisma.wavePickingBatch.count({
            where: {
              warehouseId: effectiveWarehouseId,
              createdAt: { gte: today },
            },
          });
          openWave = await prisma.wavePickingBatch.create({
            data: {
              waveNumber: `WAVE-${dateStr}-${String(waveCount + 1).padStart(3, "0")}`,
              warehouseId: effectiveWarehouseId,
              status: "PENDING",
              priority: "NORMAL",
            },
          });
        }
        assignedWaveId = openWave.id;
      }
    }

    // Release the order
    const updated = await prisma.salesOrder.update({
      where: { id: params.id },
      data: {
        status: "RELEASED",
        warehouseId: effectiveWarehouseId,
        releasedDate: new Date(),
        releasedById: session.user.id,
        internalNotes: notes
          ? `${order.internalNotes ? order.internalNotes + "\n" : ""}[RELEASE] ${notes}`
          : order.internalNotes,
        ...(assignedWaveId && { waveId: assignedWaveId }),
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    // Auto-create PickList logic
    const existingPickList = await prisma.pickList.findFirst({
      where: { salesOrderId: params.id, organizationId },
    });

    let pickListId = existingPickList?.id;

    if (!existingPickList) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const count = await prisma.pickList.count({
        where: {
          organizationId,
          createdAt: { gte: today },
        },
      });

      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const pickListNumber = `PL-${dateStr}-${String(count + 1).padStart(4, "0")}`;

      const newPickList = await prisma.pickList.create({
        data: {
          organizationId,
          pickListNumber,
          salesOrderId: params.id,
          warehouseId: effectiveWarehouseId,
          status: "PENDING",
          createdById: session.user.id,
          items: {
            create: order.items.map((item) => ({
              salesOrderItemId: item.id,
              inventoryItemId: item.inventoryItemId,
              quantityToPick: item.quantity,
              quantityPicked: 0,
            })),
          },
        },
      });
      pickListId = newPickList.id;
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "SALES_ORDER_RELEASED",
        resourceType: "SalesOrder",
        resourceId: params.id,
        details: {
          soNumber: order.soNumber,
          warehouseId: effectiveWarehouseId,
          waveId: assignedWaveId ?? null,
        } as any,
      },
    });

    return NextResponse.json({
      success: true,
      order: updated,
      waveId: assignedWaveId ?? null,
      message: assignedWaveId
        ? `Order ${order.soNumber} released and added to wave`
        : `Order ${order.soNumber} released to warehouse`,
    });
  } catch (error: any) {
    console.error("[release]", error);
    return NextResponse.json(
      { error: "Failed to release order", detail: error.message },
      { status: 500 },
    );
  }
}
