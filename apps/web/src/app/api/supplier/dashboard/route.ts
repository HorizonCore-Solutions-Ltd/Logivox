import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supplier-portal-secret-key";

// Verify supplier token
function verifyToken(request: Request): any {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.substring(7);
  return jwt.verify(token, JWT_SECRET);
}

/**
 * GET /api/supplier/dashboard
 * Get supplier dashboard statistics
 */
export async function GET(request: Request) {
  try {
    // Verify authentication
    const decoded = verifyToken(request);

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    if (!supplierId || decoded.supplierId !== supplierId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    // Get open NCRs count
    const openNCRs = await prisma.nonConformanceReport.count({
      where: {
        supplierId,
        status: {
          in: ["OPEN", "INVESTIGATING", "ACTION_PENDING"],
        },
      },
    });

    // Get pending responses count
    const pendingResponses = await prisma.nonConformanceReport.count({
      where: {
        supplierId,
        status: {
          in: ["OPEN", "INVESTIGATING"],
        },
        supplierResponses: {
          none: {},
        },
      },
    });

    // Get recent NCRs
    const recentNCRs = await prisma.nonConformanceReport.findMany({
      where: { supplierId },
      orderBy: { reportDate: "desc" },
      take: 5,
      select: {
        id: true,
        ncrNumber: true,
        title: true,
        severity: true,
        reportDate: true,
        status: true,
      },
    });

    // Calculate quality score (simple version)
    const totalNCRs = await prisma.nonConformanceReport.count({
      where: {
        supplierId,
        reportDate: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
    });

    const closedNCRs = await prisma.nonConformanceReport.count({
      where: {
        supplierId,
        status: "CLOSED",
        reportDate: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Quality score: 100 - (10 * open NCRs) - (5 * critical NCRs)
    const criticalNCRs = await prisma.nonConformanceReport.count({
      where: {
        supplierId,
        severity: "CRITICAL",
        status: {
          not: "CLOSED",
        },
      },
    });

    const qualityScore = Math.max(0, 100 - openNCRs * 10 - criticalNCRs * 15);

    return NextResponse.json({
      success: true,
      data: {
        openNCRs,
        pendingResponses,
        qualityScore: Math.round(qualityScore),
        recentNCRs,
      },
    });
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard" },
      { status: error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
