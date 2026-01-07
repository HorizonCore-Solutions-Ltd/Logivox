import { NextRequest, NextResponse } from "next/server";
import { GateSecurityAutomationService } from "@/lib/services/gate-security-automation";

/**
 * Cron job endpoint for gate security automation
 * Should be called periodically (e.g., every 15 minutes) by a scheduler
 *
 * Vercel Cron: Add to vercel.json:
 * "crons": [{
 *   "path": "/api/security/automation/run",
 *   "schedule": "0,15,30,45 * * * *"
 * }]
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting gate security automation run...");

    const results = await GateSecurityAutomationService.runAll();

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error running gate security automation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  // Allow manual trigger via POST for testing
  return GET(req);
}
