/**
 * LogiVox Voice Engine
 * Complete voice-directed warehouse operations with OpenAI Whisper & GPT-4
 * Zero-training adaptive learning system
 */

import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==========================================
// VOICE PROCESSING ENGINE
// ==========================================

export interface VoiceInput {
  audioData: Buffer | Blob;
  userId: string;
  sessionId?: string;
  context?: {
    taskType?: string;
    orderId?: string;
    location?: string;
    metadata?: Record<string, any>;
  };
}

export interface VoiceResponse {
  success: boolean;
  recognizedText: string;
  intent: string;
  confidence: number;
  responseText: string;
  responseAudio?: string;
  action?: {
    type: string;
    data: Record<string, any>;
  };
  error?: string;
}

/**
 * Main voice processing function
 * Handles speech-to-text, NLU, and response generation
 */
export async function processVoiceCommand(
  input: VoiceInput,
): Promise<VoiceResponse> {
  const startTime = Date.now();

  try {
    // 1. Get or create voice profile
    const voiceProfile = await getOrCreateVoiceProfile(input.userId);

    // 2. Transcribe audio using Whisper
    const transcription = await transcribeAudio(
      input.audioData,
      voiceProfile.language,
    );

    if (!transcription.text) {
      return {
        success: false,
        recognizedText: "",
        intent: "UNKNOWN",
        confidence: 0,
        responseText: "Sorry, I couldn't hear that clearly. Please try again.",
        error: "Transcription failed",
      };
    }

    // 3. Understand intent using GPT-4
    const nluResult = await understandIntent(
      transcription.text,
      input.context,
      voiceProfile,
    );

    // 4. Execute action based on intent
    const actionResult = await executeAction(nluResult, input);

    // 5. Generate response
    const responseText = await generateResponse(
      nluResult,
      actionResult,
      voiceProfile,
    );

    // 6. Store command in database
    const processingTime = Date.now() - startTime;
    await storeVoiceCommand({
      voiceProfileId: voiceProfile.id,
      sessionId: input.sessionId,
      spokenText: transcription.text,
      recognizedText: transcription.text,
      intent: nluResult.intent,
      confidence: nluResult.confidence,
      processingTime,
      successful: true,
      commandType: "USER_INITIATED",
      metadata: input.context,
      responseText,
      organizationId: voiceProfile.organizationId,
    });

    // 7. Update voice profile (adaptive learning)
    await updateVoiceProfile(voiceProfile.id, transcription, true);

    return {
      success: true,
      recognizedText: transcription.text,
      intent: nluResult.intent,
      confidence: nluResult.confidence,
      responseText,
      action: actionResult,
    };
  } catch (error) {
    console.error("Voice processing error:", error);

    return {
      success: false,
      recognizedText: "",
      intent: "ERROR",
      confidence: 0,
      responseText:
        "I encountered an error. Please try again or request assistance.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Transcribe audio using OpenAI Whisper
 */
async function transcribeAudio(
  audioData: Buffer | Blob,
  language: string = "en",
): Promise<{ text: string; language: string; confidence: number }> {
  try {
    // Convert Buffer to File if needed
    const audioFile =
      audioData instanceof Buffer
        ? new File([audioData], "audio.wav", { type: "audio/wav" })
        : (audioData as File);

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: language.split("-")[0], // e.g., 'en' from 'en-US'
      response_format: "verbose_json",
    });

    return {
      text: transcription.text || "",
      language: (transcription as any).language || language,
      confidence: 1.0, // Whisper doesn't provide confidence, assume high
    };
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Audio transcription failed");
  }
}

/**
 * Understand user intent using GPT-4
 */
interface NLUResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  reasoning: string;
}

