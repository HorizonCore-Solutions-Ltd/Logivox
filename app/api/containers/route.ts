/**
 * Container Management API
 * Full CRUD operations for container-driven load sheets
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/containers - List all containers with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const loadSheetId = searchParams.get("loadSheetId");
    const warehouseId = searchParams.get("warehouseId");
    const search = searchParams.get("search");

    const where: any = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (loadSheetId) where.loadSheetId = loadSheetId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (search) {
      where.OR = [
        { containerNumber: { contains: search, mode: "insensitive" } },
        { trailerNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const containers = await prisma.container.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        loadSheet: {
          select: {
            id: true,
            loadSheetNumber: true,
            status: true,
          },
        },
        bayDoorAssignment: {
          select: {
            id: true,
            doorNumber: true,
            status: true,
          },
        },
        containerItems: {
          include: {
            salesOrder: {
              select: {
                id: true,
                orderNumber: true,
              },
            },
            inventoryItem: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            containerItems: true,
            containerEvents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      containers,
      count: containers.length,
    });
  } catch (error) {
    console.error("Get containers error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve containers" },
      { status: 500 },
    );
  }
}

// POST /api/containers - Create new container
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      containerNumber,
      containerType = "PALLET",
      customerId,
      destinationAddress,
      destinationBranch,
      routeCode,
      carrierCode,
      priority = 5,
      warehouseId,
      organizationId,
    } = body;

    if (!containerNumber) {
      return NextResponse.json(
        { error: "Container number is required" },
        { status: 400 },
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Check if container already exists
    const existing = await prisma.container.findUnique({
      where: { containerNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Container number already exists" },
        { status: 409 },
      );
    }

    // Create container
    const container = await prisma.container.create({
      data: {
        containerNumber,
        containerType,
        status: "EMPTY",
        customerId,
        destinationAddress,
        destinationBranch,
        routeCode,
        carrierCode,
        priority,
        assignedBy: session.user.id,
        assignedAt: new Date(),
        assignmentMethod: "MANUAL",
        organizationId,
        warehouseId,
      },
      include: {
        customer: true,
        warehouse: true,
      },
    });

    // Create event
    await prisma.containerEvent.create({
      data: {
        containerId: container.id,
        eventType: "CREATED",
        userId: session.user.id,
        userName: session.user.name || "Unknown",
        location: warehouseId,
        organizationId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        container,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create container error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create container",
      },
      { status: 500 },
    );
  }
}

// PATCH /api/containers - Update container
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { containerId, ...updates } = body;

    if (!containerId) {
      return NextResponse.json(
        { error: "Container ID is required" },
        { status: 400 },
      );
    }

    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      return NextResponse.json(
        { error: "Container not found" },
        { status: 404 },
      );
    }

    // Update container
    const updated = await prisma.container.update({
      where: { id: containerId },
      data: updates,
      include: {
        customer: true,
        loadSheet: true,
        containerItems: true,
      },
    });

    // Create event
    await prisma.containerEvent.create({
      data: {
        containerId: updated.id,
        eventType: "MODIFIED",
        userId: session.user.id,
        userName: session.user.name || "Unknown",
        eventData: updates,
        organizationId: updated.organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      container: updated,
    });
  } catch (error) {
    console.error("Update container error:", error);
    return NextResponse.json(
      { error: "Failed to update container" },
      { status: 500 },
    );
  }
}

// DELETE /api/containers - Delete container
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const containerId = searchParams.get("id");

    if (!containerId) {
      return NextResponse.json(
        { error: "Container ID is required" },
        { status: 400 },
      );
    }

    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        containerItems: true,
        loadSheet: true,
      },
    });

    if (!container) {
      return NextResponse.json(
        { error: "Container not found" },
        { status: 404 },
      );
    }

    // Check if container has items
    if (container.containerItems.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete container with items. Remove items first." },
        { status: 400 },
      );
    }

    // Check if assigned to load sheet
    if (container.loadSheetId) {
      return NextResponse.json(
        { error: "Cannot delete container assigned to load sheet." },
        { status: 400 },
      );
    }

    // Delete container (events will cascade)
    await prisma.container.delete({
      where: { id: containerId },
    });

    return NextResponse.json({
      success: true,
      message: "Container deleted successfully",
    });
  } catch (error) {
    console.error("Delete container error:", error);
    return NextResponse.json(
      { error: "Failed to delete container" },
      { status: 500 },
    );
  }
}
