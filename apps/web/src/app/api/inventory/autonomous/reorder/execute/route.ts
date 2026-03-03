import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const body = await request.json();
    const { productIds } = body;

    // Find inventory items that are below reorder point
    const where: Record<string, unknown> = { organizationId: orgId };
    if (productIds?.length) where.id = { in: productIds };

    const items = await prisma.inventoryItem.findMany({
      where: { ...where, quantity: { lte: prisma.inventoryItem.fields.reorderPoint } },
      take: 50,
    });

    // Record each reorder decision as an autonomous decision
    const decisions = await Promise.all(
      items.map((item) =>
        prisma.autonomousDecision.create({
          data: {
            organizationId: orgId,
            decisionType: "REORDER",
            entityType: "INVENTORY_ITEM",
            entityId: item.id,
            rationale: `Auto-reorder triggered: quantity ${item.quantity} at or below reorder point`,
            status: "PENDING",
          },
        }),
      ),
    );

    return NextResponse.json({ success: true, decisionsCreated: decisions.length, decisions });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
