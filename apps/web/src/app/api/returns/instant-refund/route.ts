import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { instantRefundService } from "@/lib/services/returns/instant-refund-service";

/**
 * POST /api/returns/instant-refund
 * Evaluate eligibility and process instant refund
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rmaId, organizationId } = body;

    if (!rmaId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields: rmaId, organizationId" },
        { status: 400 },
      );
    }

    // Evaluate eligibility
    const eligibility = await instantRefundService.evaluateEligibility({
      rmaId,
      organizationId,
    });

    if (!eligibility.eligible) {
      return NextResponse.json({
        eligible: false,
        ...eligibility,
      });
    }

    // Process instant refund
    const instantRefund = await instantRefundService.processInstantRefund({
      rmaId,
      organizationId,
      refundMethod: body.refundMethod || "ORIGINAL_PAYMENT",
    });

    return NextResponse.json({
      success: true,
      instantRefund,
    });
  } catch (error: any) {
    console.error("Instant refund error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process instant refund" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/returns/instant-refund?organizationId=xxx
 * Get all instant refunds for organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedOrgId = searchParams.get("organizationId");
    const status = searchParams.get("status");

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.length) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 404 },
      );
    }

    const allowedOrgIds = new Set(
      user.organizationMemberships.map((m) => m.organizationId),
    );
    const organizationId =
      requestedOrgId && allowedOrgIds.has(requestedOrgId)
        ? requestedOrgId
        : user.organizationMemberships[0].organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organization context" },
        { status: 403 },
      );
    }

    const instantRefunds = await prisma.instantRefund.findMany({
      where: {
        organizationId,
        ...(status ? { verificationStatus: status } : {}),
      },
      include: {
        rma: {
          select: {
            id: true,
            rmaNumber: true,
            status: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      instantRefunds,
      count: instantRefunds.length,
    });
  } catch (error: any) {
    console.error("Get instant refunds error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get instant refunds" },
      { status: 500 },
    );
  }
}
