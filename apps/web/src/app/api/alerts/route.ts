import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReorderAlertEngine, getAlertStatistics } from "@/lib/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getOrganizationId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizationMemberships: { include: { organization: true }, take: 1 },
    },
  });
  return user?.organizationMemberships?.[0]?.organization?.id ?? null;
}

/**
 * GET /api/alerts
 * Get all reorder alerts for the current organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

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
