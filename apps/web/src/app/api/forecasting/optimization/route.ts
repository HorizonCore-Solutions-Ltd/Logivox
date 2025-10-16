import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateStockOptimization } from "@/lib/ai/forecasting-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use first organization as tenant
    const tenantId = session.user.organizations[0]?.id;
    if (!tenantId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const optimization = await generateStockOptimization(tenantId);

    return NextResponse.json(optimization);
  } catch (error) {
    console.error("Error generating stock optimization:", error);
    return NextResponse.json(
      { error: "Failed to generate optimization" },
      { status: 500 }
    );
  }
}
