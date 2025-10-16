import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateLocationSchema = z.object({
  locationCode: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z
    .enum([
      "WAREHOUSE",
      "ZONE",
      "AISLE",
      "RACK",
      "SHELF",
      "BIN",
      "STAGING",
      "SHIPPING",
      "RECEIVING",
      "QUARANTINE",
    ])
    .optional(),
  parentId: z.string().nullable().optional(),
  warehouseId: z.string().nullable().optional(),
  zoneId: z.string().nullable().optional(),
  aisleId: z.string().nullable().optional(),
  rackId: z.string().nullable().optional(),
  shelfId: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  qrCode: z.string().nullable().optional(),
  capacity: z.number().nullable().optional(),
  maxWeight: z.number().nullable().optional(),
  length: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
  isPickable: z.boolean().optional(),
  isPutaway: z.boolean().optional(),
  temperature: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// GET /api/locations/[id] - Get location details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const location = await prisma.location.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        parent: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            type: true,
            isActive: true,
          },
          orderBy: { locationCode: "asc" },
        },
        _count: {
          select: {
            transfersFrom: true,
            transfersTo: true,
            adjustments: true,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(location);
  } catch (error: any) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch location" },
      { status: 500 }
    );
  }
}

// PUT /api/locations/[id] - Update location
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    // Verify location exists and belongs to organization
    const existingLocation = await prisma.location.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateLocationSchema.parse(body);

    // If updating location code, check uniqueness
    if (
      validatedData.locationCode &&
      validatedData.locationCode !== existingLocation.locationCode
    ) {
      const codeExists = await prisma.location.findFirst({
        where: {
          organizationId: membership.organizationId,
          locationCode: validatedData.locationCode,
          id: { not: params.id },
        },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "Location code already exists" },
          { status: 400 }
        );
      }
    }

    // If updating barcode, check uniqueness
    if (
      validatedData.barcode &&
      validatedData.barcode !== existingLocation.barcode
    ) {
      const barcodeExists = await prisma.location.findFirst({
        where: {
          barcode: validatedData.barcode,
          id: { not: params.id },
        },
      });

      if (barcodeExists) {
        return NextResponse.json(
          { error: "Barcode already exists" },
          { status: 400 }
        );
      }
    }

    // Update location
    const location = await prisma.location.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        parent: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "LOCATION_UPDATED",
        entityType: "LOCATION",
        entityId: location.id,
        metadata: {
          locationCode: location.locationCode,
          changes: validatedData,
        },
      },
    });

    return NextResponse.json(location);
  } catch (error: any) {
    console.error("Error updating location:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update location" },
      { status: 500 }
    );
  }
}

// DELETE /api/locations/[id] - Delete location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    // Verify location exists and belongs to organization
    const location = await prisma.location.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        _count: {
          select: {
            children: true,
            transfersFrom: true,
            transfersTo: true,
            adjustments: true,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Check if location has children
    if (location._count.children > 0) {
      return NextResponse.json(
        { error: "Cannot delete location with child locations" },
        { status: 400 }
      );
    }

    // Check if location has active transfers
    if (location._count.transfersFrom > 0 || location._count.transfersTo > 0) {
      return NextResponse.json(
        { error: "Cannot delete location with active transfers" },
        { status: 400 }
      );
    }

    // Delete location
    await prisma.location.delete({
      where: { id: params.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "LOCATION_DELETED",
        entityType: "LOCATION",
        entityId: params.id,
        metadata: {
          locationCode: location.locationCode,
          name: location.name,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete location" },
      { status: 500 }
    );
  }
}
