import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stop = await prisma.deliveryStop.findUnique({ where: { id: params.id } });
  if (!stop) return NextResponse.json({ error: "Stop not found" }, { status: 404 });
  const updated = await prisma.deliveryStop.update({
    where: { id: params.id },
    data: { deliveryStatus: "DELIVERED", actualDeparture: new Date(), signedBy: "Signed on delivery", signedAt: new Date() },
  });
  // Check if all stops delivered – if so, complete the route
  const remaining = await prisma.deliveryStop.count({
    where: { routeId: stop.routeId, deliveryStatus: { notIn: ["DELIVERED", "FAILED"] } },
  });
  if (remaining === 0) {
    await prisma.deliveryRoute.update({
      where: { id: stop.routeId },
      data: { status: "COMPLETED", endTime: new Date() },
    });
  }
  return NextResponse.json({ success: true, stop: updated });
}
