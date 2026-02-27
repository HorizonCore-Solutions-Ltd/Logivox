import prisma from "@/lib/prisma";
import { TimeAttendancePunch } from "./adapter";
import { getTimeAttendanceAdapter } from "./provider";

export async function syncPunches(params: {
  start: Date;
  end: Date;
  locationExternalId?: string;
}) {
  const adapter = getTimeAttendanceAdapter();
  const punches = await adapter.pullPunches(params);
  return upsertPunches(punches, adapter.provider);
}

export async function upsertPunches(punches: TimeAttendancePunch[], provider: string) {
  const results: Array<{ externalId: string; status: "upserted" | "skipped"; reason?: string }> = [];

  for (const punch of punches) {
    const { externalId, employeeExternalId, occurredAt, type, locationExternalId, payload } = punch;

    // Try explicit mapping first, then fall back to employeeNumber for simple cases.
    const mapping = await prisma.timeAttendanceMapping.findUnique({
      where: { provider_externalEmployeeId: { provider, externalEmployeeId: employeeExternalId } },
      select: { employeeId: true, organizationId: true },
    });

    const employee = mapping
      ? await prisma.employee.findUnique({
          where: { id: mapping.employeeId },
          select: { id: true, organizationId: true, warehouseId: true },
        })
      : await prisma.employee.findFirst({
          where: { employeeNumber: employeeExternalId },
          select: { id: true, organizationId: true, warehouseId: true },
        });

    if (!employee) {
      results.push({ externalId, status: "skipped", reason: "employee mapping not found" });
      continue;
    }

    await prisma.timeEntry.upsert({
      where: { externalId_provider: { externalId, provider } },
      create: {
        externalId,
        provider,
        organizationId: employee.organizationId,
        employeeId: employee.id,
        warehouseId: employee.warehouseId ?? null,
        startTime: occurredAt,
        entryType: "IMPORTED",
        status: "APPROVED",
        metadata: {
          provider,
          punchType: type,
          locationExternalId,
          payload,
          employeeExternalId,
        },
      },
      update: {
        startTime: occurredAt,
        metadata: {
          provider,
          punchType: type,
          locationExternalId,
          payload,
          employeeExternalId,
        },
      },
    });

    results.push({ externalId, status: "upserted" });
  }

  return { count: results.length, results };
}

export async function handleWebhook(payload: unknown, headers: Record<string, string | string[] | undefined>, rawBody: string) {
  const adapter = getTimeAttendanceAdapter();

  if (!adapter.verifyWebhook || !adapter.parseWebhook) {
    throw new Error("Webhook handling not supported for this provider");
  }

  const isValid = await adapter.verifyWebhook(rawBody, headers);
  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }

  const parsed = await adapter.parseWebhook(payload);
  const punchResult = parsed.punches ? await upsertPunches(parsed.punches, adapter.provider) : null;

  return { punchResult };
}
