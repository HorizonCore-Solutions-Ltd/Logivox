import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const fmeas = await prisma.fMEA.findMany({
      where: { organizationId: orgId },
      include: { failureModes: { select: { rpn: true, severity: true, occurrence: true, detection: true } } },
    });
    const allModes = fmeas.flatMap((f) => f.failureModes);
    const avgRpn = allModes.length > 0 ? allModes.reduce((a, m) => a + (m.rpn ?? 0), 0) / allModes.length : 0;
    const highRisk = allModes.filter((m) => (m.rpn ?? 0) >= 100).length;
    return NextResponse.json({ total: fmeas.length, totalModes: allModes.length, avgRpn, highRisk });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
