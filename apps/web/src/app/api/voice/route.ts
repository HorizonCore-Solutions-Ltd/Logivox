import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  processVoiceCommand,
  startVoiceSession,
  endVoiceSession,
  getVoiceSession,
} from "@/lib/voice/voiceEngine";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    let audioBuffer: Buffer | undefined;
    let textCommand: string | undefined;
    let sessionId: string | undefined;
    let context: Record<string, unknown> = {};

    // 1. Handle Audio Upload (Multipart)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      sessionId = (formData.get("sessionId") as string) || undefined;
      const contextStr = formData.get("context") as string;

      if (contextStr) {
        try {
          context = JSON.parse(contextStr);
        } catch {
          // ignore invalid context
        }
      }

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
      }
    }
    // 2. Handle Text Command (JSON)
    else if (contentType.includes("application/json")) {
      const body = await req.json();
      textCommand = body.text;
      sessionId = body.sessionId;
      context = body.context || {};
    } else {
      return NextResponse.json(
        { error: "Unsupported Content-Type" },
        { status: 415 },
      );
    }

    if (!audioBuffer && !textCommand) {
      return NextResponse.json(
        { error: "No voice or text input provided" },
        { status: 400 },
      );
    }

    // Process the command
    const result = await processVoiceCommand({
      audioData: audioBuffer,
      text: textCommand,
      userId: session.user.id,
      sessionId,
      context,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Voice API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
