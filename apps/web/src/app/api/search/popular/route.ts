export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve tenantId
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

    // Return popular searches derived from most-ordered item names in the last 90 days
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const topItems = await prisma.salesOrderItem.groupBy({
      by: ["inventoryItemId"],
      where: {
        salesOrder: {
          organizationId: tenantId,
          createdAt: { gte: cutoff },
        },
      },
      _count: { inventoryItemId: true },
      orderBy: { _count: { inventoryItemId: "desc" } },
      take: 10,
    });

    // Fetch names for the top items
    const itemIds = topItems.map((t) => t.inventoryItemId);
    const itemNames = await prisma.inventoryItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, sku: true },
    });
    const nameMap = Object.fromEntries(
      itemNames.map((i) => [i.id, i.name || i.sku]),
    );

    const popularSearches = topItems.map((t) => ({
      query: nameMap[t.inventoryItemId] ?? t.inventoryItemId,
      count: t._count.inventoryItemId,
    }));

    return NextResponse.json({ popular: popularSearches });
  } catch (error) {
    console.error("Error fetching popular searches:", error);
    return NextResponse.json(
      { error: "Failed to fetch popular searches" },
      { status: 500 },
    );
  }
}
