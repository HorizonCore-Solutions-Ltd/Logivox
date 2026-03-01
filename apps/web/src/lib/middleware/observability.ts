import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface LogEntry {
  userId?: string;
  organizationId?: string;
  action: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  ip: string;
  userAgent: string;
  requestId: string;
}

/**
 * Production-ready observability middleware for Next.js API Routes.
 * Handles both error catching and performance tracking.
 */
export async function withObservability(
  handler: (req: Request, context: any) => Promise<Response>,
  req: Request,
  context: any = {},
) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const response = await handler(req, context);
    const duration = Date.now() - startTime;

    // Async logging - don't block response
    void logRequest({
      action: "API_REQUEST_SUCCESS",
      method: req.method,
      url: new URL(req.url).pathname,
      statusCode: response.status,
      duration,
      ip,
      userAgent,
      requestId,
    });

    return response;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error(`[API ERROR] ${requestId}:`, error);

    // Secure error response for production - avoid leaking implementation details
    const errorResponse = NextResponse.json(
      {
        error: "Internal Server Error",
        message:
          process.env.NODE_ENV === "production"
            ? "The request could not be processed."
            : error.message,
        requestId,
      },
      { status: 500 },
    );

    // Audit critical failures
    void logRequest({
      action: "API_REQUEST_ERROR",
      method: req.method,
      url: new URL(req.url).pathname,
      statusCode: 500,
      duration,
      ip,
      userAgent,
      requestId,
    });

    return errorResponse;
  }
}

async function logRequest(entry: LogEntry) {
  try {
    // Only log significant events to DB, use standard logging for the rest
    if (entry.statusCode >= 400 || entry.duration > 1000) {
      await prisma.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId || "system",
          metadata: entry,
        },
      });
    }
  } catch (err) {
    console.warn("Logging failed:", err);
  }
}
