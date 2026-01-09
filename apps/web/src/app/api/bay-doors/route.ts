/**
 * Bay Door Management API
 * CRUD operations for dock bay doors
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// GET - List bay doors or get specific door
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doorId = searchParams.get("doorId");
    const warehouseId = searchParams.get("warehouseId");
    const status = searchParams.get("status");
    const available = searchParams.get("available");

    // Get specific door
    if (doorId) {
      const door = await prisma.bayDoor.findUnique({
        where: { id: doorId },
        include: {
          warehouse: true,
          currentLoadSheet: {
            include: {
              customer: true,
              containers: true,
            },
          },
          events: {
            orderBy: { timestamp: "desc" },
            take: 10,
          },
        },
      });

      if (!door) {
        return NextResponse.json(
          { error: "Bay door not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ door });
    }

    // Build filters
    const where: any = {};

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (status) {
      where.status = status;
    }

    if (available === "true") {
      where.status = "AVAILABLE";
      where.currentLoadSheetId = null;
    }

    // List doors
    const doors = await prisma.bayDoor.findMany({
      where,
      include: {
        warehouse: true,
        currentLoadSheet: {
          include: {
            customer: true,
            containers: {
              include: {
                containerItems: true,
              },
            },
          },
        },
        _count: {
          select: {
            loadSheets: true,
          },
        },
      },
      orderBy: { doorNumber: "asc" },
    });

    return NextResponse.json({
      doors,
      total: doors.length,
    });
  } catch (error) {
    console.error("Bay door GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bay doors" },
      { status: 500 },
    );
  }
}

// POST - Create new bay door
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      warehouseId,
      doorNumber,
      doorType,
      maxWeight,
      maxVolume,
      iotSensorId,
      notes,
    } = body;

    // Validate required fields
    if (!warehouseId || !doorNumber) {
      return NextResponse.json(
        { error: "Warehouse ID and door number are required" },
        { status: 400 },
      );
    }

    // Check for duplicate door number in warehouse
    const existing = await prisma.bayDoor.findFirst({
      where: {
        warehouseId,
        doorNumber,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Bay door ${doorNumber} already exists in this warehouse` },
        { status: 409 },
      );
    }

    // Create bay door
    const door = await prisma.bayDoor.create({
      data: {
        warehouseId,
        doorNumber,
        doorType: doorType || "LOADING",
        status: "AVAILABLE",
        maxWeight: maxWeight || 25000,
        maxVolume: maxVolume || 80,
        iotSensorId,
        notes,
      },
      include: {
        warehouse: true,
      },
    });

    // Log creation event
    await prisma.bayDoorEvent.create({
      data: {
        bayDoorId: door.id,
        eventType: "OPENED",
        description: `Bay door ${doorNumber} created and opened for use`,
        performedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      door,
      message: `Bay door ${doorNumber} created successfully`,
    });
  } catch (error) {
    console.error("Bay door POST error:", error);
    return NextResponse.json(
      { error: "Failed to create bay door" },
      { status: 500 },
    );
  }
}

// PATCH - Update bay door
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      doorId,
      action, // 'assign', 'release', 'open', 'close', 'maintenance'
      loadSheetId,
      status,
      ...updates
    } = body;

    if (!doorId) {
      return NextResponse.json(
        { error: "Door ID is required" },
        { status: 400 },
      );
    }

    const door = await prisma.bayDoor.findUnique({
      where: { id: doorId },
    });

    if (!door) {
      return NextResponse.json(
        { error: "Bay door not found" },
        { status: 404 },
      );
    }

    let updatedDoor;
    let eventType: string;
    let eventDescription: string;

    // Handle actions
    if (action === "assign" && loadSheetId) {
      // Assign load sheet to door
      if (door.status !== "AVAILABLE") {
        return NextResponse.json(
          { error: "Bay door is not available for assignment" },
          { status: 400 },
        );
      }

      updatedDoor = await prisma.bayDoor.update({
        where: { id: doorId },
        data: {
          status: "OCCUPIED",
          currentLoadSheetId: loadSheetId,
        },
        include: {
          currentLoadSheet: true,
        },
      });

      // Update load sheet with bay door
      await prisma.loadSheet.update({
        where: { id: loadSheetId },
        data: { bayDoorId: doorId },
      });

      eventType = "ASSIGNED";
      eventDescription = `Load sheet assigned to bay door ${door.doorNumber}`;
    } else if (action === "release") {
      // Release door (clear assignment)
      updatedDoor = await prisma.bayDoor.update({
        where: { id: doorId },
        data: {
          status: "AVAILABLE",
          currentLoadSheetId: null,
        },
      });

      eventType = "RELEASED";
      eventDescription = `Bay door ${door.doorNumber} released and marked available`;
    } else if (action === "open") {
      // Open door
      updatedDoor = await prisma.bayDoor.update({
        where: { id: doorId },
        data: { status: "AVAILABLE" },
      });

      eventType = "OPENED";
      eventDescription = `Bay door ${door.doorNumber} opened`;
    } else if (action === "close") {
      // Close door
      updatedDoor = await prisma.bayDoor.update({
        where: { id: doorId },
        data: {
          status: "CLOSED",
          currentLoadSheetId: null,
        },
      });

      eventType = "CLOSED";
      eventDescription = `Bay door ${door.doorNumber} closed`;
    } else if (action === "maintenance") {
      // Put door in maintenance
      updatedDoor = await prisma.bayDoor.update({
        where: { id: doorId },
        data: {
          status: "MAINTENANCE",
          currentLoadSheetId: null,
        },
      });

      eventType = "MAINTENANCE";
      eventDescription = `Bay door ${door.doorNumber} placed under maintenance`;
    } else {
      // General update
      updatedDoor = await prisma.bayDoor.update({
        where: { id: doorId },
        data: {
          status,
          ...updates,
        },
      });

      eventType = "MODIFIED";
      eventDescription = `Bay door ${door.doorNumber} updated`;
    }

    // Log event
    await prisma.bayDoorEvent.create({
      data: {
        bayDoorId: doorId,
        eventType: eventType as any,
        description: eventDescription,
        performedBy: session.user.id,
        metadata: action ? { action } : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      door: updatedDoor,
      message: `Bay door updated successfully`,
    });
  } catch (error) {
    console.error("Bay door PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update bay door" },
      { status: 500 },
    );
  }
}

// DELETE - Delete bay door
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doorId = searchParams.get("doorId");

    if (!doorId) {
      return NextResponse.json(
        { error: "Door ID is required" },
        { status: 400 },
      );
    }

    const door = await prisma.bayDoor.findUnique({
      where: { id: doorId },
      include: {
        currentLoadSheet: true,
        loadSheets: true,
      },
    });

    if (!door) {
      return NextResponse.json(
        { error: "Bay door not found" },
        { status: 404 },
      );
    }

    // Prevent deletion if door is occupied
    if (door.currentLoadSheetId) {
      return NextResponse.json(
        { error: "Cannot delete bay door while occupied" },
        { status: 400 },
      );
    }

    // Delete door (events will cascade)
    await prisma.bayDoor.delete({
      where: { id: doorId },
    });

    return NextResponse.json({
      success: true,
      message: `Bay door ${door.doorNumber} deleted successfully`,
    });
  } catch (error) {
    console.error("Bay door DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete bay door" },
      { status: 500 },
    );
  }
}
