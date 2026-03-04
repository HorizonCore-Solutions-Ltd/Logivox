import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// SPC control chart data
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get("sku");
    if (!sku)
      return NextResponse.json({ error: "sku is required" }, { status: 400 });
    const measurements = await prisma.qualityMeasurement.findMany({
      where: { organizationId: orgId, productSku: sku },
      select: { measuredValue: true, measuredAt: true },
      orderBy: { measuredAt: "asc" },
      take: 100,
    });
    const values = measurements.map((m) => Number(m.measuredValue));
    const mean =
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const stdDev =
      values.length > 1
        ? Math.sqrt(
            values.reduce((a, b) => a + (b - mean) ** 2, 0) /
              (values.length - 1),
          )
        : 0;
    return NextResponse.json({
      data: measurements.map((m, i) => ({
        x: i + 1,
        y: Number(m.measuredValue),
        date: m.measuredAt,
      })),
      control: {
        mean,
        ucl: mean + 3 * stdDev,
        lcl: mean - 3 * stdDev,
        ucl1s: mean + stdDev,
        lcl1s: mean - stdDev,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
