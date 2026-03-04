import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get("sku");
    const where: Record<string, unknown> = { organizationId: orgId };
    if (sku) where.productSku = sku;
    const measurements = await prisma.qualityMeasurement.findMany({
      where,
      select: {
        measuredValue: true,
        lowerSpecLimit: true,
        upperSpecLimit: true,
        isWithinSpec: true,
      },
      take: 500,
    });
    const values = measurements.map((m) => Number(m.measuredValue));
    const n = values.length;
    const mean = n > 0 ? values.reduce((a, b) => a + b, 0) / n : 0;
    const variance =
      n > 1 ? values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;
    const stdDev = Math.sqrt(variance);
    const inSpec = measurements.filter((m) => m.isWithinSpec).length;
    return NextResponse.json({
      stats: {
        count: n,
        mean,
        stdDev,
        inSpec,
        outOfSpec: n - inSpec,
        passRate: n > 0 ? (inSpec / n) * 100 : 0,
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
