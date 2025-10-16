import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for creating an integration
const createIntegrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  provider: z.enum([
    "QUICKBOOKS_ONLINE", "QUICKBOOKS_DESKTOP", "XERO", "SAGE", "NETSUITE", "SAP", "MICROSOFT_DYNAMICS",
    "SHOPIFY", "WOOCOMMERCE", "MAGENTO", "BIGCOMMERCE", "AMAZON", "EBAY", "ETSY",
    "FEDEX", "UPS", "DHL", "USPS", "SHIPSTATION", "EASYPOST", "SHIPPO",
    "STRIPE", "PAYPAL", "SQUARE", "BRAINTREE", "AUTHORIZE_NET",
    "SALESFORCE", "HUBSPOT", "ZOHO_CRM",
    "TWILIO", "SENDGRID", "MAILCHIMP",
    "CUSTOM", "WEBHOOK"
  ]),
  category: z.enum([
    "ACCOUNTING", "ECOMMERCE", "SHIPPING", "PAYMENT", "CRM", 
    "MARKETING", "COMMUNICATION", "ANALYTICS", "CUSTOM"
  ]),
  config: z.record(z.any()),
  authType: z.enum(["OAUTH2", "API_KEY", "BASIC", "BEARER_TOKEN", "CUSTOM", "NONE"]),
  credentials: z.record(z.any()).optional(),
  webhookSecret: z.string().optional(),
  features: z.record(z.any()),
  syncDirection: z.enum(["IMPORT", "EXPORT", "BIDIRECTIONAL"]),
  syncFrequency: z.enum([
    "REALTIME", "EVERY_5_MINUTES", "EVERY_15_MINUTES", "EVERY_30_MINUTES",
    "HOURLY", "EVERY_6_HOURS", "DAILY", "WEEKLY", "MANUAL"
  ]),
  autoSync: z.boolean().default(false),
  fieldMappings: z.record(z.any()),
  defaultMappings: z.record(z.any()).optional(),
  rateLimitPerMinute: z.number().optional(),
  rateLimitPerHour: z.number().optional(),
  rateLimitPerDay: z.number().optional(),
  version: z.string().optional(),
  apiVersion: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

// GET /api/integrations - List integrations
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
    const provider = searchParams.get("provider");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const healthStatus = searchParams.get("healthStatus");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (provider) where.provider = provider;
    if (category) where.category = category;
    if (status) where.status = status;
    if (healthStatus) where.healthStatus = healthStatus;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const integrations = await prisma.externalIntegration.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            connections: true,
            syncs: true,
            logs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

// POST /api/integrations - Create integration
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
    const validatedData = createIntegrationSchema.parse(body);

    // Check for duplicate code
    const existing = await prisma.externalIntegration.findUnique({
      where: {
        organizationId_code: {
          organizationId,
          code: validatedData.code,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Integration with this code already exists" },
        { status: 400 }
      );
    }

    const integration = await prisma.externalIntegration.create({
      data: {
        ...validatedData,
        organizationId,
        createdById: session.user.id,
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

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating integration:", error);
    return NextResponse.json(
      { error: "Failed to create integration" },
      { status: 500 }
    );
  }
}
