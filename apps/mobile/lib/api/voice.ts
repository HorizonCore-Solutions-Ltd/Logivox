import { apiClient } from "./client";

// POST /api/voice/transcribe — send audio blob to OpenAI Whisper
export async function transcribeAudio(
  audioBase64: string,
  mimeType = "audio/m4a",
): Promise<{ transcript: string; confidence: number }> {
  const { data } = await apiClient.post("/api/voice/transcribe", {
    audioBase64,
    mimeType,
  });
  return data;
}

export interface VoiceCommandResult {
  command: string;
  intent: string;
  entities: Record<string, string | number>;
  action?: {
    type: string;
    payload: Record<string, unknown>;
  };
  response: string;
}

// POST /api/voice/command — NLP parsing of transcript into structured command
export async function processVoiceCommand(
  transcript: string,
  context?: {
    screen?: string;
    warehouseId?: string;
    currentItemId?: string;
  },
): Promise<VoiceCommandResult> {
  const { data } = await apiClient.post<VoiceCommandResult>(
    "/api/voice/command",
    { transcript, context },
  );
  return data;
}
