import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "CARRIER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const warehouseId = searchParams.get("warehouseId");

  if (!warehouseId)
    return NextResponse.json(
      { error: "Warehouse ID Required" },
      { status: 400 },
    );

  try {
    const docks = await prisma.yardLocation.findMany({
      where: {
        warehouseId: warehouseId,
        locationType: { in: ["LOADING_DOCK", "UNLOADING_DOCK"] },
      },
      select: {
        id: true,
        locationName: true,
        locationType: true,
      },
    });

    // Map to simpler format for frontend
    return NextResponse.json(
      docks.map((d) => ({
        id: d.id,
        name: d.locationName,
        type: d.locationType,
      })),
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
