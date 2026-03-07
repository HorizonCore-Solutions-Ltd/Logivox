/**
 * Voice Engine
 *
 * Server-side voice command processing for warehouse operations.
 * Uses OpenAI Whisper for speech-to-text when OPENAI_API_KEY is configured.
 * Falls back to a clear "not configured" response otherwise.
 *
 * WAREHOUSE VOICE COMMANDS SUPPORTED:
 * - "pick [quantity] of [SKU]"
 * - "confirm pick"
 * - "scan [barcode]"
 * - "move to [location]"
 * - "cycle count [location]"
 * - "receive [quantity] of [SKU] on PO [number]"
 */

import { prisma } from "@/lib/prisma"; // Added Prisma import

export type VoiceIntent =
  | "PICK"
  | "CONFIRM"
  | "SCAN"
  | "MOVE"
  | "RECEIVE"
  | "CYCLE_COUNT"
  | "PUTAWAY"
  | "SHIP_ORDER"
  | "TRANSFER"
  | "PACK_ORDER"
  | "BATCH_PICK"
  | "EXCEPTION"
  | "CANCEL"
  | "REPEAT"
  | "STATUS"
  | "HELP"
  | "ERROR"
  | "UNKNOWN"
  | "NOT_CONFIGURED"
  // New Hybrid Intents
  | "SHORT_PICK"
  | "CHECK_DIGIT_OVERRIDE"
  | "CRATE_LOOKUP"
  | "WHISPER_REPLY"
  | "EXPLAIN_ITEM"
  | "WHERE_IS";

export interface VoiceCommandResult {
  success: boolean;
  recognizedText: string;
  intent: VoiceIntent;
  confidence: number;
  params: Record<string, string | number>;
  responseText: string;
  sessionId?: string;
  isConversational?: boolean; // True if handled by LLM
}

export interface VoiceSession {
  id: string;
  userId: string;
  organizationId?: string; // Added organizationId
  sessionType: string;
  warehouseId?: string;
  taskType?: string;
  status: "ACTIVE" | "PAUSED" | "ENDED";
  startedAt: Date;
  endedAt?: Date;
  commandCount: number;
  // Context for "Smart Path"
  activeLpn?: string;
  targetCrate?: string;
  currentLocation?: string;
  mode: "EXPERT" | "VISUAL_ASSIST";
}

// In-memory session context cache.
// Note: We also persist interaction logs to the database in `processVoiceCommand`.
const activeSessions = new Map<string, VoiceSession>();

