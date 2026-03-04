import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const rules = await prisma.replenishmentRule.findMany({
    where: { organizationId, isActive: true },
    include: { inventoryItem: true, warehouse: true },
  });

  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;
  const body = await req.json();

  try {
    const rule = await prisma.replenishmentRule.create({
      data: {
        organizationId,
        name: body.name || `Rule for item ${body.inventoryItemId}`,
        strategy: body.strategy,
        minQty: body.minQty || 0,
        maxQty: body.maxQty || 0,
        reorderPoint: body.reorderPoint || 0,
        reorderQty: body.reorderQty || 0,
        leadTimeDays: body.leadTimeDays || 3,
        reviewFrequencyDays: body.reviewFrequencyDays || 7,
        inventoryItemId: body.inventoryItemId,
        warehouseId: body.warehouseId,
        createdById: session.user.id,
      },
    });
    return NextResponse.json({ success: true, rule });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
