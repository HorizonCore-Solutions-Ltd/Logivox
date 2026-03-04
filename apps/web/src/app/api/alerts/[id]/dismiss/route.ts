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
    const alert = await prisma.alert.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!alert)
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    const updated = await prisma.alert.update({
      where: { id: params.id },
      data: { dismissedAt: new Date(), status: "DISMISSED" },
    });
    return NextResponse.json({ success: true, alert: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
