/**
 * Individual RTV Request Management API
 * GET /api/returns/rtv/[id] - Get RTV details
 * PATCH /api/returns/rtv/[id] - Update RTV request
 * POST /api/returns/rtv/[id]/authorize - Record authorization
 * POST /api/returns/rtv/[id]/ship - Record shipment
 * POST /api/returns/rtv/[id]/credit - Record credit received
 */

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { RTVService } from "@/lib/services/returns/rtv-management";

const authorizeSchema = z.object({
  authorizationNumber: z.string(),
  expiresAt: z.string().optional(),
  instructions: z.string().optional(),
});

const shipSchema = z.object({
  carrier: z.string(),
  trackingNumber: z.string(),
  shippingCost: z.number().optional(),
  packageCount: z.number().default(1),
});

const creditSchema = z.object({
  creditAmount: z.number(),
  creditType: z.enum(["REFUND", "STORE_CREDIT", "REPLACEMENT"]),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 404 },
      );
    }

    const rtvRequest = (await prisma.$queryRaw`
      SELECT rtv.*, v.name as vendor_name, v.email as vendor_email
      FROM rtv_requests rtv
      LEFT JOIN "Vendor" v ON v.id = rtv.vendor_id
      WHERE rtv.id = ${params.id}
        AND rtv.organization_id = ${membership.organizationId}
    `) as any[];

    if (!rtvRequest || rtvRequest.length === 0) {
      return NextResponse.json(
        { error: "RTV request not found" },
        { status: 404 },
      );
    }

    // Get associated RMA items
    const rtv = rtvRequest[0];
    const items = await prisma.rMAItem.findMany({
      where: {
        id: { in: rtv.rma_item_ids },
      },
      include: {
        product: true,
        rma: {
          include: {
            customer: true,
          },
        },
      },
    });

    return NextResponse.json({
      rtvRequest: rtv,
      items,
    });
  } catch (error) {
    console.error("Error fetching RTV request:", error);
    return NextResponse.json(
      { error: "Failed to fetch RTV request" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { action } = body;

    // Get RTV request
    const rtvRequest = (await prisma.$queryRaw`
      SELECT * FROM rtv_requests
      WHERE id = ${params.id}
        AND organization_id = ${membership.organizationId}
    `) as any[];

    if (!rtvRequest || rtvRequest.length === 0) {
      return NextResponse.json(
        { error: "RTV request not found" },
        { status: 404 },
      );
    }

    const rtv = rtvRequest[0];
    const rtvService = new RTVService();

    if (action === "authorize") {
      const data = authorizeSchema.parse(body);

      await rtvService.recordAuthorization(
        params.id,
        data.authorizationNumber,
        data.expiresAt ? new Date(data.expiresAt) : undefined,
        data.instructions,
      );

      await prisma.$executeRaw`
        UPDATE rtv_requests
        SET 
          status = 'AUTHORIZED',
          authorization_number = ${data.authorizationNumber},
          authorized_at = NOW(),
          authorization_expires_at = ${data.expiresAt || null},
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{authorizationInstructions}',
            to_jsonb(${data.instructions || ""})
          ),
          updated_at = NOW()
        WHERE id = ${params.id}
      `;

      return NextResponse.json({
        message: "Authorization recorded successfully",
      });
    }

    if (action === "ship") {
      const data = shipSchema.parse(body);

      await rtvService.shipRTV(
        params.id,
        data.carrier,
        data.trackingNumber,
        data.shippingCost,
        data.packageCount,
      );

      await prisma.$executeRaw`
        UPDATE rtv_requests
        SET 
          status = 'SHIPPED',
          tracking_number = ${data.trackingNumber},
          carrier = ${data.carrier},
          shipped_at = NOW(),
          shipping_cost = ${data.shippingCost || null},
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{packageCount}',
            to_jsonb(${data.packageCount})
          ),
          updated_at = NOW()
        WHERE id = ${params.id}
      `;

      return NextResponse.json({ message: "Shipment recorded successfully" });
    }

    if (action === "credit") {
      const data = creditSchema.parse(body);

      await rtvService.recordCredit(
        params.id,
        data.creditAmount,
        data.creditType,
        data.referenceNumber,
        data.notes,
      );

      await prisma.$executeRaw`
        UPDATE rtv_requests
        SET 
          status = 'COMPLETED',
          credit_amount = ${data.creditAmount},
          credit_type = ${data.creditType},
          credit_reference = ${data.referenceNumber || null},
          completed_at = NOW(),
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{creditNotes}',
            to_jsonb(${data.notes || ""})
          ),
          updated_at = NOW()
        WHERE id = ${params.id}
      `;

      return NextResponse.json({ message: "Credit recorded successfully" });
    }

    // General status update
    if (body.status) {
      await prisma.$executeRaw`
        UPDATE rtv_requests
        SET status = ${body.status}, updated_at = NOW()
        WHERE id = ${params.id}
      `;

      return NextResponse.json({ message: "RTV request updated successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error updating RTV request:", error);
    return NextResponse.json(
      {
        error: "Failed to update RTV request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
