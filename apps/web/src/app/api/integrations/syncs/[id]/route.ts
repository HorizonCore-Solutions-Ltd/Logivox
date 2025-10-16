import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/integrations/syncs/[id] - Get sync details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sync = await prisma.integrationSync.findUnique({
      where: { id: params.id },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            provider: true,
            category: true,
            config: true,
          },
        },
        triggeredByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            user: {
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

    if (!sync) {
      return NextResponse.json(
        { error: "Sync not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(sync);
  } catch (error) {
    console.error("Error fetching sync:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync" },
      { status: 500 }
    );
  }
}

// PATCH /api/integrations/syncs/[id] - Update sync status
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
    const { action } = body;

    if (!action || !["cancel", "retry", "complete"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'cancel', 'retry', or 'complete'" },
        { status: 400 }
      );
    }

    const sync = await prisma.integrationSync.findUnique({
      where: { id: params.id },
    });

    if (!sync) {
      return NextResponse.json(
        { error: "Sync not found" },
        { status: 404 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case "cancel":
        if (!["PENDING", "RUNNING"].includes(sync.status)) {
          return NextResponse.json(
            { error: "Can only cancel pending or running syncs" },
            { status: 400 }
          );
        }
        updateData = {
          status: "CANCELLED",
          completedAt: new Date(),
        };
        break;

      case "retry":
        if (sync.status !== "FAILED") {
          return NextResponse.json(
            { error: "Can only retry failed syncs" },
            { status: 400 }
          );
        }
        updateData = {
          status: "RUNNING",
          retryCount: sync.retryCount + 1,
          lastRetryAt: new Date(),
          startedAt: new Date(),
          completedAt: null,
        };
        break;

      case "complete":
        if (sync.status !== "RUNNING") {
          return NextResponse.json(
            { error: "Can only complete running syncs" },
            { status: 400 }
          );
        }
        updateData = {
          status: "COMPLETED",
          completedAt: new Date(),
          progress: 100,
          duration: sync.startedAt
            ? Math.floor((new Date().getTime() - sync.startedAt.getTime()) / 1000)
            : null,
        };
        break;
    }

    const updatedSync = await prisma.integrationSync.update({
      where: { id: params.id },
      data: updateData,
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
        triggeredByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create log entry
    await prisma.integrationLog.create({
      data: {
        organizationId: sync.organizationId,
        integrationId: sync.integrationId,
        syncId: sync.id,
        level: "INFO",
        action: `SYNC_${action.toUpperCase()}`,
        message: `Sync ${action}ed by user`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(updatedSync);
  } catch (error) {
    console.error("Error updating sync:", error);
    return NextResponse.json(
      { error: "Failed to update sync" },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/syncs/[id] - Delete sync
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sync = await prisma.integrationSync.findUnique({
      where: { id: params.id },
    });

    if (!sync) {
      return NextResponse.json(
        { error: "Sync not found" },
        { status: 404 }
      );
    }

    if (["PENDING", "RUNNING"].includes(sync.status)) {
      return NextResponse.json(
        { error: "Cannot delete pending or running syncs. Cancel them first." },
        { status: 400 }
      );
    }

    await prisma.integrationSync.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Sync deleted successfully" });
  } catch (error) {
    console.error("Error deleting sync:", error);
    return NextResponse.json(
      { error: "Failed to delete sync" },
      { status: 500 }
    );
  }
}
