export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Chatbot } from "@/lib/ai/chatbot";

// Store active chatbot instances
const chatbots = new Map<string, Chatbot>();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "SessionId and message required" },
        { status: 400 }
      );
    }

    // Get chatbot instance
    let chatbot = chatbots.get(session.user.id);
    if (!chatbot) {
      return NextResponse.json(
        { error: "No active session found" },
        { status: 404 }
      );
    }

    // Send message and get response
    const response = await chatbot.sendMessage(sessionId, message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
