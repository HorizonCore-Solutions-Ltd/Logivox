import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for creating a webhook
const createWebhookSchema = z.object({
  integrationId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  event: z.string().min(1, "Event is required"),
  url: z.string().url("Invalid URL"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"),
  secret: z.string().optional(),
  signatureHeader: z.string().optional(),
  signatureAlgorithm: z.string().optional(),
  headers: z.record(z.string()).optional(),
  payloadTemplate: z.string().optional(),
  includeMetadata: z.boolean().default(true),
  filters: z.record(z.any()).optional(),
  retryEnabled: z.boolean().default(true),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelay: z.number().min(0).default(60),
  metadata: z.record(z.any()).optional(),
});

// GET /api/integrations/webhooks - List webhooks
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("integrationId");
    const event = searchParams.get("event");
    const status = searchParams.get("status");
    const isActive = searchParams.get("isActive");

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (integrationId) where.integrationId = integrationId;
    if (event) where.event = event;
    if (status) where.status = status;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const webhooks = await prisma.integrationWebhook.findMany({
      where,
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            provider: true,
            category: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

// POST /api/integrations/webhooks - Create webhook
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const body = await request.json();
    const validatedData = createWebhookSchema.parse(body);

    // Verify integration exists
    const integration = await prisma.externalIntegration.findUnique({
      where: { id: validatedData.integrationId },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    const webhook = await prisma.integrationWebhook.create({
      data: {
        ...validatedData,
        organizationId,
        createdById: session.user.id,
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            provider: true,
            category: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}
