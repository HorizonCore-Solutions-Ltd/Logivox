import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const stop = await prisma.deliveryStop.findUnique({ where: { id: params.id } });
  if (!stop) return NextResponse.json({ error: "Stop not found" }, { status: 404 });
  const updated = await prisma.deliveryStop.update({
    where: { id: params.id },
    data: { deliveryStatus: "FAILED", notes: body.reason ?? "Delivery failed" },
  });
  return NextResponse.json({ success: true, stop: updated });
}
