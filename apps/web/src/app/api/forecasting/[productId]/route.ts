import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateProductForecast } from "@/lib/ai/forecasting-engine";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = params.productId;
    const forecast = await generateProductForecast(productId, session.user.tenantId);

    if (!forecast) {
      return NextResponse.json(
        { error: "Forecast not available for this product" },
        { status: 404 }
      );
    }

    return NextResponse.json({ forecast });
  } catch (error) {
    console.error("Error generating forecast:", error);
    return NextResponse.json(
      { error: "Failed to generate forecast" },
      { status: 500 }
    );
  }
}
