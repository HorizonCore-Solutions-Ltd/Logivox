import crypto from "crypto";

import { TimeAttendanceAdapter, TimeAttendancePunch } from "./adapter";

const baseUrl = process.env.ROTAVU_BASE_URL || "https://api.rotavu.com";
const apiKey = process.env.ROTAVU_API_KEY;
const webhookSecret = process.env.ROTAVU_WEBHOOK_SECRET;

function requireApiKey() {
  if (!apiKey) {
    throw new Error("Rotavu API key missing; set ROTAVU_API_KEY");
  }
}

function mapPunch(raw: any): TimeAttendancePunch {
  if (!raw?.id || !raw?.employeeId || !raw?.timestamp || !raw?.type) {
    throw new Error("Rotavu punch payload missing required fields");
  }

  const typeMap: Record<
    string,
    "clock-in" | "clock-out" | "break-start" | "break-end"
  > = {
    clock_in: "clock-in",
    "clock-out": "clock-out",
    clock_out: "clock-out",
    break_start: "break-start",
    break_end: "break-end",
  };

  const mappedType = typeMap[raw.type] ?? "clock-in";

  return {
    externalId: String(raw.id),
    employeeExternalId: String(raw.employeeId),
    occurredAt: new Date(raw.timestamp),
    type: mappedType,
    locationExternalId: raw.locationId ? String(raw.locationId) : undefined,
    payload: raw,
  };
}

export const rotavuAdapter: TimeAttendanceAdapter = {
  provider: "rotavu",

  async pullPunches(params) {
    requireApiKey();
    const search = new URLSearchParams({
      start: params.start.toISOString(),
      end: params.end.toISOString(),
    });
    if (params.locationExternalId) {
      search.set("locationId", params.locationExternalId);
    }

    const res = await fetch(`${baseUrl}/v1/punches?${search.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Rotavu pullPunches failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const punches = Array.isArray(data?.punches) ? data.punches : data;

    return (punches as any[]).map(mapPunch);
  },

  async verifyWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ) {
    if (!webhookSecret) {
      throw new Error(
        "Rotavu webhook secret missing; set ROTAVU_WEBHOOK_SECRET",
      );
    }
    const signature = (
      headers["x-rotavu-signature"] as string | undefined
    )?.trim();
    if (!signature) return false;
    const computed = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computed),
    );
  },

  async parseWebhook(payload: any) {
    const punches = Array.isArray(payload?.punches) ? payload.punches : [];
    return { punches: punches.map(mapPunch) };
  },
};
