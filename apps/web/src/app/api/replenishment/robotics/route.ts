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

  // Fetch the fleet status matrix and active dispatch jobs mapped against Replenishment Tasks.
  const jobs = await prisma.replenishmentRobotJob.findMany({
    where: { organizationId },
    include: {
      robot: {
        select: {
          id: true,
          robotId: true,
          roleLabel: true,
          batteryLevel: true,
          currentStatus: true,
        },
      },
      task: {
        select: {
          id: true,
          requiredQty: true,
          inventoryItem: { select: { sku: true } },
        },
      },
    },
    orderBy: { dispatchedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ robotTasks: jobs });
}
