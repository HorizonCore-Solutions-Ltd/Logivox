export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createDashboardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  slug: z.string().min(1, "Slug is required"),
  dashboardType: z.enum([
    "OVERVIEW",
    "INVENTORY",
    "SALES",
    "WAREHOUSE",
    "ANALYTICS",
    "CUSTOM",
  ]),
  category: z.enum(["OPERATIONS", "SALES", "FINANCE", "INVENTORY"]).optional(),
  layout: z.record(z.any()).optional(),
  widgets: z.array(z.record(z.any())).optional(),
  isPublic: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  allowedRoles: z.array(z.string()).optional(),
  allowedUserIds: z.array(z.string()).optional(),
  autoRefresh: z.boolean().default(false),
  refreshInterval: z.number().int().min(10).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/dashboards - List dashboards
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
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const { searchParams } = new URL(request.url);
    const dashboardType = searchParams.get("dashboardType");
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: any = {
      organizationId,
    };

    if (dashboardType) where.dashboardType = dashboardType;
    if (category) where.category = category;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const dashboards = await prisma.dashboard.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ dashboards });
  } catch (error) {
    console.error("Error fetching dashboards:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboards" },
      { status: 500 },
    );
  }
}

// POST /api/dashboards - Create dashboard
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
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const body = await request.json();
    const validated = createDashboardSchema.parse(body);

    // Check for duplicate slug
    const existing = await prisma.dashboard.findFirst({
      where: {
        organizationId,
        slug: validated.slug,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Dashboard slug already exists" },
        { status: 400 },
      );
    }

    // Create dashboard
    const dashboard = await prisma.dashboard.create({
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

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error creating dashboard:", error);
    return NextResponse.json(
      { error: "Failed to create dashboard" },
      { status: 500 },
    );
  }
}
