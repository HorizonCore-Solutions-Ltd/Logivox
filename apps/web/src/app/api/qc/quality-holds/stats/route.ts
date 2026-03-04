import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const [total, active, released] = await Promise.all([
      prisma.qualityHold.count({ where: { organizationId: orgId } }),
      prisma.qualityHold.count({
        where: { organizationId: orgId, status: "ACTIVE" },
      }),
      prisma.qualityHold.count({
        where: { organizationId: orgId, status: "RELEASED" },
      }),
    ]);
    return NextResponse.json({
      stats: { total, active, released, pending: total - active - released },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
