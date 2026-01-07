/**
 * Autonomous Performance Metrics API
 * Track ROI, success rates, and financial impact
 *
 * KPIs:
 * - Success rate: 85%+ target
 * - Cost savings: $1M+ annually
 * - Automation rate: 85%+
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { autonomousOperationsService } from "@/lib/services/inventory/autonomous-operations-service";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/inventory/autonomous/performance
 * Get autonomous operations performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get all autonomous decisions in period
    const decisions = await prisma.autonomousDecision.findMany({
      where: {
        organizationId: session.user.organizationId,
        createdAt: { gte: startDate },
      },
      include: {
        product: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate metrics by type
    const reorders = decisions.filter((d) => d.decisionType === "REORDER");
    const transfers = decisions.filter((d) => d.decisionType === "TRANSFER");
    const adjustments = decisions.filter((d) => d.decisionType === "ADJUST");

    const calculateMetrics = (decisions: any[]) => {
      const total = decisions.length;
      const executed = decisions.filter((d) => d.actionTaken).length;
      const succeeded = decisions.filter((d) => d.result === "SUCCESS").length;
      const failed = decisions.filter((d) => d.result === "FAILED").length;
      const pending = decisions.filter((d) => d.result === "PENDING").length;

      const totalCost = decisions.reduce(
        (sum, d) => sum + parseFloat(d.estimatedCost?.toString() || "0"),
        0,
      );
      const totalSavings = decisions.reduce(
        (sum, d) => sum + parseFloat(d.estimatedSavings?.toString() || "0"),
        0,
      );
      const avgConfidence =
        total > 0
          ? decisions.reduce((sum, d) => sum + d.confidence, 0) / total
          : 0;

      return {
        total,
        executed,
        succeeded,
        failed,
        pending,
        successRate: total > 0 ? (succeeded / total) * 100 : 0,
        automationRate: total > 0 ? (executed / total) * 100 : 0,
        totalCost,
        totalSavings,
        roi: totalCost > 0 ? (totalSavings / totalCost) * 100 : 0,
        avgConfidence,
      };
    };

    const reorderMetrics = calculateMetrics(reorders);
    const transferMetrics = calculateMetrics(transfers);
    const adjustmentMetrics = calculateMetrics(adjustments);
    const overallMetrics = calculateMetrics(decisions);

    // Financial impact projection
    const annualProjection = {
      reorderSavings: (reorderMetrics.totalSavings / periodDays) * 365,
      transferSavings: (transferMetrics.totalSavings / periodDays) * 365,
      adjustmentSavings: (adjustmentMetrics.totalSavings / periodDays) * 365,
      totalSavings: (overallMetrics.totalSavings / periodDays) * 365,
    };

    // Top performers
    const productPerformance = decisions.reduce((acc: any[], d) => {
      const existing = acc.find((item) => item.productId === d.productId);
      const savings = parseFloat(d.estimatedSavings?.toString() || "0");

      if (existing) {
        existing.decisions++;
        existing.savings += savings;
        existing.avgConfidence = (existing.avgConfidence + d.confidence) / 2;
      } else {
        acc.push({
          productId: d.productId,
          productName: d.product?.product?.name || "Unknown",
          decisions: 1,
          savings,
          avgConfidence: d.confidence,
        });
      }
      return acc;
    }, []);

    const topPerformers = productPerformance
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 10)
      .map((p) => ({
        ...p,
        savings: `$${p.savings.toLocaleString()}`,
        avgConfidence: `${Math.round(p.avgConfidence)}%`,
      }));

    return NextResponse.json({
      success: true,
      data: {
        period: `${periodDays} days`,
        overall: {
          ...overallMetrics,
          successRate: `${Math.round(overallMetrics.successRate)}%`,
          automationRate: `${Math.round(overallMetrics.automationRate)}%`,
          totalCost: `$${overallMetrics.totalCost.toLocaleString()}`,
          totalSavings: `$${overallMetrics.totalSavings.toLocaleString()}`,
          roi: `${Math.round(overallMetrics.roi)}%`,
          avgConfidence: `${Math.round(overallMetrics.avgConfidence)}%`,
          performance:
            overallMetrics.successRate >= 85
              ? "EXCELLENT"
              : overallMetrics.successRate >= 75
                ? "GOOD"
                : overallMetrics.successRate >= 65
                  ? "ACCEPTABLE"
                  : "NEEDS_IMPROVEMENT",
        },
        byType: {
          reorders: {
            ...reorderMetrics,
            successRate: `${Math.round(reorderMetrics.successRate)}%`,
            totalSavings: `$${reorderMetrics.totalSavings.toLocaleString()}`,
          },
          transfers: {
            ...transferMetrics,
            successRate: `${Math.round(transferMetrics.successRate)}%`,
            totalSavings: `$${transferMetrics.totalSavings.toLocaleString()}`,
          },
          adjustments: {
            ...adjustmentMetrics,
            successRate: `${Math.round(adjustmentMetrics.successRate)}%`,
            totalSavings: `$${adjustmentMetrics.totalSavings.toLocaleString()}`,
          },
        },
        annualProjection: {
          reorderSavings: `$${annualProjection.reorderSavings.toLocaleString()}`,
          transferSavings: `$${annualProjection.transferSavings.toLocaleString()}`,
          adjustmentSavings: `$${annualProjection.adjustmentSavings.toLocaleString()}`,
          totalSavings: `$${annualProjection.totalSavings.toLocaleString()}`,
          target: "$1M+",
        },
        topPerformers,
        targets: {
          successRate: "85%+",
          automationRate: "85%+",
          roi: "200%+",
          annualSavings: "$1M+",
        },
      },
    });
  } catch (error: any) {
    console.error("Performance metrics error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate performance metrics",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
