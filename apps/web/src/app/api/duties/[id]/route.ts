import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DutyService } from "@/lib/services/duties/duty-service";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z
    .enum([
      "PLANNED",
      "ACTIVE",
      "PAUSED",
      "DONE",
      "CANCELLED",
      "SKIPPED",
      "ESCALATED",
    ])
    .optional(),
  employeeId: z.string().cuid().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  completionNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  reassignReason: z.string().optional(),
  checklistItems: z.any().optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const duty = await prisma.duty.findFirst({
    where: { id: params.id, organizationId: session.user.organizationId },
    include: {
      dutyType: true,
      evidence: { orderBy: { capturedAt: "asc" } },
    },
  });

  if (!duty) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Resolve employee name if assigned
  let employee = null;
  if (duty.employeeId) {
    employee = await prisma.employee.findUnique({
      where: { id: duty.employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        department: true,
      },
    });
  }

  return NextResponse.json({ duty, employee });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const data = parsed.data;
  const orgId = session.user.organizationId;

  // Status transition
  if (data.status) {
    const duty = await DutyService.updateStatus(params.id, orgId, data.status, {
      completionNotes: data.completionNotes,
      rejectionReason: data.rejectionReason,
    });
    return NextResponse.json({ duty });
  }

  // Reassign
  if (data.employeeId && data.reassignReason) {
    const duty = await DutyService.reassign(
      params.id,
      orgId,
      data.employeeId,
      data.reassignReason,
    );
    return NextResponse.json({ duty });
  }

  // Generic update
  const duty = await prisma.duty.update({
    where: { id: params.id, organizationId: orgId },
    data: {
      priority: data.priority as any,
      checklistItems: data.checklistItems,
      scheduledStart: data.scheduledStart
        ? new Date(data.scheduledStart)
        : undefined,
      scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
    },
  });

  return NextResponse.json({ duty });
}
