import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createReportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  code: z.string().min(1, "Code is required"),
  reportType: z.enum(['TABULAR', 'SUMMARY', 'CHART', 'COMBINED', 'PIVOT', 'MATRIX']),
  category: z.enum(['INVENTORY', 'SALES', 'PURCHASING', 'WAREHOUSE', 'FINANCIAL', 'QUALITY', 'PRODUCTION', 'CUSTOM']),
  dataSource: z.string().min(1, "Data source is required"),
  filters: z.record(z.any()).optional(),
  groupBy: z.array(z.string()).optional(),
  sortBy: z.array(z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  })).optional(),
  columns: z.array(z.object({
    field: z.string(),
    label: z.string(),
    type: z.string().optional(),
    aggregation: z.string().optional(),
  })).optional(),
  chartType: z.enum(['BAR', 'LINE', 'PIE', 'DONUT', 'AREA', 'SCATTER', 'GAUGE', 'FUNNEL', 'HEATMAP', 'TABLE']).optional(),
  chartConfig: z.record(z.any()).optional(),
  isScheduled: z.boolean().default(false),
  scheduleType: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).optional(),
  scheduleConfig: z.record(z.any()).optional(),
  emailRecipients: z.array(z.string()).optional(),
  webhookUrl: z.string().optional(),
  isPublic: z.boolean().default(false),
  allowedRoles: z.array(z.string()).optional(),
  allowedUserIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

// GET /api/reports - List reports
export async function GET(request: Request) {
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
        { status: 404 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("reportType");
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (reportType) where.reportType = reportType;
    if (category) where.category = category;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              executions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create report
export async function POST(request: Request) {
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
        { status: 404 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const body = await request.json();
    const validated = createReportSchema.parse(body);

    // Check for duplicate code
    const existing = await prisma.report.findFirst({
      where: {
        organizationId,
        code: validated.code,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Report code already exists" },
        { status: 400 }
      );
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        organizationId,
        createdById: user.id,
        ...validated,
      },
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

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
