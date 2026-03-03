import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.organizationId;
  const route = await prisma.deliveryRoute.findUnique({ where: { id: params.id } });
  if (!route || route.organizationId !== orgId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (![ "PLANNED", "ASSIGNED", "OPTIMIZED" ].includes(route.status))
    return NextResponse.json({ error: "Route is not in a startable state" }, { status: 400 });
  const updated = await prisma.deliveryRoute.update({
    where: { id: params.id },
    data: { status: "IN_PROGRESS", startTime: new Date() },
  });
  return NextResponse.json({ success: true, route: updated });
}