async function understandIntent(
  text: string,
  context: VoiceInput["context"] = {},
  voiceProfile: any,
): Promise<NLUResult> {
  const systemPrompt = `You are a warehouse voice assistant AI. Analyze the user's speech and determine their intent.

Current context:
- Task type: ${context.taskType || "unknown"}
- Location: ${context.location || "unknown"}
- Additional context: ${JSON.stringify(context.metadata || {})}

Possible intents:
- PICK_ITEM: User wants to pick an item
- CONFIRM: User confirming an action (yes, correct, confirmed, etc.)
- CANCEL: User wants to cancel or go back (no, cancel, back, etc.)
- REQUEST_HELP: User needs assistance
- ASSIGN_CONTAINER: User assigning/using a container number (T####)
- REPORT_QUANTITY: User reporting picked quantity
- REPORT_LOCATION: User reporting current location
- REPORT_PROBLEM: User reporting an issue (damage, shortage, etc.)
- REQUEST_REPEAT: User wants instruction repeated
- REQUEST_SKIP: User wants to skip current task
- COMPLETE_TASK: User finished a task
- UNKNOWN: Cannot determine intent

Extract entities like:
- sku: Product SKU mentioned
- quantity: Numbers mentioned
- container: Container numbers (T#### format)
- location: Location codes
- confirmation: Yes/no responses

Respond in JSON format:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "entities": {"entity_name": "value"},
  "reasoning": "Brief explanation"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.3, // Lower temperature for more consistent intent classification
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return {
      intent: result.intent || "UNKNOWN",
      confidence: result.confidence || 0.5,
      entities: result.entities || {},
      reasoning: result.reasoning || "",
    };
  } catch (error) {
    console.error("Intent understanding error:", error);

    // Fallback: Simple keyword matching
    return simpleIntentMatch(text);
  }
}

/**
 * Fallback: Simple keyword-based intent matching
 */
function simpleIntentMatch(text: string): NLUResult {
  const lowerText = text.toLowerCase();

  // Confirmation
  if (/\b(yes|yeah|yep|correct|confirmed|okay|ok|sure)\b/i.test(lowerText)) {
    return {
      intent: "CONFIRM",
      confidence: 0.8,
      entities: { confirmation: true },
      reasoning: "Keyword match for confirmation",
    };
  }

  // Cancellation
  if (/\b(no|nope|cancel|back|stop|negative)\b/i.test(lowerText)) {
    return {
      intent: "CANCEL",
      confidence: 0.8,
      entities: { confirmation: false },
      reasoning: "Keyword match for cancellation",
    };
  }

  // Help request
  if (/\b(help|assist|stuck|problem|issue)\b/i.test(lowerText)) {
    return {
      intent: "REQUEST_HELP",
      confidence: 0.9,
      entities: {},
      reasoning: "Keyword match for help request",
    };
  }

  // Container number (T#### format)
  const containerMatch = lowerText.match(/\b[t]\s?(\d{3,4})\b/i);
  if (containerMatch) {
    return {
      intent: "ASSIGN_CONTAINER",
      confidence: 0.95,
      entities: { container: `T${containerMatch[1]}` },
      reasoning: "Container number detected",
    };
  }

  // Quantity reporting (numbers)
  const quantityMatch = lowerText.match(/\b(\d+)\b/);
  if (quantityMatch) {
    return {
      intent: "REPORT_QUANTITY",
      confidence: 0.7,
      entities: { quantity: parseInt(quantityMatch[1]) },
      reasoning: "Number detected",
    };
  }

  // Complete task
  if (/\b(done|complete|finished|all set)\b/i.test(lowerText)) {
    return {
      intent: "COMPLETE_TASK",
      confidence: 0.85,
      entities: {},
      reasoning: "Completion keywords detected",
    };
  }

  return {
    intent: "UNKNOWN",
    confidence: 0.3,
    entities: {},
    reasoning: "No clear intent detected",
  };
}

/**
 * Execute action based on intent
 */
async function executeAction(
  nluResult: NLUResult,
  input: VoiceInput,
): Promise<{ type: string; data: Record<string, any> } | undefined> {
  const { intent, entities } = nluResult;

  try {
    switch (intent) {
      case "ASSIGN_CONTAINER":
        if (entities.container) {
          // Create or find container
          const container = await prisma.container.upsert({
            where: { containerNumber: entities.container },
            update: {
              assignedBy: input.userId,
              assignedAt: new Date(),
              assignmentMethod: "VOICE",
              status: "IN_PROGRESS",
            },
            create: {
              containerNumber: entities.container,
              containerType: "PALLET",
              assignedBy: input.userId,
              assignedAt: new Date(),
              assignmentMethod: "VOICE",
              status: "IN_PROGRESS",
              organizationId: input.context?.metadata?.organizationId || "",
              warehouseId: input.context?.metadata?.warehouseId,
            },
          });

          return {
            type: "CONTAINER_ASSIGNED",
            data: {
              containerId: container.id,
              containerNumber: container.containerNumber,
            },
          };
        }
        break;

      case "PICK_ITEM":
        // Handle item picking logic
        return {
          type: "ITEM_PICKED",
          data: entities,
        };

      case "REQUEST_HELP":
        // Create collaboration request
        await prisma.collaborationRequest.create({
          data: {
            requestType: "PEER_HELP",
            priority: 7,
            status: "PENDING",
            requesterId: input.userId,
            requestReason: "Voice assistance requested",
            taskDescription: "User requested help via voice",
            taskLocation: input.context?.location,
            warehouseId: input.context?.metadata?.warehouseId,
            organizationId: input.context?.metadata?.organizationId || "",
          },
        });

        return {
          type: "HELP_REQUESTED",
          data: { status: "pending" },
        };

      case "COMPLETE_TASK":
        return {
          type: "TASK_COMPLETED",
          data: { completedAt: new Date().toISOString() },
        };

      default:
        return undefined;
    }
  } catch (error) {
    console.error("Action execution error:", error);
    return undefined;
  }
}

/**
 * Generate natural language response
 */
async function generateResponse(
  nluResult: NLUResult,
  actionResult: any,
  voiceProfile: any,
): Promise<string> {
  const { intent, entities } = nluResult;

  // Default responses based on intent
  const responses: Record<string, string> = {
    ASSIGN_CONTAINER: `Container ${entities.container} assigned. Start picking.`,
    PICK_ITEM: `Item confirmed. Continue to next pick.`,
    CONFIRM: `Confirmed. Proceeding.`,
    CANCEL: `Cancelled. Returning to previous step.`,
    REQUEST_HELP: `Help request sent. A team member will assist you shortly.`,
    REPORT_QUANTITY: `${entities.quantity} units recorded.`,
    COMPLETE_TASK: `Great job! Task completed.`,
    UNKNOWN: `I didn't understand that. Please try again or say "help" for assistance.`,
  };

  // Get base response
  let response = responses[intent] || responses["UNKNOWN"];

  // Add action result info if available
  if (actionResult) {
    switch (actionResult.type) {
      case "CONTAINER_ASSIGNED":
        response = `Container ${actionResult.data.containerNumber} is ready. What would you like to pick?`;
        break;
      case "HELP_REQUESTED":
        response = `Help is on the way. A supervisor has been notified and will assist you soon.`;
        break;
    }
  }

  return response;
}

