/**
 * GET  /api/billing/accessorial/charge-codes  – list all charge codes
 * POST /api/billing/accessorial/charge-codes  – create a charge code
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  chargeType: z
    .enum([
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
    ])
    .default("PER_ORDER"),
  unitLabel: z.string().default("order"),
  defaultRate: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  minCharge: z.number().optional(),
  maxCharge: z.number().optional(),
  markup: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  glCode: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const { searchParams } = new URL(request.url);
  const isActive = searchParams.get("isActive");
  const chargeType = searchParams.get("chargeType");

  const codes = await prisma.accessorialChargeCode.findMany({
    where: {
      organizationId,
      ...(isActive !== null && { isActive: isActive === "true" }),
      ...(chargeType && { chargeType: chargeType as any }),
    },
    include: {
      _count: { select: { lines: true } },
    },
    orderBy: { code: "asc" },
  });

  // Revenue summary per code
  const revenuePerCode = await prisma.accessorialChargeLine.groupBy({
    by: ["chargeCodeId"],
    where: { organizationId, status: { not: "VOID" } },
    _sum: { total: true },
  });
  const revenueMap = new Map(
    revenuePerCode.map((r) => [r.chargeCodeId, Number(r._sum.total ?? 0)]),
  );

  return NextResponse.json({
    chargeCodes: codes.map((c) => ({
      ...c,
      totalRevenue: revenueMap.get(c.id) ?? 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const code = await prisma.accessorialChargeCode.create({
    data: { ...parsed.data, organizationId },
  });

  return NextResponse.json({ chargeCode: code }, { status: 201 });
}
