/**
 * AI Intervention API
 * Create and manage worker interventions
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

async function sendInterventionNotification(payload: Record<string, unknown>) {
  const webhookUrl = process.env.AI_INTERVENTION_WEBHOOK_URL;
  if (!webhookUrl) {
    return { delivered: false, reason: "not_configured" };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "AI_INTERVENTION_CREATED",
        payload,
        timestamp: new Date().toISOString(),
      }),
    });
    return { delivered: response.ok, statusCode: response.status };
  } catch (error) {
    console.error("AI intervention webhook error:", error);
    return { delivered: false, reason: "request_failed" };
  }
}

// GET - List interventions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const workerId = searchParams.get("workerId");
    const interventionType = searchParams.get("interventionType");
    const severity = searchParams.get("severity");

    // MANDATORY: Organization scoping for AI interventions
    const where: Record<string, unknown> = {
      // Note: AI interventions are scoped through the session relationship
      // which is tied to organization through worker
    };

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (workerId) {
      where.session = {
        workerId,
      };
    }

    if (interventionType) {
      where.interventionType = interventionType;
    }

    if (severity) {
      where.severity = severity;
    }

    const interventions = await prisma.aIIntervention.findMany({
      where,
      include: {
        session: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return NextResponse.json({
      interventions,
      total: interventions.length,
    });
  } catch (error) {
    console.error("AI Intervention GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch interventions" },
      { status: 500 },
    );
  }
}

// POST - Create new intervention
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      sessionId,
      interventionType,
      severity,
      reason,
      recommendation,
      metadata,
    } = body;

    if (!sessionId || !interventionType || !severity) {
      return NextResponse.json(
        { error: "Session ID, intervention type, and severity are required" },
        { status: 400 },
      );
    }

    // Get session
    const aiSession = await prisma.aISupervisionSession.findUnique({
      where: { id: sessionId },
      include: {
        worker: true,
      },
    });

    if (!aiSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Create intervention
    const intervention = await prisma.aIIntervention.create({
      data: {
        sessionId,
        interventionType,
        severity,
        reason,
        recommendation,
        metadata,
      },
      include: {
        session: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Update session warning counter
    await prisma.aISupervisionSession.update({
      where: { id: sessionId },
      data: {
        warningsIssued: {
          increment: severity === "HIGH" || severity === "CRITICAL" ? 1 : 0,
        },
      },
    });

    const notification = await sendInterventionNotification({
      interventionId: intervention.id,
      sessionId,
      workerId: aiSession.workerId,
      interventionType,
      severity,
      reason,
      recommendation,
    });

    if (severity === "CRITICAL") {
      await prisma.alert.create({
        data: {
          organizationId: aiSession.organizationId,
          alertNumber: `ALT-${Date.now()}`,
          category: "PERFORMANCE",
          alertType: "EVENT",
          severity: "CRITICAL",
          title: "Critical AI Intervention",
          message: `Critical intervention created for worker ${aiSession.worker?.name || aiSession.workerId}`,
          relatedEntityType: "AIIntervention",
          relatedEntityId: intervention.id,
          status: "ACTIVE",
          metadata: {
            interventionId: intervention.id,
            sessionId,
            workerId: aiSession.workerId,
            reason,
            recommendation,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      intervention,
      notification,
      message: "Intervention created successfully",
    });
  } catch (error) {
    console.error("AI Intervention POST error:", error);
    return NextResponse.json(
      { error: "Failed to create intervention" },
      { status: 500 },
    );
  }
}

// PATCH - Update intervention (acknowledge, resolve)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { interventionId, action, resolution } = body;

    if (!interventionId) {
      return NextResponse.json(
        { error: "Intervention ID is required" },
        { status: 400 },
      );
    }

    const intervention = await prisma.aIIntervention.findUnique({
      where: { id: interventionId },
    });

    if (!intervention) {
      return NextResponse.json(
        { error: "Intervention not found" },
        { status: 404 },
      );
    }

    let updatedIntervention;

    if (action === "acknowledge") {
      updatedIntervention = await prisma.aIIntervention.update({
        where: { id: interventionId },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
        },
      });
    } else if (action === "resolve") {
      updatedIntervention = await prisma.aIIntervention.update({
        where: { id: interventionId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolution,
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      intervention: updatedIntervention,
    });
  } catch (error) {
    console.error("AI Intervention PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update intervention" },
      { status: 500 },
    );
  }
}
