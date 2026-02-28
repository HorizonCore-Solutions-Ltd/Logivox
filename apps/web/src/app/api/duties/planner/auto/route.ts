import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DutyService } from "@/lib/services/duties/duty-service";
import { z } from "zod";

const Schema = z.object({
  shiftId: z.string().cuid(),
  warehouseId: z.string().cuid().optional(),
  duties: z.array(
    z.object({
      dutyTypeId: z.string().cuid(),
      quantity: z.number().int().min(1).max(50),
      zoneId: z.string().optional(),
      scheduledStart: z.string().datetime().optional(),
    }),
  ),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const results = await DutyService.autoPlan({
    organizationId: session.user.organizationId,
    shiftId: parsed.data.shiftId,
    warehouseId: parsed.data.warehouseId,
    duties: parsed.data.duties.map((d) => ({
      ...d,
      scheduledStart: d.scheduledStart ? new Date(d.scheduledStart) : undefined,
    })),
    requestedBy: session.user.id ?? "system",
  });

  const assigned = results.filter((r) => r.employeeId !== null).length;
  const unassigned = results.filter((r) => r.employeeId === null).length;

  return NextResponse.json({
    results,
    summary: {
      total: results.length,
      assigned,
      unassigned,
      assignmentRate:
        results.length > 0 ? Math.round((assigned / results.length) * 100) : 0,
    },
  });
}
