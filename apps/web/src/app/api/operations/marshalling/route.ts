import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    // 1. Get Active Load Sheets
    const activeLoadSheets = await prisma.loadSheet.findMany({
      where: {
        organizationId,
        status: {
          in: ["BUILDING", "CONFIRMED", "APPROVED", "LOADING"],
        },
      },
      include: {
        customer: { select: { name: true } },
        bayDoor: { select: { name: true } },
        vehicleType: true,
      },
      orderBy: { shipmentDate: "asc" },
    });

    // 2. Get Recent Departures for KPIs
    const recentDepartures = await prisma.loadSheet.findMany({
      where: {
        organizationId,
        status: "DEPARTED",
      },
      orderBy: { actualDeparture: "desc" },
      take: 20,
    });

    const vehicleTypes = await prisma.fleetVehicleType.findMany({
      where: { organizationId },
    });

    const stagingLanes = activeLoadSheets.slice(0, 10).map((sheet, index) => ({
      id: `S${index + 1}`,
      status: sheet.bayDoorId ? "OCCUPIED" : "AVAILABLE",
      loadSheetId: sheet.id,
    }));

    return NextResponse.json({
      loadSheets: activeLoadSheets,
      history: recentDepartures,
      stagingLanes,
      vehicleTypes,
    });
  } catch (error) {
    console.error("GET /api/operations/marshalling error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marshalling data" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const body = await request.json();

    const loadSheet = await prisma.loadSheet.create({
      data: {
        organizationId,
        loadSheetNumber: `LS-${Date.now()}`,
        shipmentDate: body.shipmentDate || new Date(),
        carrierName: body.carrierName || "Internal Fleet",
        status: "BUILDING",
        totalContainers: 0,
        totalWeight: 0,
        vehicleTypeId: body.vehicleType,
        metadata: {
          stagingLane: body.stagingLane || "S1",
          startedBy: "System (Auto)",
        },
      },
    });

    return NextResponse.json(loadSheet);
  } catch (err) {
    console.error("POST /api/operations/marshalling error:", err);
    return NextResponse.json(
      { error: "Failed to generate load sheet" },
      { status: 500 },
    );
  }
}
export async function PATCH(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const { loadSheetId, status, delayReason } = await request.json();

    const updateData: any = { status };

    if (status === "LOADING") {
      updateData.startedLoadingAt = new Date();
    } else if (status === "DEPARTED") {
      updateData.actualDeparture = new Date();
      updateData.finishedLoadingAt = new Date(); // Assume finished at departure if not set
      if (delayReason) updateData.delayReason = delayReason;
    }

    const updated = await prisma.loadSheet.update({
      where: { id: loadSheetId, organizationId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/operations/marshalling error:", err);
    return NextResponse.json(
      { error: "Failed to update load sheet" },
      { status: 500 },
    );
  }
}
