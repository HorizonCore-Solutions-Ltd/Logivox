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
    const productSku = searchParams.get("sku");
    const where: Record<string, unknown> = { organizationId: orgId };
    if (productSku) where.productSku = productSku;
    const measurements = await prisma.qualityMeasurement.findMany({
      where,
      orderBy: { measuredAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ measurements, total: measurements.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const body = await request.json();
    const measurement = await prisma.qualityMeasurement.create({
      data: { ...body, organizationId: orgId },
    });
    return NextResponse.json({ success: true, measurement }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
