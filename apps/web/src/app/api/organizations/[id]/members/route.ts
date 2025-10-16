import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Verify user is member of this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: params.id,
      },
    })

    if (!membership) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Get all members of this organization
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Members fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch members" },
      { status: 500 }
    )
  }
}
