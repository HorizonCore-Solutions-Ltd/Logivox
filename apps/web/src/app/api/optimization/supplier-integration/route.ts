import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Smart Replenishment API
 * Handles automated procurement logic and stats
 */

const createPORequestSchema = z.object({
  action: z.literal("createPO"),
  data: z.object({
    supplierId: z.string().cuid(),
    items: z
      .array(
        z.object({
          productId: z.string().cuid(),
          sku: z.string().min(1),
          quantity: z.number().int().positive(),
          unitPrice: z.number().nonnegative(),
        }),
      )
      .min(1),
    deliveryDate: z.string().datetime().optional(),
    warehouseId: z.string().optional(),
    notes: z.string().optional(),
  }),
});

function toNumber(value: unknown): number {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function deriveTier(score: number): string {
  if (score >= 95) return "PLATINUM";
  if (score >= 85) return "GOLD";
  if (score >= 75) return "SILVER";
  if (score >= 60) return "BRONZE";
  return "PROBATION";
}

async function resolveOrganizationId(
  userId: string,
  sessionOrgId?: string | null,
) {
  if (sessionOrgId) {
    return sessionOrgId;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizationMemberships: {
        where: { isActive: true },
        take: 1,
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  return user?.organizationMemberships?.[0]?.organizationId ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return new NextResponse("Unauthorized", { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get("action");
    const orgId = await resolveOrganizationId(
      session.user.id,
      session.user.orgId,
    );

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    if (action === "stats") {
      const [
        activeOrders,
        pendingApproval,
        totalOrders,
        spendAggregate,
        activeSuppliers,
      ] = await Promise.all([
        prisma.purchaseOrder.count({
          where: {
            organizationId: orgId,
            status: { notIn: ["CANCELLED", "CLOSED", "RECEIVED"] },
          },
        }),
        prisma.purchaseOrder.count({
          where: {
            organizationId: orgId,
            status: { in: ["DRAFT", "PENDING"] },
          },
        }),
        prisma.purchaseOrder.count({
          where: { organizationId: orgId },
        }),
        prisma.purchaseOrder.aggregate({
          where: {
            organizationId: orgId,
            status: { notIn: ["CANCELLED"] },
          },
          _sum: { totalAmount: true },
          _avg: { totalAmount: true },
        }),
        prisma.supplier.count({
          where: { organizationId: orgId, isActive: true },
        }),
      ]);

      return NextResponse.json({
        stats: {
          activeOrders,
          pendingApproval,
          totalOrders,
          totalSpend: toNumber(spendAggregate._sum.totalAmount),
          avgOrderValue: toNumber(spendAggregate._avg.totalAmount),
          activeSuppliers,
        },
      });
    } else if (action === "suppliers") {
      const now = new Date();
      const last30Days = new Date(now);
      last30Days.setDate(last30Days.getDate() - 30);
      const last90Days = new Date(now);
      last90Days.setDate(last90Days.getDate() - 90);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const suppliers = await prisma.supplier.findMany({
        where: { organizationId: orgId },
        take: 50,
        include: {
          qualityScore: true,
          supplierPerformanceReviews: {
            orderBy: { periodEnd: "desc" },
            take: 1,
          },
          supplierUsers: {
            select: { id: true },
            take: 1,
          },
          purchaseOrders: {
            where: {
              organizationId: orgId,
              orderDate: { gte: yearStart },
            },
            select: {
              status: true,
              totalAmount: true,
              orderDate: true,
            },
          },
        },
      });

      const profile = suppliers
        .map((supplier) => {
          const quality = supplier.qualityScore;
          const latestReview = supplier.supplierPerformanceReviews[0];
          const orders = supplier.purchaseOrders;

          const totalOrders = orders.length;
          const activeOrders = orders.filter((order) =>
            [
              "DRAFT",
              "PENDING",
              "APPROVED",
              "SENT",
              "CONFIRMED",
              "PARTIALLY_RECEIVED",
            ].includes(order.status),
          ).length;
          const completedOrders = orders.filter((order) =>
            ["RECEIVED", "CLOSED"].includes(order.status),
          ).length;
          const disputedOrders = orders.filter(
            (order) => order.status === "CANCELLED",
          ).length;

          const performanceScore = clampPercent(
            quality?.overallScore ?? latestReview?.overallScore ?? 0,
          );
          const qualityPercent = clampPercent(
            latestReview?.qualityScore ??
              quality?.qualityScore ??
              performanceScore,
          );
          const onTimeDelivery = clampPercent(
            latestReview?.deliveryScore ??
              quality?.reliabilityScore ??
              performanceScore,
          );
          const defectRate = Math.max(
            toNumber(quality?.recent90DefectRate),
            toNumber(quality?.lifetimeDefectRate),
          );
          const orderAccuracy = clampPercent(
            defectRate > 0 ? 100 - defectRate * 100 : qualityPercent,
          );
          const responsivenessScore = clampPercent(
            latestReview?.responsivenessScore ?? quality?.responseScore ?? 70,
          );
          const avgResponseTime = Math.max(
            1,
            Math.round((100 - responsivenessScore) / 8),
          );

          return {
            supplierId: supplier.id,
            supplierName: supplier.name,
            integrationType:
              supplier.supplierUsers.length > 0
                ? "PORTAL"
                : supplier.email
                  ? "EMAIL"
                  : "MANUAL",
            isActive: supplier.isActive,
            performanceScore,
            tier: quality?.tier || deriveTier(performanceScore),
            metrics: {
              onTimeDelivery,
              qualityScore: qualityPercent,
              orderAccuracy,
              avgResponseTime,
            },
            orders: {
              total: totalOrders,
              active: activeOrders,
              completed: completedOrders,
              disputed: disputedOrders,
            },
            spend: {
              last30Days: orders
                .filter((order) => order.orderDate >= last30Days)
                .reduce((sum, order) => sum + toNumber(order.totalAmount), 0),
              last90Days: orders
                .filter((order) => order.orderDate >= last90Days)
                .reduce((sum, order) => sum + toNumber(order.totalAmount), 0),
              yearToDate: orders.reduce(
                (sum, order) => sum + toNumber(order.totalAmount),
                0,
              ),
            },
          };
        })
        .sort((left, right) => right.performanceScore - left.performanceScore);

      return NextResponse.json({ suppliers: profile });
    } else if (action === "recommendations") {
      const lowStockItems = await prisma.inventoryItem.findMany({
        where: {
          organizationId: orgId,
          isActive: true,
          minStockLevel: { gt: 0 },
          supplierId: { not: null },
        },
        include: {
          supplier: true,
        },
      });

      const recommendations = lowStockItems
        .filter((item) => item.availableQty <= item.minStockLevel)
        .map((item) => {
          let qtyToOrder =
            item.reorderQuantity && item.reorderQuantity > 0
              ? item.reorderQuantity
              : item.maxStockLevel
                ? item.maxStockLevel - item.availableQty
                : item.minStockLevel * 2;

          if (qtyToOrder <= 0) {
            qtyToOrder = item.minStockLevel - item.availableQty;
          }

          if (qtyToOrder <= 0 || !item.supplierId) {
            return null;
          }

          return {
            productId: item.id,
            sku: item.sku,
            supplierId: item.supplierId,
            supplierName: item.supplier?.name || "Unassigned Supplier",
            recommendedQty: qtyToOrder,
            currentStock: item.availableQty,
            minStock: item.minStockLevel,
            urgency: item.availableQty === 0 ? "CRITICAL" : "HIGH",
            reason: `Stock (${item.availableQty}) below minimum (${item.minStockLevel})`,
            estimatedCost: toNumber(item.costPrice) * qtyToOrder,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((left, right) => {
          const urgencyRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          const urgencyDelta =
            urgencyRank[left.urgency] - urgencyRank[right.urgency];

          if (urgencyDelta !== 0) {
            return urgencyDelta;
          }

          return right.estimatedCost - left.estimatedCost;
        });
      const finalRecs = recommendations.slice(0, 20);
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

    const parsed = createPORequestSchema.parse(await req.json());

    if (parsed.action === "createPO") {
      const orgId = await resolveOrganizationId(
        session.user.id,
        session.user.orgId,
      );
      if (!orgId) throw new Error("No active organization found");

      const supplier = await prisma.supplier.findFirst({
        where: {
          id: parsed.data.supplierId,
          organizationId: orgId,
          isActive: true,
        },
      });

      if (!supplier) {
        return NextResponse.json(
          { error: "Supplier not found or inactive" },
          { status: 400 },
        );
      }

      const productIds = parsed.data.items.map((item) => item.productId);
      const products = await prisma.inventoryItem.findMany({
        where: {
          id: { in: productIds },
          organizationId: orgId,
        },
      });
      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );

      if (products.length !== productIds.length) {
        return NextResponse.json(
          { error: "One or more inventory items were not found" },
          { status: 400 },
        );
      }

      const poCount = await prisma.purchaseOrder.count({
        where: { organizationId: orgId },
      });
      const poNumber = `PO-${Date.now()}-${String(poCount + 1).padStart(4, "0")}`;

      const lineItems = parsed.data.items.map((item) => {
        const product = productMap.get(item.productId);
        const quantity = item.quantity;
        const unitPrice = item.unitPrice;

        return {
          inventoryItemId: item.productId,
          sku: item.sku || product?.sku || "UNKNOWN",
          description: product?.name || `Item ${item.sku}`,
          quantityOrdered: quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
        };
      });

      const subtotal = lineItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );

      const result = await prisma.purchaseOrder.create({
        data: {
          organizationId: orgId,
          supplierId: parsed.data.supplierId,
          poNumber,
          status: "DRAFT",
          expectedDate: parsed.data.deliveryDate
            ? new Date(parsed.data.deliveryDate)
            : undefined,
          deliveryNotes: parsed.data.notes,
          notes: "Generated from Smart Replenishment recommendation",
          subtotal,
          totalAmount: subtotal,
          items: {
            create: lineItems,
          },
          createdById: session.user.id,
        },
      });

      await prisma.activityLog.create({
        data: {
          organizationId: orgId,
          userId: session.user.id,
          action: "CREATE",
          entityType: "PurchaseOrder",
          entityId: result.id,
          metadata: {
            poNumber,
            source: "SMART_REPLENISHMENT",
          },
        },
      });

      return NextResponse.json({ success: true, poId: result.id, poNumber });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Create PO Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
