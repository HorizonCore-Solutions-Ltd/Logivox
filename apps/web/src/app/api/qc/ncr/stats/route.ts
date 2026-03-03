import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const [total, open, closed, inReview] = await Promise.all([
      prisma.nonConformanceReport.count({ where: { organizationId: orgId } }),
      prisma.nonConformanceReport.count({ where: { organizationId: orgId, status: "OPEN" } }),
      prisma.nonConformanceReport.count({ where: { organizationId: orgId, status: "CLOSED" } }),
      prisma.nonConformanceReport.count({ where: { organizationId: orgId, status: "IN_REVIEW" } }),
    ]);
    return NextResponse.json({ stats: { total, open, closed, inReview } });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
