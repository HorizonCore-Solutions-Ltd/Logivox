export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserBasedRecommendations,
  getItemBasedRecommendations,
  getTrendingProducts,
  getPersonalizedRecommendations,
  type RecommendationResult,
  type UserProfile,
} from "@/lib/ai/recommendations";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type") || "all"; // all, user-based, item-based, trending, personalized

    // Get tenant ID from first organization
    const tenantId = session.user.organizations[0]?.id;
    if (!tenantId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // Fetch products
    const products = await prisma.product.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        stock: true,
        unitPrice: true,
        tags: true,
      },
    });

    // Transform to expected format
    const productList = products.map((p: (typeof products)[number]) => ({
      id: p.id,
      name: p.name,
      category: p.category || "Uncategorized",
      price: Number(p.unitPrice),
      tags: p.tags || [],
      description: p.description || "",
    }));

    // Create dummy data for demo (in production, fetch real data)
    const userProfile: UserProfile = {
      userId: session.user.id,
      purchases: [],
      views: [],
      categories: [],
      priceRange: { min: 0, max: 100000 },
    };

    const allUsers: UserProfile[] = [userProfile];
    const purchaseHistory: Array<{
      productId: string;
      relatedProductId: string;
    }> = [];

    let recommendations: RecommendationResult[] = [];

    switch (type) {
      case "user-based":
        recommendations = await getUserBasedRecommendations(
          session.user.id,
          allUsers,
          productList,
          limit,
        );
        break;

      case "item-based":
        recommendations = await getItemBasedRecommendations(
          productId,
          productList,
          purchaseHistory,
          limit,
        );
        break;

      case "trending":
        const recentPurchases: Array<{ productId: string; date: Date }> = [];
        recommendations = await getTrendingProducts(
          recentPurchases,
          productList,
          7,
          limit,
        );
        break;

      case "personalized":
        recommendations = await getPersonalizedRecommendations(
          userProfile,
          productList,
          limit,
        );
        break;

      case "all":
      default:
        // For demo, just return trending products (most popular)
        recommendations = productList
          .slice(0, limit)
          .map((p: (typeof productList)[number]) => ({
            productId: p.id,
            productName: p.name,
            score: Math.random(),
            reason: "Recommended for you",
            category: p.category,
            price: p.price,
          }));
        break;
    }

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 },
    );
  }
}
