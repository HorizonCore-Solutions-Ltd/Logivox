import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Mobile API - Task Actions
 * Start, pause, complete tasks from mobile
 */

// POST /api/mobile/tasks/[id]/start - Start task
export async function POST(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const task = await prisma.pickingTask.findUnique({
      where: { id: params.id },
      select: { status: true, assignedToId: true },
    });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Task not found" },
        },
        { status: 404 }
      );
    }

    if (task.assignedToId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Task not assigned to you" },
        },
        { status: 403 }
      );
    }

    const updated = await prisma.pickingTask.update({
      where: { id: params.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        fromLocation: {
          select: {
            id: true,
            name: true,
            barcode: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
            barcode: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            barcode: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        task: updated,
      },
    });
  } catch (error) {
    console.error("Error starting task:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ACTION_FAILED",
          message: "Failed to start task",
        },
      },
      { status: 500 }
    );
  }
}
