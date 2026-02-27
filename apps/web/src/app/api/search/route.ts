export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSearchEngine, type Product } from "@/lib/ai/smart-search";

// Create search engine instance
const searchEngine = createSearchEngine();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type");

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    // Get tenant ID from first organization
    const tenantId = session.user.organizations[0]?.id;
    if (!tenantId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // Fetch all searchable items
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

    // Index products
    searchEngine.index(
      products.map((p: Product) => ({
        ...p,
        type: "product" as const,
      })),
    );

    // Perform search
    const results = await searchEngine.search({
      query,
      limit,
      offset,
      filters: type ? { type: [type] } : undefined,
    });

    // Track search
    await trackSearch(query, tenantId);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 },
    );
  }
}

async function trackSearch(query: string, tenantId: string) {
  // Store search query for analytics via activity logs
  try {
    await prisma.activityLog.create({
      data: {
        organizationId: tenantId,
        action: "SEARCH_QUERY",
        entityType: "Search",
        entityId: null,
        metadata: {
          query,
          trackedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Error tracking search:", error);
  }
}
