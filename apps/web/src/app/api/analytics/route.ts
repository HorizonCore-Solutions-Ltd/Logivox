/**
 * Analytics API
 * Calculate and return KPI metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "today";

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    if (range === "today") {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (range === "week") {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (range === "month") {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    } else {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    // Load Sheet Analytics
    const loadSheets = await prisma.loadSheet.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        events: true,
      },
    });

    const approvedLoadSheets = loadSheets.filter((ls) => ls.approved);
    const departedLoadSheets = loadSheets.filter(
      (ls) => ls.status === "DEPARTED",
    );

    const avgApprovalTime =
      approvedLoadSheets.reduce((sum, ls) => {
        if (ls.approvedAt) {
          const diff = ls.approvedAt.getTime() - ls.createdAt.getTime();
          return sum + diff / (1000 * 60); // minutes
        }
        return sum;
      }, 0) / (approvedLoadSheets.length || 1);

    const onTimeShipments = departedLoadSheets.filter((ls) => {
      if (!ls.shipmentDate || !ls.actualDepartureTime) return false;
      return ls.actualDepartureTime <= ls.shipmentDate;
    });

    // Container Analytics
    const containers = await prisma.container.findMany({
      where: {
        createdAt: { gte: startDate },
      },
    });

    const avgWeight =
      containers.reduce((sum, c) => sum + c.weight, 0) /
      (containers.length || 1);

    const avgUtilization =
      containers.reduce((sum, c) => {
        const weightUtil = (c.weight / 1000) * 100; // Assuming 1000kg max
        const volumeUtil = (c.volume / 10) * 100; // Assuming 10m³ max
        return sum + (weightUtil + volumeUtil) / 2;
      }, 0) / (containers.length || 1);

    // Worker Analytics
    const workers = await prisma.user.count({
      where: {
        role: { in: ["USER", "MANAGER"] },
      },
    });

    const activeSessions = await prisma.aISupervisionSession.findMany({
      where: {
        status: "ACTIVE",
        startTime: { gte: startDate },
      },
    });

    const avgProductivity =
      activeSessions.reduce((sum, s) => sum + (s.productivityScore || 0), 0) /
      (activeSessions.length || 1);

    const avgAccuracy =
      activeSessions.reduce((sum, s) => sum + (s.accuracyScore || 0), 0) /
      (activeSessions.length || 1);

    // Voice Analytics
    const voiceCommands = await prisma.voiceCommand.findMany({
      where: {
        timestamp: { gte: startDate },
      },
    });

    const avgVoiceAccuracy =
      voiceCommands.reduce((sum, vc) => sum + (vc.confidence || 0) * 100, 0) /
      (voiceCommands.length || 1);

    const avgResponseTime =
      voiceCommands.reduce((sum, vc) => sum + (vc.processingTime || 0), 0) /
      (voiceCommands.length || 1);

    const intentCounts = new Map<string, number>();
    voiceCommands.forEach((vc) => {
      if (vc.intent) {
        intentCounts.set(vc.intent, (intentCounts.get(vc.intent) || 0) + 1);
      }
    });

    const topIntents = Array.from(intentCounts.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count);

    // Intervention Analytics
    const interventions = await prisma.aIIntervention.findMany({
      where: {
        timestamp: { gte: startDate },
      },
    });

    const resolvedInterventions = interventions.filter((i) => i.resolved);

    const avgResolutionTime =
      resolvedInterventions.reduce((sum, i) => {
        if (i.resolvedAt) {
          const diff = i.resolvedAt.getTime() - i.timestamp.getTime();
          return sum + diff / (1000 * 60); // minutes
        }
        return sum;
      }, 0) / (resolvedInterventions.length || 1);

    const bySeverity: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    interventions.forEach((i) => {
      bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    });

    // Build analytics response
    const analytics = {
      loadSheets: {
        total: loadSheets.length,
        approved: approvedLoadSheets.length,
        departed: departedLoadSheets.length,
        avgApprovalTime: Math.round(avgApprovalTime * 10) / 10,
        onTimePercentage:
          (onTimeShipments.length / (departedLoadSheets.length || 1)) * 100,
      },
      containers: {
        total: containers.length,
        packed: containers.filter((c) => c.status === "PACKED").length,
        shipped: containers.filter((c) => c.status === "SHIPPED").length,
        avgWeight: Math.round(avgWeight),
        avgUtilization: Math.round(avgUtilization * 10) / 10,
      },
      workers: {
        total: workers,
        active: activeSessions.length,
        avgProductivity: Math.round(avgProductivity * 10) / 10,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      },
      voice: {
        totalCommands: voiceCommands.length,
        avgAccuracy: Math.round(avgVoiceAccuracy * 10) / 10,
        avgResponseTime: Math.round(avgResponseTime),
        topIntents,
      },
      interventions: {
        total: interventions.length,
        resolved: resolvedInterventions.length,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        bySeverity,
      },
    };

    return NextResponse.json({
      analytics,
      dateRange: range,
      startDate,
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
