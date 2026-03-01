/**
 * GET  /api/customers/contracts/[id]  – get contract details
 * PATCH /api/customers/contracts/[id] – update status / fields
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "SUSPENDED", "TERMINATED", "PENDING_RENEWAL"]).optional(),
  name: z.string().optional(),
  endDate: z.string().optional().transform((s) => s ? new Date(s) : undefined),
  creditLimit: z.number().min(0).optional(),
  discountPct: z.number().min(0).max(100).optional(),
  paymentTermsDays: z.number().int().min(0).optional(),
  slaHours: z.number().int().min(1).optional(),
  notes: z.string().optional(),
  pricingRules: z.array(z.any()).optional(),
  pricingTier: z.string().optional(),
  signedDate: z.string().optional().transform((s) => s ? new Date(s) : undefined),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const contract = await prisma.customerContract.findFirst({
    where: { id: params.id, organizationId },
    include: {
      customer: {
        select: {
          id: true, name: true, code: true, email: true,
          creditLimit: true, creditUsed: true, creditHold: true,
          paymentTermsDays: true, currency: true,
        },
      },
    },
  });

  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  return NextResponse.json({ contract });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await prisma.customerContract.findFirst({ where: { id: params.id, organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const extra: any = {};
  if (parsed.data.status === "TERMINATED") extra.terminatedAt = new Date();
  if (parsed.data.status === "ACTIVE" && existing.status === "PENDING_RENEWAL") extra.renewedAt = new Date();
  if (parsed.data.signedDate) extra.signedById = session.user.id;

  const contract = await prisma.customerContract.update({
    where: { id: params.id },
    data: { ...parsed.data, ...extra },
    include: { customer: { select: { id: true, name: true, code: true } } },
  });

  return NextResponse.json({ contract });
}
