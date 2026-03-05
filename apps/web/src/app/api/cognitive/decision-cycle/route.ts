// Turnkey Trigger for Cognitive Engine
// POST /api/cognitive/decision-cycle
// Optionally triggered by Cron or Event Webhook

import { NextResponse } from "next/server";
import { CognitiveEngine } from "@/lib/cognitive/engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, warehouseId, event, metadata } = body;

    if (!organizationId || !event) {
      return NextResponse.json({ error: "Missing orgId or event" }, { status: 400 });
    }

    const result = await CognitiveEngine.runDecisionCycle({
      organizationId,
      warehouseId,
      triggerEvent: event,
      metadata: metadata || {}
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Cognitive Cycle Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
