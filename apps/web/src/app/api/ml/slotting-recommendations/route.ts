import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recommendations = await prisma.slottingRecommendation.findMany({
      where: {
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const formattedRecs = recommendations.map((r: any) => ({
      id: r.id,
      sku: r.sku || "N/A",
      currentLocation: r.currentLocationCode || "N/A",
      recommendedLocation: r.recommendedLocationCode || "N/A",
      pickFrequency: r.pickFrequency || 0,
      expectedImprovement: r.confidence || 0,
      status: r.status,
    }));

    return NextResponse.json(formattedRecs);
  } catch (error) {
    console.error("Error fetching slotting recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
