/**
 * Order Management API
 * Auto-batching, wave management, and order release
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { withObservability } from "@/lib/middleware/observability";
import { authOptions } from "@/lib/auth";

type OrderBatch = {
  orders: Array<{
    id: string;
    customer?: { city?: string | null; state?: string | null };
    shipDate?: Date | null;
    customerId?: string;
    priority?: string | null;
  }>;
  priority: string;
  reason: string;
};

// GET - List orders or waves
export async function GET(req: NextRequest) {
  return withObservability(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const waveId = searchParams.get("waveId");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const showWaves = searchParams.get("showWaves");

    // Get specific order
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true,
            },
          },
          organization: true,
          wave: true,
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json({ order });
    }

    // List waves
    if (showWaves === "true") {
      const waves = await prisma.wavePickingBatch.findMany({
        where: waveId ? { id: waveId } : {},
        include: {
          warehouse: true,
          orders: {
            include: {
              customer: true,
              orderItems: true,
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        waves,
        total: waves.length,
      });
    }

    // Build order filters
    const where: Record<string, string> = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    // List orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        wave: {
          select: {
            id: true,
            waveNumber: true,
            status: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: { orderDate: "desc" },
      take: 100,
    });

    return NextResponse.json({
      orders,
      total: orders.length,
    });
  }, req);
}

// POST - Create wave or release orders
export async function POST(req: NextRequest) {
  return withObservability(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, orderIds, warehouseId, priority, cutoffTime } = body;

    if (action === "createWave") {
      // Create new wave and assign orders
      if (!orderIds || orderIds.length === 0) {
        return NextResponse.json(
          { error: "Order IDs are required" },
          { status: 400 },
        );
      }

      // Generate wave number (WAVE-YYYYMMDD-NNN)
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
      const existingWaves = await prisma.wavePickingBatch.count({
        where: {
          createdAt: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
          },
        },
      });
      const waveNumber = `WAVE-${dateStr}-${String(existingWaves + 1).padStart(3, "0")}`;

      // Create wave
      const wave = await prisma.wavePickingBatch.create({
        data: {
          waveNumber,
          warehouseId,
          status: "PENDING",
          priority: priority || "NORMAL",
          cutoffTime: cutoffTime ? new Date(cutoffTime) : undefined,
        },
      });

      // Assign orders to wave
      await prisma.order.updateMany({
        where: {
          id: { in: orderIds },
        },
        data: {
          waveId: wave.id,
          status: "ASSIGNED_TO_WAVE",
        },
      });

      // Get wave with orders
      const waveWithOrders = await prisma.wavePickingBatch.findUnique({
        where: { id: wave.id },
        include: {
          orders: {
            include: {
              customer: true,
              orderItems: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        wave: waveWithOrders,
        message: `Wave ${waveNumber} created with ${orderIds.length} orders`,
      });
    } else if (action === "releaseWave") {
      // Release wave for picking
      const { waveId } = body;

      if (!waveId) {
        return NextResponse.json(
          { error: "Wave ID is required" },
          { status: 400 },
        );
      }

      const wave = await prisma.wavePickingBatch.update({
        where: { id: waveId },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
        },
        include: {
          orders: true,
        },
      });

      // Update order statuses
      await prisma.order.updateMany({
        where: {
          waveId: waveId,
        },
        data: {
          status: "PICKING",
        },
      });

      return NextResponse.json({
        success: true,
        wave,
        message: `Wave ${wave.waveNumber} released for picking`,
      });
    } else if (action === "autoBatch") {
      // Auto-batch orders into optimal waves
      const result = await autoBatchOrders(warehouseId);

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }, req);
}

// PATCH - Update wave or order status
export async function PATCH(req: NextRequest) {
  return withObservability(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { waveId, orderId, status } = body;

    if (waveId) {
      // Update wave
      const wave = await prisma.wavePickingBatch.update({
        where: { id: waveId },
        data: {
          status: status || undefined,
          completedAt: status === "COMPLETED" ? new Date() : undefined,
        },
      });

      return NextResponse.json({
        success: true,
        wave,
      });
    } else if (orderId) {
      // Update order
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: status || undefined,
        },
      });

      return NextResponse.json({
        success: true,
        order,
      });
    }

    return NextResponse.json(
      { error: "Wave ID or Order ID is required" },
      { status: 400 },
    );
    }, req);
 */
