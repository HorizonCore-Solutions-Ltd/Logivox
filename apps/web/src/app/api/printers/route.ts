
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's organizations
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      organizationMembers: { select: { organizationId: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ printers: [] });
  }

  const orgIds = user.organizationMembers.map((m) => m.organizationId);

  const printers = await prisma.printer.findMany({
    where: {
      organizationId: { in: orgIds },
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ printers });
}
