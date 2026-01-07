export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const resolveSchema = z.object({
  resolution: z.string().min(1, "Resolution is required"),
  resolutionAction: z.string().optional(),
});

// POST /api/notifications/alerts/[id]/resolve - Resolve alert
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alert = await prisma.alert.findUnique({
      where: { id: params.id },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = resolveSchema.parse(body);

    const updated = await prisma.alert.update({
      where: { id: params.id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedById: session.user.id,
        resolution: validated.resolution,
        resolutionAction: validated.resolutionAction,
      },
      include: {
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error resolving alert:", error);
    return NextResponse.json(
      { error: "Failed to resolve alert" },
      { status: 500 },
    );
  }
}
