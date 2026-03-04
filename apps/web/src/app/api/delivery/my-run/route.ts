import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  if (!runId)
    return NextResponse.json({ error: "runId required" }, { status: 400 });
  const stops = await prisma.deliveryStop.findMany({
    where: { routeId: runId },
    orderBy: { stopSequence: "asc" },
  });
  return NextResponse.json({ stops });
}
