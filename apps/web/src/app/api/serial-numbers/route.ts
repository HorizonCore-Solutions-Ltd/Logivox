export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSerialSchema = z.object({
  inventoryId: z.string(),
  lotId: z.string().optional(),
  serialNumber: z.string(),
  grnId: z.string().optional(),
  locationId: z.string().optional(),
  warrantyPeriodDays: z.number().int().positive().optional(),
  customFields: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

const bulkCreateSchema = z.object({
  inventoryId: z.string(),
  lotId: z.string().optional(),
  serialNumbers: z.array(z.string()).min(1),
  grnId: z.string().optional(),
  locationId: z.string().optional(),
  warrantyPeriodDays: z.number().int().positive().optional(),
});

// GET /api/serial-numbers - List serial numbers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization membership" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const inventoryId = searchParams.get("inventoryId");
    const lotId = searchParams.get("lotId");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: membership.organizationId,
    };

    if (inventoryId) where.inventoryId = inventoryId;
    if (lotId) where.lotId = lotId;
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.serialNumber = { contains: search, mode: "insensitive" };
    }

    const [serialNumbers, totalCount] = await Promise.all([
      prisma.serialNumber.findMany({
        where,
        include: {
          inventoryItem: {
            select: {
              sku: true,
              name: true,
            },
          },
          lot: {
            select: {
              lotNumber: true,
              expiryDate: true,
            },
          },
          location: {
            select: {
              locationCode: true,
              name: true,
            },
          },
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.serialNumber.count({ where }),
    ]);

    return NextResponse.json({
      serialNumbers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + serialNumbers.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching serial numbers:", error);
    return NextResponse.json(
      { error: "Failed to fetch serial numbers" },
      { status: 500 },
    );
  }
}

// POST /api/serial-numbers - Create serial number(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        role: { in: ["ADMIN", "MANAGER"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Check if bulk create or single
    const isBulk = Array.isArray(body.serialNumbers);

    if (isBulk) {
      const data = bulkCreateSchema.parse(body);

      // Validate inventory item
      const inventoryItem = await prisma.inventoryItem.findFirst({
        where: {
          id: data.inventoryId,
          organizationId: membership.organizationId,
        },
      });

      if (!inventoryItem) {
        return NextResponse.json(
          { error: "Inventory item not found" },
          { status: 404 },
        );
      }

      // Check for duplicates
      const existingSerials = await prisma.serialNumber.findMany({
        where: {
          organizationId: membership.organizationId,
          serialNumber: { in: data.serialNumbers },
        },
        select: { serialNumber: true },
      });

      if (existingSerials.length > 0) {
        return NextResponse.json(
          {
            error: "Duplicate serial numbers found",
            duplicates: existingSerials.map((s: any) => s.serialNumber),
          },
          { status: 400 },
        );
      }

      // Create all serial numbers
      const created = await prisma.serialNumber.createMany({
        data: data.serialNumbers.map((sn) => ({
          organizationId: membership.organizationId,
          inventoryId: data.inventoryId,
          lotId: data.lotId,
          serialNumber: sn,
          grnId: data.grnId,
          locationId: data.locationId,
          warrantyPeriodDays: data.warrantyPeriodDays,
          receivedDate: new Date(),
        })),
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId: membership.organizationId,
          userId: session.user.id,
          action: "SERIAL_NUMBERS_CREATED_BULK",
          entityType: "SERIAL_NUMBER",
          metadata: {
            count: created.count,
            inventoryItemSku: inventoryItem.sku,
          },
        },
      });

      return NextResponse.json({ created: created.count }, { status: 201 });
    } else {
      const data = createSerialSchema.parse(body);

      // Validate inventory item
      const inventoryItem = await prisma.inventoryItem.findFirst({
        where: {
          id: data.inventoryId,
          organizationId: membership.organizationId,
        },
      });

      if (!inventoryItem) {
        return NextResponse.json(
          { error: "Inventory item not found" },
          { status: 404 },
        );
      }

      // Check for duplicate
      const existing = await prisma.serialNumber.findFirst({
        where: {
          organizationId: membership.organizationId,
          serialNumber: data.serialNumber,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Serial number already exists" },
          { status: 400 },
        );
      }

      const warrantyStartDate = new Date();
      const warrantyEndDate = data.warrantyPeriodDays
        ? new Date(
            warrantyStartDate.getTime() +
              data.warrantyPeriodDays * 24 * 60 * 60 * 1000,
          )
        : undefined;

      const serialNumber = await prisma.serialNumber.create({
        data: {
          organizationId: membership.organizationId,
          inventoryId: data.inventoryId,
          lotId: data.lotId,
          serialNumber: data.serialNumber,
          grnId: data.grnId,
          locationId: data.locationId,
          warrantyPeriodDays: data.warrantyPeriodDays,
          warrantyStartDate,
          warrantyEndDate,
          customFields: data.customFields,
          notes: data.notes,
          receivedDate: new Date(),
        },
        include: {
          inventoryItem: {
            select: {
              sku: true,
              name: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId: membership.organizationId,
          userId: session.user.id,
          action: "SERIAL_NUMBER_CREATED",
          entityType: "SERIAL_NUMBER",
          entityId: serialNumber.id,
          metadata: {
            serialNumber: serialNumber.serialNumber,
            inventoryItemSku: serialNumber.inventoryItem.sku,
          },
        },
      });

      return NextResponse.json(serialNumber, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error creating serial number:", error);
    return NextResponse.json(
      { error: "Failed to create serial number" },
      { status: 500 },
    );
  }
}