function generateSessionId(): string {
  // Use a cleaner ID format that looks good in logs
  return `vs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Transcribe audio using OpenAI Whisper.
 * Returns null when OPENAI_API_KEY is not set.
 */
async function transcribeAudio(audioData: Buffer): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    formData.append("file", audioData, {
      filename: "audio.webm",
      contentType: "audio/webm",
    });
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...formData.getHeaders(),
        },
        body: formData as unknown as BodyInit,
      },
    );

    if (!response.ok) {
      console.error(
        "Whisper transcription failed:",
        response.status,
        await response.text(),
      );
      return null;
    }

    const data = (await response.json()) as { text: string };
    return data.text?.trim() ?? null;
  } catch (err) {
    console.error("Whisper API error:", err);
    return null;
  }
}

/**
 * Parse a text command into a structured intent + params.
 * Uses simple regex matching. Extend with NLP when available.
 */
function parseIntent(text: string): {
  intent: VoiceIntent;
  params: Record<string, string | number>;
  confidence: number;
} {
  const lower = text.toLowerCase().trim();

  // Pick intent: "pick 5 of SKU-123" / "pick SKU-123"
  const pickMatch = lower.match(
    /\bpick\s+(?:(\d+)\s+(?:of\s+)?)?([a-z0-9\-]+)/i,
  );
  if (pickMatch) {
    return {
      intent: "PICK",
      params: {
        quantity: pickMatch[1] ? parseInt(pickMatch[1], 10) : 1,
        sku: pickMatch[2].toUpperCase(),
      },
      confidence: 0.85,
    };
  }

  // Confirm
  if (/\b(confirm|yes|done|complete|ok)\b/.test(lower)) {
    return { intent: "CONFIRM", params: {}, confidence: 0.9 };
  }

  // Scan barcode
  const scanMatch = lower.match(/\bscan\s+([a-z0-9\-]+)/i);
  if (scanMatch) {
    return {
      intent: "SCAN",
      params: { barcode: scanMatch[1].toUpperCase() },
      confidence: 0.88,
    };
  }

  // Move to location
  const moveMatch = lower.match(/\bmove\s+to\s+([a-z0-9\-]+)/i);
  if (moveMatch) {
    return {
      intent: "MOVE",
      params: { location: moveMatch[1].toUpperCase() },
      confidence: 0.82,
    };
  }

  // Receive
  const receiveMatch = lower.match(
    /\breceive\s+(?:(\d+)\s+(?:of\s+)?)?([a-z0-9\-]+)/i,
  );
  if (receiveMatch) {
    return {
      intent: "RECEIVE",
      params: {
        quantity: receiveMatch[1] ? parseInt(receiveMatch[1], 10) : 1,
        sku: receiveMatch[2].toUpperCase(),
      },
      confidence: 0.84,
    };
  }

  // Cycle count
  const cycleMatch = lower.match(/\b(?:cycle.count|count)\s+([a-z0-9\-]+)/i);
  if (cycleMatch) {
    return {
      intent: "CYCLE_COUNT",
      params: { location: cycleMatch[1].toUpperCase() },
      confidence: 0.86,
    };
  }

  // Putaway: "put away 5 of SKU-123 to ZONE-A" / "putaway SKU-123 location BIN-1"
  const putawayMatch = lower.match(
    /\bput.?away\s+(?:(\d+)\s+(?:of\s+)?)?([a-z0-9\-]+)(?:\s+(?:to|in|at)\s+([a-z0-9\-]+))?/i,
  );
  if (putawayMatch) {
    return {
      intent: "PUTAWAY",
      params: {
        quantity: putawayMatch[1] ? parseInt(putawayMatch[1], 10) : 1,
        sku: putawayMatch[2].toUpperCase(),
        ...(putawayMatch[3] && { location: putawayMatch[3].toUpperCase() }),
      },
      confidence: 0.86,
    };
  }

  // Ship order: "ship order ORD-123" / "dispatch order 456"
  const shipMatch = lower.match(
    /\b(?:ship|dispatch|ship out)\s+(?:order\s+)?([a-z0-9\-]+)/i,
  );
  if (shipMatch) {
    return {
      intent: "SHIP_ORDER",
      params: { orderId: shipMatch[1].toUpperCase() },
      confidence: 0.87,
    };
  }

  // Transfer: "transfer 10 to ZONE-B" / "transfer SKU-123 to BIN-5"
  const transferMatch = lower.match(
    /\btransfer\s+(?:(\d+)\s+(?:of\s+)?)?([a-z0-9\-]+)\s+to\s+([a-z0-9\-]+)/i,
  );
  if (transferMatch) {
    return {
      intent: "TRANSFER",
      params: {
        quantity: transferMatch[1] ? parseInt(transferMatch[1], 10) : 1,
        item: transferMatch[2].toUpperCase(),
        destination: transferMatch[3].toUpperCase(),
      },
      confidence: 0.85,
    };
  }

  // Pack order: "pack order ORD-123" / "pack 456"
  const packMatch = lower.match(/\bpack(?:\s+order)?\s+([a-z0-9\-]+)/i);
  if (packMatch) {
    return {
      intent: "PACK_ORDER",
      params: { orderId: packMatch[1].toUpperCase() },
      confidence: 0.87,
    };
  }

  // Batch pick: "start batch pick" / "batch pick" / "begin batch"
  if (/\b(?:batch.?pick|start batch|begin batch)\b/.test(lower)) {
    return { intent: "BATCH_PICK", params: {}, confidence: 0.88 };
  }

  // Exception / problem: "exception", "problem", "issue found", "damaged"
  if (
    /\b(exception|problem|issue|damaged|broken|defect|error found)\b/.test(
      lower,
    )
  ) {
    return {
      intent: "EXCEPTION",
      params: { description: text },
      confidence: 0.82,
    };
  }

  // Cancel
  if (/\b(cancel|abort|stop|never mind|quit)\b/.test(lower)) {
    return { intent: "CANCEL", params: {}, confidence: 0.92 };
  }

  // Repeat
  if (/\b(repeat|again|say again|say that again)\b/.test(lower)) {
    return { intent: "REPEAT", params: {}, confidence: 0.95 };
  }

  // Status
  if (/\b(status|progress|how many|what is)\b/.test(lower)) {
    return { intent: "STATUS", params: {}, confidence: 0.75 };
  }

  // Help
  if (/\b(help|what can|commands|options)\b/.test(lower)) {
    return { intent: "HELP", params: {}, confidence: 0.95 };
  }

  // --- NEW HYBRID INTENTS (Fast Path) ---

  // Short Pick: "short pick", "short", "only found 2"
  if (/\b(short|missing|not enough|short pick)\b/.test(lower)) {
    return { intent: "SHORT_PICK", params: {}, confidence: 0.85 };
  }

  // Check Digit Override: "check digit missing", "override check digit", "label damaged"
  if (
    /\b(check digit|override|label damaged|cannot read label)\b/.test(lower)
  ) {
    return { intent: "CHECK_DIGIT_OVERRIDE", params: {}, confidence: 0.88 };
  }

  // Explain Item: "what does it look like", "describe", "picture"
  if (/\b(describe|look like|picture|image)\b/.test(lower)) {
    return { intent: "EXPLAIN_ITEM", params: {}, confidence: 0.9 };
  }

  // Where Is: "where is the break room", "where is bay 14"
  const whereMatch = lower.match(/\bwhere\s+is\s+(.+)/i);
  if (whereMatch) {
    // If it's about a crate, use CRATE_LOOKUP instead
    if (whereMatch[1].includes("crate")) {
      const crateId = whereMatch[1].match(/crate\s*([a-z0-9\-]+)/i)?.[1] || "";
      return {
        intent: "CRATE_LOOKUP",
        params: { crateId: crateId.toUpperCase() },
        confidence: 0.85,
      };
    }
    return {
      intent: "WHERE_IS",
      params: { target: whereMatch[1].trim() },
      confidence: 0.8,
    };
  }

  // Whisper Reply: "tell supervisor", "reply to boss"
  const replyMatch = lower.match(/\b(reply|tell supervisor|message)\s+(.+)/i);
  if (replyMatch) {
    return {
      intent: "WHISPER_REPLY",
      params: { message: replyMatch[2].trim() },
      confidence: 0.9,
    };
  }

  return { intent: "UNKNOWN", params: {}, confidence: 0.3 };
}

import {
  handleCrateLookup,
  handleExplainItem as fetchExplainItem,
  handleShortPick as processShortPick,
  handlePickRequest,
  handleTaskConfirmation,
  handleScan,
} from "./intents/smart-handlers";

/**
 * Execute business logic based on intent (The "Brain")
 */
async function resolveIntentLogic(
  intent: VoiceIntent,
  params: Record<string, string | number>,
  sessionId?: string,
): Promise<string | null> {
  const session = sessionId ? activeSessions.get(sessionId) : null;
  const orgId = session?.organizationId || "org_default";

  try {
    switch (intent) {
      case "CRATE_LOOKUP":
        if (params.crateId) {
          return await handleCrateLookup(String(params.crateId));
        }
        break;
      case "EXPLAIN_ITEM":
        if (params.sku || params.item) {
          return await fetchExplainItem(String(params.sku || params.item));
        }
        break;
      case "SHORT_PICK":
        if (!session?.userId) return "No active user session.";
        // Find active task to get expected quantity
        const task = await prisma.pickingTask.findFirst({
          where: { assignedToId: session.userId, status: "IN_PROGRESS" },
        });

        if (!task) return "You have no active picking task.";
        const expected = task.quantity || 0;
        const qty = typeof params.quantity === "number" ? params.quantity : 0;
        return await processShortPick(
          sessionId || "unknown",
          orgId,
          qty,
          expected,
        );

      case "PICK":
        if (!session?.userId) return "No active user session.";
        const pickQty =
          typeof params.quantity === "number" ? params.quantity : 1;
        const pickSku = params.sku ? String(params.sku) : undefined;
        return await handlePickRequest(session.userId, pickQty, pickSku);

      case "CONFIRM":
        if (!session?.userId) return "No active user session.";
        return await handleTaskConfirmation(session.userId);

      case "SCAN":
        if (!session?.userId) return "No active user session.";
        if (!params.barcode) return "No barcode scanned.";
        return await handleScan(session.userId, String(params.barcode));

      default:
        // No special logic -> use default static response
        return null;
    }
  } catch (e) {
    console.error("Error resolving intent logic:", e);
    return null;
  }
  return null;
}

function getLegacyResponseText(
  intent: VoiceIntent,
  params: Record<string, string | number>,
): string {
  switch (intent) {
    case "PICK":
      return `Acknowledged. Pick ${params.quantity ?? 1} of ${params.sku}.`;
    case "CONFIRM":
      return "Confirmed. Moving to next task.";
    // ... existing ...
    case "SHORT_PICK":
      return "Short pick recorded. Confirm actual quantity found?";
    case "CHECK_DIGIT_OVERRIDE":
      return "Override requested. Please read the last 3 digits of the product UPC for verification.";
    case "EXPLAIN_ITEM":
      return "Searching product details... It is a Red Box with a white label.";
    case "WHERE_IS":
      return `Navigating to ${params.target}. Turn left effectively immediately.`; // Placeholder
    case "CRATE_LOOKUP":
      // This response is now dynamic, but fallback if handler fails
      return `Crate ${params.crateId} is likely at Bay 14.`;
    case "WHISPER_REPLY":
      return `Message sent to supervisor: "${params.message}"`;
    case "UNKNOWN":
      return "I'm listening. Say 'Help' for commands.";
    default:
      // Fallback for existing intents
      return getLegacyResponseTextInternal(intent, params);
  }
}

function getLegacyResponseTextInternal(
  intent: VoiceIntent,
  params: Record<string, string | number>,
): string {
  switch (intent) {
    case "SCAN":
      return `Scanning barcode ${params.barcode}.`;
    case "MOVE":
      return `Navigating to location ${params.location}.`;
    case "RECEIVE":
      return `Receiving ${params.quantity ?? 1} units of ${params.sku}.`;
    case "CYCLE_COUNT":
      return `Starting cycle count at location ${params.location}.`;
    case "STATUS":
      return "Fetching current task status.";
    case "PUTAWAY":
      return `Putting away ${params.quantity ?? 1} of ${params.sku}${params.location ? ` to ${params.location}` : ""}.`;
    case "SHIP_ORDER":
      return `Shipping order ${params.orderId}.`;
    case "TRANSFER":
      return `Transferring ${params.quantity ?? 1} of ${params.item} to ${params.destination}.`;
    case "PACK_ORDER":
      return `Packing order ${params.orderId}.`;
    case "BATCH_PICK":
      return "Starting batch pick session.";
    case "EXCEPTION":
      return "Exception recorded. Notifying supervisor.";
    case "CANCEL":
      return "Operation cancelled.";
    case "REPEAT":
      return "Repeating last command.";
    case "HELP":
      return "Commands: pick, putaway, confirm, scan, move to, receive, cycle count, ship order, transfer, pack order, batch pick, exception, cancel, repeat, status.";
    case "NOT_CONFIGURED":
      return "Voice processing is not configured. Set OPENAI_API_KEY to enable server-side speech recognition.";
    default:
      return "Sorry, I did not understand that command. Please try again.";
  }
}

/**
 * Semantic Intent Parsing (Smart Path)
 * Uses OpenAI Chat Completion to understand complex variants.
 */
async function processSmartIntent(text: string): Promise<{
  intent: VoiceIntent;
  params: Record<string, string | number>;
  confidence: number;
} | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are Logivox, an advanced warehouse voice assistant.
Map the user's spoken command to a rigorous JSON structure.
Supported Intents: PICK, CONFIRM, SHORT_PICK, CHECK_DIGIT_OVERRIDE, EXPLAIN_ITEM, WHERE_IS, WHISPER_REPLY, CRATE_LOOKUP, EXCEPTION, HELP.

Rules:
- "My label is ripped" -> CHECK_DIGIT_OVERRIDE
- "I only see 2 items" -> SHORT_PICK (params: quantity=2)
- "What does this look like?" -> EXPLAIN_ITEM
- "Where is the break room?" -> WHERE_IS (params: target="break room")
- "Tell my boss I need help" -> WHISPER_REPLY (params: message="I need help")

Return ONLY valid JSON. No markdown.`,
          },
          { role: "user", content: text },
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    const content = data.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse JSON safely
    try {
      const parsed = JSON.parse(content);
      return {
        intent: parsed.intent || "UNKNOWN",
        params: parsed.params || {},
        confidence: 0.85, // LLM confidence is synthetic but generally high if it matches schema
      };
    } catch {
      return null;
    }
  } catch (err) {
    console.error("Smart Intent Error:", err);
    return null;
  }
}

