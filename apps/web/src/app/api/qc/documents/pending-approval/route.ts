import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const docs = await prisma.document.findMany({
      where: { organizationId: orgId, status: "PENDING_APPROVAL" },
      orderBy: { updatedAt: "asc" },
      take: 50,
    });
    return NextResponse.json({ documents: docs, total: docs.length });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
