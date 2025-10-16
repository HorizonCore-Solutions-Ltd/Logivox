import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateWebhookSchema = z.object({
  url: z.string().url("Invalid URL").optional(),
  events: z.array(z.string()).min(1).optional(),
  description: z.string().optional(),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizations: { take: 1 } },
    })

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 }
      )
    }

    const webhook = await prisma.webhook.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizations[0].id,
      },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    })

    if (!webhook) {
      return NextResponse.json(
        { message: "Webhook not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(webhook)
  } catch (error) {
    console.error("Webhook fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch webhook" },
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizations: { take: 1 } },
    })

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 }
      )
    }

    // Verify webhook belongs to user's organization
    const existingWebhook = await prisma.webhook.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizations[0].id,
      },
    })

    if (!existingWebhook) {
      return NextResponse.json(
        { message: "Webhook not found" },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateWebhookSchema.parse(body)

    // Update webhook
    const webhook = await prisma.webhook.update({
      where: { id: params.id },
      data: validatedData,
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "webhook",
        entityId: webhook.id,
        userId: session.user.id,
        details: JSON.stringify({
          changes: validatedData,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json(webhook)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      )
    }

    console.error("Webhook update error:", error)
    return NextResponse.json(
      { message: "Failed to update webhook" },
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizations: { take: 1 } },
    })

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 }
      )
    }

    // Verify webhook belongs to user's organization
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizations[0].id,
      },
    })

    if (!webhook) {
      return NextResponse.json(
        { message: "Webhook not found" },
        { status: 404 }
      )
    }

    // Delete webhook (cascade will delete deliveries)
    await prisma.webhook.delete({
      where: { id: params.id },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "webhook",
        entityId: webhook.id,
        userId: session.user.id,
        details: JSON.stringify({
          url: webhook.url,
          events: webhook.events,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook delete error:", error)
    return NextResponse.json(
      { message: "Failed to delete webhook" },
      { status: 500 }
    )
  }
}
