export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * @route POST /api/shipments/:id/label
 * @desc Generate shipping label for a shipment
 * @access Private
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shipmentId = params.id;

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Transaction to generate label
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Get shipment
        const shipment = await tx.shipment.findFirst({
          where: {
            id: shipmentId,
            organizationId,
          },
          include: {
            salesOrder: {
              include: {
                customer: true,
              },
            },
          },
        });

        if (!shipment) {
          throw new Error("Shipment not found");
        }

        // Check if label already generated
        if (shipment.trackingNumber && shipment.labelUrl) {
          return {
            shipment,
            message: "Label already exists",
            newLabel: false,
          };
        }

        const carrierCode = shipment.carrierCode || "UPS";
        const carrierConfig = await tx.carrierConfig.findFirst({
          where: {
            organizationId,
            carrierType: carrierCode as any,
            isActive: true,
          },
        });

        if (!carrierConfig || !carrierConfig.apiKey) {
          throw new Error(
            `Carrier label integration is not configured for ${carrierCode}. Configure an active carrier API key before label generation.`,
          );
        }

        const config =
          carrierConfig.config && typeof carrierConfig.config === "object"
            ? (carrierConfig.config as Record<string, unknown>)
            : {};
        const labelEndpoint =
          typeof config.labelEndpoint === "string"
            ? config.labelEndpoint
            : undefined;

        if (!labelEndpoint) {
          throw new Error(
            `Carrier ${carrierCode} config missing labelEndpoint in carrier config.`,
          );
        }

        const requestPayload = {
          shipment: {
            shipmentId: shipment.id,
            shipmentNumber: shipment.shipmentNumber,
            carrierCode,
            carrierService: shipment.carrierService,
            weight: shipment.weight ? Number(shipment.weight) : null,
            weightUnit: shipment.weightUnit || "kg",
            dimensions: shipment.dimensions || null,
            recipient: {
              name: shipment.recipientName || shipment.salesOrder.customer.name,
              phone:
                shipment.recipientPhone || shipment.salesOrder.customer.phone,
              email:
                shipment.recipientEmail || shipment.salesOrder.customer.email,
              addressLine1:
                shipment.addressLine1 || shipment.salesOrder.shippingAddress,
              addressLine2: shipment.addressLine2,
              city: shipment.city || shipment.salesOrder.shippingCity,
              state: shipment.state || shipment.salesOrder.shippingState,
              postalCode:
                shipment.postalCode || shipment.salesOrder.shippingZip,
              country: shipment.country || shipment.salesOrder.shippingCountry,
            },
          },
          order: {
            salesOrderId: shipment.salesOrderId,
            soNumber: shipment.salesOrder.soNumber,
          },
        };

        const labelResponse = await fetch(labelEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${carrierConfig.apiKey}`,
            ...(carrierConfig.apiSecret
              ? { "X-Api-Secret": carrierConfig.apiSecret }
              : {}),
            ...(carrierConfig.accountNumber
              ? { "X-Account-Number": carrierConfig.accountNumber }
              : {}),
          },
          body: JSON.stringify(requestPayload),
        });

        const labelResult = await labelResponse.json().catch(() => ({}));

        if (!labelResponse.ok) {
          throw new Error(
            labelResult?.error ||
              `Carrier ${carrierCode} label API failed with status ${labelResponse.status}`,
          );
        }

        const trackingNumber = labelResult?.trackingNumber;
        const labelUrl = labelResult?.labelUrl;

        if (!trackingNumber || !labelUrl) {
          throw new Error(
            `Carrier ${carrierCode} label API response missing trackingNumber or labelUrl`,
          );
        }

        const trackingUrl =
          labelResult?.trackingUrl || shipment.trackingUrl || null;
        const estimatedDelivery = labelResult?.estimatedDelivery
          ? new Date(labelResult.estimatedDelivery)
          : shipment.estimatedDelivery;
        const shippingCost =
          typeof labelResult?.shippingCost === "number"
            ? labelResult.shippingCost
            : shipment.shippingCost;

        // Update shipment with label info
        const updatedShipment = await tx.shipment.update({
          where: { id: shipmentId },
          data: {
            status: "PROCESSING",
            trackingNumber,
            trackingUrl: trackingUrl || undefined,
            labelUrl,
            labelFormat: String(labelResult?.labelFormat || "PDF"),
            estimatedDelivery: estimatedDelivery || undefined,
            shippingCost: shippingCost || undefined,
            lastTrackingUpdate: new Date(),
            trackingEvents: [
              {
                status: "LABEL_CREATED",
                description: "Shipping label created",
                timestamp: new Date().toISOString(),
                carrierResponseId: labelResult?.id || null,
              },
            ] as any,
          },
        });

        // Update sales order tracking info
        await tx.salesOrder.update({
          where: { id: shipment.salesOrderId },
          data: {
            trackingNumber,
            carrierName: shipment.carrierName,
          },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            organizationId,
            userId: session.user.id,
            action: "SHIPPING_LABEL_GENERATED",
            entityType: "SHIPMENT",
            entityId: shipmentId,
            metadata: {
              shipmentNumber: shipment.shipmentNumber,
              trackingNumber,
              carrier: shipment.carrierCode,
              service: shipment.carrierService,
              estimatedDelivery: estimatedDelivery?.toISOString(),
            },
          },
        });

        return {
          shipment: updatedShipment,
          message: "Label generated successfully",
          newLabel: true,
        };
      },
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error generating label:", error);

    const message = error?.message || "Failed to generate label";
    if (message.includes("not configured")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
