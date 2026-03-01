/**
 * POST /api/sales-orders/cartonise
 *
 * Runs a bin-packing algorithm against the order's line items and
 * available CartonTypes, returning a suggested cartonisation plan.
 * Also accepts a PUT-like "confirm" flag to persist the plan as Pack records.
 *
 * Body:
 *   salesOrderId   string   – order to cartonise
 *   confirm?       boolean  – if true, persist Pack records
 *
 * Returns:
 *   { plan: CartonPlan[], summary, totalWeight, totalVolume }
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface CartonPlan {
  cartonType: {
    id: string;
    name: string;
    code: string;
    maxWeight: number;
    maxVolume: number;
  };
  items: Array<{
    inventoryItemId: string;
    sku: string;
    name: string;
    qty: number;
    weight: number;
    volume: number;
  }>;
  totalWeight: number;
  totalVolume: number;
  utilizationPct: number;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = (session.user as any).organizationId;
  const body = await request.json();
  const { salesOrderId, confirm = false } = body;

  if (!salesOrderId)
    return NextResponse.json(
      { error: "salesOrderId is required" },
      { status: 400 },
    );

  // Load order with items and weights/dims
  const order = await prisma.salesOrder.findFirst({
    where: { id: salesOrderId, organizationId },
    include: {
      items: {
        include: {
          inventoryItem: {
            select: {
              id: true,
              name: true,
              sku: true,
              weight: true,
              length: true,
              width: true,
              height: true,
            },
          },
        },
      },
    },
  });

  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (!["APPROVED", "RELEASED", "PICKING", "PACKING"].includes(order.status))
    return NextResponse.json(
      { error: `Order in status ${order.status} cannot be cartonised` },
      { status: 400 },
    );

  // Load available carton types (org-scoped + global)
  const cartonTypes = await prisma.cartonType.findMany({
    where: {
      OR: [{ organizationId }, { organizationId: null }],
      isActive: true,
    },
    orderBy: { maxVolume: "asc" },
  });

  if (cartonTypes.length === 0)
    return NextResponse.json(
      { error: "No active carton types configured" },
      { status: 400 },
    );

  // ── Bin-packing (First Fit Decreasing) ────────────────────────────────────
  // Flatten items into individual units for packing
  interface UnitItem {
    inventoryItemId: string;
    sku: string;
    name: string;
    weight: number; // kg
    volume: number; // m³
  }

  const units: UnitItem[] = [];
  for (const item of order.items) {
    const vol =
      item.inventoryItem.length &&
      item.inventoryItem.width &&
      item.inventoryItem.height
        ? (Number(item.inventoryItem.length) *
            Number(item.inventoryItem.width) *
            Number(item.inventoryItem.height)) /
          1_000_000 // cm³ → m³
        : 0;
    const wt = Number(item.inventoryItem.weight ?? 0);
    for (let i = 0; i < item.quantity; i++) {
      units.push({
        inventoryItemId: item.inventoryItem.id,
        sku: item.inventoryItem.sku,
        name: item.inventoryItem.name,
        weight: wt,
        volume: vol,
      });
    }
  }

  // Sort units descending by volume
  units.sort((a, b) => b.volume - a.volume);

  // Pick the smallest carton type that can hold at least 1 unit
  const defaultCarton = cartonTypes[cartonTypes.length - 1];

  interface Bin {
    cartonType: (typeof cartonTypes)[0];
    unitItems: UnitItem[];
    weightUsed: number;
    volumeUsed: number;
  }

  const bins: Bin[] = [];

  const openBin = (): Bin => ({
    cartonType: defaultCarton,
    unitItems: [],
    weightUsed: 0,
    volumeUsed: 0,
  });

  for (const unit of units) {
    let placed = false;

    for (const bin of bins) {
      const fits =
        bin.weightUsed + unit.weight <= Number(bin.cartonType.maxWeightKg) &&
        bin.volumeUsed + unit.volume <=
          Number(bin.cartonType.maxVolumeCm3) / 1_000_000;

      if (fits) {
        bin.unitItems.push(unit);
        bin.weightUsed += unit.weight;
        bin.volumeUsed += unit.volume;
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Find smallest carton that can hold this unit
      const carton =
        cartonTypes.find(
          (ct) =>
            Number(ct.maxWeightKg) >= unit.weight &&
            Number(ct.maxVolumeCm3) / 1_000_000 >= unit.volume,
        ) ?? defaultCarton;

      const bin = openBin();
      bin.cartonType = carton;
      bin.unitItems.push(unit);
      bin.weightUsed = unit.weight;
      bin.volumeUsed = unit.volume;
      bins.push(bin);
    }
  }

  // ── Build plan response ────────────────────────────────────────────────────
  const plan: CartonPlan[] = bins.map((bin) => {
    // Aggregate items back
    const itemMap = new Map<string, UnitItem & { qty: number }>();
    for (const u of bin.unitItems) {
      const existing = itemMap.get(u.inventoryItemId);
      if (existing) {
        existing.qty += 1;
        existing.weight += u.weight;
        existing.volume += u.volume;
      } else {
        itemMap.set(u.inventoryItemId, { ...u, qty: 1 });
      }
    }
    const maxVol = Number(bin.cartonType.maxVolumeCm3) / 1_000_000;
    return {
      cartonType: {
        id: bin.cartonType.id,
        name: bin.cartonType.name,
        code: bin.cartonType.code,
        maxWeight: Number(bin.cartonType.maxWeightKg),
        maxVolume: maxVol,
      },
      items: Array.from(itemMap.values()),
      totalWeight: Number(bin.weightUsed.toFixed(3)),
      totalVolume: Number(bin.volumeUsed.toFixed(6)),
      utilizationPct:
        maxVol > 0 ? Number(((bin.volumeUsed / maxVol) * 100).toFixed(1)) : 0,
    };
  });

  const summary = {
    totalCartons: bins.length,
    totalWeight: Number(bins.reduce((s, b) => s + b.weightUsed, 0).toFixed(3)),
    totalVolume: Number(bins.reduce((s, b) => s + b.volumeUsed, 0).toFixed(6)),
    avgUtilization: plan.length
      ? Number(
          (
            plan.reduce((s, p) => s + p.utilizationPct, 0) / plan.length
          ).toFixed(1),
        )
      : 0,
  };

  // ── Persist Pack records if confirmed ─────────────────────────────────────
  if (confirm) {
    // Remove any existing draft packs for this order
    await prisma.pack.deleteMany({
      where: { salesOrderId, status: "PENDING" },
    });

    for (let i = 0; i < plan.length; i++) {
      const p = plan[i];
      await prisma.pack.create({
        data: {
          organizationId,
          salesOrderId,
          cartonTypeId: p.cartonType.id,
          packNumber: `PACK-${order.soNumber}-${String(i + 1).padStart(3, "0")}`,
          totalWeight: p.totalWeight,
          totalVolume: p.totalVolume,
          status: "PENDING",
          items: {
            create: p.items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.qty,
              weight: item.weight,
            })),
          },
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "ORDER_CARTONISED",
        resourceType: "SalesOrder",
        resourceId: salesOrderId,
        details: { totalCartons: plan.length, soNumber: order.soNumber },
      },
    });
  }

  return NextResponse.json({ plan, summary, confirmed: confirm });
}
