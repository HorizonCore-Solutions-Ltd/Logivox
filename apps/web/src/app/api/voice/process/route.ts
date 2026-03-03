/**
 * Voice API Endpoint
 * POST /api/voice/process
 * Process voice commands for warehouse operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  processVoiceCommand,
  processTextCommand,
} from "@/lib/voice/voiceEngine";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";

    // ── Text-command fallback (no audio needed) ─────────────────────────────
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const text: string = body.text ?? "";
      if (!text.trim()) {
        return NextResponse.json(
          { error: "No text provided" },
          { status: 400 },
        );
      }
      const result = await processTextCommand({
        text,
        userId: session.user.id,
        sessionId: body.sessionId,
        context: body.context,
      });
      return NextResponse.json(result);
    }

    // ── Audio path ──────────────────────────────────────────────────────────
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const context = formData.get("context");
    const sessionId = formData.get("sessionId") as string | undefined;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioData = Buffer.from(arrayBuffer);

    // Parse context if provided
    let parsedContext;
    if (context && typeof context === "string") {
      try {
        parsedContext = JSON.parse(context);
      } catch (e) {
        console.error("Failed to parse context:", e);
      }
    }

    // Process voice command
    const result = await processVoiceCommand({
      audioData,
      userId: session.user.id,
      sessionId,
      context: parsedContext,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Voice API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        recognizedText: "",
        intent: "ERROR",
        confidence: 0,
        responseText: "An error occurred processing your command.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Voice API is active. Use POST to send audio.",
    version: "1.0.0",
    capabilities: [
      "speech-to-text (Whisper)",
      "natural language understanding (GPT-4)",
      "adaptive learning",
      "multi-language support",
      "container assignment",
      "collaboration requests",
      "task completion tracking",
    ],
  });
}
