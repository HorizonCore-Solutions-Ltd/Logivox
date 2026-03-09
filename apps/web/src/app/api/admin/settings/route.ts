/**
 * Admin Settings API Routes
 * GET: Fetch system settings
 * PUT: Update system settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

// Default settings structure
const defaultSettings = {
  general: {
    appName: "LogiVox",
    appUrl: "https://logivox.ai",
    companyName: "Your Company",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    language: "en",
  },
  email: {
    enabled: false,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "noreply@logivox.ai",
    fromName: "LogiVox",
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlerts: true,
    orderAlerts: true,
    systemAlerts: true,
  },
  security: {
    sessionTimeout: 60,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: true,
    twoFactorEnabled: false,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
  },
  inventory: {
    autoReorder: false,
    reorderDays: 7,
    allowNegativeStock: false,
    defaultWarehouse: "",
    trackSerialNumbers: true,
    trackBatchNumbers: true,
  },
  integrations: {
    stripeEnabled: false,
    stripePublicKey: "",
    stripeSecretKey: "",
    twilioEnabled: false,
    twilioAccountSid: "",
    twilioAuthToken: "",
    slackEnabled: false,
    slackWebhook: "",
  },
};

// GET /api/admin/settings - Fetch system settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.user.role, "settings:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch settings from database
    const settings = await prisma.systemSetting.findMany();

    // Convert to object structure
    const settingsObject = settings.reduce((acc, setting) => {
      const [category, key] = setting.key.split(".");
      if (!acc[category]) {
        acc[category] = {};
      }
      acc[category][key] = setting.value;
      return acc;
    }, {} as any);

    // Merge with defaults
    const mergedSettings = Object.keys(defaultSettings).reduce(
      (acc, category) => {
        acc[category] = {
          ...defaultSettings[category as keyof typeof defaultSettings],
          ...(settingsObject[category] || {}),
        };
        return acc;
      },
      {} as any,
    );

    return NextResponse.json(mergedSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/settings - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.user.role, "settings:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate settings structure
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 },
      );
    }

    // Flatten settings object
    const flattenedSettings: Array<{ key: string; value: any }> = [];
    Object.entries(body).forEach(([category, settings]) => {
      if (typeof settings === "object") {
        Object.entries(settings as object).forEach(([key, value]) => {
          flattenedSettings.push({
            key: `${category}.${key}`,
            value,
          });
        });
      }
    });

    // Update settings in database using upsert
    await Promise.all(
      flattenedSettings.map((setting) =>
        prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            updatedAt: new Date(),
          },
          create: {
            key: setting.key,
            value: setting.value,
          },
        }),
      ),
    );

    // Log audit event

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
