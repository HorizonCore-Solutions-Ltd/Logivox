export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Authenticate API key
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) return auth.error!;

  // Fetch single inventory item
  const item = await prisma.inventoryItem.findFirst({
    where: {
      id: params.id,
      organizationId: auth.organizationId,
    },
    include: {
      warehouse: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          quantity: true,
          reason: true,
          createdAt: true,
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json(
      { message: "Inventory item not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(item);
}
