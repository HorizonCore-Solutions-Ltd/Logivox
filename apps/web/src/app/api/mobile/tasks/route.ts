import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Mobile API - Tasks
 * Get assigned tasks for mobile users
 */

// GET /api/mobile/tasks - Get tasks assigned to user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const taskType = searchParams.get("taskType");

    const where: any = {
      organizationId: session.user.organizationId,
      assignedToId: session.user.id,
    };

    if (status) where.status = status;
    if (taskType) where.taskType = taskType;

    const tasks = await prisma.pickingTask.findMany({
      where,
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
            zone: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
            barcode: true,
            zone: true,
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
      orderBy: [{ priority: "desc" }, { scheduledFor: "asc" }],
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        count: tasks.length,
      },
    });
  } catch (error) {
    console.error("Error fetching mobile tasks:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: "Failed to fetch tasks",
        },
      },
      { status: 500 },
    );
  }
}
