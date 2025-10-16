import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/task-automations/[id] - Get automation details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const automation = await prisma.taskAutomation.findUnique({
      where: { id: params.id },
      include: {
        assignToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        executions: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
    });

    if (!automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Error fetching automation:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation" },
      { status: 500 }
    );
  }
}

// PATCH /api/task-automations/[id] - Update automation
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...updateData } = body;

    // Handle special actions
    if (action) {
      switch (action) {
        case "activate":
          return handleToggleAutomation(params.id, true);
        case "deactivate":
          return handleToggleAutomation(params.id, false);
        case "execute":
          return handleManualExecution(params.id, session.user.id);
        default:
          return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
          );
      }
    }

    // Regular update
    const automation = await prisma.taskAutomation.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        assignToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Error updating automation:", error);
    return NextResponse.json(
      { error: "Failed to update automation" },
      { status: 500 }
    );
  }
}

// DELETE /api/task-automations/[id] - Delete automation
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.taskAutomation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting automation:", error);
    return NextResponse.json(
      { error: "Failed to delete automation" },
      { status: 500 }
    );
  }
}

// Helper: Toggle automation active status
async function handleToggleAutomation(automationId: string, isActive: boolean) {
  const automation = await prisma.taskAutomation.update({
    where: { id: automationId },
    data: {
      isActive,
    },
  });

  return NextResponse.json(automation);
}

// Helper: Manual execution of automation
async function handleManualExecution(automationId: string, userId: string) {
  const automation = await prisma.taskAutomation.findUnique({
    where: { id: automationId },
  });

  if (!automation) {
    return NextResponse.json(
      { error: "Automation not found" },
      { status: 404 }
    );
  }

  // Generate execution number: EXEC-YYYYMMDD-XXXX
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const todayCount = await prisma.taskExecution.count({
    where: {
      organizationId: automation.organizationId,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  const sequenceNumber = String(todayCount + 1).padStart(4, "0");
  const executionNumber = `EXEC-${dateStr}-${sequenceNumber}`;

  // Create execution record
  const execution = await prisma.taskExecution.create({
    data: {
      organizationId: automation.organizationId,
      automationId: automation.id,
      executionNumber,
      status: "PENDING",
      triggerData: { manual: true, userId },
      triggeredBy: userId,
    },
  });

  // TODO: Implement actual task creation logic based on automation rules
  // For now, just mark as completed
  await prisma.taskExecution.update({
    where: { id: execution.id },
    data: {
      status: "COMPLETED",
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 0,
      result: {
        message: "Manual execution placeholder",
      },
    },
  });

  // Update automation stats
  await prisma.taskAutomation.update({
    where: { id: automationId },
    data: {
      lastTriggeredAt: new Date(),
      lastExecutionAt: new Date(),
      executionCount: { increment: 1 },
      successCount: { increment: 1 },
    },
  });

  return NextResponse.json(execution);
}
