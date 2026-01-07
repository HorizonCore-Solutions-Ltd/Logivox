import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateDARSchema = z.object({
  warehouseId: z.string().optional(),
  reportDate: z.string(),
  shiftType: z.enum(["DAY", "EVENING", "NIGHT"]),
  guardId: z.string(),
  guardName: z.string(),
  supervisorId: z.string().optional(),
  supervisorName: z.string().optional(),
  shiftStart: z.string(),
  shiftEnd: z.string(),
  weatherConditions: z.string().optional(),
  temperature: z.number().optional(),
  equipmentStatus: z.any().optional(),
  observations: z.string().optional(),
  significantEvents: z.string().optional(),
  handoverNotes: z.string().optional(),
});

// POST /api/security/daily-reports - Create Daily Activity Report
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = CreateDARSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    // Generate report number
    const reportDate = new Date(body.reportDate);
    const year = reportDate.getFullYear();
    const count = await prisma.dailyActivityReport.count({
      where: {
        organizationId,
        reportDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    const reportNumber = `DAR-${year}-${String(count + 1).padStart(4, "0")}`;

    // Calculate activity counts from actual data
    const shiftStart = new Date(body.shiftStart);
    const shiftEnd = new Date(body.shiftEnd);

    const [
      gateEntriesCount,
      gateExitsCount,
      visitorsCheckIns,
      incidentsCount,
      patrolsCount,
    ] = await Promise.all([
      prisma.gateEntry.count({
        where: {
          organizationId,
          direction: "INBOUND",
          entryTime: { gte: shiftStart, lte: shiftEnd },
        },
      }),
      prisma.gateEntry.count({
        where: {
          organizationId,
          direction: "OUTBOUND",
          exitTime: { gte: shiftStart, lte: shiftEnd },
        },
      }),
      prisma.visitor.count({
        where: {
          organizationId,
          checkInTime: { gte: shiftStart, lte: shiftEnd },
        },
      }),
      prisma.securityIncident.count({
        where: {
          organizationId,
          reportedAt: { gte: shiftStart, lte: shiftEnd },
        },
      }),
      prisma.patrolExecution.count({
        where: {
          organizationId,
          guardId: body.guardId,
          startTime: { gte: shiftStart, lte: shiftEnd },
          status: "COMPLETED",
        },
      }),
    ]);

    const checkpointsScanned = await prisma.checkpointScan.count({
      where: {
        organizationId,
        guardId: body.guardId,
        scanTime: { gte: shiftStart, lte: shiftEnd },
      },
    });

    // Calculate total hours
    const totalHours =
      (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);

    const report = await prisma.dailyActivityReport.create({
      data: {
        organizationId,
        reportNumber,
        warehouseId: body.warehouseId,
        reportDate,
        shiftType: body.shiftType,
        guardId: body.guardId,
        guardName: body.guardName,
        supervisorId: body.supervisorId,
        supervisorName: body.supervisorName,
        shiftStart,
        shiftEnd,
        totalHours,
        gateEntries: gateEntriesCount,
        gateExits: gateExitsCount,
        visitorCheckIns: visitorsCheckIns,
        incidentsReported: incidentsCount,
        patrolsCompleted: patrolsCount,
        checkpointsScanned,
        weatherConditions: body.weatherConditions,
        temperature: body.temperature,
        equipmentStatus: body.equipmentStatus,
        observations: body.observations,
        significantEvents: body.significantEvents,
        handoverNotes: body.handoverNotes,
        status: "DRAFT",
      },
    });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error creating daily report:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/security/daily-reports - List reports
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const guardId = searchParams.get("guardId");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const reports = await prisma.dailyActivityReport.findMany({
      where: {
        organizationId,
        ...(guardId && { guardId }),
        ...(status && { status: status as any }),
        ...(from &&
          to && {
            reportDate: {
              gte: new Date(from),
              lte: new Date(to),
            },
          }),
      },
      orderBy: { reportDate: "desc" },
      take: 50,
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("Error listing daily reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
