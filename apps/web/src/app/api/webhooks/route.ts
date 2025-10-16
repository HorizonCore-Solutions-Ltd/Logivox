import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const webhookSchema = z.object({
  url: z.string().url("Invalid URL"),
  events: z.array(z.string()).min(1, "At least one event is required"),
  description: z.string().optional(),
  secret: z.string().optional(),
})

export async function GET(request: NextRequest) {
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

    const organizationId = user.organizations[0].id

    // Get webhooks for organization
    const webhooks = await prisma.webhook.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(webhooks)
  } catch (error) {
    console.error("Webhooks fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch webhooks" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const organizationId = user.organizations[0].id

    // Parse and validate request body
    const body = await request.json()
    const validatedData = webhookSchema.parse(body)

    // Create webhook
    const webhook = await prisma.webhook.create({
      data: {
        url: validatedData.url,
        events: validatedData.events,
        description: validatedData.description,
        secret: validatedData.secret,
        organizationId,
        createdById: session.user.id,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
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

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      )
    }

    console.error("Webhook creation error:", error)
    return NextResponse.json(
      { message: "Failed to create webhook" },
      { status: 500 }
    )
  }
}
