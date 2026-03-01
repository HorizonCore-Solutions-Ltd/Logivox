/**
 * GET  /api/organization/invoice-settings  – return current invoice settings
 * PATCH /api/organization/invoice-settings – update invoice settings
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  trigger: "ON_ORDER_CONFIRMATION", // InvoiceTrigger enum value
  termsNet: 30,                     // payment due in N days
  footerText: "",                   // printed on packing slip + invoice footer
  showPackingSlip: true,            // auto-show packing slip upon shipment
  logoUrl: "",                      // override logo URL for documents
  requireDeliveryConfirmation: false,
  taxRate: 0,                       // default tax % (0–100)
  invoicePrefix: "INV",             // e.g. "INV" → INV-20240101-0001
  nextSequence: 1,                  // manually override next sequence number
  currency: "USD",
  bankDetails: "",                  // free-text bank info printed on invoice
  paymentInstructions: "",          // free-text payment method instructions
  ccEmails: [] as string[],         // additional CC addresses on invoice emails
};

// ── Validation schema ────────────────────────────────────────────────────────
const patchSchema = z.object({
  trigger: z
    .enum(["ON_ORDER_CONFIRMATION", "ON_SHIPMENT", "ON_DELIVERY_CONFIRMATION", "MANUAL"])
    .optional(),
  termsNet: z.number().int().min(0).max(365).optional(),
  footerText: z.string().max(2000).optional(),
  showPackingSlip: z.boolean().optional(),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  requireDeliveryConfirmation: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  invoicePrefix: z.string().min(1).max(20).optional(),
  nextSequence: z.number().int().min(1).optional(),
  currency: z.string().length(3).optional(),
  bankDetails: z.string().max(2000).optional(),
  paymentInstructions: z.string().max(2000).optional(),
  ccEmails: z.array(z.string().email()).max(10).optional(),
});

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { invoiceSettings: true, currency: true, name: true },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const saved = (org.invoiceSettings as Record<string, any>) ?? {};
  const settings = {
    ...DEFAULT_SETTINGS,
    currency: org.currency ?? DEFAULT_SETTINGS.currency,
    ...saved,
  };

  return NextResponse.json({ settings, organizationName: org.name });
}

// ── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { invoiceSettings: true },
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const current = (org.invoiceSettings as Record<string, any>) ?? {};
  const updated = { ...current, ...parsed.data };

  await prisma.organization.update({
    where: { id: organizationId },
    data: { invoiceSettings: updated },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      organizationId,
      action: "UPDATE_INVOICE_SETTINGS",
      resourceType: "Organization",
      resourceId: organizationId,
      details: { changes: Object.keys(parsed.data) },
    },
  });

  return NextResponse.json({ success: true, settings: updated });
}
