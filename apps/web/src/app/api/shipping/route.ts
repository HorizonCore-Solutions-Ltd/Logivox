/**
 * Shipping Operations API
 * Handles shipment creation, carrier selection, rate shopping, and tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { ShippingService } from "@/lib/services/shipping.service";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

// GET - Get shipment details, rates, or tracking
export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    switch (action) {
      case "shipment":
        const shipmentId = searchParams.get("shipmentId");
        if (!shipmentId) {
          return NextResponse.json(
            { error: "Shipment ID is required" },
            { status: 400 },
          );
        }

        const shipment = await prisma.shipment.findUnique({
          where: { id: shipmentId },
          include: { salesOrder: true },
        });
        return NextResponse.json(shipment);

      case "tracking":
        const trackingNumber = searchParams.get("trackingNumber");
        if (!trackingNumber) {
          return NextResponse.json(
            { error: "Tracking number is required" },
            { status: 400 },
          );
        }

        const tracking =
          await ShippingService.getByTrackingNumber(trackingNumber);
        return NextResponse.json(tracking);

      case "performance":
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (!organizationId || !startDate || !endDate) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 },
          );
        }

        const performance = await ShippingService.getShippingMetrics({
          organizationId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        });

        return NextResponse.json(performance);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: shipment, tracking, performance" },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error("Shipping GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

// POST - Create shipment, get rates, or generate label
export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create-shipment":
        const {
          organizationId,
          salesOrderId,
          packId,
          carrierCode,
          carrierService,
          createdById,
        } = body;

        if (!organizationId || !salesOrderId || !createdById) {
          return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 },
          );
        }

        const shipment = await ShippingService.createShipment({
          organizationId,
          salesOrderId,
          packId,
          carrierCode,
          carrierService,
          createdById,
        });

        return NextResponse.json(shipment, { status: 201 });

      case "get-rates":
        const {
          organizationId: rateOrgId,
          fromAddress,
          toAddress,
          weight,
          weightUnit,
          carriers,
        } = body;

        if (!rateOrgId || !fromAddress || !toAddress || !weight) {
          return NextResponse.json(
            {
              error:
                "Missing required fields (organizationId, fromAddress, toAddress, weight)",
            },
            { status: 400 },
          );
        }

        const rates = await ShippingService.getRateQuotes({
          organizationId: rateOrgId,
          fromAddress,
          toAddress,
          weight,
          weightUnit: weightUnit || "kg",
          carriers,
        });

        return NextResponse.json(rates);

      case "select-carrier":
        const {
          organizationId: selectOrgId,
          shipmentId: selectShipmentId,
          criteria,
        } = body;

        if (!selectOrgId || !selectShipmentId || !criteria) {
          return NextResponse.json(
            { error: "organizationId, shipmentId, and criteria are required" },
            { status: 400 },
          );
        }

        const selected = await ShippingService.selectOptimalCarrier({
          organizationId: selectOrgId,
          shipmentId: selectShipmentId,
          criteria,
        });

        return NextResponse.json(selected);

      case "generate-label":
        const { shipmentId: labelShipmentId } = body;

        if (!labelShipmentId) {
          return NextResponse.json(
            { error: "Shipment ID is required" },
            { status: 400 },
          );
        }

        const label = await ShippingService.generateLabel({
          shipmentId: labelShipmentId,
        });

        return NextResponse.json(label);

      case "bulk-ship":
        const {
          organizationId: bulkOrgId,
          shipments,
          createdById: bulkCreatedById,
        } = body;

        if (
          !bulkOrgId ||
          !shipments ||
          !Array.isArray(shipments) ||
          !bulkCreatedById
        ) {
          return NextResponse.json(
            {
              error:
                "organizationId, shipments array, and createdById are required",
            },
            { status: 400 },
          );
        }

        const bulkResult = await ShippingService.bulkShip({
          organizationId: bulkOrgId,
          shipments,
          createdById: bulkCreatedById,
        });

        return NextResponse.json(bulkResult);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Shipping POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}
