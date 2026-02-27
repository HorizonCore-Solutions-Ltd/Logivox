export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTenantFromRequest } from "@/lib/tenant-context";

export async function GET(request: NextRequest) {
  try {
    // Resolve tenant to get organizationId (fail-closed, no user-provided params)
    const tenant = await resolveTenantFromRequest(request as any);
    if (!tenant) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: {
        organizationId: tenant.organizationId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            inventoryItems: true,
            children: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Resolve tenant to get organizationId
    const tenant = await resolveTenantFromRequest(request as any);
    if (!tenant) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 },
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        parentId,
        organizationId: tenant.organizationId,
      },
    });

    // Log activity with organization scope
    await prisma.activityLog.create({
      data: {
        organizationId: tenant.organizationId,
        userId: tenant.userId,
        action: "CREATE",
        entityType: "category",
        entityId: category.id,
        metadata: { name },
        ipAddress: (request as any).headers.get("x-forwarded-for") || "unknown",
        userAgent: (request as any).headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
