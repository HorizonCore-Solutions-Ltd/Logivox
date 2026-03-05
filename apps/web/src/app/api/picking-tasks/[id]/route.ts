import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/picking-tasks/[id] - Get task details
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.pickingTask.findUnique({
      where: { id: params.id },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        wavePick: {
          select: {
            id: true,
            waveNumber: true,
            name: true,
            status: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            description: true,
            imageUrl: true,
          },
        },
        fromLocation: {
          select: {
            id: true,
            name: true,
            zone: true,
            aisle: true,
            rack: true,
            bin: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
            zone: true,
            aisle: true,
            rack: true,
            bin: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        completedBy: {
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
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}

// PATCH /api/picking-tasks/[id] - Update task
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
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
        case "assign":
          return handleAssignTask(
            params.id,
            updateData.assignedToId,
            session.user.id,
          );
        case "start":
          return handleStartTask(params.id, session.user.id);
        case "complete":
          return handleCompleteTask(params.id, session.user.id, updateData);
        case "cancel":
          return handleCancelTask(params.id, session.user.id);
        default:
          return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 },
          );
      }
    }

    // Regular update
    const task = await prisma.pickingTask.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

// DELETE /api/picking-tasks/[id] - Delete task
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.pickingTask.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!["PENDING", "CANCELLED"].includes(task.status)) {
      return NextResponse.json(
        { error: "Cannot delete task in current status" },
        { status: 400 },
      );
    }

    await prisma.pickingTask.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}

// Helper: Assign task to user
async function handleAssignTask(
  taskId: string,
  assignedToId: string,
  userId: string,
) {
  const task = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      assignedToId,
      assignedAt: new Date(),
      status: "ASSIGNED",
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(task);
}

// Helper: Start task
async function handleStartTask(taskId: string, userId: string) {
  const task = await prisma.pickingTask.findUnique({
    where: { id: taskId },
    select: { status: true, assignedToId: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (!["PENDING", "ASSIGNED"].includes(task.status)) {
    return NextResponse.json(
      { error: "Task cannot be started from current status" },
      { status: 400 },
    );
  }

  const updated = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      status: "IN_PROGRESS",
      startedAt: new Date(),
      assignedToId: task.assignedToId || userId,
      assignedAt: task.assignedToId ? undefined : new Date(),
    },
  });

  return NextResponse.json(updated);
}

// Helper: Complete task
async function handleCompleteTask(taskId: string, userId: string, data: any) {
  const task = await prisma.pickingTask.findUnique({
    where: { id: taskId },
    select: { status: true, startedAt: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Task must be in progress to complete" },
      { status: 400 },
    );
  }

  const completedAt = new Date();
  const duration = task.startedAt
    ? Math.floor((completedAt.getTime() - task.startedAt.getTime()) / 1000)
    : null;

  const updated = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedAt,
      completedById: userId,
      duration,
      progress: 100,
      completionNotes: data.completionNotes,
    },
    include: {
      completedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(updated);
}

// Helper: Cancel task
async function handleCancelTask(taskId: string, userId: string) {
  const task = await prisma.pickingTask.findUnique({
    where: { id: taskId },
    select: { status: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (["COMPLETED", "CANCELLED"].includes(task.status)) {
    return NextResponse.json(
      { error: "Cannot cancel task in current status" },
      { status: 400 },
    );
  }

  const updated = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      status: "CANCELLED",
    },
  });

  return NextResponse.json(updated);
}
