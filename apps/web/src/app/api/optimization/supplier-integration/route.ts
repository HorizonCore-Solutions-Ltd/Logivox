import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Smart Replenishment API
 * Handles automated procurement logic and stats
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return new NextResponse("Unauthorized", { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get("action");
    const orgId =
      session.user.orgId ||
      (await prisma.user.findUnique({ where: { id: session.user.id } }))
        .organizationMemberships[0]?.organizationId; // Fallback

    if (!orgId) {
      // Just grab first org user belongs to if session doesn't have it direct
      // In robust app, this would be cleaner
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    if (action === "stats") {
      // 1. Stats logic
      // Count Active Orders (Open POs)
      const activeCtx = await prisma.purchaseOrder.count({
        where: {
          organizationId: orgId,
          status: { notIn: ["CANCELLED", "CLOSED", "RECEIVED"] },
        },
      });
      // Pending
      const pendingCtx = await prisma.purchaseOrder.count({
        where: { organizationId: orgId, status: "PENDING" },
      });

      const totalOrdersCtx = await prisma.purchaseOrder.count({
        where: { organizationId: orgId },
      });

      return NextResponse.json({
        stats: {
          activeOrders: activeCtx,
          pendingApproval: pendingCtx,
          totalOrders: totalOrdersCtx,
          totalSpend: 154000, // Mock for now or aggregate
          avgOrderValue: 3200,
          activeSuppliers: await prisma.supplier.count({
            where: { organizationId: orgId, status: "ACTIVE" },
          }),
        },
      });
    } else if (action === "suppliers") {
      // 2. Suppliers logic
      const suppliers = await prisma.supplier.findMany({
        where: { organizationId: orgId },
        take: 20,
      });

      // Transform to frontend shape
      const profile = suppliers.map((s) => ({
        supplierId: s.id,
        supplierName: s.name,
        tier: "GOLD", // Mock logic or add field
        metrics: { onTimeDelivery: 98, qualityScore: 99 }, // Mock logic
      }));

      return NextResponse.json({ suppliers: profile });
    } else if (action === "recommendations") {
      // 3. Smart Replenishment Logic
      // Find items below min stock
      const lowStockItems = await prisma.inventoryItem.findMany({
        where: {
          organizationId: orgId,
          isActive: true,
          // Prisma currently doesn't support direct field comparison in where easily,
          // so we fetch ones with minStockLevel > 0 and filter in memory for complex logic if needed.
          // Or user raw query. For safety, let's fetch active items with minStock defined.
          minStockLevel: { gt: 0 },
        },
        include: {
          supplier: true,
        },
      });

      const recommendations = [];

      for (const item of lowStockItems) {
        if (item.availableQty <= item.minStockLevel) {
          // Calculate replenishment
          let qtyToOrder =
            item.reorderQuantity && item.reorderQuantity > 0
              ? item.reorderQuantity
              : item.maxStockLevel
                ? item.maxStockLevel - item.availableQty
                : item.minStockLevel * 2;

          if (qtyToOrder <= 0) qtyToOrder = 10; // Fallback safety

          recommendations.push({
            productId: item.id,
            sku: item.sku,
            supplierId: item.supplierId || "SUP-UNKNOWN",
            supplierName: item.supplier?.name || "Assign Supplier",
            recommendedQty: qtyToOrder,
            currentStock: item.availableQty,
            minStock: item.minStockLevel,
            urgency: item.availableQty === 0 ? "CRITICAL" : "HIGH",
            reason: `Stock (${item.availableQty}) below minimum (${item.minStockLevel})`,
            estimatedCost: (Number(item.costPrice) || 0) * qtyToOrder,
          });
        }
      }

      // Limit to top 20 urgent
      const finalRecs = recommendations.slice(0, 20);

      // Calculate Summary
      const summary = {
        total: recommendations.length,
        critical: recommendations.filter((r) => r.urgency === "CRITICAL")
          .length,
        high: recommendations.filter((r) => r.urgency === "HIGH").length,
        estimatedTotalCost: recommendations.reduce(
          (sum, r) => sum + r.estimatedCost,
          0,
        ),
      };

      return NextResponse.json({
        summary,
        recommendations: finalRecs,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Optimization API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return new NextResponse("Unauthorized", { status: 401 });

    const json = await req.json();
    const { action, data } = json;

    if (action === "createPO") {
      // Create Purchase Order Logic
      const { supplierId, items, deliveryDate, warehouseId, notes } = data;

      // Resolve Organization
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { organizationMemberships: true },
      });
      const orgId = user?.organizationMemberships[0]?.organizationId;
      if (!orgId) throw new Error("No Org");

      const poNumber = "PO-" + Date.now().toString().slice(-6);

      // Fetch items details for description
      const productIds = items.map((i: any) => i.productId);
      const products = await prisma.inventoryItem.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      const result = await prisma.purchaseOrder.create({
        data: {
          organizationId: orgId,
          supplierId,
          poNumber,
          status: "DRAFT",
          expectedDate: deliveryDate ? new Date(deliveryDate) : undefined,
          deliveryNotes: notes,
          items: {
            create: items.map((i: any) => {
              const product = productMap.get(i.productId);
              const qty = Number(i.quantity) || 0;
              const price = Number(i.unitPrice) || 0;

              return {
                inventoryItemId: i.productId,
                sku: i.sku || product?.sku || "UNKNOWN",
                description: product?.name || "Item " + i.sku,
                quantityOrdered: qty,
                unitPrice: price,
                totalPrice: qty * price,
              };
            }),
          },
          createdById: session.user.id,
        },
      });

      return NextResponse.json({ success: true, poId: result.id, poNumber });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Create PO Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
