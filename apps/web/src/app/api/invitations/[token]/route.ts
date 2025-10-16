import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Find invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
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

    if (!invitation) {
      return NextResponse.json(
        { message: "Invitation not found" },
        { status: 404 }
      )
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { message: "Invitation has expired" },
        { status: 400 }
      )
    }

    // Check if invitation status is PENDING
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { message: "Invitation has already been used" },
        { status: 400 }
      )
    }

    // Check if user's email matches invitation email
    if (session.user.email !== invitation.email) {
      return NextResponse.json(
        { message: "This invitation was sent to a different email address" },
        { status: 403 }
      )
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error("Invitation fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch invitation" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Find invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
      include: {
        organization: true,
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { message: "Invitation not found" },
        { status: 404 }
      )
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      })
      return NextResponse.json(
        { message: "Invitation has expired" },
        { status: 400 }
      )
    }

    // Check if invitation status is PENDING
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { message: "Invitation has already been used" },
        { status: 400 }
      )
    }

    // Check if user's email matches invitation email
    if (session.user.email !== invitation.email) {
      return NextResponse.json(
        { message: "This invitation was sent to a different email address" },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const existingMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
      },
    })

    if (existingMembership) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      })
      return NextResponse.json(
        { message: "You are already a member of this organization" },
        { status: 400 }
      )
    }

    // Add user to organization
    await prisma.$transaction([
      // Create organization membership
      prisma.organizationMember.create({
        data: {
          userId: session.user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      }),
      // Update invitation status
      prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      }),
      // Create activity log
      prisma.activityLog.create({
        data: {
          action: "CREATE",
          entityType: "member",
          entityId: session.user.id,
          userId: session.user.id,
          details: JSON.stringify({
            organizationId: invitation.organizationId,
            role: invitation.role,
            invitationId: invitation.id,
          }),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      }),
    ])

    return NextResponse.json({
      message: "Successfully joined organization",
      organization: invitation.organization,
    })
  } catch (error) {
    console.error("Invitation acceptance error:", error)
    return NextResponse.json(
      { message: "Failed to accept invitation" },
      { status: 500 }
    )
  }
}
