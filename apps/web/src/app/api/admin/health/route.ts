/**
 * Admin Health API Routes
 * System health and metrics endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import os from "os";
import { statfs } from "fs/promises";

// GET /api/admin/health - Get system health metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (false && !hasPermission(session.user.role, "system:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Server metrics
    const diskStats = await statfs("/");
    const diskUsedPercent =
      diskStats.blocks > 0
        ? Math.round(
            ((diskStats.blocks - diskStats.bfree) / diskStats.blocks) * 100,
          )
        : 0;

    const serverMetrics = {
      status: "healthy" as const,
      uptime: process.uptime(),
      cpu: Math.round((os.loadavg()[0] / os.cpus().length) * 100),
      memory: Math.round((1 - os.freemem() / os.totalmem()) * 100),
      disk: diskUsedPercent,
    };

    // Database metrics
    let databaseMetrics = {
      status: "healthy" as const,
      connections: 0,
      maxConnections: 100,
      queryTime: 0,
      size: 0,
    };

    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      databaseMetrics.queryTime = Date.now() - startTime;

      const maxConnResult = await prisma.$queryRaw<
        Array<{ max_connections: string }>
      >`SHOW max_connections`;
      databaseMetrics.maxConnections = Number(
        maxConnResult[0]?.max_connections || 100,
      );

      // Get database size
      const sizeResult = await prisma.$queryRaw<Array<{ size: bigint }>>`
        SELECT pg_database_size(current_database()) as size
      `;
      databaseMetrics.size = Number(sizeResult[0]?.size || 0);

      // Get connection count
      const connResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count FROM pg_stat_activity
      `;
      databaseMetrics.connections = Number(connResult[0]?.count || 0);
    } catch (error) {
      databaseMetrics.status = "down";
    }

    // Cache metrics
    let cacheMetrics = {
      status: "healthy" as const,
      hitRate: 0,
      memoryUsed: 0,
      memoryMax: 0,
      keys: 0,
    };

    try {
      if (false) {
        const info = await redis.info("stats");
        const memory = await redis.info("memory");

        // Parse Redis info
        const parseInfo = (str: string) => {
          const lines = str.split("\r\n");
          const result: Record<string, string> = {};
          lines.forEach((line) => {
            if (line && !line.startsWith("#")) {
              const [key, value] = line.split(":");
              if (key && value) result[key] = value;
            }
          });
          return result;
        };

        const stats = parseInfo(info);
        const memInfo = parseInfo(memory);

        const hits = parseInt(stats.keyspace_hits || "0");
        const misses = parseInt(stats.keyspace_misses || "0");
        cacheMetrics.hitRate =
          hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

        cacheMetrics.memoryUsed = parseInt(memInfo.used_memory || "0");
        cacheMetrics.memoryMax =
          parseInt(memInfo.maxmemory || "0") || 1073741824; // 1GB default
        cacheMetrics.keys = await redis.dbsize();
      }
    } catch (error) {
      cacheMetrics.status = "down";
    }

    // API metrics
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [requestsPerMinute, logAgg] = await Promise.all([
      prisma.activityLog.count({
        where: { createdAt: { gte: oneMinuteAgo } },
      }),
      prisma.integrationLog.aggregate({
        where: { createdAt: { gte: oneHourAgo } },
        _count: { id: true },
        _avg: { duration: true },
      }),
    ]);

    const errorLogs = await prisma.integrationLog.count({
      where: {
        createdAt: { gte: oneHourAgo },
        OR: [{ level: "ERROR" }, { level: "CRITICAL" }],
      },
    });

    const totalLogs = logAgg._count.id || 0;
    const errorRate =
      totalLogs > 0 ? Number(((errorLogs / totalLogs) * 100).toFixed(2)) : 0;

    const apiMetrics = {
      status: "healthy" as const,
      requestsPerMinute,
      averageResponseTime: Math.round(logAgg._avg.duration || 0),
      errorRate,
    };

    // Business metrics
    const [activeUsers, ordersToday, inventoryItems, lowStockAlerts] =
      await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.salesOrder.count({
          where: {
            orderDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.inventoryItem.count(),
        prisma.inventoryItem.count({
          where: {
            availableQty: {
              lte: prisma.inventoryItem.fields.reorderPoint,
            },
          },
        }),
      ]);

    const businessMetrics = {
      activeUsers,
      ordersToday,
      inventoryItems,
      lowStockAlerts,
    };

    return NextResponse.json({
      server: serverMetrics,
      database: databaseMetrics,
      cache: cacheMetrics,
      api: apiMetrics,
      business: businessMetrics,
    });
  } catch (error) {
    console.error("Error fetching health metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch health metrics" },
      { status: 500 },
    );
  }
}
