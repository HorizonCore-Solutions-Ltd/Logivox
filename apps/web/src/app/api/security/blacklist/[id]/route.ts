import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  bannedUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
  severity: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL", "PERMANENT"])
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const entry = await prisma.vehicleBlacklist.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const updated = await prisma.vehicleBlacklist.update({
      where: { id: params.id },
      data: {
        isActive: data.isActive,
        bannedUntil: data.bannedUntil ? new Date(data.bannedUntil) : undefined,
        notes: data.notes,
        severity: data.severity,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error updating blacklist entry:", error);
    return NextResponse.json(
      { error: "Failed to update blacklist entry" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entry = await prisma.vehicleBlacklist.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await prisma.vehicleBlacklist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blacklist entry:", error);
    return NextResponse.json(
      { error: "Failed to delete blacklist entry" },
      { status: 500 },
    );
  }
}