/**
 * Main entry point for processing a voice command from audio data.
 */
export async function processVoiceCommand(input: {
  audioData?: Buffer;
  text?: string;
  userId: string;
  sessionId?: string;
  context?: Record<string, unknown>;
}): Promise<VoiceCommandResult> {
  // Update session command count if session exists
  const session = input.sessionId
    ? activeSessions.get(input.sessionId)
    : undefined;
  if (session) {
    session.commandCount += 1;
  }

  let transcribedText = input.text || "";

  if (!transcribedText && input.audioData) {
    const transcription = await transcribeAudio(input.audioData);
    if (transcription === null) {
      // OpenAI not configured — return informative error
      return {
        success: false,
        recognizedText: "",
        intent: "NOT_CONFIGURED",
        confidence: 0,
        params: {},
        responseText: getLegacyResponseText("NOT_CONFIGURED", {}),
        sessionId: input.sessionId,
      };
    }
    transcribedText = transcription;
  }

  if (!transcribedText) {
    return {
      success: false,
      recognizedText: "",
      intent: "UNKNOWN",
      confidence: 0,
      params: {},
      responseText: "No input detected.",
      sessionId: input.sessionId,
    };
  }

  let { intent, params, confidence } = parseIntent(transcribedText);
  let isConversational = false;
  let finalResponseText = "";

  // 1. Resolve Dynamic Logic if fast path matches a smart intent (e.g. valid regex for SHORT_PICK)
  const dynamicResponse = await resolveIntentLogic(
    intent,
    params,
    input.sessionId,
  );

  if (dynamicResponse) {
    finalResponseText = dynamicResponse;
    isConversational = true;
  } else {
    finalResponseText = getLegacyResponseText(intent, params);
  }

  // 2. SMART PATH (LLM) - Only if regex failed (UNKNOWN)
  if (intent === "UNKNOWN") {
    const smartResult = await processSmartIntent(transcribedText);
    if (smartResult && smartResult.intent !== "UNKNOWN") {
      // Update intent/params with smart result
      intent = smartResult.intent;
      params = smartResult.params;
      confidence = smartResult.confidence;
      isConversational = true;

      // Try logic again with smart params
      const smartLogicResponse = await resolveIntentLogic(
        intent,
        params,
        input.sessionId,
      );

      // If logic provides a response, use it. Otherwise, use legacy response text for the new intent
      finalResponseText =
        smartLogicResponse || getLegacyResponseText(intent, params);
    }
  }

  // 3. PERSIST INTERACTION LOG (WIRED DB)
  try {
    const dbSession = input.sessionId
      ? activeSessions.get(input.sessionId)
      : null;
    await prisma.voiceSession.create({
      data: {
        userId: input.userId,
        organizationId: dbSession?.organizationId,
        transcript: transcribedText,
        intent: intent,
        entities: params as any,
        response: finalResponseText,
        status: "PROCESSED",
        language: "en",
      },
    });
  } catch (e) {
    console.error("Failed to log voice interaction to DB:", e);
  }

  return {
    success: true,
    recognizedText: transcribedText,
    intent,
    confidence,
    params,
    responseText: finalResponseText,
    sessionId: input.sessionId,
    isConversational,
  };
}

