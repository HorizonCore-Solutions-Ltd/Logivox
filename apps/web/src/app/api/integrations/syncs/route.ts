import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for creating a sync
const createSyncSchema = z.object({
  integrationId: z.string(),
  syncType: z.enum([
    "PRODUCTS", "ORDERS", "CUSTOMERS", "INVENTORY", 
    "INVOICES", "PAYMENTS", "SHIPMENTS", "RETURNS", "CUSTOM"
  ]),
  direction: z.enum(["IMPORT", "EXPORT", "BIDIRECTIONAL"]),
  entityType: z.string(),
  entityId: z.string().optional(),
  mode: z.enum(["FULL", "INCREMENTAL", "DELTA"]).default("INCREMENTAL"),
  filters: z.record(z.any()).optional(),
  includeFields: z.array(z.string()).default([]),
  excludeFields: z.array(z.string()).default([]),
  batchSize: z.number().min(1).max(1000).default(100),
  scheduledFor: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

// Helper function to generate sync number
async function generateSyncNumber(organizationId: string): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const prefix = `SYNC-${year}${month}${day}`;

  // Find the last sync number for today
  const lastSync = await prisma.integrationSync.findFirst({
    where: {
      organizationId,
      syncNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      syncNumber: "desc",
    },
    select: {
      syncNumber: true,
    },
  });

  let sequence = 1;
  if (lastSync) {
    const lastSequence = parseInt(lastSync.syncNumber.split("-")[3]);
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}

// GET /api/integrations/syncs - List syncs
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
    const syncType = searchParams.get("syncType");
    const status = searchParams.get("status");
    const entityType = searchParams.get("entityType");

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (integrationId) where.integrationId = integrationId;
    if (syncType) where.syncType = syncType;
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;

    const syncs = await prisma.integrationSync.findMany({
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
        triggeredByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            logs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(syncs);
  } catch (error) {
    console.error("Error fetching syncs:", error);
    return NextResponse.json(
      { error: "Failed to fetch syncs" },
      { status: 500 }
    );
  }
}

// POST /api/integrations/syncs - Create sync
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
    const validatedData = createSyncSchema.parse(body);

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

    // Check if integration has an active connection
    const connection = await prisma.integrationConnection.findFirst({
      where: {
        integrationId: validatedData.integrationId,
        status: "CONNECTED",
        isActive: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "No active connection found for this integration" },
        { status: 400 }
      );
    }

    // Generate sync number
    const syncNumber = await generateSyncNumber(organizationId);

    const sync = await prisma.integrationSync.create({
      data: {
        ...validatedData,
        organizationId,
        syncNumber,
        triggeredBy: "MANUAL",
        triggeredByUserId: session.user.id,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
        status: validatedData.scheduledFor ? "PENDING" : "RUNNING",
        startedAt: validatedData.scheduledFor ? null : new Date(),
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
        triggeredByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Start the actual sync process in the background
    // This would typically involve a queue/job system

    return NextResponse.json(sync, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating sync:", error);
    return NextResponse.json(
      { error: "Failed to create sync" },
      { status: 500 }
    );
  }
}
