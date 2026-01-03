export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateOrgSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable(),
  settings: z.record(z.any()).optional(),
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
    const organization = await prisma.organization.findFirst({
      where: {
        id: params.id,
        members: {
          some: {
            id: session.user.id,
          },
        },
      },
      include: {
        members: {
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
        },
        _count: {
          select: {
            members: true,
            inventoryItems: true,
            bookings: true,
            customers: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Organization fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch organization" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
        { message: "Only admins can update organization settings" },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateOrgSchema.parse(body)

    // Update organization
    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: validatedData,
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "organization",
        entityId: organization.id,
        userId: session.user.id,
        details: JSON.stringify({
          name: organization.name,
          changes: validatedData,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json(organization)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      )
    }

    console.error("Organization update error:", error)
    return NextResponse.json(
      { message: "Failed to update organization" },
      { status: 500 }
    )
  }
}
