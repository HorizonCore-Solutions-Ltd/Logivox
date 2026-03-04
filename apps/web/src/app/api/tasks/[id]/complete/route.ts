import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    // Optional request body for quantity confirmation or notes
    const body = await req.json().catch(() => ({}));

    const task = await prisma.pickingTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Task already completed" },
        { status: 400 },
      );
    }

    // Complete the task
    // The PickingTask record itself serves as the audit trail for the move
    const updatedTask = await prisma.pickingTask.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedById: session.user.id,
        progress: 100,
      },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error("Error completing task:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete task" },
      { status: 500 },
    );
  }
}
