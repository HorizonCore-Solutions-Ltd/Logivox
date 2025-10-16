import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeTurnoverRates } from "@/lib/ai/forecasting-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const periodDays = searchParams.get("period") ? parseInt(searchParams.get("period")!) : 90;

    // Use first organization as tenant
    const tenantId = session.user.organizations[0]?.id;
    if (!tenantId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const turnover = await analyzeTurnoverRates(tenantId, periodDays);

    return NextResponse.json({ turnover, count: turnover.length });
  } catch (error) {
    console.error("Error analyzing turnover rates:", error);
    return NextResponse.json(
      { error: "Failed to analyze turnover rates" },
      { status: 500 }
    );
  }
}
