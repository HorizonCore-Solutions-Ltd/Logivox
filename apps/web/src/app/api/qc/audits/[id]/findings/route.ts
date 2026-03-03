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
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const audit = await prisma.audit.findFirst({ where: { id: params.id, organizationId: orgId } });
    if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    const findings = await prisma.auditFinding.findMany({ where: { auditId: params.id }, orderBy: { severity: "asc" } });
    return NextResponse.json({ findings, total: findings.length });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const audit = await prisma.audit.findFirst({ where: { id: params.id, organizationId: orgId } });
    if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    const body = await request.json();
    const finding = await prisma.auditFinding.create({ data: { ...body, auditId: params.id } });
    return NextResponse.json({ success: true, finding }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
