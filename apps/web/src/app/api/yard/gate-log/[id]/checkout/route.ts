import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;

    // Verify the entry belongs to this org
    const existing = await prisma.gateEntry.findFirst({
      where: { id: params.id, organizationId: orgId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Gate entry not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.gateEntry.update({
      where: { id: params.id },
      data: {
        exitTime: new Date(),
        status: "CHECKED_OUT",
      },
    });

    return NextResponse.json({
      success: true,
      entry: {
        id: updated.id,
        status: updated.status,
        exitTime: updated.exitTime?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error checking out gate entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
