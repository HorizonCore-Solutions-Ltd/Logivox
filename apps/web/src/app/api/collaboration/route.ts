/**
 * Collaboration API
 * H2H (Human-to-Human), H2R (Human-to-Robot), R2R (Robot-to-Robot), Predictive collaboration
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

async function emitCollaborationEvent(
  eventType: string,
  payload: Record<string, unknown>,
) {
  const webhookUrl = process.env.COLLABORATION_EVENTS_WEBHOOK_URL;
  if (!webhookUrl) {
    return { delivered: false, reason: "not_configured" };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, payload, timestamp: new Date().toISOString() }),
    });
    return { delivered: response.ok, statusCode: response.status };
  } catch (error) {
    console.error("Collaboration webhook error:", error);
    return { delivered: false, reason: "request_failed" };
  }
}

// GET - List collaboration requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");
    const requestType = searchParams.get("requestType");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    // Get specific request
    if (requestId) {
      const request = await prisma.collaborationRequest.findUnique({
        where: { id: requestId },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          messages: {
            orderBy: { timestamp: "asc" },
            include: {
              sender: {
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

      if (!request) {
        return NextResponse.json(
          { error: "Request not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ request });
    }

    // Build filters
    const where: Record<string, unknown> = {};

    if (requestType) {
      where.requestType = requestType;
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.OR = [{ requesterId: userId }, { assigneeId: userId }];
    }

    // List requests
    const requests = await prisma.collaborationRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      requests,
      total: requests.length,
    });
  } catch (error) {
    console.error("Collaboration GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaboration requests" },
      { status: 500 },
    );
  }
}

// POST - Create new collaboration request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      requestType,
      taskType,
      priority,
      description,
      locationInfo,
      estimatedDuration,
      assigneeId,
      robotId,
      metadata,
    } = body;

    if (!requestType || !taskType) {
      return NextResponse.json(
        { error: "Request type and task type are required" },
        { status: 400 },
      );
    }

    // Create collaboration request
    const request = await prisma.collaborationRequest.create({
      data: {
        requesterId: session.user.id,
        requestType,
        taskType,
        priority: priority || "MEDIUM",
        status: "PENDING",
        description,
        locationInfo,
        estimatedDuration,
        assigneeId,
        robotId,
        metadata,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Auto-route request based on type
    if (requestType === "H2H") {
      // Find available peer workers
      await autoAssignPeerWorker(request.id);
    } else if (requestType === "H2R") {
      // Find available robot
      await autoAssignRobot(request.id, taskType);
    } else if (requestType === "PREDICTIVE") {
      // Analyze and predict need
      await analyzePredictiveRequest(request.id);
    }

    await emitCollaborationEvent("COLLABORATION_REQUEST_CREATED", {
      requestId: request.id,
      requestType,
      taskType,
      priority,
      requesterId: session.user.id,
      assigneeId: request.assigneeId,
    });

    return NextResponse.json({
      success: true,
      request,
      message: "Collaboration request created",
    });
  } catch (error) {
    console.error("Collaboration POST error:", error);
    return NextResponse.json(
      { error: "Failed to create collaboration request" },
      { status: 500 },
    );
  }
}

// PATCH - Update collaboration request
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, action, assigneeId, resolution } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 },
      );
    }

    const request = await prisma.collaborationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    let updatedRequest;

    if (action === "accept" && assigneeId) {
      updatedRequest = await prisma.collaborationRequest.update({
        where: { id: requestId },
        data: {
          status: "IN_PROGRESS",
          assigneeId,
          acceptedAt: new Date(),
        },
      });
    } else if (action === "start") {
      updatedRequest = await prisma.collaborationRequest.update({
        where: { id: requestId },
        data: {
          status: "IN_PROGRESS",
          acceptedAt: request.acceptedAt || new Date(),
        },
      });
    } else if (action === "complete") {
      updatedRequest = await prisma.collaborationRequest.update({
        where: { id: requestId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          resolution,
        },
      });
    } else if (action === "cancel") {
      updatedRequest = await prisma.collaborationRequest.update({
        where: { id: requestId },
        data: {
          status: "CANCELLED",
          completedAt: new Date(),
          resolution: resolution || "Cancelled by user",
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Collaboration PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update collaboration request" },
      { status: 500 },
    );
  }
}

// Helper: Auto-assign peer worker for H2H collaboration
async function autoAssignPeerWorker(requestId: string) {
  try {
    const request = await prisma.collaborationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) return;

    await emitCollaborationEvent("COLLABORATION_PEER_ASSIGNMENT_REQUESTED", {
      requestId,
      requesterId: request.requesterId,
      status: request.status,
    });
  } catch (error) {
    console.error("Auto-assign peer worker error:", error);
  }
}

// Helper: Auto-assign robot for H2R collaboration
async function autoAssignRobot(requestId: string, taskType: string) {
  try {
    const request = await prisma.collaborationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) return;

    await emitCollaborationEvent("COLLABORATION_ROBOT_ASSIGNMENT_REQUESTED", {
      requestId,
      taskType,
      requesterId: request.requesterId,
      status: request.status,
    });
  } catch (error) {
    console.error("Auto-assign robot error:", error);
  }
}

// Helper: Analyze predictive collaboration request
async function analyzePredictiveRequest(requestId: string) {
  try {
    const request = await prisma.collaborationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) return;

    await emitCollaborationEvent("COLLABORATION_PREDICTIVE_ANALYSIS_REQUESTED", {
      requestId,
      requesterId: request.requesterId,
      status: request.status,
      taskType: request.taskType,
    });
  } catch (error) {
    console.error("Analyze predictive request error:", error);
  }
}
