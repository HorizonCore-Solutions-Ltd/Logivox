export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTenantFromRequest } from "@/lib/tenant-context";
import { withObservability } from "@/lib/middleware/observability";

export async function GET(request: NextRequest) {
  return withObservability(async () => {
    // Resolve tenant to get organizationId (fail-closed, no user-provided params)
    const tenant = await resolveTenantFromRequest(request as any);
    if (!tenant) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const warehouses = await prisma.warehouse.findMany({
      where: {
        organizationId: tenant.organizationId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(warehouses);
  }, request);
}

export async function POST(request: NextRequest) {
  return withObservability(async () => {
    // Resolve tenant to get organizationId
    const tenant = await resolveTenantFromRequest(request as any);
    if (!tenant) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, location, description } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 },
      );
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        location,
        description,
        organizationId: tenant.organizationId,
      },
    });

    // Log activity with organization scope
    await prisma.activityLog.create({
      data: {
        organizationId: tenant.organizationId,
        userId: tenant.userId,
        action: "CREATE",
        entityType: "warehouse",
        entityId: warehouse.id,
        metadata: { name },
        ipAddress: (request as any).headers.get("x-forwarded-for") || "unknown",
        userAgent: (request as any).headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json(warehouse, { status: 201 });
  }, request);
}
