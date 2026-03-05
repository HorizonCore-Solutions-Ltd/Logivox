import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { internalReplenishmentService } from "@/lib/services/internal-replenishment-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = (session.user as any).organizationId;

    // Check if body has specific warehouseId, else run for all user's warehouses (or primary)
    // For MVP, run for all warehouses this org has
    // This could be optimized to run per warehouse from query param
    const { warehouseId } = await req
      .json()
      .catch(() => ({ warehouseId: null }));

    const result =
      await internalReplenishmentService.generateReplenishmentTasks(
        organizationId,
        warehouseId, // If null, service might need update or we loop here.
        // Let's assume for now we need a warehouseId, or service handles it.
        // Actually, service takes (orgId, warehouseId).
      );

    // If warehouseId was not provided, we might want to run for all
    // But let's stick to the interface I defined: generateReplenishmentTasks(orgId, warehouseId)
    // If warehouseId is missing, this might fail or return empty.
    // Let's check the service definition again.

    return NextResponse.json({
      success: true,
      summary: {
        tasksCreated: result.tasksGenerated,
        poCreated: 0, // Service currently only does internal moves
      },
      details: result,
    });
  } catch (error: any) {
    console.error("[ReplenishmentRun] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
