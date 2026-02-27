/**
 * Admin Audit Logs API Routes
 * Fetch and export audit logs
 * SECURITY: Scoped to organization to prevent cross-tenant access
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { resolveTenantFromRequest } from "@/lib/tenant-context";

// GET /api/admin/audit-logs - Fetch audit logs for organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "audit:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Resolve tenant to scope to organization
    const tenant = await resolveTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const skip = (page - 1) * limit;

    // Build where clause with MANDATORY organization scope
    const where: any = {
      organizationId: tenant.organizationId,
    };

    if (type && type !== "all") {
      where.type = type;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (from || to) {
      where.auditDate = {};
      if (from) where.auditDate.gte = new Date(from);
      if (to) where.auditDate.lte = new Date(to);
    }

    // Fetch audit logs with organization isolation
    const [logs, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { auditDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.audit.count({ where }),
    ]);

    // Transform audit records for response
    const transformedLogs = logs.map((log) => ({
      id: log.id,
      auditNumber: log.auditNumber,
      organizationId: log.organizationId,
      type: log.type,
      scope: log.scope,
      standard: log.standard,
      auditDate: log.auditDate.toISOString(),
      location: log.location,
      auditorName: log.auditorName,
      auditorId: log.auditorId,
      auditeeName: log.auditeeName,
      auditeeId: log.auditeeId,
      status: log.status,
      summary: log.summary,
      recommendations: log.recommendations,
      notes: log.notes,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}
