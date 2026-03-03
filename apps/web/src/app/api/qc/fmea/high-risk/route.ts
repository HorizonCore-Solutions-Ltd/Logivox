import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const modes = await prisma.fMEAFailureMode.findMany({
      where: { fmea: { organizationId: orgId }, rpn: { gte: 100 } },
      include: { fmea: { select: { fmeaNumber: true, title: true, type: true } } },
      orderBy: { rpn: "desc" },
      take: 50,
    });
    return NextResponse.json({ modes, total: modes.length });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
