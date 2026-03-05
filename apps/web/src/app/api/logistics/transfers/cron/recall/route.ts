// Turnkey API: Global Recall Analysis Trigger
// GET /api/logistics/transfers/cron/recall?dcId=...

import { NextResponse } from "next/server";
import { CognitiveTransferOrchestrator } from "@/lib/logistics/transfer-service";

export const dynamic = 'force-dynamic'; // Ensure not cached

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mainDcId = searchParams.get("dcId");

    if (!mainDcId) {
      return NextResponse.json({ error: "Missing 'dcId' query parameter" }, { status: 400 });
    }

    const report = await CognitiveTransferOrchestrator.runGlobalRecallAnalysis(mainDcId);

    return NextResponse.json({
        success: true,
        message: "Recall analysis completed.",
        report
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
