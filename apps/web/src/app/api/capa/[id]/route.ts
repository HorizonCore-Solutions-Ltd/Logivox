import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const capa = await prisma.correctivePreventiveAction.findUnique({
      where: { id: params.id, organizationId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!capa) {
      return NextResponse.json({ error: "CAPA not found" }, { status: 404 });
    }

    const relatedMovements = await prisma.inventoryMovement.findMany({
      where: {
        OR: [
          { notes: { contains: `[CAPA:${params.id}]` } },
          capa.sourceId
            ? {
                inventoryItemId: capa.sourceId,
              }
            : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const relatedInventoryItem = capa.sourceId
      ? await prisma.inventoryItem.findFirst({
          where: {
            id: capa.sourceId,
            organizationId,
          },
          select: {
            id: true,
            sku: true,
            name: true,
            quantity: true,
            availableQty: true,
            status: true,
          },
        })
      : null;

    return NextResponse.json({
      ...capa,
      relatedInventoryItem,
      relatedMovements,
    });
  } catch (error) {
    console.error("GET /api/capa/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CAPA" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const body = await request.json();
    const { inventoryAdjustments, ...capaData } = body;

    const updated = await prisma.$transaction(async (tx: any) => {
      const capa = await tx.correctivePreventiveAction.update({
        where: { id: params.id, organizationId },
        data: capaData,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      const appliedAdjustments: any[] = [];
      if (Array.isArray(inventoryAdjustments) && inventoryAdjustments.length) {
        for (const adjustment of inventoryAdjustments) {
          const item = await tx.inventoryItem.findFirst({
            where: {
              id: adjustment.inventoryItemId,
              organizationId,
            },
          });

          if (!item) continue;

          const qty = Math.abs(Number(adjustment.quantity || 0));
          if (!qty) continue;

          const subtract = ["SALE", "DAMAGE", "TRANSFER"].includes(
            adjustment.type,
          );
          const newQuantity = subtract
            ? item.quantity - qty
            : item.quantity + qty;
          if (newQuantity < 0) continue;

          await tx.inventoryItem.update({
            where: { id: item.id },
            data: {
              quantity: newQuantity,
              availableQty: newQuantity - item.reservedQty,
              status:
                newQuantity === 0
                  ? "OUT_OF_STOCK"
                  : item.minStockLevel && newQuantity <= item.minStockLevel
                    ? "LOW_STOCK"
                    : "ACTIVE",
            },
          });

          const movement = await tx.inventoryMovement.create({
            data: {
              inventoryItemId: item.id,
              type: adjustment.type,
              quantity: qty,
              reason: adjustment.reason || "CAPA-driven adjustment",
              notes: `${adjustment.notes || ""}${adjustment.notes ? " " : ""}[CAPA:${params.id}]`,
            },
          });

          appliedAdjustments.push(movement);
        }
      }

      return {
        ...capa,
        appliedAdjustments,
      };
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/capa/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update CAPA" },
      { status: 500 },
    );
  }
}
