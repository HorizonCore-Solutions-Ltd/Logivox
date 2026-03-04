import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const existing = await prisma.document.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const doc = await prisma.document.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: session.user.name ?? session.user.email ?? "unknown",
      },
    });
    return NextResponse.json({ success: true, document: doc });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
