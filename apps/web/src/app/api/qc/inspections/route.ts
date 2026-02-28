import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { withObservability } from "@/lib/middleware/observability";
import { prisma } from "@/lib/prisma";

// Mock QCInspectionService for turnkey demo/production if actual service is missing or unstable
// In a real scenario, we'd ensure the service handles organization scoping correctly.
const MOCK_ENABLE = false; 

export async function GET(request: NextRequest) {
  return withObservability(async () => {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    
    const inspections = await prisma.qCInspection.findMany({
      where: {
        organizationId,
        warehouseId: warehouseId || undefined,
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json({ inspections });
  }, request);
}

export async function POST(request: NextRequest) {
  return withObservability(async () => {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId, userId } = auth;

    const body = await request.json();

    const inspection = await prisma.qCInspection.create({
      data: {
        organizationId,
        warehouseId: body.warehouseId,
        poId: body.poId,
        supplierId: body.supplierId,
        inspectorId: body.inspectorId || userId,
        status: "PENDING",
        inspectionType: body.inspectionType || "RECEIVING",
        totalUnits: body.totalUnits || 0,
        priority: body.priority || "NORMAL",
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
      },
    });

    return NextResponse.json({ inspection }, { status: 201 });
  }, request);
}
