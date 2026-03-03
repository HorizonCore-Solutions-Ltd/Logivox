import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const integration = await prisma.integration.findFirst({
      where: { organizationId: orgId, type: "TIME_ATTENDANCE", isActive: true },
    });
    if (!integration) {
      return NextResponse.json({ error: "No active time-attendance integration configured" }, { status: 404 });
    }
    await prisma.integration.update({ where: { id: integration.id }, data: { lastSyncAt: new Date() } });
    return NextResponse.json({ success: true, syncedAt: new Date().toISOString(), integrationId: integration.id });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
