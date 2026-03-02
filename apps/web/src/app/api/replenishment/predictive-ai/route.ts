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

  // In a real system, this would hit SageMaker, Vertex AI, or an internal Python microservice.
  // We fetch the cached AI inferences natively integrated into the WMS DB.

  const forecasts = await prisma.replenishmentForecastCache.findMany({
    where: { organizationId },
    include: {
      inventoryItem: { select: { id: true, name: true, sku: true } },
    },
    orderBy: { forecastConfidence: "desc" },
    take: 50,
  });

  return NextResponse.json({ predictions: forecasts });
}
