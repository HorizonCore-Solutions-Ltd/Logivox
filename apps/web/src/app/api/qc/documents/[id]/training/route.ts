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
    const doc = await prisma.document.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const acknowledgments = await prisma.trainingAcknowledgment.findMany({
      where: { documentId: params.id },
      orderBy: { acknowledgedAt: "desc" },
    });
    return NextResponse.json({
      documentId: params.id,
      acknowledgments,
      total: acknowledgments.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
