export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user with all their organizations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: {
            organization: {
              include: {
                _count: {
                  select: {
                    members: true,
                    inventoryItems: true,
                    bookings: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      user.organizationMemberships.map((m) => m.organization),
    );
  } catch (error) {
    console.error("Organizations fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch organizations" },
      { status: 500 },
    );
  }
}
