export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-guard";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: {
        id: params.id,
      },
      include: {
        _count: {
          select: {
            inventoryItems: true,
          },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { message: "Warehouse not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error("Error fetching warehouse:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, location, description } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 },
      );
    }

    const warehouse = await prisma.warehouse.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        location,
        description,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "warehouse",
        entityId: warehouse.id,
        userId: user.id,
        details: JSON.stringify({ name }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error("Error updating warehouse:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if warehouse has inventory items
    const itemCount = await prisma.inventoryItem.count({
      where: {
        warehouseId: params.id,
      },
    });

    if (itemCount > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete warehouse with ${itemCount} inventory items. Please move or delete the items first.`,
        },
        { status: 400 },
      );
    }

    const warehouse = await prisma.warehouse.delete({
      where: {
        id: params.id,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "warehouse",
        entityId: warehouse.id,
        userId: user.id,
        details: JSON.stringify({ name: warehouse.name }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({ message: "Warehouse deleted successfully" });
  } catch (error) {
    console.error("Error deleting warehouse:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