async function autoBatchOrders(warehouseId: string) {
  try {
    // Get unassigned orders
    const unassignedOrders = await prisma.order.findMany({
      where: {
        warehouseId,
        status: "PENDING",
        waveId: null,
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (unassignedOrders.length === 0) {
      return {
        message: "No unassigned orders to batch",
        wavesCreated: 0,
      };
    }

    // Group orders by criteria
    const batches: OrderBatch[] = [];

    // Criteria 1: Same customer + same ship date
    const customerDateGroups = new Map<string, OrderBatch["orders"]>();
    for (const order of unassignedOrders) {
      const key = `${order.customerId}-${order.shipDate?.toISOString().split("T")[0] || "no-date"}`;
      if (!customerDateGroups.has(key)) {
        customerDateGroups.set(key, []);
      }
      customerDateGroups.get(key)!.push(order);
    }

    // Create batches from groups with 3+ orders
    for (const [, orders] of customerDateGroups) {
      if (orders.length >= 3) {
        batches.push({
          orders,
          priority: "HIGH",
          reason: "Same customer, same ship date",
        });
      }
    }

    // Criteria 2: Similar destinations (same city/state)
    const destinationGroups = new Map<string, OrderBatch["orders"]>();
    for (const order of unassignedOrders) {
      if (batches.some((b) => b.orders.includes(order))) continue;
      const city = String(order.customer?.city || "")
        .trim()
        .toUpperCase();
      const state = String(order.customer?.state || "")
        .trim()
        .toUpperCase();
      if (!city && !state) continue;

      const key = `${city}-${state}`;
      if (!destinationGroups.has(key)) {
        destinationGroups.set(key, []);
      }
      destinationGroups.get(key)!.push(order);
    }

    for (const [key, orders] of destinationGroups) {
      if (orders.length >= 3) {
        batches.push({
          orders,
          priority: "MEDIUM",
          reason: `Geographic cluster: ${key.replace("-", ", ")}`,
        });
      }
    }

    // Criteria 3: Order priority (urgent orders)
    const urgentOrders = unassignedOrders.filter(
      (o) =>
        o.priority === "URGENT" && !batches.some((b) => b.orders.includes(o)),
    );
    if (urgentOrders.length > 0) {
      batches.push({
        orders: urgentOrders,
        priority: "URGENT",
        reason: "Urgent priority",
      });
    }

    // Create waves from batches
    const wavesCreated = [];
    for (const batch of batches) {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
      const existingWaves = await prisma.wavePickingBatch.count({
        where: {
          createdAt: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
          },
        },
      });
      const waveNumber = `WAVE-${dateStr}-${String(existingWaves + wavesCreated.length + 1).padStart(3, "0")}`;

      const wave = await prisma.wavePickingBatch.create({
        data: {
          waveNumber,
          warehouseId,
          status: "PENDING",
          priority: batch.priority,
        },
      });

      await prisma.order.updateMany({
        where: {
          id: { in: batch.orders.map((o) => o.id) },
        },
        data: {
          waveId: wave.id,
          status: "ASSIGNED_TO_WAVE",
        },
      });

      wavesCreated.push({
        waveNumber,
        orderCount: batch.orders.length,
        reason: batch.reason,
      });
    }

    return {
      message: `Auto-batched ${unassignedOrders.length} orders into ${wavesCreated.length} waves`,
      wavesCreated,
    };
  } catch (error) {
    console.error("Auto-batch error:", error);
    throw error;
  }
}
