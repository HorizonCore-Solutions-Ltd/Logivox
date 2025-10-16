import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAllForecasts } from "@/lib/ai/forecasting-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

    // Use first organization as tenant
    const tenantId = session.user.organizations[0]?.id;
    if (!tenantId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const forecasts = await generateAllForecasts(tenantId, limit);

    return NextResponse.json({ forecasts, count: forecasts.length });
  } catch (error) {
    console.error("Error generating bulk forecasts:", error);
    return NextResponse.json(
      { error: "Failed to generate forecasts" },
      { status: 500 }
    );
  }
}