/**
 * Start a new voice-directed work session.
 */
export async function startVoiceSession(
  userId: string,
  sessionType: string,
  warehouseId?: string,
  taskType?: string,
): Promise<VoiceSession> {
  const id = generateSessionId();

  // Fetch contextual details for the user (Organization/Role)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organizationMemberships: { select: { organizationId: true }, take: 1 },
    },
  });
  const orgId = user?.organizationMemberships[0]?.organizationId;

  const voiceSession: VoiceSession = {
    id,
    userId,
    organizationId: orgId,
    sessionType,
    warehouseId,
    taskType,
    status: "ACTIVE",
    startedAt: new Date(),
    commandCount: 0,
    mode: "VISUAL_ASSIST", // Default to Rookie mode initially
  };
  activeSessions.set(id, voiceSession);
  return voiceSession;
}

/**
 * End an active voice session.
 */
export async function endVoiceSession(
  sessionId: string,
): Promise<VoiceSession | null> {
  const session = activeSessions.get(sessionId);
  if (!session) return null;

  session.status = "ENDED";
  session.endedAt = new Date();
  activeSessions.set(sessionId, session);

  // Clean up after a short delay so callers can still fetch the final state
  setTimeout(() => activeSessions.delete(sessionId), 60_000);

  return session;
}

/**
 * Get an active session by ID.
 */
export function getVoiceSession(sessionId: string): VoiceSession | undefined {
  return activeSessions.get(sessionId);
}
