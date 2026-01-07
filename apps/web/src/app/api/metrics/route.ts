import { NextRequest, NextResponse } from "next/server";
import { getMetrics } from "@/lib/services/metrics";

/**
 * GET /api/metrics
 * Export Prometheus metrics
 *
 * Note: In production, this endpoint should be protected or only accessible
 * from internal networks (e.g., Prometheus scraper)
 */
export async function GET(req: NextRequest) {
  try {
    // Optional: Add basic auth or IP whitelist for production
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.METRICS_AUTH_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const metrics = await getMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error exporting metrics:", error);
    return NextResponse.json(
      { error: "Failed to export metrics" },
      { status: 500 },
    );
  }
}
