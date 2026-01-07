import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ReorderAlertEngine, getAlertStatistics } from "@/lib/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/alerts
 * Get all reorder alerts for the current organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Get organizationId from session/user
    const organizationId = "org_example"; // Replace with actual org ID from session

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const days = parseInt(searchParams.get("days") || "30");

    if (searchParams.has("stats")) {
      // Return statistics
      const stats = await getAlertStatistics(organizationId, days);
      return NextResponse.json(stats);
    }

    // Get pending alerts
    const alerts = await ReorderAlertEngine.getPendingAlerts(organizationId);

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("[GET /api/alerts] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/alerts/check
 * Manually trigger inventory check
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Get organizationId from session/user
    const organizationId = "org_example"; // Replace with actual org ID from session

    const engine = new ReorderAlertEngine({
      organizationId,
      checkLeadTime: true,
      throttleHours: 24,
      enableEmail: true,
      enableSMS: false,
      enableSlack: true,
      enablePush: true,
    });

    const results = await engine.checkInventory();

    return NextResponse.json({
      success: true,
      alertsCreated: results.length,
      results,
    });
  } catch (error) {
    console.error("[POST /api/alerts/check] Error:", error);
    return NextResponse.json(
      { error: "Failed to check inventory" },
      { status: 500 },
    );
  }
}
