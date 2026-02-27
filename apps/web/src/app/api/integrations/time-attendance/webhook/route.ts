import { NextRequest, NextResponse } from "next/server";

import { handleWebhook } from "@/lib/integrations/time-attendance/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const result = await handleWebhook(payload, Object.fromEntries(req.headers.entries()), rawBody);
    return NextResponse.json({ status: "ok", result });
  } catch (error: any) {
    const message = error?.message || "Webhook processing failed";
    const status =
      message.includes("not configured") ||
      message.includes("No time and attendance provider")
        ? 503
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
