import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const where: Record<string, unknown> = { organizationId: orgId };
    if (status) where.status = status;
    const ncrs = await prisma.nonConformanceReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ ncrs, total: ncrs.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const body = await request.json();
    const ncr = await prisma.nonConformanceReport.create({
      data: { ...body, organizationId: orgId },
    });
    return NextResponse.json({ success: true, ncr }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
