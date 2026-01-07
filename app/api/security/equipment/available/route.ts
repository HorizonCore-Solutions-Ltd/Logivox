import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/security/equipment/available - Get available equipment
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const equipment = await prisma.equipment.findMany({
      where: {
        organizationId,
        status: "AVAILABLE",
        ...(type && { equipmentType: type as any }),
      },
      orderBy: { equipmentNumber: "asc" },
    });

    return NextResponse.json(equipment);
  } catch (error: any) {
    console.error("Error fetching available equipment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
