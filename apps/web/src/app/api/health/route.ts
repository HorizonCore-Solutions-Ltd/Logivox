import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: "healthy" | "degraded" | "unhealthy";
      used: number;
      total: number;
      percentage: number;
    };
    env: {
      status: "healthy" | "unhealthy";
      missingVars?: string[];
    };
  };
}

const REQUIRED_ENV_VARS = ["DATABASE_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET"];

async function checkDatabase(): Promise<
  HealthCheckResponse["checks"]["database"]
> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    return {
      status: "healthy",
      responseTime,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function checkMemory(): HealthCheckResponse["checks"]["memory"] {
  const memoryUsage = process.memoryUsage();
  const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const percentage = Math.round((usedMB / totalMB) * 100);

  let status: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (percentage > 90) status = "unhealthy";
  else if (percentage > 75) status = "degraded";

  return {
    status,
    used: usedMB,
    total: totalMB,
    percentage,
  };
}

function checkEnvironment(): HealthCheckResponse["checks"]["env"] {
  const missingVars = REQUIRED_ENV_VARS.filter(
    (varName) => !process.env[varName],
  );

  return {
    status: missingVars.length === 0 ? "healthy" : "unhealthy",
    ...(missingVars.length > 0 && { missingVars }),
  };
}

export async function GET() {
  try {
    const [databaseCheck, memoryCheck, envCheck] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkEnvironment()),
    ]);

    const allHealthy =
      databaseCheck.status === "healthy" &&
      memoryCheck.status === "healthy" &&
      envCheck.status === "healthy";

    const anyUnhealthy =
      databaseCheck.status === "unhealthy" ||
      memoryCheck.status === "unhealthy" ||
      envCheck.status === "unhealthy";

    const status: HealthCheckResponse["status"] = allHealthy
      ? "healthy"
      : anyUnhealthy
        ? "unhealthy"
        : "degraded";

    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      checks: {
        database: databaseCheck,
        memory: memoryCheck,
        env: envCheck,
      },
    };

    const statusCode =
      status === "healthy" ? 200 : status === "degraded" ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    const response: HealthCheckResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      checks: {
        database: {
          status: "unhealthy",
          error: "Health check failed",
        },
        memory: {
          status: "unhealthy",
          used: 0,
          total: 0,
          percentage: 0,
        },
        env: {
          status: "unhealthy",
        },
      },
    };

    return NextResponse.json(response, { status: 503 });
  }
}
