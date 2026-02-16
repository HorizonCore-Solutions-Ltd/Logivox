import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import os from "os";

export async function GET() {
  try {
    // Comprehensive system health check
    const [databaseStatus, memoryUsage, systemInfo] = await Promise.allSettled([
      // Database connectivity
      prisma.$queryRaw`SELECT 1`,

      // Memory usage
      Promise.resolve(process.memoryUsage()),

      // System information
      Promise.resolve({
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
      }),
    ]);

    const detailedHealth = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: Math.floor(process.uptime()),

      database: {
        status:
          databaseStatus.status === "fulfilled" ? "connected" : "disconnected",
        error:
          databaseStatus.status === "rejected"
            ? databaseStatus.reason?.message
            : null,
      },

      memory:
        memoryUsage.status === "fulfilled"
          ? {
              used: Math.round(memoryUsage.value.heapUsed / 1024 / 1024), // MB
              total: Math.round(memoryUsage.value.heapTotal / 1024 / 1024), // MB
              external: Math.round(memoryUsage.value.external / 1024 / 1024), // MB
            }
          : null,

      system:
        systemInfo.status === "fulfilled"
          ? {
              platform: systemInfo.value.platform,
              arch: systemInfo.value.arch,
              nodeVersion: systemInfo.value.nodeVersion,
              cpus: systemInfo.value.cpus,
              totalMemory: Math.round(
                systemInfo.value.totalMemory / 1024 / 1024 / 1024,
              ), // GB
              freeMemory: Math.round(
                systemInfo.value.freeMemory / 1024 / 1024 / 1024,
              ), // GB
              loadAverage: systemInfo.value.loadAverage,
            }
          : null,

      services: {
        prisma:
          databaseStatus.status === "fulfilled" ? "operational" : "degraded",
        nextauth: process.env.NEXTAUTH_URL ? "configured" : "not_configured",
        uploads:
          process.env.S3_BUCKET_NAME || process.env.UPLOAD_DIR
            ? "configured"
            : "local_only",
      },
    };

    const overallHealthy = databaseStatus.status === "fulfilled";
    const statusCode = overallHealthy ? 200 : 503;

    return NextResponse.json(detailedHealth, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Detailed health check failed",
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
