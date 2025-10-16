import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sendNotificationSchema = z.object({
  templateId: z.string().optional(),
  category: z.enum(['ORDER_UPDATES', 'INVENTORY_ALERTS', 'SHIPMENT_UPDATES', 'PAYMENT_UPDATES', 'QUALITY_ALERTS', 'SYSTEM_ALERTS', 'USER_ACTIONS', 'REPORTS', 'APPROVALS', 'CUSTOM']),
  notificationType: z.enum(['EMAIL', 'SMS', 'WEBHOOK', 'PUSH', 'IN_APP']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  subject: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  htmlBody: z.string().optional(),
  data: z.record(z.any()).optional(),
  recipientType: z.enum(['USER', 'ROLE', 'CUSTOM', 'DYNAMIC']),
  recipientId: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  recipientPushToken: z.string().optional(),
  channels: z.array(z.string()).min(1, "At least one channel required"),
  scheduledFor: z.string().optional(),
  expiresAt: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Helper function to generate notification number
async function generateNotificationNumber(organizationId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const lastNotification = await prisma.notification.findFirst({
    where: {
      organizationId,
      notificationNumber: {
        startsWith: `NOTIF-${dateStr}-`,
      },
    },
    orderBy: { notificationNumber: 'desc' },
  });

  let sequence = 1;
  if (lastNotification?.notificationNumber) {
    const lastSequence = parseInt(lastNotification.notificationNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `NOTIF-${dateStr}-${sequence.toString().padStart(4, '0')}`;
}

// GET /api/notifications - List notifications
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
    const status = searchParams.get("status");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    const where: any = {
      organizationId,
      recipientId: user.id, // Only show notifications for the current user
    };

    if (category) where.category = category;
    if (status) where.status = status;
    if (unreadOnly) where.readAt = null;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              code: true,
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
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          organizationId,
          recipientId: user.id,
          readAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Send notification
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
    const validated = sendNotificationSchema.parse(body);

    // Generate notification number
    const notificationNumber = await generateNotificationNumber(organizationId);

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        organizationId,
        notificationNumber,
        createdById: user.id,
        ...validated,
        scheduledFor: validated.scheduledFor ? new Date(validated.scheduledFor) : undefined,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
        status: validated.scheduledFor ? 'SCHEDULED' : 'PENDING',
      },
      include: {
        template: true,
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create delivery records for each channel
    const deliveries = await Promise.all(
      (validated.channels as string[]).map((channel) =>
        prisma.notificationDelivery.create({
          data: {
            notificationId: notification.id,
            channel: channel as any,
            status: 'PENDING',
          },
        })
      )
    );

    // TODO: Actually send the notification via the appropriate channels
    // For now, we'll just mark it as sent
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ notification, deliveries }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
