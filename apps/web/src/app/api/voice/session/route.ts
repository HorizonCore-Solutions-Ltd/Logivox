/**
 * Voice Session API
 * Manage voice-directed work sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  startVoiceSession,
  endVoiceSession,
  getVoiceSession,
} from "@/lib/voice/voiceEngine";

// POST /api/voice/session - Start a new voice session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionType, warehouseId, taskType } = body;

    if (!sessionType) {
      return NextResponse.json(
        { error: "Session type is required" },
        { status: 400 },
      );
    }

    const voiceSession = await startVoiceSession(
      session.user.id,
      sessionType,
      warehouseId,
      taskType,
    );

    return NextResponse.json({
      success: true,
      session: voiceSession,
    });
  } catch (error) {
    console.error("Start session error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start session",
      },
      { status: 500 },
    );
  }
}

// GET /api/voice/session?sessionId=xxx - Get session details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      // In-memory session store — no DB model for voice sessions
      return NextResponse.json({ activeSessions: [] });
    }

    // Get specific session from in-memory store
    const voiceSession = getVoiceSession(sessionId);

    if (!voiceSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session: voiceSession });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve session" },
      { status: 500 },
    );
  }
}

// PATCH /api/voice/session - End a session
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, action } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    if (action === "end") {
      const endedSession = await endVoiceSession(sessionId);

      return NextResponse.json({
        success: true,
        session: endedSession,
      });
    }

    if (action === "pause") {
      const s = getVoiceSession(sessionId);
      if (!s) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 },
        );
      }
      s.status = "PAUSED";
      return NextResponse.json({ success: true, session: s });
    }

    if (action === "resume") {
      const s = getVoiceSession(sessionId);
      if (!s) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 },
        );
      }
      s.status = "ACTIVE";
      return NextResponse.json({ success: true, session: s });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 },
    );
  }
}
