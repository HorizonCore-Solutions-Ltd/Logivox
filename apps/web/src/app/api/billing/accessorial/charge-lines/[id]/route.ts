/**
 * POST /api/billing/accessorial/charge-lines/[id]/approve
 * POST /api/billing/accessorial/charge-lines/bulk-invoice
 *  – combine pending lines into an invoice
 *
 * PATCH /api/billing/accessorial/charge-lines/[id]  – update status
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** PATCH /api/billing/accessorial/charge-lines/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json();
  const { status } = body;

  if (!["APPROVED", "VOID"].includes(status)) {
    return NextResponse.json({ error: "status must be APPROVED or VOID" }, { status: 400 });
  }

  const line = await prisma.accessorialChargeLine.updateMany({
    where: { id: params.id, organizationId },
    data: { status },
  });

  if (line.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, status });
}
