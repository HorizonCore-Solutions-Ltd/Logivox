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
    const direction = searchParams.get("direction");
    const dateStr = searchParams.get("date");

    const where: Record<string, unknown> = { organizationId: orgId };
    if (status) where.status = status;
    if (direction) where.direction = direction;
    if (dateStr) {
      const day = new Date(dateStr);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.entryTime = { gte: day, lt: nextDay };
    }

    const entries = await prisma.gateEntry.findMany({
      where,
      orderBy: { entryTime: "desc" },
      take: 100,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntries = entries.filter((e) => e.entryTime >= today);
    const stats = {
      totalToday: todayEntries.length,
      inboundToday: todayEntries.filter((e) => e.direction === "INBOUND")
        .length,
      outboundToday: todayEntries.filter((e) => e.direction === "OUTBOUND")
        .length,
      onSite: entries.filter(
        (e) =>
          e.status === "CHECKED_IN" ||
          e.status === "PROCESSING" ||
          e.status === "APPROVED",
      ).length,
      pendingCheckIn: entries.filter((e) => e.status === "SCHEDULED").length,
    };

    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e.id,
        entryNumber: e.entryNumber,
        entryType: e.entryType,
        direction: e.direction,
        vehicleNumber: e.vehicleNumber ?? e.licensePlate,
        licensePlate: e.licensePlate,
        trailerNumber: e.trailerNumber,
        driverName: e.driverName,
        carrierName: e.carrierName,
        status: e.status,
        appointmentId: e.appointmentId,
        entryTime: e.entryTime.toISOString(),
        exitTime: e.exitTime?.toISOString() ?? null,
        securityCheckPassed: e.securityCheckPassed,
        createdAt: e.entryTime.toISOString(),
      })),
      total: entries.length,
      stats,
    });
  } catch (error) {
    console.error("Error fetching gate entries:", error);
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
      entryType,
      direction,
      vehicleType,
      vehicleNumber,
      licensePlate,
      trailerNumber,
      driverName,
      driverLicense,
      driverPhone,
      carrierName,
      appointmentId,
      referenceNumber,
      gateNumber,
      securityCheckPassed,
      notes,
    } = body;

    if (!entryType || !direction) {
      return NextResponse.json(
        { error: "entryType and direction are required" },
        { status: 400 },
      );
    }

    // Generate sequential entry number
    const count = await prisma.gateEntry.count({
      where: { organizationId: orgId },
    });
    const entryNumber = `GE-${String(count + 1).padStart(5, "0")}`;

    const entry = await prisma.gateEntry.create({
      data: {
        organizationId: orgId,
        entryNumber,
        entryType,
        direction,
        vehicleType,
        vehicleNumber,
        licensePlate,
        trailerNumber,
        driverName,
        driverLicense,
        driverPhone,
        carrierName,
        appointmentId,
        referenceNumber,
        gateNumber,
        securityCheckPassed: securityCheckPassed ?? false,
        notes,
        entryTime: new Date(),
        status: "CHECKED_IN",
      },
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error("Error creating gate entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
