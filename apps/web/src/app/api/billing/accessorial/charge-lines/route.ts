/**
 * GET  /api/billing/accessorial/charge-lines  – list charge lines (pending/invoiced)
 * POST /api/billing/accessorial/charge-lines  – add an accessorial charge line to an order/customer
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  chargeCodeId: z.string(),
  salesOrderId: z.string().optional(),
  customerId: z.string().optional(),
  periodStart: z.string().optional().transform((s) => s ? new Date(s) : undefined),
  periodEnd: z.string().optional().transform((s) => s ? new Date(s) : undefined),
  quantity: z.number().min(0.001),
  unitRate: z.number().min(0).optional(), // defaults to chargeCode.defaultRate
  markup: z.number().min(0).default(0),
  description: z.string().optional(),
  currency: z.string().length(3).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const salesOrderId = searchParams.get("salesOrderId");
  const customerId = searchParams.get("customerId");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));

  const where: any = {
    organizationId,
    ...(status && { status }),
    ...(salesOrderId && { salesOrderId }),
    ...(customerId && { customerId }),
  };

  const [lines, total] = await Promise.all([
    prisma.accessorialChargeLine.findMany({
      where,
      include: {
        chargeCode: { select: { code: true, name: true, chargeType: true, unitLabel: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.accessorialChargeLine.count({ where }),
  ]);

  // Aggregate totals
  const totals = await prisma.accessorialChargeLine.aggregate({
    where: { ...where, status: { not: "VOID" } },
    _sum: { total: true, subtotal: true, markup: true },
  });

  return NextResponse.json({
    lines,
    totals: {
      subtotal: Number(totals._sum.subtotal ?? 0),
      markup: Number(totals._sum.markup ?? 0),
      total: Number(totals._sum.total ?? 0),
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { chargeCodeId, quantity, unitRate, markup, description, currency, ...rest } = parsed.data;

  // Load charge code for default rate
  const code = await prisma.accessorialChargeCode.findFirst({
    where: { id: chargeCodeId, organizationId, isActive: true },
  });
  if (!code) return NextResponse.json({ error: "Charge code not found or inactive" }, { status: 404 });

  const effectiveRate = unitRate ?? Number(code.defaultRate);
  const effectiveMarkup = markup ?? Number(code.markup);
  const subtotal = quantity * effectiveRate;
  const markupAmount = (subtotal * effectiveMarkup) / 100;
  const total = subtotal + markupAmount;

  // Enforce minCharge / maxCharge
  const minC = code.minCharge ? Number(code.minCharge) : null;
  const maxC = code.maxCharge ? Number(code.maxCharge) : null;
  const finalTotal = Math.max(minC ?? 0, maxC !== null ? Math.min(total, maxC) : total);

  const line = await prisma.accessorialChargeLine.create({
    data: {
      organizationId,
      chargeCodeId,
      quantity,
      unitRate: effectiveRate,
      subtotal,
      markup: markupAmount,
      total: finalTotal,
      currency: currency ?? code.currency,
      description,
      status: "DRAFT",
      ...rest,
    },
    include: { chargeCode: { select: { code: true, name: true } } },
  });

  return NextResponse.json({ line }, { status: 201 });
}
