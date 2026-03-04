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

    const sheets = await prisma.loadSheet.findMany({
      where,
      include: {
        containers: {
          include: {
            containerItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      sheets: sheets.map((s) => ({
        id: s.id,
        loadSheetNumber: s.loadSheetNumber,
        status: s.status,
        shipmentDate: s.shipmentDate.toISOString(),
        routeCode: s.routeCode,
        carrierName: s.carrierName,
        driverName: s.driverName,
        trailerNumber: s.trailerNumber,
        totalContainers: s.totalContainers,
        totalWeight: s.totalWeight,
        totalVolume: s.totalVolume,
        totalPallets: s.totalPallets,
        totalBoxes: s.totalBoxes,
        totalItems: s.totalItems,
        totalOrders: s.totalOrders,
        approved: s.approved,
        approvedBy: s.approvedBy,
        approvedAt: s.approvedAt?.toISOString() ?? null,
        distributed: s.distributed,
        distributedAt: s.distributedAt?.toISOString() ?? null,
        actualDeparture: s.actualDeparture?.toISOString() ?? null,
        containers: s.containers.map((c) => ({
          id: c.id,
          containerNumber: c.containerNumber,
          containerType: c.containerType,
          status: c.status,
          weight: c.weight,
          volume: c.volume,
          itemCount: c.containerItems.length,
          containerItems: c.containerItems.map((i) => ({
            id: i.id,
            sku: i.sku,
            description: i.description,
            quantity: i.quantity,
            weight: i.weight,
          })),
        })),
        createdAt: s.createdAt.toISOString(),
      })),
      total: sheets.length,
    });
  } catch (error) {
    console.error("Error fetching load sheets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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
      shipmentDate,
      routeCode,
      carrierName,
      driverName,
      driverPhone,
      trailerNumber,
      bayDoorId,
      destinationAddress,
      notes,
    } = body;

    if (!shipmentDate) {
      return NextResponse.json(
        { error: "shipmentDate is required" },
        { status: 400 },
      );
    }

    const count = await prisma.loadSheet.count({
      where: { organizationId: orgId },
    });
    const loadSheetNumber = `LS-${String(count + 1).padStart(5, "0")}`;

    const sheet = await prisma.loadSheet.create({
      data: {
        organizationId: orgId,
        loadSheetNumber,
        shipmentDate: new Date(shipmentDate),
        routeCode,
        carrierName,
        driverName,
        driverPhone,
        trailerNumber,
        bayDoorId,
        destinationAddress,
        notes,
        status: "BUILDING",
      },
    });

    return NextResponse.json({ success: true, sheet }, { status: 201 });
  } catch (error) {
    console.error("Error creating load sheet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
