export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user?.organizations?.[0]?.id) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizations[0].id;

    // Fetch all inventory items with related data
    const items = await prisma.inventoryItem.findMany({
      where: { organizationId },
      include: {
        warehouse: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { sku: "asc" },
    });

    // Convert to CSV
    const headers = [
      "id",
      "name",
      "sku",
      "description",
      "barcode",
      "quantity",
      "minStockLevel",
      "reorderPoint",
      "costPrice",
      "sellingPrice",
      "unit",
      "status",
      "warehouseId",
      "warehouseName",
      "categoryId",
      "categoryName",
      "createdAt",
      "updatedAt",
    ];

    const rows = items.map((item: any) => [
      item.id,
      item.name,
      item.sku,
      item.description || "",
      item.barcode || "",
      item.quantity,
      item.minStockLevel,
      item.reorderPoint,
      item.costPrice.toString(),
      item.sellingPrice.toString(),
      item.unit,
      item.status,
      item.warehouseId || "",
      item.warehouse?.name || "",
      item.categoryId || "",
      item.category?.name || "",
      item.createdAt.toISOString(),
      item.updatedAt.toISOString(),
    ]);

    // Escape CSV values
    const escapeCSV = (value: any) => {
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [
      headers.join(","),
      ...rows.map((row: any) => row.map(escapeCSV).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="inventory-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { message: "Failed to export inventory" },
      { status: 500 },
    );
  }
}
