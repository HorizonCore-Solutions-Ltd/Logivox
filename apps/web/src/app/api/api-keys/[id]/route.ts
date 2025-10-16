import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateApiKeySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  scopes: z.array(z.string()).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizations: {
          take: 1,
        },
      },
    })

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 }
      )
    }

    const organizationId = user.organizations[0].id

    // Verify API key belongs to organization
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    })

    if (!existingKey) {
      return NextResponse.json({ message: "API key not found" }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateApiKeySchema.parse(body)

    // Update API key
    const updatedKey = await prisma.apiKey.update({
      where: { id: params.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        description: true,
        keyPrefix: true,
        expiresAt: true,
        lastUsedAt: true,
        isActive: true,
        scopes: true,
        createdAt: true,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "apiKey",
        entityId: updatedKey.id,
        userId: session.user.id,
        details: JSON.stringify({
          name: updatedKey.name,
          changes: validatedData,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json(updatedKey)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      )
    }

    console.error("API key update error:", error)
    return NextResponse.json(
      { message: "Failed to update API key" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizations: {
          take: 1,
        },
      },
    })

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 }
      )
    }

    const organizationId = user.organizations[0].id

    // Verify API key belongs to organization
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    })

    if (!existingKey) {
      return NextResponse.json({ message: "API key not found" }, { status: 404 })
    }

    // Delete API key
    await prisma.apiKey.delete({
      where: { id: params.id },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "apiKey",
        entityId: existingKey.id,
        userId: session.user.id,
        details: JSON.stringify({
          name: existingKey.name,
          keyPrefix: existingKey.keyPrefix,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API key delete error:", error)
    return NextResponse.json(
      { message: "Failed to delete API key" },
      { status: 500 }
    )
  }
}
