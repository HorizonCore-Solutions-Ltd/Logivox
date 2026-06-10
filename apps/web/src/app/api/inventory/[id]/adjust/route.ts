export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

// POST /api/inventory/[id]/adjust - Adjust inventory quantity
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const quantity = body.quantity;
    const type = body.type || body.movementType;
    const reference = body.reference;
    const notes = body.notes;
    const capaId = body.capaId;

    // Validate required fields
    if (quantity === undefined || !type) {
      return NextResponse.json(
        { error: "Missing required fields: quantity, type" },
        { status: 400 },
      );
    }

    // Get current inventory item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 },
      );
    }

    if (capaId) {
      const linkedCapa = await prisma.correctivePreventiveAction.findFirst({
        where: {
          id: capaId,
          organizationId: item.organizationId,
        },
      });

      if (!linkedCapa) {
        return NextResponse.json(
          { error: "Linked CAPA not found for this organization" },
          { status: 404 },
        );
      }
    }

    // Calculate new quantity based on movement type
    let newQuantity = item.quantity;
    const adjustmentAmount = Math.abs(quantity);

    switch (type) {
      case "PURCHASE":
      case "RETURN":
      case "ADJUSTMENT":
        newQuantity += adjustmentAmount;
        break;
      case "SALE":
      case "DAMAGE":
      case "TRANSFER":
        newQuantity -= adjustmentAmount;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid movement type" },
          { status: 400 },
        );
    }

    // Ensure quantity doesn't go negative
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: "Insufficient quantity. Cannot reduce below 0." },
        { status: 400 },
      );
    }

    // Calculate new available quantity
    const newAvailableQuantity = newQuantity - item.reservedQty;

    // Determine new status
    let newStatus = item.status;
    if (newQuantity === 0) {
      newStatus = "OUT_OF_STOCK";
    } else if (item.minStockLevel && newQuantity <= item.minStockLevel) {
      newStatus = "LOW_STOCK";
    } else {
      newStatus = "ACTIVE";
    }

    const org = await prisma.organization.findUnique({
      where: { id: item.organizationId },
      select: { securitySettings: true },
    });

    const securitySettings =
      (org?.securitySettings as Record<string, any>) || {};
    const capaInventorySettings =
      (securitySettings.capaInventorySettings as Record<string, any>) || {};

    const defaultThresholds = {
      damage: 10,
      adjustment: 25,
      transfer: 50,
    };

    const orgThresholds = {
      ...defaultThresholds,
      ...(capaInventorySettings.thresholds || {}),
    };

    const warehouseOverrides =
      (capaInventorySettings.warehouseOverrides as Record<string, any>) || {};
    const warehouseThresholds = {
      ...orgThresholds,
      ...(warehouseOverrides[item.warehouseId] || {}),
    };

    const autoCapaEnabled = capaInventorySettings.enabled !== false;

    const shouldAutoCreateCapa =
      autoCapaEnabled &&
      !capaId &&
      ((type === "DAMAGE" && adjustmentAmount >= warehouseThresholds.damage) ||
        (type === "ADJUSTMENT" &&
          adjustmentAmount >= warehouseThresholds.adjustment) ||
        (type === "TRANSFER" &&
          adjustmentAmount >= warehouseThresholds.transfer));

    // Update item and create movement in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: params.id },
        data: {
          quantity: newQuantity,
          availableQty: newAvailableQuantity,
          status: newStatus,
        },
        include: {
          warehouse: true,
          category: true,
        },
      });

      const linkedNote = capaId
        ? `${notes || ""}${notes ? " " : ""}[CAPA:${capaId}]`
        : notes;

      // Create movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          type,
          quantity: adjustmentAmount,
          reason: reference || "Manual stock adjustment",
          notes: linkedNote,
          inventoryItemId: item.id,
        },
      });

      if (capaId) {
        await tx.correctivePreventiveAction.update({
          where: { id: capaId },
          data: {
            sourceType: "INVENTORY_ITEM",
            sourceId: item.id,
          },
        });
      }

      let autoCreatedCapa = null;
      if (shouldAutoCreateCapa) {
        const capaCount = await tx.correctivePreventiveAction.count({
          where: { organizationId: item.organizationId },
        });

        const capaNumber = `CAPA-${new Date().getFullYear()}-${String(capaCount + 1).padStart(4, "0")}`;

        autoCreatedCapa = await tx.correctivePreventiveAction.create({
          data: {
            capaNumber,
            title: `Auto CAPA: High-risk ${type} adjustment for ${item.sku}`,
            description:
              `Inventory item ${item.name} (${item.sku}) was adjusted by ${adjustmentAmount} units using movement type ${type}. ` +
              `A CAPA was auto-opened to enforce root cause analysis and corrective actions.`,
            category: "INVENTORY",
            priority: type === "DAMAGE" ? "HIGH" : "MEDIUM",
            status: "OPEN",
            sourceType: "INVENTORY_ITEM",
            sourceId: item.id,
            organizationId: item.organizationId,
            createdById: user.id,
            warehouseId: item.warehouseId,
          },
        });

        await tx.inventoryMovement.update({
          where: { id: movement.id },
          data: {
            notes: `${movement.notes || ""}${movement.notes ? " " : ""}[CAPA:${autoCreatedCapa.id}]`,
          },
        });

        await tx.activityLog.create({
          data: {
            action: "CAPA_AUTO_CREATED",
            entityType: "CORRECTIVE_PREVENTIVE_ACTION",
            entityId: autoCreatedCapa.id,
            description: `Auto-created CAPA ${autoCreatedCapa.capaNumber} from high-risk ${type} inventory adjustment on ${item.sku}.`,
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
            organizationId: item.organizationId,
            userId: user.id,
          },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "INVENTORY_ADJUSTED",
          entityType: "INVENTORY_ITEM",
          entityId: item.id,
          description: `${type}: ${adjustmentAmount} units of ${item.name} (${item.sku}). New quantity: ${newQuantity}${capaId ? ` [CAPA:${capaId}]` : ""}`,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          organizationId: item.organizationId,
          userId: user.id,
        },
      });

      return { updatedItem, movement, autoCreatedCapa };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error adjusting inventory:", error);
    return NextResponse.json(
      { error: "Failed to adjust inventory" },
      { status: 500 },
    );
  }
}
