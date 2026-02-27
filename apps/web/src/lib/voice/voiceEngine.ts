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

export type VoiceIntent =
  | "PICK"
  | "CONFIRM"
  | "SCAN"
  | "MOVE"
  | "RECEIVE"
  | "CYCLE_COUNT"
  | "STATUS"
  | "HELP"
  | "ERROR"
  | "UNKNOWN"
  | "NOT_CONFIGURED";

export interface VoiceCommandResult {
  success: boolean;
  recognizedText: string;
  intent: VoiceIntent;
  confidence: number;
  params: Record<string, string | number>;
  responseText: string;
  sessionId?: string;
}

export interface VoiceSession {
  id: string;
  userId: string;
  sessionType: string;
  warehouseId?: string;
  taskType?: string;
  status: "ACTIVE" | "PAUSED" | "ENDED";
  startedAt: Date;
  endedAt?: Date;
  commandCount: number;
}

// In-memory session store (no DB model available for voice sessions)
const activeSessions = new Map<string, VoiceSession>();

function generateSessionId(): string {
  return `vs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

  // Status
  if (/\b(status|progress|how many|what is)\b/.test(lower)) {
    return { intent: "STATUS", params: {}, confidence: 0.75 };
  }

  // Help
  if (/\b(help|what can|commands|options)\b/.test(lower)) {
    return { intent: "HELP", params: {}, confidence: 0.95 };
  }

  return { intent: "UNKNOWN", params: {}, confidence: 0.3 };
}

function buildResponseText(
  intent: VoiceIntent,
  params: Record<string, string | number>,
): string {
  switch (intent) {
    case "PICK":
      return `Acknowledged. Pick ${params.quantity ?? 1} of ${params.sku}.`;
    case "CONFIRM":
      return "Confirmed. Moving to next task.";
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
    case "HELP":
      return "Available commands: pick, confirm, scan, move to, receive, cycle count, status.";
    case "NOT_CONFIGURED":
      return "Voice processing is not configured. Set OPENAI_API_KEY to enable server-side speech recognition.";
    default:
      return "Sorry, I did not understand that command. Please try again.";
  }
}

/**
 * Main entry point for processing a voice command from audio data.
 */
export async function processVoiceCommand(input: {
  audioData: Buffer;
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

  const transcribedText = await transcribeAudio(input.audioData);

  if (transcribedText === null) {
    // OpenAI not configured — return informative error
    return {
      success: false,
      recognizedText: "",
      intent: "NOT_CONFIGURED",
      confidence: 0,
      params: {},
      responseText: buildResponseText("NOT_CONFIGURED", {}),
      sessionId: input.sessionId,
    };
  }

  const { intent, params, confidence } = parseIntent(transcribedText);
  const responseText = buildResponseText(intent, params);

  return {
    success: true,
    recognizedText: transcribedText,
    intent,
    confidence,
    params,
    responseText,
    sessionId: input.sessionId,
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
  const voiceSession: VoiceSession = {
    id,
    userId,
    sessionType,
    warehouseId,
    taskType,
    status: "ACTIVE",
    startedAt: new Date(),
    commandCount: 0,
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