/**
 * Get or create voice profile for user
 */
async function getOrCreateVoiceProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organizationMemberships: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const organizationId = user.organizationMemberships[0]?.organizationId;

  if (!organizationId) {
    throw new Error("User has no organization");
  }

  let voiceProfile = await prisma.voiceProfile.findUnique({
    where: { userId },
  });

  if (!voiceProfile) {
    voiceProfile = await prisma.voiceProfile.create({
      data: {
        userId,
        organizationId,
        language: "en-US",
        confidence: 0.0,
        voiceEnabled: true,
        autoLearn: true,
        feedbackLevel: "NORMAL",
      },
    });
  }

  return voiceProfile;
}

/**
 * Store voice command in database
 */
async function storeVoiceCommand(data: {
  voiceProfileId: string;
  sessionId?: string;
  spokenText: string;
  recognizedText: string;
  intent: string;
  confidence: number;
  processingTime: number;
  successful: boolean;
  commandType: string;
  metadata?: Record<string, any>;
  responseText: string;
  organizationId: string;
}) {
  return prisma.voiceCommand.create({
    data: {
      ...data,
      language: "en-US", // TODO: Get from voice profile
      metadata: data.metadata || {},
    },
  });
}

/**
 * Update voice profile with adaptive learning
 */
async function updateVoiceProfile(
  profileId: string,
  transcription: { text: string; confidence: number },
  successful: boolean,
) {
  const profile = await prisma.voiceProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) return;

  const totalCommands = profile.totalCommands + 1;
  const successfulCmds = successful
    ? profile.successfulCmds + 1
    : profile.successfulCmds;
  const accuracy = successfulCmds / totalCommands;

  await prisma.voiceProfile.update({
    where: { id: profileId },
    data: {
      totalCommands,
      successfulCmds,
      accuracy,
      confidence: Math.min(1.0, profile.confidence + 0.01), // Gradually increase confidence
      lastTrainedAt: new Date(),
    },
  });
}

// ==========================================
// VOICE SESSION MANAGEMENT
// ==========================================

export async function startVoiceSession(
  userId: string,
  sessionType: string,
  warehouseId?: string,
  taskType?: string,
) {
  const voiceProfile = await getOrCreateVoiceProfile(userId);

  const session = await prisma.voiceSession.create({
    data: {
      voiceProfileId: voiceProfile.id,
      sessionType,
      status: "ACTIVE",
      warehouseId,
      taskType,
      organizationId: voiceProfile.organizationId,
    },
  });

  return session;
}

export async function endVoiceSession(sessionId: string) {
  const session = await prisma.voiceSession.findUnique({
    where: { id: sessionId },
    include: { commands: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const duration = Math.floor(
    (Date.now() - session.startedAt.getTime()) / 1000,
  );
  const commandCount = session.commands.length;
  const errorCount = session.commands.filter(
    (cmd: any) => !cmd.successful,
  ).length;
  const accuracy =
    commandCount > 0 ? (commandCount - errorCount) / commandCount : 0;

  return prisma.voiceSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      endedAt: new Date(),
      duration,
      commandCount,
      errorCount,
      accuracy,
    },
  });
}

// ==========================================
// TEXT-TO-SPEECH (OPTIONAL)
// ==========================================

export async function synthesizeSpeech(
  text: string,
  voice: string = "alloy",
): Promise<Buffer> {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as any,
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error("Speech synthesis error:", error);
    throw new Error("Text-to-speech conversion failed");
  }
}
