import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const [total, planned, inProgress, completed] = await Promise.all([
      prisma.audit.count({ where: { organizationId: orgId } }),
      prisma.audit.count({ where: { organizationId: orgId, status: "PLANNED" } }),
      prisma.audit.count({ where: { organizationId: orgId, status: "IN_PROGRESS" } }),
      prisma.audit.count({ where: { organizationId: orgId, status: "COMPLETED" } }),
    ]);
    const findings = await prisma.auditFinding.count({ where: { audit: { organizationId: orgId } } });
    return NextResponse.json({ metrics: { total, planned, inProgress, completed, findings } });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
