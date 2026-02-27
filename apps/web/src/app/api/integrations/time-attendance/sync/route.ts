import { NextRequest, NextResponse } from "next/server";

import { syncPunches } from "@/lib/integrations/time-attendance/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startDate, endDate, locationExternalId } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 },
      );
    }

    const result = await syncPunches({
      start: new Date(startDate),
      end: new Date(endDate),
      locationExternalId,
    });

    return NextResponse.json({ status: "ok", result });
  } catch (error: any) {
    const message = error?.message || "Sync failed";
    const status = message.includes("No time and attendance provider")
      ? 503
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
