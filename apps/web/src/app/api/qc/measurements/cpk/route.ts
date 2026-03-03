import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Cpk process capability calculation
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get("sku");
    if (!sku) return NextResponse.json({ error: "sku is required" }, { status: 400 });
    const measurements = await prisma.qualityMeasurement.findMany({
      where: { organizationId: orgId, productSku: sku },
      select: { measuredValue: true, upperSpecLimit: true, lowerSpecLimit: true },
      take: 200,
    });
    if (measurements.length < 2) return NextResponse.json({ error: "Insufficient data" }, { status: 400 });
    const values = measurements.map((m) => Number(m.measuredValue));
    const usl = Number(measurements.find((m) => m.upperSpecLimit)?.upperSpecLimit ?? 0);
    const lsl = Number(measurements.find((m) => m.lowerSpecLimit)?.lowerSpecLimit ?? 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1));
    const cpu = stdDev > 0 ? (usl - mean) / (3 * stdDev) : 0;
    const cpl = stdDev > 0 ? (mean - lsl) / (3 * stdDev) : 0;
    const cpk = Math.min(cpu, cpl);
    return NextResponse.json({ sku, count: values.length, mean, stdDev, usl, lsl, cpu, cpl, cpk, isCapable: cpk >= 1.33 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
