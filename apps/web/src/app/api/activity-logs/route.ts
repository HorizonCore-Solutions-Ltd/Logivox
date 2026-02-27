import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTenantContext } from "@/lib/tenant-route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    // Tenant context injected by withTenantContext wrapper
    const tenant = (request as any).tenant;
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const userId = searchParams.get("userId");

    const skip = (page - 1) * limit;

    // Build where clause with MANDATORY tenant scope
    const where: any = {
      organizationId: tenant.organizationId,
    };

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (userId) {
      // Additional validation: userId must belong to this organization
      const userInOrg = await prisma.user.findFirst({
        where: {
          id: userId,
          organizations: {
            some: {
              id: tenant.organizationId,
            },
          },
        },
      });

      if (!userInOrg) {
        return NextResponse.json(
          { error: "User not found in this organization" },
          { status: 403 }
        );
      }

      where.userId = userId;
    }

    // Get activity logs with tenant scope
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Activity logs fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch activity logs" },
      { status: 500 },
    );
  }
});
