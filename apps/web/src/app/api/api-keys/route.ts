export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  scopes: z.array(z.string()).optional(),
});

function generateApiKey(): string {
  return `fsk_${crypto.randomBytes(32).toString("hex")}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizations: {
          take: 1,
        },
      },
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizations[0].id;

    // Get API keys for organization
    const apiKeys = await prisma.apiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
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
        // Don't return the actual key
      },
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("API keys fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch API keys" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizations: {
          take: 1,
        },
      },
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizations[0].id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createApiKeySchema.parse(body);

    // Generate API key
    const apiKey = generateApiKey();
    const keyPrefix = apiKey.substring(0, 12); // fsk_xxxxxxxx

    // Hash the API key for storage
    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");

    // Create API key in database
    const newApiKey = await prisma.apiKey.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        key: hashedKey,
        keyPrefix,
        organizationId,
        createdById: session.user.id,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
        scopes: validatedData.scopes || [],
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "apiKey",
        entityId: newApiKey.id,
        userId: session.user.id,
        details: JSON.stringify({
          name: newApiKey.name,
          keyPrefix: newApiKey.keyPrefix,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Return the API key ONLY ONCE (never stored in plaintext)
    return NextResponse.json(
      {
        id: newApiKey.id,
        name: newApiKey.name,
        description: newApiKey.description,
        apiKey, // Only returned on creation
        keyPrefix: newApiKey.keyPrefix,
        expiresAt: newApiKey.expiresAt,
        message:
          "API key created successfully. Save it now - you won't be able to see it again!",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 },
      );
    }

    console.error("API key creation error:", error);
    return NextResponse.json(
      { message: "Failed to create API key" },
      { status: 500 },
    );
  }
}
