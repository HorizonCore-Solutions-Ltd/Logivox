import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for creating a connection
const createConnectionSchema = z.object({
  integrationId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  connectionType: z.enum(["OAUTH", "API_KEY", "CREDENTIALS", "CUSTOM"]),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenType: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  scope: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  baseUrl: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  environment: z.enum(["PRODUCTION", "SANDBOX", "DEVELOPMENT"]).default("PRODUCTION"),
  metadata: z.record(z.any()).optional(),
});

// GET /api/integrations/connections - List connections
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
    const status = searchParams.get("status");
    const environment = searchParams.get("environment");

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (integrationId) where.integrationId = integrationId;
    if (status) where.status = status;
    if (environment) where.environment = environment;

    const connections = await prisma.integrationConnection.findMany({
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

    // Remove sensitive data before sending
    const sanitizedConnections = connections.map((conn) => ({
      ...conn,
      accessToken: conn.accessToken ? "****" : null,
      refreshToken: conn.refreshToken ? "****" : null,
      apiKey: conn.apiKey ? "****" : null,
      apiSecret: conn.apiSecret ? "****" : null,
      password: conn.password ? "****" : null,
    }));

    return NextResponse.json(sanitizedConnections);
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

// POST /api/integrations/connections - Create connection
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
    const validatedData = createConnectionSchema.parse(body);

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

    // TODO: Encrypt sensitive data before storing (accessToken, apiKey, password, etc.)
    // For now, we'll store them as-is. In production, use proper encryption.

    const connection = await prisma.integrationConnection.create({
      data: {
        ...validatedData,
        organizationId,
        createdById: session.user.id,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        status: "CONNECTED",
        connectedAt: new Date(),
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

    // Sanitize sensitive data
    const sanitizedConnection = {
      ...connection,
      accessToken: connection.accessToken ? "****" : null,
      refreshToken: connection.refreshToken ? "****" : null,
      apiKey: connection.apiKey ? "****" : null,
      apiSecret: connection.apiSecret ? "****" : null,
      password: connection.password ? "****" : null,
    };

    return NextResponse.json(sanitizedConnection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating connection:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}
