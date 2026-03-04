import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const hold = await prisma.qualityHold.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!hold)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ hold });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const existing = await prisma.qualityHold.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await request.json();
    const hold = await prisma.qualityHold.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json({ success: true, hold });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
