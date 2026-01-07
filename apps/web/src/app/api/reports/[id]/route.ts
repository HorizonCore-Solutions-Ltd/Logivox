export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateReportSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  reportType: z
    .enum(["TABULAR", "SUMMARY", "CHART", "COMBINED", "PIVOT", "MATRIX"])
    .optional(),
  category: z
    .enum([
      "INVENTORY",
      "SALES",
      "PURCHASING",
      "WAREHOUSE",
      "FINANCIAL",
      "QUALITY",
      "PRODUCTION",
      "CUSTOM",
    ])
    .optional(),
  dataSource: z.string().min(1).optional(),
  filters: z.record(z.any()).optional(),
  groupBy: z.array(z.string()).optional(),
  sortBy: z
    .array(
      z.object({
        field: z.string(),
        direction: z.enum(["asc", "desc"]),
      }),
    )
    .optional(),
  columns: z
    .array(
      z.object({
        field: z.string(),
        label: z.string(),
        type: z.string().optional(),
        aggregation: z.string().optional(),
      }),
    )
    .optional(),
  chartType: z
    .enum([
      "BAR",
      "LINE",
      "PIE",
      "DONUT",
      "AREA",
      "SCATTER",
      "GAUGE",
      "FUNNEL",
      "HEATMAP",
      "TABLE",
    ])
    .optional(),
  chartConfig: z.record(z.any()).optional(),
  isScheduled: z.boolean().optional(),
  scheduleType: z
    .enum(["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "CUSTOM"])
    .optional(),
  scheduleConfig: z.record(z.any()).optional(),
  emailRecipients: z.array(z.string()).optional(),
  webhookUrl: z.string().optional(),
  isPublic: z.boolean().optional(),
  allowedRoles: z.array(z.string()).optional(),
  allowedUserIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/reports/[id] - Get report by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        executions: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            executedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 },
    );
  }
}

// PATCH /api/reports/[id] - Update report
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Check if report exists
    const existing = await prisma.report.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateReportSchema.parse(body);

    // Update report
    const report = await prisma.report.update({
      where: { id: params.id },
      data: validated,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 },
    );
  }
}

// DELETE /api/reports/[id] - Delete report
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Check if report exists
    const existing = await prisma.report.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Delete executions first
    await prisma.reportExecution.deleteMany({
      where: { reportId: params.id },
    });

    // Delete report
    await prisma.report.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 },
    );
  }
}
