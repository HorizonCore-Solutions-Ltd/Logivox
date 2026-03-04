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
    const category = searchParams.get("category");
    const code = searchParams.get("code");
    const isVisible = searchParams.get("visible");

    const where: Record<string, unknown> = { organizationId: orgId };
    if (category) where.category = category;
    if (code) where.metricCode = code;
    if (isVisible !== null) where.isVisible = isVisible !== "false";

    const metrics = await prisma.kPIMetric.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { metricCode: "asc" }],
    });

    return NextResponse.json({
      metrics: metrics.map((m) => ({
        id: m.id,
        metricCode: m.metricCode,
        metricName: m.metricName,
        description: m.description,
        category: m.category,
        currentValue: Number(m.currentValue),
        previousValue:
          m.previousValue !== null ? Number(m.previousValue) : null,
        targetValue: m.targetValue !== null ? Number(m.targetValue) : null,
        unit: m.unit,
        changeAmount: m.changeAmount !== null ? Number(m.changeAmount) : null,
        changePercent:
          m.changePercent !== null ? Number(m.changePercent) : null,
        trend: m.trend,
        periodType: m.periodType,
        periodStart: m.periodStart.toISOString(),
        periodEnd: m.periodEnd.toISOString(),
        status: m.status,
        alertThreshold:
          m.alertThreshold !== null ? Number(m.alertThreshold) : null,
        displayOrder: m.displayOrder,
        isVisible: m.isVisible,
        icon: m.icon,
        color: m.color,
        calculatedAt: m.calculatedAt.toISOString(),
      })),
      total: metrics.length,
    });
  } catch (error) {
    console.error("Error fetching KPI metrics:", error);
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
      metricCode,
      metricName,
      description,
      category,
      currentValue,
      previousValue,
      targetValue,
      unit,
      trend,
      periodType,
      periodStart,
      periodEnd,
      status,
      displayOrder,
      icon,
      color,
    } = body;

    if (!metricCode || !metricName || !category || currentValue === undefined) {
      return NextResponse.json(
        {
          error:
            "metricCode, metricName, category, and currentValue are required",
        },
        { status: 400 },
      );
    }

    const metric = await prisma.kPIMetric.create({
      data: {
        organizationId: orgId,
        metricCode,
        metricName,
        description,
        category,
        currentValue,
        previousValue,
        targetValue,
        unit,
        trend,
        periodType: periodType ?? "DAILY",
        periodStart: periodStart ? new Date(periodStart) : new Date(),
        periodEnd: periodEnd ? new Date(periodEnd) : new Date(),
        status: status ?? "NORMAL",
        displayOrder: displayOrder ?? 0,
        icon,
        color,
      },
    });

    return NextResponse.json({ success: true, metric }, { status: 201 });
  } catch (error) {
    console.error("Error creating KPI metric:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
