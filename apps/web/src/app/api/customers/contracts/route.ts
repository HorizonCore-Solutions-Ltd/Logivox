/**
 * GET  /api/customers/contracts  – list contracts (org-scoped)
 * POST /api/customers/contracts  – create contract
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  customerId: z.string(),
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined)),
  autoRenew: z.boolean().default(false),
  currency: z.string().length(3).default("USD"),
  paymentTermsDays: z.number().int().min(0).max(365).default(30),
  creditLimit: z.number().min(0).optional(),
  discountPct: z.number().min(0).max(100).default(0),
  pricingTier: z.string().optional(),
  slaHours: z.number().int().min(1).optional(),
  notes: z.string().optional(),
  pricingRules: z.array(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const search = searchParams.get("search");

  const contracts = await prisma.customerContract.findMany({
    where: {
      organizationId,
      ...(status && { status: status as any }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { contractNumber: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          code: true,
          email: true,
          creditLimit: true,
          creditUsed: true,
          creditHold: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Auto-expire contracts past endDate
  const now = new Date();
  const expiredIds = contracts
    .filter((c) => c.status === "ACTIVE" && c.endDate && c.endDate < now)
    .map((c) => c.id);

  if (expiredIds.length > 0) {
    await prisma.customerContract.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: "EXPIRED" },
    });
  }

  return NextResponse.json({ contracts });
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

  // Auto-generate contract number
  const count = await prisma.customerContract.count({
    where: { organizationId },
  });
  const contractNumber = `CTR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const contract = await prisma.customerContract.create({
    data: {
      ...parsed.data,
      contractNumber,
      status: "DRAFT",
      organizationId,
      createdById: session.user.id,
    },
    include: {
      customer: { select: { id: true, name: true, code: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      organizationId,
      action: "CONTRACT_CREATED",
      resourceType: "CustomerContract",
      resourceId: contract.id,
      details: { contractNumber, customerId: parsed.data.customerId },
    },
  });

  return NextResponse.json({ contract }, { status: 201 });
}
