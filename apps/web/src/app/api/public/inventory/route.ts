export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, checkApiKeyScope } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // Authenticate API key
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) return auth.error!;

  // Optionally check for required scope
  // if (!checkApiKeyScope(auth.apiKey, "inventory:read")) {
  //   return NextResponse.json({ message: "Insufficient scope" }, { status: 403 })
  // }

  // Fetch inventory items for the organization
  const items = await prisma.inventoryItem.findMany({
    where: { organizationId: auth.organizationId },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      availableQty: true,
      reservedQty: true,
      sellingPrice: true,
      costPrice: true,
      warehouseId: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const response = items.map((item) => ({
    ...item,
    availableQuantity: item.availableQty,
    reservedQuantity: item.reservedQty,
  }));

  return NextResponse.json(response);
}
