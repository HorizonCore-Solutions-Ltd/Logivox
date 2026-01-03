export const dynamic = 'force-dynamic';
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
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get tenant ID from first organization
    const tenantId = session.user.organizations[0]?.id;
    if (!tenantId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Fetch products for indexing
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
    searchEngine.index(products.map((p: Product) => ({
      ...p,
      type: "product" as const,
    })));

    // Get suggestions
    const suggestions = await searchEngine.suggest(query);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
