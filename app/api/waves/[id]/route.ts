import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/waves/[id] - Get wave details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wave = await prisma.wavePick.findUnique({
      where: { id: params.id },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignedTo: {
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
        lines: {
          include: {
            salesOrder: {
              select: {
                id: true,
                soNumber: true,
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            inventoryItem: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
            location: {
              select: {
                id: true,
                name: true,
                zone: true,
                aisle: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
            pickedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { pickSequence: "asc" },
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        routes: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!wave) {
      return NextResponse.json({ error: "Wave not found" }, { status: 404 });
    }

    return NextResponse.json(wave);
  } catch (error) {
    console.error("Error fetching wave:", error);
    return NextResponse.json(
      { error: "Failed to fetch wave" },
      { status: 500 }
    );
  }
}

// PATCH /api/waves/[id] - Update wave
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
        case "release":
          return handleReleaseWave(params.id, session.user.id);
        case "start":
          return handleStartWave(params.id, session.user.id);
        case "complete":
          return handleCompleteWave(params.id, session.user.id);
        case "cancel":
          return handleCancelWave(params.id, session.user.id);
        case "assign":
          return handleAssignWave(params.id, updateData.assignedToId, session.user.id);
        default:
          return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
          );
      }
    }

    // Regular update
    const wave = await prisma.wavePick.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        warehouse: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            lines: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(wave);
  } catch (error) {
    console.error("Error updating wave:", error);
    return NextResponse.json(
      { error: "Failed to update wave" },
      { status: 500 }
    );
  }
}

// DELETE /api/waves/[id] - Delete wave
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if wave can be deleted
    const wave = await prisma.wavePick.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    if (!wave) {
      return NextResponse.json({ error: "Wave not found" }, { status: 404 });
    }

    if (!["PLANNED", "CANCELLED"].includes(wave.status)) {
      return NextResponse.json(
        { error: "Cannot delete wave in current status" },
        { status: 400 }
      );
    }

    await prisma.wavePick.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wave:", error);
    return NextResponse.json(
      { error: "Failed to delete wave" },
      { status: 500 }
    );
  }
}

// Helper: Release wave for picking
async function handleReleaseWave(waveId: string, userId: string) {
  const wave = await prisma.wavePick.findUnique({
    where: { id: waveId },
    select: { status: true },
  });

  if (!wave) {
    return NextResponse.json({ error: "Wave not found" }, { status: 404 });
  }

  if (wave.status !== "PLANNED") {
    return NextResponse.json(
      { error: "Wave can only be released from PLANNED status" },
      { status: 400 }
    );
  }

  const updated = await prisma.wavePick.update({
    where: { id: waveId },
    data: {
      status: "RELEASED",
      releaseTime: new Date(),
    },
    include: {
      warehouse: true,
      lines: true,
    },
  });

  return NextResponse.json(updated);
}

// Helper: Start wave picking
async function handleStartWave(waveId: string, userId: string) {
  const wave = await prisma.wavePick.findUnique({
    where: { id: waveId },
    select: { status: true },
  });

  if (!wave) {
    return NextResponse.json({ error: "Wave not found" }, { status: 404 });
  }

  if (wave.status !== "RELEASED") {
    return NextResponse.json(
      { error: "Wave must be released before starting" },
      { status: 400 }
    );
  }

  const updated = await prisma.wavePick.update({
    where: { id: waveId },
    data: {
      status: "IN_PROGRESS",
      startedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}

// Helper: Complete wave
async function handleCompleteWave(waveId: string, userId: string) {
  const wave = await prisma.wavePick.findUnique({
    where: { id: waveId },
    include: {
      lines: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!wave) {
    return NextResponse.json({ error: "Wave not found" }, { status: 404 });
  }

  // Check if all lines are picked
  const allPicked = wave.lines.every((line) =>
    ["PICKED", "VERIFIED", "CANCELLED"].includes(line.status)
  );

  if (!allPicked) {
    return NextResponse.json(
      { error: "Not all lines have been picked" },
      { status: 400 }
    );
  }

  const completedAt = new Date();
  const duration = wave.startedAt
    ? Math.floor((completedAt.getTime() - wave.startedAt.getTime()) / 60000)
    : null;

  const updated = await prisma.wavePick.update({
    where: { id: waveId },
    data: {
      status: "COMPLETED",
      completedAt,
      duration,
      progress: 100,
    },
  });

  return NextResponse.json(updated);
}

// Helper: Cancel wave
async function handleCancelWave(waveId: string, userId: string) {
  const wave = await prisma.wavePick.findUnique({
    where: { id: waveId },
    select: { status: true },
  });

  if (!wave) {
    return NextResponse.json({ error: "Wave not found" }, { status: 404 });
  }

  if (["COMPLETED", "CANCELLED"].includes(wave.status)) {
    return NextResponse.json(
      { error: "Cannot cancel wave in current status" },
      { status: 400 }
    );
  }

  const updated = await prisma.wavePick.update({
    where: { id: waveId },
    data: {
      status: "CANCELLED",
    },
  });

  return NextResponse.json(updated);
}

// Helper: Assign wave to user
async function handleAssignWave(
  waveId: string,
  assignedToId: string,
  userId: string
) {
  const updated = await prisma.wavePick.update({
    where: { id: waveId },
    data: {
      assignedToId,
      assignedAt: new Date(),
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

  return NextResponse.json(updated);
}
