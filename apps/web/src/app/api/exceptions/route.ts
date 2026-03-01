/**
 * GET  /api/exceptions          – list exceptions
 * POST /api/exceptions/auto-detect – scan for exceptions automatically
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const type = searchParams.get("type");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));

  const where: any = {
    organizationId,
    ...(status && { status }),
    ...(severity && { severity }),
    ...(type && { type }),
  };

  const [exceptions, total] = await Promise.all([
    prisma.exceptionRecord.findMany({
      where,
      orderBy: [{ severity: "asc" }, { detectedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.exceptionRecord.count({ where }),
  ]);

  // Summary counts
  const summary = await prisma.exceptionRecord.groupBy({
    by: ["severity", "status"],
    where: { organizationId },
    _count: true,
  });

  return NextResponse.json({
    exceptions,
    summary,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
