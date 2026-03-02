export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  // 3PL tenant isolation charge-logs for automated replenishment
  const charges = await prisma.replenishmentCostLog.findMany({
    where: { organizationId },
    include: {
      task: { select: { id: true, status: true } },
      robotJob: { select: { id: true, robotId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ charges });
}
