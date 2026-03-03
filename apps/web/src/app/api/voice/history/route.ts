import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/voice/history — list voice command history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50", 10),
      200,
    );
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    const userId = searchParams.get("userId"); // admin filter

    const where: Partial<{ userId: string }> = {};

    // Non-admins can only see their own history
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const isAdmin = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN";

    if (!isAdmin) {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    const [sessions, total] = await Promise.all([
      prisma.voiceSession.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          userId: true,
          transcript: true,
          intent: true,
          response: true,
          entities: true,
          language: true,
          status: true,
          durationMs: true,
          errorMessage: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.voiceSession.count({ where }),
    ]);

    return NextResponse.json({
      history: sessions,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("Voice history error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve voice history" },
      { status: 500 },
    );
  }
}

// DELETE /api/voice/history — clear own history
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await prisma.voiceSession.deleteMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json({
      deleted: deleted.count,
      message: "Voice history cleared.",
    });
  } catch (err) {
    console.error("Voice history delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
