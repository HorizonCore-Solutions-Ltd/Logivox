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
    const [total, pending, approved, overdue] = await Promise.all([
      prisma.document.count({ where: { organizationId: orgId } }),
      prisma.document.count({
        where: { organizationId: orgId, status: "PENDING_APPROVAL" },
      }),
      prisma.document.count({
        where: { organizationId: orgId, status: "APPROVED" },
      }),
      prisma.document.count({
        where: {
          organizationId: orgId,
          nextReviewDate: { lt: new Date() },
          status: { not: "OBSOLETE" },
        },
      }),
    ]);
    return NextResponse.json({
      metrics: { total, pending, approved, overdue },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
