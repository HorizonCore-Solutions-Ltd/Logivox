import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dateStr = searchParams.get("date");

    const where: Record<string, unknown> = { organizationId: orgId };
    if (status) where.status = status;
    if (dateStr) {
      const day = new Date(dateStr);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.shipmentDate = { gte: day, lt: nextDay };
    }

    const plans = await prisma.loadPlan.findMany({
      where,
      include: {
        items: {
          orderBy: { loadSequence: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      plans: plans.map((p) => ({
        id: p.id,
        planNumber: p.planNumber,
        planName: p.planName,
        status: p.status,
        shipmentDate: p.shipmentDate.toISOString(),
        vehicleType: p.vehicleType,
        optimizationGoal: p.optimizationGoal,
        maxWeight: p.maxWeight,
        maxVolume: p.maxVolume,
        maxPallets: p.maxPallets,
        totalWeight: p.totalWeight,
        totalVolume: p.totalVolume,
        totalPallets: p.totalPallets,
        utilization: p.utilization,
        estimatedCost: p.estimatedCost !== null ? Number(p.estimatedCost) : null,
        actualCost: p.actualCost !== null ? Number(p.actualCost) : null,
        approvedBy: p.approvedBy,
        itemCount: p.items.length,
        items: p.items.map((item) => ({
          id: item.id,
          loadSequence: item.loadSequence,
          itemSKU: item.itemSKU,
          itemName: item.itemName,
          quantity: item.quantity,
          weight: item.weight,
          volume: item.volume,
          palletNumber: item.palletNumber,
          isLoaded: item.isLoaded,
        })),
        createdAt: p.createdAt.toISOString(),
      })),
      total: plans.length,
    });
  } catch (error) {
    console.error("Error fetching load plans:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;

    const body = await request.json();
    const {
      planName,
      shipmentDate,
      vehicleType,
      maxWeight,
      maxVolume,
      maxPallets,
      optimizationGoal,
    } = body;

    if (!planName || !shipmentDate) {
      return NextResponse.json(
        { error: "planName and shipmentDate are required" },
        { status: 400 },
      );
    }

    const count = await prisma.loadPlan.count({ where: { organizationId: orgId } });
    const planNumber = `LP-${String(count + 1).padStart(5, "0")}`;

    const plan = await prisma.loadPlan.create({
      data: {
        organizationId: orgId,
        planNumber,
        planName,
        shipmentDate: new Date(shipmentDate),
        vehicleType,
        maxWeight,
        maxVolume,
        maxPallets,
        optimizationGoal: optimizationGoal ?? "MAXIMIZE_UTILIZATION",
        status: "DRAFT",
      },
    });

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error) {
    console.error("Error creating load plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
