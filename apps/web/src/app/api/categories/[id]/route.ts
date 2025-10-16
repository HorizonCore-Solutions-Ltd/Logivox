import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const category = await prisma.category.findUnique({
      where: {
        id: params.id,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            inventoryItems: true,
            children: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error fetching category:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, parentId } = body

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      )
    }

    // Prevent circular references
    if (parentId === params.id) {
      return NextResponse.json(
        { message: "A category cannot be its own parent" },
        { status: 400 }
      )
    }

    const category = await prisma.category.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        parentId: parentId || null,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "category",
        entityId: category.id,
        userId: user.id,
        details: JSON.stringify({ name }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if category has inventory items
    const itemCount = await prisma.inventoryItem.count({
      where: {
        categoryId: params.id,
      },
    })

    if (itemCount > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete category with ${itemCount} inventory items. Please reassign or delete the items first.`,
        },
        { status: 400 }
      )
    }

    // Check if category has children
    const childCount = await prisma.category.count({
      where: {
        parentId: params.id,
      },
    })

    if (childCount > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete category with ${childCount} sub-categories. Please delete or reassign the sub-categories first.`,
        },
        { status: 400 }
      )
    }

    const category = await prisma.category.delete({
      where: {
        id: params.id,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "category",
        entityId: category.id,
        userId: user.id,
        details: JSON.stringify({ name: category.name }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
