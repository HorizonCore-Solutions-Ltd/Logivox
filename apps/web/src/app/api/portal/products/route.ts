export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/products
 * Get products available for customer to order
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get customer's organization
    const customerUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        customer: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!customerUser?.customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Get active inventory items from customer's organization
    const products = await prisma.inventoryItem.findMany({
      where: {
        organizationId: customerUser.customer.organizationId,
        isActive: true,
        quantity: { gt: 0 }, // Only show in-stock items
      },
      orderBy: { productName: "asc" },
      select: {
        id: true,
        productName: true,
        sku: true,
        sellingPrice: true,
        quantity: true,
        description: true,
        category: true,
        imageUrl: true,
      },
    });

    const productsFormatted = products.map((product) => ({
      id: product.id,
      name: product.productName,
      sku: product.sku,
      sellingPrice: Number(product.sellingPrice || 0),
      availableQty: product.quantity,
      description: product.description,
      category: product.category,
      imageUrl: product.imageUrl,
    }));

    return NextResponse.json({ products: productsFormatted });
  } catch (error: any) {
    console.error("Portal products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
