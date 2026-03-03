/**
 * CAPA Monitoring API
 * GET  /api/capa/monitoring  — real-time open/overdue CAPA status
 * POST /api/capa/monitoring  — trigger alert / escalation for a CAPA
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const now = new Date();

    const [open, overdue, closedThisMonth, byPriority, recent] =
      await Promise.all([
        // Total open
        prisma.correctivePreventiveAction.count({
          where: {
            organizationId: orgId,
            status: { in: ["OPEN", "IN_PROGRESS"] },
          },
        }),
        // Overdue
        prisma.correctivePreventiveAction.count({
          where: {
            organizationId: orgId,
            status: { in: ["OPEN", "IN_PROGRESS"] },
            dueDate: { lt: now },
          },
        }),
        // Closed this month
        prisma.correctivePreventiveAction.count({
          where: {
            organizationId: orgId,
            status: "CLOSED",
            updatedAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
            },
          },
        }),
        // By priority
        prisma.correctivePreventiveAction.groupBy({
          by: ["priority"],
          where: {
            organizationId: orgId,
            status: { in: ["OPEN", "IN_PROGRESS"] },
          },
          _count: true,
        }),
        // Recent 10
        prisma.correctivePreventiveAction.findMany({
          where: { organizationId: orgId },
          orderBy: { updatedAt: "desc" },
          take: 10,
          select: {
            id: true,
            capaNumber: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            updatedAt: true,
          },
        }),
      ]);

    return NextResponse.json({
      summary: {
        open,
        overdue,
        closedThisMonth,
        overdueRate: open > 0 ? Math.round((overdue / open) * 100) : 0,
      },
      byPriority: byPriority.reduce(
        (
          acc: Record<string, number>,
          g: { priority: string; _count: number },
        ) => {
          acc[g.priority] = g._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recent,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/capa/monitoring error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitoring data" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { capaId, action, note } = await request.json();
    if (!capaId || !action) {
      return NextResponse.json(
        { error: "capaId and action are required" },
        { status: 400 },
      );
    }

    const capa = await prisma.correctivePreventiveAction.findFirst({
      where: { id: capaId, organizationId: session.user.organizationId },
    });
    if (!capa) {
      return NextResponse.json({ error: "CAPA not found" }, { status: 404 });
    }

    // Record the monitoring alert / escalation note
    const updated = await prisma.correctivePreventiveAction.update({
      where: { id: capaId },
      data: {
        updatedAt: new Date(),
        // Append note to description as audit trail
        description: note
          ? `${capa.description}\n\n[${action.toUpperCase()} — ${new Date().toISOString()}]: ${note}`
          : capa.description,
      },
    });

    return NextResponse.json({ success: true, capa: updated });
  } catch (error) {
    console.error("POST /api/capa/monitoring error:", error);
    return NextResponse.json(
      { error: "Failed to process monitoring action" },
      { status: 500 },
    );
  }
}
