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

  // Digital twin stream representing edge devices (Computer Vision out-of-stock hooks, shelf weight sensors)
  const triggers = await prisma.replenishmentIoTTrigger.findMany({
    where: { organizationId },
    include: {
      device: {
        select: {
          id: true,
          deviceId: true,
          deviceType: true,
          assignedZone: true,
        },
      },
      inventoryItem: { select: { id: true, sku: true, name: true } },
    },
    orderBy: { triggerTime: "desc" },
    take: 50,
  });

  return NextResponse.json({ events: triggers });
}
