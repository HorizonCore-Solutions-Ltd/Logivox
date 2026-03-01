/**
 * GET   /api/exceptions/[id]  – get single exception
 * PATCH /api/exceptions/[id]  – acknowledge / resolve / escalate
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum(["ACKNOWLEDGE", "RESOLVE", "ESCALATE", "SUPPRESS"]),
  resolution: z.string().optional(),
  escalatedToId: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const exc = await prisma.exceptionRecord.findFirst({
    where: { id: params.id, organizationId },
  });

  if (!exc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ exception: exc });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const existing = await prisma.exceptionRecord.findFirst({
    where: { id: params.id, organizationId },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const update: any = {};

  switch (parsed.data.action) {
    case "ACKNOWLEDGE":
      update.status = "ACKNOWLEDGED";
      update.acknowledgedAt = now;
      update.acknowledgedById = session.user.id;
      break;
    case "RESOLVE":
      update.status = "RESOLVED";
      update.resolvedAt = now;
      update.resolvedById = session.user.id;
      update.resolution = parsed.data.resolution ?? "Manually resolved";
      break;
    case "ESCALATE":
      update.status = "ESCALATED";
      update.escalatedAt = now;
      update.escalatedToId = parsed.data.escalatedToId;
      break;
    case "SUPPRESS":
      update.status = "SUPPRESSED";
      break;
  }

  const exc = await prisma.exceptionRecord.update({
    where: { id: params.id },
    data: update,
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      organizationId,
      action: `EXCEPTION_${parsed.data.action}`,
      resourceType: "ExceptionRecord",
      resourceId: params.id,
      details: {
        action: parsed.data.action,
        resolution: parsed.data.resolution,
      },
    },
  });

  return NextResponse.json({ exception: exc });
}
