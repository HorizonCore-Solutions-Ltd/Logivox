// apps/web/src/app/api/fulfillment/config/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  let config = await prisma.autonomousConfig.findUnique({
    where: { organizationId }
  });

  if (!config) {
    // Auto-create default config if missing
    config = await prisma.autonomousConfig.create({
      data: {
        organizationId,
        minTrustScore: 80,
        requireVerification: true,
        enableAutoReorders: false,
        enableAutoTransfers: false,
        enableAutoAdjustments: false
      }
    });
  }

  return NextResponse.json(config);
}

const updateSchema = z.object({
  minTrustScore: z.number().min(0).max(100).optional(),
  requireVerification: z.boolean().optional(),
  enableAutoReorders: z.boolean().optional(),
  enableAutoTransfers: z.boolean().optional(),
  enableAutoAdjustments: z.boolean().optional(),
  maxOrderValue: z.number().optional(),
  approvalThreshold: z.number().optional()
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const config = await prisma.autonomousConfig.upsert({
      where: { organizationId },
      create: {
        organizationId,
        ...data
      },
      update: {
        ...data
      }
    });

    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
