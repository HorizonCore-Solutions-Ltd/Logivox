/**
 * GET  /api/billing/accessorial          – list charge codes + lines
 * POST /api/billing/accessorial          – create a charge line
 * POST /api/billing/accessorial?action=codes  – create a new charge code
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const codeSchema = z.object({
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(120),
  description: z.string().optional(),
  chargeType: z.enum([
    "PER_ORDER",
    "PER_LINE",
    "PER_UNIT",
    "PER_PALLET",
    "PER_KG",
    "PER_CBM",
    "PER_HOUR",
    "PER_DAY",
    "FLAT_FEE",
    "RECURRING_STORAGE",
    "PERCENTAGE",
  ]),
  unitLabel: z.string().default("order"),
  defaultRate: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  minCharge: z.number().min(0).optional(),
  maxCharge: z.number().min(0).optional(),
  markup: z.number().min(0).max(100).default(0),
  glCode: z.string().optional(),
});

const lineSchema = z.object({
  chargeCodeId: z.string(),
  salesOrderId: z.string().optional(),
  customerId: z.string().optional(),
  invoiceId: z.string().optional(),
  quantity: z.number().positive(),
  unitRate: z.number().min(0),
  markup: z.number().min(0).default(0),
  description: z.string().optional(),
  periodStart: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined)),
  periodEnd: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined)),
  metadata: z.any().optional(),
});

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = (session.user as any).organizationId;
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "lines"; // "codes" | "lines"
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const salesOrderId = searchParams.get("salesOrderId");

  if (view === "codes") {
    const codes = await prisma.accessorialChargeCode.findMany({
      where: {
        organizationId,
        ...(searchParams.get("active") === "true" && { isActive: true }),
      },
      include: { _count: { select: { lines: true } } },
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ codes });
  }

  // ── Lines view ─────────────────────────────────────────────────────────────
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 25));

  const where: any = { organizationId };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (salesOrderId) where.salesOrderId = salesOrderId;

  const [lines, total] = await Promise.all([
    prisma.accessorialChargeLine.findMany({
      where,
      include: {
        chargeCode: {
          select: {
            id: true,
            code: true,
            name: true,
            chargeType: true,
            unitLabel: true,
          },
        },
        customer: { select: { id: true, name: true, code: true } },
        salesOrder: { select: { id: true, soNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.accessorialChargeLine.count({ where }),
  ]);

  const totals = await prisma.accessorialChargeLine.aggregate({
    where: { organizationId, status: { notIn: ["VOID"] } },
    _sum: { total: true, subtotal: true, markup: true },
  });

  const byStatus = await prisma.accessorialChargeLine.groupBy({
    by: ["status"],
    where: { organizationId },
    _sum: { total: true },
    _count: { _all: true },
  });

  return NextResponse.json({
    lines,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    totals: {
      revenue: Number(totals._sum.total ?? 0),
      subtotal: Number(totals._sum.subtotal ?? 0),
      markup: Number(totals._sum.markup ?? 0),
    },
    byStatus: Object.fromEntries(
      byStatus.map((s) => [
        s.status,
        { count: s._count._all, total: Number(s._sum.total ?? 0) },
      ]),
    ),
  });
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = (session.user as any).organizationId;
  const { searchParams } = new URL(request.url);
  const body = await request.json();

  // ── Create charge code ─────────────────────────────────────────────────────
  if (searchParams.get("action") === "codes") {
    const parsed = codeSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );

    const code = await prisma.accessorialChargeCode.create({
      data: { organizationId, ...parsed.data },
    });
    return NextResponse.json(code, { status: 201 });
  }

  // ── Create charge line ────────────────────────────────────────────────────
  const parsed = lineSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );

  const { chargeCodeId, quantity, unitRate, markup = 0, ...rest } = parsed.data;

  // verify charge code belongs to org
  const chargeCode = await prisma.accessorialChargeCode.findFirst({
    where: { id: chargeCodeId, organizationId },
  });
  if (!chargeCode)
    return NextResponse.json(
      { error: "Charge code not found" },
      { status: 404 },
    );

  const subtotal = Number((quantity * unitRate).toFixed(2));
  const markupAmt = Number(((subtotal * markup) / 100).toFixed(2));
  const total = Number((subtotal + markupAmt).toFixed(2));

  // apply min/max from charge code
  const finalTotal = Math.max(
    Number(chargeCode.minCharge ?? 0),
    chargeCode.maxCharge
      ? Math.min(total, Number(chargeCode.maxCharge))
      : total,
  );

  const line = await prisma.accessorialChargeLine.create({
    data: {
      organizationId,
      chargeCodeId,
      quantity,
      unitRate,
      markup: markupAmt,
      subtotal,
      total: finalTotal,
      currency: chargeCode.currency,
      ...rest,
    },
    include: {
      chargeCode: {
        select: { id: true, code: true, name: true, chargeType: true },
      },
    },
  });

  return NextResponse.json(line, { status: 201 });
}
