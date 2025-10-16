import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const inviteSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
})

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

    // Get all invitations for this organization
    const invitations = await prisma.invitation.findMany({
      where: { organizationId: params.id },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error("Invitations fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch invitations" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Verify user is admin of this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: params.id,
        role: "ADMIN",
      },
    })

    if (!membership) {
      return NextResponse.json(
        { message: "Only admins can send invitations" },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { email, role } = inviteSchema.parse(body)

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        organizations: {
          where: { id: params.id },
        },
      },
    })

    if (existingUser?.organizations?.length > 0) {
      return NextResponse.json(
        { message: "User is already a member of this organization" },
        { status: 400 }
      )
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: params.id,
        status: "PENDING",
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        { message: "Invitation already sent to this email" },
        { status: 400 }
      )
    }

    // Generate invitation token
    const token = `inv_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        token,
        organizationId: params.id,
        inviterId: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        organization: true,
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // TODO: Send invitation email
    // For now, we'll just log it
    console.log("Invitation created:", {
      email,
      role,
      token,
      inviteUrl: `${process.env.NEXTAUTH_URL}/invite/${token}`,
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "invitation",
        entityId: invitation.id,
        userId: session.user.id,
        details: JSON.stringify({
          email,
          role,
          organizationId: params.id,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      )
    }

    console.error("Invitation creation error:", error)
    return NextResponse.json(
      { message: "Failed to create invitation" },
      { status: 500 }
    )
  }
}
