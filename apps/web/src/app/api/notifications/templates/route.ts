export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  code: z.string().min(1, "Code is required"),
  category: z.enum(['ORDER_UPDATES', 'INVENTORY_ALERTS', 'SHIPMENT_UPDATES', 'PAYMENT_UPDATES', 'QUALITY_ALERTS', 'SYSTEM_ALERTS', 'USER_ACTIONS', 'REPORTS', 'APPROVALS', 'CUSTOM']),
  notificationType: z.enum(['EMAIL', 'SMS', 'WEBHOOK', 'PUSH', 'IN_APP']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  subject: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  htmlBody: z.string().optional(),
  smsBody: z.string().optional(),
  channels: z.array(z.string()).min(1, "At least one channel required"),
  deliveryRules: z.record(z.any()).optional(),
  recipientType: z.enum(['USER', 'ROLE', 'CUSTOM', 'DYNAMIC']),
  defaultRecipients: z.record(z.any()).optional(),
  triggerEvent: z.string().min(1, "Trigger event is required"),
  conditions: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

// GET /api/notifications/templates - List notification templates
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const notificationType = searchParams.get("notificationType");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: any = {
      organizationId,
    };

    if (category) where.category = category;
    if (notificationType) where.notificationType = notificationType;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.notificationTemplate.findMany({
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
            notifications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/notifications/templates - Create notification template
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const body = await request.json();
    const validated = createTemplateSchema.parse(body);

    // Check for duplicate code
    const existing = await prisma.notificationTemplate.findFirst({
      where: {
        organizationId,
        code: validated.code,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Template code already exists" },
        { status: 400 }
      );
    }

    // Create template
    const template = await prisma.notificationTemplate.create({
      data: {
        organizationId,
        createdById: user.id,
        ...validated,
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

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
