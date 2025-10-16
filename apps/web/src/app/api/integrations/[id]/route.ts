import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updating an integration
const updateIntegrationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  credentials: z.record(z.any()).optional(),
  webhookSecret: z.string().optional(),
  features: z.record(z.any()).optional(),
  syncDirection: z.enum(["IMPORT", "EXPORT", "BIDIRECTIONAL"]).optional(),
  syncFrequency: z.enum([
    "REALTIME", "EVERY_5_MINUTES", "EVERY_15_MINUTES", "EVERY_30_MINUTES",
    "HOURLY", "EVERY_6_HOURS", "DAILY", "WEEKLY", "MANUAL"
  ]).optional(),
  autoSync: z.boolean().optional(),
  fieldMappings: z.record(z.any()).optional(),
  defaultMappings: z.record(z.any()).optional(),
  rateLimitPerMinute: z.number().optional(),
  rateLimitPerHour: z.number().optional(),
  rateLimitPerDay: z.number().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ERROR", "CONFIGURING", "TESTING", "PAUSED", "ARCHIVED"]).optional(),
  isActive: z.boolean().optional(),
  healthStatus: z.enum(["HEALTHY", "DEGRADED", "UNHEALTHY", "UNKNOWN"]).optional(),
  version: z.string().optional(),
  apiVersion: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/integrations/[id] - Get integration details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integration = await prisma.externalIntegration.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        connections: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        syncs: {
          include: {
            triggeredByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        mappings: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        webhooks: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            connections: true,
            syncs: true,
            logs: true,
          },
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(integration);
  } catch (error) {
    console.error("Error fetching integration:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration" },
      { status: 500 }
    );
  }
}

// PATCH /api/integrations/[id] - Update integration
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateIntegrationSchema.parse(body);

    const integration = await prisma.externalIntegration.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(integration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating integration:", error);
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/[id] - Delete integration
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if integration has active syncs
    const activeSyncs = await prisma.integrationSync.count({
      where: {
        integrationId: params.id,
        status: { in: ["PENDING", "RUNNING"] },
      },
    });

    if (activeSyncs > 0) {
      return NextResponse.json(
        { error: "Cannot delete integration with active syncs. Please cancel or complete them first." },
        { status: 400 }
      );
    }

    await prisma.externalIntegration.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Integration deleted successfully" });
  } catch (error) {
    console.error("Error deleting integration:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}
