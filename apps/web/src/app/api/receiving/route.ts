/**
 * Receiving Operations API
 * Handles inbound inventory, GRN creation, QC, and put-away
 */

import { NextRequest, NextResponse } from "next/server";
import { ReceivingService } from "@/lib/services/receiving.service";

export const dynamic = "force-dynamic";

// GET - Get GRNs or receiving statistics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const organizationId = searchParams.get("organizationId");
    const warehouseId = searchParams.get("warehouseId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    switch (action) {
      case "statistics":
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: "Start and end dates are required" },
            { status: 400 },
          );
        }

        const stats = await ReceivingService.getStatistics({
          organizationId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          warehouseId: warehouseId || undefined,
        });

        return NextResponse.json(stats);

      case "grn":
        const grnId = searchParams.get("grnId");
        if (!grnId) {
          return NextResponse.json(
            { error: "GRN ID is required" },
            { status: 400 },
          );
        }

        const grn = await ReceivingService.getGRNDetails(grnId);
        return NextResponse.json(grn);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: statistics, grn" },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error("Receiving GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

// POST - Create GRN, perform QC, complete put-away, or process ASN
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create-grn":
        const {
          organizationId,
          purchaseOrderId,
          warehouseId,
          receivedById,
          items,
        } = body;

        if (!organizationId || !purchaseOrderId || !receivedById) {
          return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 },
          );
        }

        const grn = await ReceivingService.createGRN({
          organizationId,
          purchaseOrderId,
          warehouseId,
          receivedById,
          items: items || [],
        });

        return NextResponse.json(grn, { status: 201 });

      case "quality-control":
        const { grnId, qcById, qcStatus, qcNotes, itemUpdates } = body;

        if (!grnId || !qcById || !qcStatus) {
          return NextResponse.json(
            { error: "Missing required QC fields" },
            { status: 400 },
          );
        }

        const qcResult = await ReceivingService.performQualityControl({
          grnId,
          qcById,
          qcStatus,
          qcNotes,
          items: itemUpdates || [],
        });

        return NextResponse.json(qcResult);

      case "complete-putaway":
        const { grnId: putawayGrnId, completedById, binAssignments } = body;

        if (!putawayGrnId || !completedById) {
          return NextResponse.json(
            { error: "Missing required put-away fields" },
            { status: 400 },
          );
        }

        const putawayResult = await ReceivingService.completePutAway({
          grnId: putawayGrnId,
          items: binAssignments || [],
        });

        return NextResponse.json(putawayResult);

      case "process-asn":
        const {
          organizationId: asnOrgId,
          purchaseOrderId: asnPurchaseOrderId,
          asnData,
        } = body;

        if (!asnOrgId || !asnPurchaseOrderId || !asnData) {
          return NextResponse.json(
            {
              error:
                "Missing ASN data (requires organizationId, purchaseOrderId, asnData)",
            },
            { status: 400 },
          );
        }

        const asnResult = await ReceivingService.processASN({
          organizationId: asnOrgId,
          purchaseOrderId: asnPurchaseOrderId,
          asnData,
        });

        return NextResponse.json(asnResult);

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Use: create-grn, quality-control, complete-putaway, process-asn",
          },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error("Receiving POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}
