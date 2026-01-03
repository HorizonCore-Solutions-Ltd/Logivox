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

    // Get tenant ID from first organization
    const tenantId = session.user.organizations[0]?.id;
    if (!tenantId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Create or get chatbot instance
    let chatbot = chatbots.get(session.user.id);
    if (!chatbot) {
      chatbot = new Chatbot();
      chatbots.set(session.user.id, chatbot);
    }

    // Start a new session
    const sessionId = await chatbot.startSession(session.user.id, {
      name: session.user.name || "User",
      role: "user",
      preferences: { tenantId },
    });

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("Error starting chat session:", error);
    return NextResponse.json(
      { error: "Failed to start chat session" },
      { status: 500 }
    );
  }
}
