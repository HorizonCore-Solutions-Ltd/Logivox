import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PackagingRecommendation {
  id: string;
  title: string;
  description: string;
  currentMaterial: string;
  recommendedMaterial: string;
  co2eSavings: number;
  costSavings: number;
  impact: "High" | "Medium" | "Low";
  status: "pending" | "applied" | "rejected";
}

/**
 * GET /api/sustainability/recommendations
 * Get AI-powered sustainability recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recommendations from database
    const recommendations = await prisma.sustainabilityRecommendation.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: {
          in: ["pending", "applied"],
        },
      },
      orderBy: [{ status: "asc" }, { co2eSavings: "desc" }],
      take: 20,
    });

    // If no recommendations exist, generate some sample ones
    if (recommendations.length === 0) {
      const sampleRecommendations = [
        {
          title: "Switch to Recycled Cardboard Boxes",
          description:
            "Replace virgin cardboard with 100% recycled cardboard for standard shipments",
          currentMaterial: "Virgin Cardboard",
          recommendedMaterial: "100% Recycled Cardboard",
          co2eSavings: 1247.5,
          costSavings: 3890.0,
          impact: "High" as const,
          status: "pending" as const,
          organizationId: session.user.organizationId,
        },
        {
          title: "Optimize Box Sizes",
          description:
            "Use AI to select optimal box sizes, reducing void fill and materials",
          currentMaterial: "Standard Boxes",
          recommendedMaterial: "Right-Sized Boxes",
          co2eSavings: 892.3,
          costSavings: 2145.0,
          impact: "High" as const,
          status: "pending" as const,
          organizationId: session.user.organizationId,
        },
        {
          title: "Biodegradable Void Fill",
          description:
            "Replace plastic bubble wrap with biodegradable packing peanuts",
          currentMaterial: "Plastic Bubble Wrap",
          recommendedMaterial: "Biodegradable Peanuts",
          co2eSavings: 567.8,
          costSavings: 890.0,
          impact: "Medium" as const,
          status: "pending" as const,
          organizationId: session.user.organizationId,
        },
        {
          title: "Reusable Shipping Containers",
          description: "Implement reusable containers for B2B shipments",
          currentMaterial: "Disposable Packaging",
          recommendedMaterial: "Reusable Containers",
          co2eSavings: 2134.6,
          costSavings: 5670.0,
          impact: "High" as const,
          status: "pending" as const,
          organizationId: session.user.organizationId,
        },
        {
          title: "Water-Based Adhesive Tape",
          description: "Switch from plastic tape to water-activated paper tape",
          currentMaterial: "Plastic Packing Tape",
          recommendedMaterial: "Paper Tape",
          co2eSavings: 234.5,
          costSavings: 456.0,
          impact: "Low" as const,
          status: "pending" as const,
          organizationId: session.user.organizationId,
        },
      ];

      // Create sample recommendations
      await prisma.sustainabilityRecommendation.createMany({
        data: sampleRecommendations,
      });

      return NextResponse.json({
        success: true,
        data: {
          recommendations: sampleRecommendations.map((r, i) => ({
            id: `rec-${i + 1}`,
            ...r,
          })),
          summary: {
            total: sampleRecommendations.length,
            pending: sampleRecommendations.filter((r) => r.status === "pending")
              .length,
            applied: 0,
            totalPotentialCO2eSavings: sampleRecommendations.reduce(
              (sum, r) => sum + r.co2eSavings,
              0,
            ),
            totalPotentialCostSavings: sampleRecommendations.reduce(
              (sum, r) => sum + r.costSavings,
              0,
            ),
          },
        },
      });
    }

    // Return existing recommendations
    const totalPotentialCO2eSavings = recommendations
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + r.co2eSavings, 0);

    const totalPotentialCostSavings = recommendations
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + r.costSavings, 0);

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        summary: {
          total: recommendations.length,
          pending: recommendations.filter((r) => r.status === "pending").length,
          applied: recommendations.filter((r) => r.status === "applied").length,
          totalPotentialCO2eSavings:
            Math.round(totalPotentialCO2eSavings * 100) / 100,
          totalPotentialCostSavings:
            Math.round(totalPotentialCostSavings * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch recommendations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/sustainability/recommendations/:id
 * Update recommendation status (apply or reject)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recommendationId = searchParams.get("id");
    const body = await request.json();
    const { status } = body;

    if (!recommendationId || !status) {
      return NextResponse.json(
        { error: "Recommendation ID and status are required" },
        { status: 400 },
      );
    }

    if (!["pending", "applied", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify recommendation belongs to organization
    const recommendation = await prisma.sustainabilityRecommendation.findFirst({
      where: {
        id: recommendationId,
        organizationId: session.user.organizationId,
      },
    });

    if (!recommendation) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 },
      );
    }

    // Update recommendation
    const updated = await prisma.sustainabilityRecommendation.update({
      where: { id: recommendationId },
      data: {
        status,
        appliedAt: status === "applied" ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Failed to update recommendation:", error);
    return NextResponse.json(
      {
        error: "Failed to update recommendation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
