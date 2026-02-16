/**
 * Error Logging API Endpoint
 * Centralized error logging for client-side errors
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      message,
      stack,
      componentStack,
      timestamp,
      userAgent,
      url,
      userId,
      organizationId,
    } = body;

    // Get IP address
    const headersList = headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Log to database
    await prisma.errorLog.create({
      data: {
        level: "ERROR",
        message: message || "Unknown error",
        stack: stack || null,
        context: {
          componentStack,
          userAgent,
          url,
          ipAddress,
          timestamp,
        },
        userId: userId || null,
        organizationId: organizationId || "default",
        source: "CLIENT",
        resolved: false,
      },
    });

    // In production, also send to external monitoring (Sentry, DataDog, etc.)
    if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
      // Sentry.captureException would go here
    }

    return NextResponse.json({ success: true, logged: true });
  } catch (error) {
    console.error("Failed to log error:", error);
    // Don't fail the request if logging fails
    return NextResponse.json(
      { success: false, logged: false },
      { status: 500 },
    );
  }
}
