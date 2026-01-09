/**
 * Return Settings API
 * GET /api/returns/settings - Get organization return settings
 * PUT /api/returns/settings - Update return settings
 */

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_RETURN_SETTINGS } from "@/lib/services/returns/settings";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 404 },
      );
    }

    // Get settings or return defaults
    const settings = (await prisma.$queryRaw`
      SELECT * FROM return_settings
      WHERE organization_id = ${membership.organizationId}
    `) as any[];

    if (settings.length === 0) {
      return NextResponse.json({
        settings: DEFAULT_RETURN_SETTINGS,
        isDefault: true,
      });
    }

    return NextResponse.json({
      settings: {
        ...DEFAULT_RETURN_SETTINGS,
        ...settings[0],
      },
      isDefault: false,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 404 },
      );
    }

    const body = await request.json();

    // Merge with defaults
    const newSettings = {
      ...DEFAULT_RETURN_SETTINGS,
      ...body,
    };

    // Upsert settings
    await prisma.$executeRaw`
      INSERT INTO return_settings (
        organization_id, general, labels, fraud, refurbishment,
        resale, rtv, forecasting, notifications, customer_portal,
        automation, compliance, reporting, created_at, updated_at
      ) VALUES (
        ${membership.organizationId},
        ${JSON.stringify(newSettings.general)}::jsonb,
        ${JSON.stringify(newSettings.labels)}::jsonb,
        ${JSON.stringify(newSettings.fraud)}::jsonb,
        ${JSON.stringify(newSettings.refurbishment)}::jsonb,
        ${JSON.stringify(newSettings.resale)}::jsonb,
        ${JSON.stringify(newSettings.rtv)}::jsonb,
        ${JSON.stringify(newSettings.forecasting)}::jsonb,
        ${JSON.stringify(newSettings.notifications)}::jsonb,
        ${JSON.stringify(newSettings.customerPortal)}::jsonb,
        ${JSON.stringify(newSettings.automation)}::jsonb,
        ${JSON.stringify(newSettings.compliance)}::jsonb,
        ${JSON.stringify(newSettings.reporting)}::jsonb,
        NOW(), NOW()
      )
      ON CONFLICT (organization_id)
      DO UPDATE SET
        general = EXCLUDED.general,
        labels = EXCLUDED.labels,
        fraud = EXCLUDED.fraud,
        refurbishment = EXCLUDED.refurbishment,
        resale = EXCLUDED.resale,
        rtv = EXCLUDED.rtv,
        forecasting = EXCLUDED.forecasting,
        notifications = EXCLUDED.notifications,
        customer_portal = EXCLUDED.customer_portal,
        automation = EXCLUDED.automation,
        compliance = EXCLUDED.compliance,
        reporting = EXCLUDED.reporting,
        updated_at = NOW()
    `;

    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "SETTINGS_UPDATED",
        entityType: "RETURN_SETTINGS",
        entityId: membership.organizationId,
        metadata: {
          updatedBy: session.user.name || session.user.email,
        },
      },
    });

    return NextResponse.json({
      settings: newSettings,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      {
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
