/**
 * Velocity Classification API
 * Get velocity classification for specific product
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/inventory/velocity-classification/[productId]
 * Get velocity classification and recommendations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = params;

    // Get product with classification
    const product = await prisma.inventoryItem.findFirst({
      where: {
        id: productId,
        organizationId: session.user.organizationId,
      },
      include: {
        product: true,
        warehouse: true,
        velocityClassification: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.velocityClassification) {
      return NextResponse.json({
        success: false,
        message: "No velocity classification found. Run ABC analysis first.",
        data: {
          productId,
          sku: product.product?.sku,
          name: product.product?.name,
          hasClassification: false,
        },
      });
    }

    const classification = product.velocityClassification;

    // Get peer comparison (same class)
    const peers = await prisma.velocityClassification.findMany({
      where: {
        velocityClass: classification.velocityClass,
        productId: { not: productId },
      },
      include: {
        product: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { velocityScore: "desc" },
      take: 5,
    });

    // Determine rank within class
    const allInClass = await prisma.velocityClassification.count({
      where: { velocityClass: classification.velocityClass },
    });

    const betterThan = await prisma.velocityClassification.count({
      where: {
        velocityClass: classification.velocityClass,
        velocityScore: { lt: classification.velocityScore },
      },
    });

    const percentile =
      allInClass > 0
        ? Math.round(((allInClass - betterThan) / allInClass) * 100)
        : 0;

    // Get recommendations based on class
    const recommendations =
      {
        A: {
          countFrequency: "DAILY",
          safetyStockDays: 30,
          reorderPriority: "CRITICAL",
          suggestions: [
            "Maintain high safety stock (30 days)",
            "Monitor daily for stockouts",
            "Consider backup suppliers",
            "Optimize prime warehouse locations",
          ],
        },
        B: {
          countFrequency: "WEEKLY",
          safetyStockDays: 21,
          reorderPriority: "HIGH",
          suggestions: [
            "Moderate safety stock (21 days)",
            "Weekly cycle counts",
            "Standard reorder procedures",
            "Good warehouse locations",
          ],
        },
        C: {
          countFrequency: "MONTHLY",
          safetyStockDays: 14,
          reorderPriority: "MEDIUM",
          suggestions: [
            "Lower safety stock (14 days)",
            "Monthly cycle counts",
            "Economic order quantities",
            "Standard warehouse locations",
          ],
        },
        D: {
          countFrequency: "QUARTERLY",
          safetyStockDays: 7,
          reorderPriority: "LOW",
          suggestions: [
            "Minimal safety stock (7 days)",
            "Quarterly counts",
            "Consider discontinuation",
            "Free up premium space",
          ],
        },
      }[classification.velocityClass] || {};

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          sku: product.product?.sku,
          name: product.product?.name,
          warehouse: product.warehouse?.name,
          currentQuantity: product.quantity,
          availableQuantity: product.availableQty,
        },
        classification: {
          velocityClass: classification.velocityClass,
          velocityScore: Math.round(classification.velocityScore),
          turnoverRate: classification.turnoverRate.toFixed(2),
          annualRevenue: `$${classification.annualRevenue.toLocaleString()}`,
          lastCalculated: classification.lastCalculated,
          metadata: classification.metadata,
        },
        ranking: {
          percentile: `Top ${percentile}%`,
          inClass: allInClass,
          rankDescription:
            percentile <= 10
              ? "Elite performer"
              : percentile <= 25
                ? "Top quartile"
                : percentile <= 50
                  ? "Above average"
                  : percentile <= 75
                    ? "Below average"
                    : "Needs improvement",
        },
        recommendations,
        peers: peers.map((p) => ({
          productId: p.productId,
          sku: p.product?.product?.sku,
          name: p.product?.product?.name,
          velocityScore: Math.round(p.velocityScore),
          turnoverRate: p.turnoverRate.toFixed(2),
        })),
        insights: {
          strengths:
            classification.velocityClass === "A"
              ? [
                  "High revenue contributor",
                  "Fast turnover",
                  "Customer favorite",
                ]
              : classification.velocityClass === "B"
                ? ["Steady performer", "Good turnover", "Reliable revenue"]
                : classification.velocityClass === "C"
                  ? ["Moderate turnover", "Supplementary item"]
                  : ["Slow mover", "Low revenue", "Review needed"],
          concerns:
            classification.velocityClass === "D"
              ? ["Poor turnover", "High carrying cost", "Space inefficiency"]
              : classification.turnoverRate < 2
                ? ["Below average turnover", "May need promotion"]
                : [],
        },
      },
    });
  } catch (error: any) {
    console.error("Velocity classification retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve classification", message: error.message },
      { status: 500 },
    );
  }
}
