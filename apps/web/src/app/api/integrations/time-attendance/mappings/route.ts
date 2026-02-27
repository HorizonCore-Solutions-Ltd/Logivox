import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

const upsertSchema = z.object({
  provider: z.string().min(1),
  externalEmployeeId: z.string().min(1),
  employeeId: z.string().min(1),
  locationExternalId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET(req: NextRequest) {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") || undefined;

  const mappings = await prisma.timeAttendanceMapping.findMany({
    where: {
      ...(provider ? { provider } : {}),
      ...(organizationId ? { organizationId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ mappings });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await req.json();
    const parsed = upsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const {
      provider,
      externalEmployeeId,
      employeeId,
      locationExternalId,
      metadata,
    } = parsed.data;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, organizationId: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    const mapping = await prisma.timeAttendanceMapping.upsert({
      where: { provider_externalEmployeeId: { provider, externalEmployeeId } },
      create: {
        provider,
        externalEmployeeId,
        employeeId: employee.id,
        organizationId: employee.organizationId,
        locationExternalId,
        metadata,
      },
      update: {
        employeeId: employee.id,
        organizationId: employee.organizationId,
        locationExternalId,
        metadata,
      },
    });

    return NextResponse.json({ mapping });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to upsert mapping" },
      { status: 500 },
    );
  }
}
