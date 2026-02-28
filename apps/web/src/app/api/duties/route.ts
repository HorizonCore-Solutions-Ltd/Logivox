import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DutyService } from "@/lib/services/duties/duty-service";
import { z } from "zod";

const CreateDutySchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  priority: z.string().optional(),
  dutyTypeId: z.string().cuid().optional(),
  shiftId: z.string().cuid().optional(),
  zoneId: z.string().optional(),
  zoneName: z.string().optional(),
  warehouseId: z.string().cuid().optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  slaMinutes: z.number().int().positive().optional(),
  description: z.string().optional(),
  checklistItems: z
    .array(z.object({ step: z.string(), required: z.boolean().default(false) }))
    .optional(),
  capaId: z.string().cuid().optional(),
  capaStage: z.string().optional(),
  ncrId: z.string().cuid().optional(),
  employeeId: z.string().cuid().optional(),
  idempotencyKey: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.user.organizationId;
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");
  const shiftId = searchParams.get("shiftId");
  const capaId = searchParams.get("capaId");
  const category = searchParams.get("category");
  const slaBreached = searchParams.get("slaBreached");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const page = parseInt(searchParams.get("page") ?? "1");
  const skip = (page - 1) * limit;

  // Optionally scan SLA breaches on every list call (low overhead)
  DutyService.markSLABreaches(orgId).catch(() => null);

  const where: any = { organizationId: orgId };
  if (status) where.status = status;
  if (employeeId) where.employeeId = employeeId;
  if (shiftId) where.shiftId = shiftId;
  if (capaId) where.capaId = capaId;
  if (category) where.category = category;
  if (slaBreached === "true") where.slaBreached = true;

  const [duties, total] = await Promise.all([
    prisma.duty.findMany({
      where,
      orderBy: [{ priority: "desc" }, { scheduledStart: "asc" }],
      skip,
      take: limit,
      include: {
        dutyType: { select: { name: true, category: true } },
        evidence: {
          select: { id: true, evidenceType: true, capturedAt: true },
        },
      },
    }),
    prisma.duty.count({ where }),
  ]);

  return NextResponse.json({ duties, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateDutySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const data = parsed.data;
  const duty = await DutyService.createDuty({
    organizationId: session.user.organizationId,
    ...data,
    scheduledStart: data.scheduledStart
      ? new Date(data.scheduledStart)
      : undefined,
    scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
    assignedBy: session.user.id,
  });

  // Auto-assign if no employee specified
  let assignment = null;
  if (!data.employeeId) {
    assignment = await DutyService.autoAssign(
      duty.id,
      session.user.organizationId,
    ).catch(() => null);
  }

  return NextResponse.json({ duty, assignment }, { status: 201 });
}
