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

    // Get tenant ID from session organizations or DB lookup
    let tenantId = (session.user as any).organizations?.[0]?.id;
    if (!tenantId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          organizationMemberships: { include: { organization: true }, take: 1 },
        },
      });
      tenantId = dbUser?.organizationMemberships?.[0]?.organization?.id;
    }
    if (!tenantId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // Fetch inventory items (InventoryItem is the product catalog)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { organizationId: tenantId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        totalQty: true,
        unitCost: true,
        tags: true,
      },
      take: 500,
    });

    // Transform to expected format
    const productList = inventoryItems.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || "Uncategorized",
      price: Number(p.unitCost ?? 0),
      tags: (p.tags as string[]) || [],
      description: p.description || "",
    }));

    // Build real user profile from sales order history
    const recentOrders = await prisma.salesOrder.findMany({
      where: { organizationId: tenantId, createdById: session.user.id },
      include: { items: { select: { inventoryItemId: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const purchasedItemIds = recentOrders
      .flatMap((o) => o.items)
      .map((i) => i.inventoryItemId)
      .filter(Boolean) as string[];
    const purchasedCategories = [
      ...new Set(
        inventoryItems
          .filter((p) => purchasedItemIds.includes(p.id))
          .map((p) => p.category || "Uncategorized"),
      ),
    ];

    const userProfile: UserProfile = {
      userId: session.user.id,
      purchases: purchasedItemIds.map((id) => ({
        productId: id,
        quantity: 1,
        date: new Date(),
      })),
      views: [],
      categories: purchasedCategories,
      priceRange: { min: 0, max: 100000 },
    };

    // Build purchase history pairs for item-based recommendations
    const purchaseHistory: Array<{
      productId: string;
      relatedProductId: string;
    }> = [];
    for (const order of recentOrders) {
      const ids = order.items
        .map((i) => i.inventoryItemId)
        .filter(Boolean) as string[];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          purchaseHistory.push({ productId: ids[i], relatedProductId: ids[j] });
          purchaseHistory.push({ productId: ids[j], relatedProductId: ids[i] });
        }
      }
    }

    const allUsers: UserProfile[] = [userProfile];

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

      case "trending": {
        // Use real recent order data to compute trending products
        const recentPurchases = recentOrders
          .flatMap((o) =>
            o.items.map((i) => ({
              productId: i.inventoryItemId!,
              date: o.createdAt,
            })),
          )
          .filter((p) => p.productId);
        recommendations = await getTrendingProducts(
          recentPurchases,
          productList,
          7,
          limit,
        );
        break;
      }

      case "personalized":
        recommendations = await getPersonalizedRecommendations(
          userProfile,
          productList,
          limit,
        );
        break;

      case "all":
      default: {
        // Blend personalized + trending as a combined "all" result
        const [personalized, trending] = await Promise.all([
          getPersonalizedRecommendations(
            userProfile,
            productList,
            Math.ceil(limit / 2),
          ),
          getTrendingProducts(
            recentOrders
              .flatMap((o) =>
                o.items.map((i) => ({
                  productId: i.inventoryItemId!,
                  date: o.createdAt,
                })),
              )
              .filter((p) => p.productId),
            productList,
            7,
            Math.ceil(limit / 2),
          ),
        ]);
        // Merge and de-duplicate
        const seen = new Set<string>();
        recommendations = [...personalized, ...trending]
          .filter((r) => {
            if (seen.has(r.productId)) return false;
            seen.add(r.productId);
            return true;
          })
          .slice(0, limit);
        break;
      }
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
