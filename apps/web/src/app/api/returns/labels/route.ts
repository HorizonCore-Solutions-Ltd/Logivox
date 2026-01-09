/**
 * Return Label Generation API
 * POST /api/returns/labels/generate - Generate return label
 * GET /api/returns/labels/[id] - Get label details
 * POST /api/returns/labels/[id]/void - Void a label
 * GET /api/returns/labels/[id]/track - Track shipment
 */

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { LabelServiceFactory } from "@/lib/services/returns/label-service";

const generateLabelSchema = z.object({
  rmaId: z.string(),
  carrier: z.enum(["UPS", "FedEx", "USPS", "DHL", "CanadaPost"]),
  serviceLevel: z.string().optional(),
  type: z.enum(["PREPAID", "CUSTOMER_PAID", "COLLECT"]).default("PREPAID"),
  shipFrom: z.object({
    name: z.string(),
    address1: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
  }),
  shipTo: z.object({
    name: z.string(),
    address1: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    phone: z.string().optional(),
  }),
  package: z.object({
    weight: z.number(),
    weightUnit: z.enum(["lb", "kg"]),
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const data = generateLabelSchema.parse(body);

    // Verify RMA belongs to organization
    const rma = await prisma.rMA.findFirst({
      where: {
        id: data.rmaId,
        organizationId: membership.organizationId,
      },
      include: {
        customer: true,
        returnReason: true,
      },
    });

    if (!rma) {
      return NextResponse.json({ error: "RMA not found" }, { status: 404 });
    }

    // Get label service settings
    const settings = (await prisma.$queryRaw`
      SELECT * FROM return_settings WHERE organization_id = ${membership.organizationId}
    `) as any[];

    const labelSettings = settings[0]?.labels || {};

    if (!labelSettings.enabled) {
      return NextResponse.json(
        { error: "Label generation not enabled" },
        { status: 400 },
      );
    }

    // Get appropriate label service
    const provider =
      labelSettings.provider || process.env.LABEL_PROVIDER || "shipstation";
    const labelService = LabelServiceFactory.create(provider, {
      apiKey: process.env[`${provider.toUpperCase()}_API_KEY`],
      apiSecret: process.env[`${provider.toUpperCase()}_API_SECRET`],
    });

    // Generate label
    const label = await labelService.generateLabel({
      rmaId: data.rmaId,
      rmaNumber: rma.rmaNumber,
      carrier: data.carrier,
      serviceLevel: data.serviceLevel,
      type: data.type,
      shipFrom: data.shipFrom,
      shipTo: data.shipTo,
      package: data.package,
    });

    // Save to database
    await prisma.$executeRaw`
      INSERT INTO return_labels (
        id, rma_id, carrier, service_level, tracking_number,
        label_url, label_data, qr_code_url, cost, currency,
        type, format, created_at, expires_at, metadata
      ) VALUES (
        ${label.id}, ${data.rmaId}, ${label.carrier}, ${label.serviceLevel},
        ${label.trackingNumber}, ${label.labelUrl}, ${label.labelData},
        ${label.qrCodeUrl}, ${label.cost?.amount}, ${label.cost?.currency},
        ${data.type}, ${label.format}, NOW(), ${label.expiresAt}, ${JSON.stringify(label.providerResponse)}::jsonb
      )
    `;

    // Update RMA with tracking info
    await prisma.rMA.update({
      where: { id: data.rmaId },
      data: {
        returnTrackingNumber: label.trackingNumber,
        returnCarrier: label.carrier,
        returnShippingCost: label.cost?.amount,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "RETURN_LABEL_GENERATED",
        entityType: "RMA",
        entityId: rma.id,
        metadata: {
          rmaNumber: rma.rmaNumber,
          carrier: label.carrier,
          trackingNumber: label.trackingNumber,
        },
      },
    });

    return NextResponse.json({
      label,
      message: "Return label generated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error generating label:", error);
    return NextResponse.json(
      {
        error: "Failed to generate label",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
