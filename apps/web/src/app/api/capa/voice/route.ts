/**
 * Voice-Directed CAPA Workflows API
 * Hands-free CAPA creation and interaction via voice commands
 *
 * Features:
 * - Voice-to-text CAPA creation
 * - Voice-guided 5 Whys interviews
 * - Hands-free updates on warehouse floor
 * - Voice confirmation workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const voiceCommandSchema = z.object({
  command: z.enum([
    "CREATE_CAPA",
    "ADD_ACTION",
    "UPDATE_STATUS",
    "INTERVIEW_5WHYS",
    "VERIFY_EFFECTIVENESS",
    "SEARCH_CAPA",
  ]),
  transcript: z.string(),
  capaId: z.string().optional(),
  context: z
    .object({
      location: z.string().optional(),
      equipment: z.string().optional(),
      ncrNumber: z.string().optional(),
    })
    .optional(),
});

/**
 * POST - Process voice commands
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = voiceCommandSchema.parse(body);

    let response;
    switch (validatedData.command) {
      case "CREATE_CAPA":
        response = await handleCreateCAPA(
          session.user.organizationId,
          session.user.id,
          validatedData.transcript,
          validatedData.context,
        );
        break;

      case "ADD_ACTION":
        response = await handleAddAction(
          session.user.organizationId,
          validatedData.capaId!,
          validatedData.transcript,
        );
        break;

      case "UPDATE_STATUS":
        response = await handleUpdateStatus(
          session.user.organizationId,
          validatedData.capaId!,
          validatedData.transcript,
        );
        break;

      case "INTERVIEW_5WHYS":
        response = await handle5WhysInterview(
          session.user.organizationId,
          validatedData.capaId!,
          validatedData.transcript,
        );
        break;

      case "VERIFY_EFFECTIVENESS":
        response = await handleVoiceVerification(
          session.user.organizationId,
          session.user.id,
          validatedData.capaId!,
          validatedData.transcript,
        );
        break;

      case "SEARCH_CAPA":
        response = await handleSearchCAPA(
          session.user.organizationId,
          validatedData.transcript,
        );
        break;

      default:
        return NextResponse.json({ error: "Unknown command" }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error processing voice command:", error);
    return NextResponse.json(
      { error: "Failed to process voice command" },
      { status: 500 },
    );
  }
}

/**
 * Handle CREATE_CAPA voice command
 */
async function handleCreateCAPA(
  organizationId: string,
  userId: string,
  transcript: string,
  context?: any,
) {
  // Parse natural language into structured CAPA data
  const parsed = parseVoiceCAPA(transcript, context);

  // Generate CAPA number
  const lastCAPA = await prisma.correctivePreventiveAction.findFirst({
    where: { organizationId },
    orderBy: { capaNumber: "desc" },
    select: { capaNumber: true },
  });

  const lastNumber = lastCAPA?.capaNumber
    ? parseInt(lastCAPA.capaNumber.replace(/\D/g, ""))
    : 0;
  const capaNumber = `CAPA-V${String(lastNumber + 1).padStart(6, "0")}`;

  // Create CAPA
  const capa = await prisma.correctivePreventiveAction.create({
    data: {
      capaNumber,
      organizationId,
      capaType: "CORRECTIVE",
      actionCategory: "QUALITY",
      sourceType: "VOICE",
      problemStatement: parsed.problemStatement,
      problemSeverity: parsed.severity || "MEDIUM",
      rootCauseMethod: "5_WHYS",
      immediateActions: [],
      correctiveActions: [],
      preventiveActions: [],
      responsiblePerson: userId,
      targetCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      priority: parsed.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
      status: "OPEN",
      createdBy: userId,
      notes: `Voice Created. Transcript: ${transcript}. Location: ${context?.location || "N/A"}. Equipment: ${context?.equipment || "N/A"}`,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      organizationId,
      userId,
      action: "VOICE_CAPA_CREATED",
      entityType: "CAPA",
      entityId: capa.id,
      metadata: {
        capaNumber: capa.capaNumber,
        transcript: transcript.substring(0, 100),
      },
    },
  });

  return {
    success: true,
    capa,
    voiceResponse: `CAPA ${capaNumber} created successfully. Problem statement: ${parsed.problemStatement}. What immediate actions should we take?`,
    nextStep: "ADD_ACTION",
  };
}

/**
 * Handle ADD_ACTION voice command
 */
async function handleAddAction(
  organizationId: string,
  capaId: string,
  transcript: string,
) {
  // Parse action from transcript
  const action = {
    description: transcript,
    assignedTo: "",
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "PENDING",
  };

  // Get current CAPA
  const capa = await prisma.correctivePreventiveAction.findUnique({
    where: { id: capaId, organizationId },
  });

  if (!capa) {
    return { success: false, error: "CAPA not found" };
  }

  // Determine action type from transcript
  const actionType = classifyAction(transcript);
  const capaAny: any = capa;
  const currentActions = (capaAny[actionType] as any[]) || [];

  // Update CAPA
  await prisma.correctivePreventiveAction.update({
    where: { id: capaId },
    data: {
      [actionType]: [...currentActions, action] as any,
    },
  });

  return {
    success: true,
    actionType,
    action,
    voiceResponse: `Action added to ${actionType.replace("Actions", " actions")}. Do you need to add more actions, or shall we proceed with root cause analysis?`,
    nextStep: "INTERVIEW_5WHYS",
  };
}

/**
 * Handle 5 Whys voice interview
 */
async function handle5WhysInterview(
  organizationId: string,
  capaId: string,
  transcript: string,
) {
  const capa = await prisma.correctivePreventiveAction.findUnique({
    where: { id: capaId, organizationId },
  });

  if (!capa) {
    return { success: false, error: "CAPA not found" };
  }

  // Get existing 5 Whys or start new
  const existingAnalysis = (capa.rootCauseAnalysis as any) || {};
  const whys = existingAnalysis.whys || [];

  // Add new "why" answer
  whys.push({
    question: `Why ${whys.length + 1}?`,
    answer: transcript,
  });

  // Check if we have 5 whys
  if (whys.length >= 5) {
    // Extract root cause from 5th why
    const rootCause = extractRootCause(whys[4].answer);

    await prisma.correctivePreventiveAction.update({
      where: { id: capaId },
      data: {
        rootCauseAnalysis: {
          ...existingAnalysis,
          whys,
          method: "5_WHYS_VOICE",
        } as any,
        rootCause,
      },
    });

    return {
      success: true,
      whys,
      rootCause,
      voiceResponse: `Root cause analysis complete. Identified root cause: ${rootCause}. Now let's define corrective actions.`,
      nextStep: "ADD_ACTION",
    };
  } else {
    // Ask next why
    const nextQuestion = generateNextWhy(whys);

    await prisma.correctivePreventiveAction.update({
      where: { id: capaId },
      data: {
        rootCauseAnalysis: {
          ...existingAnalysis,
          whys,
        } as any,
      },
    });

    return {
      success: true,
      whys,
      voiceResponse: nextQuestion,
      nextStep: "INTERVIEW_5WHYS",
    };
  }
}

/**
 * Handle status update via voice
 */
async function handleUpdateStatus(
  organizationId: string,
  capaId: string,
  transcript: string,
) {
  const status = extractStatus(transcript);

  if (!status) {
    return {
      success: false,
      error: "Could not determine status from transcript",
      voiceResponse:
        "I didn't understand the status. Please say: Open, In Progress, Under Review, or Closed.",
    };
  }

  const updateData: any = { status };

  if (status === "CLOSED") {
    updateData.closedDate = new Date();
  }

  const capa = await prisma.correctivePreventiveAction.update({
    where: { id: capaId, organizationId },
    data: updateData,
  });

  return {
    success: true,
    capa,
    voiceResponse: `CAPA ${capa.capaNumber} status updated to ${status.toLowerCase().replace("_", " ")}.`,
  };
}

/**
 * Handle voice verification
 */
async function handleVoiceVerification(
  organizationId: string,
  userId: string,
  capaId: string,
  transcript: string,
) {
  // Parse verification result from transcript
  const verification = parseVerification(transcript);

  const capa = await prisma.correctivePreventiveAction.update({
    where: { id: capaId, organizationId },
    data: {
      verificationMethod: "Voice Verification",
      verificationDate: new Date(),
      verificationPerformedBy: userId,
      verificationPassed: verification.passed,
      effectivenessScore: verification.score,
      effectivenessNotes: transcript,
    },
  });

  return {
    success: true,
    capa,
    voiceResponse: verification.passed
      ? `Verification passed with ${verification.score}% effectiveness. CAPA is effective.`
      : `Verification failed. Score: ${verification.score}%. A Re-CAPA will be triggered.`,
  };
}

/**
 * Handle CAPA search via voice
 */
async function handleSearchCAPA(organizationId: string, transcript: string) {
  // Extract search terms
  const searchTerms = transcript.toLowerCase();

  // Try to find CAPA by number
  const numberMatch = searchTerms.match(/capa[- ]?(\d+)/);
  if (numberMatch) {
    const capa = await prisma.correctivePreventiveAction.findFirst({
      where: {
        organizationId,
        capaNumber: {
          contains: numberMatch[1],
        },
      },
    });

    if (capa) {
      return {
        success: true,
        capas: [capa],
        voiceResponse: `Found CAPA ${capa.capaNumber}. Status: ${capa.status}. Problem: ${capa.problemStatement}`,
      };
    }
  }

  // Search by keywords in problem statement
  const capas = await prisma.correctivePreventiveAction.findMany({
    where: {
      organizationId,
      problemStatement: {
        contains: searchTerms.split(" ")[0],
        mode: "insensitive",
      },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    capas,
    voiceResponse:
      capas.length > 0
        ? `Found ${capas.length} CAPA(s). The most recent is ${capas[0].capaNumber}: ${capas[0].problemStatement}`
        : "No CAPAs found matching your search.",
  };
}

/**
 * Parse natural language CAPA creation
 */
function parseVoiceCAPA(transcript: string, context?: any) {
  const lowerTranscript = transcript.toLowerCase();

  // Detect severity
  let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM";
  if (
    lowerTranscript.includes("critical") ||
    lowerTranscript.includes("urgent")
  ) {
    severity = "CRITICAL";
  } else if (
    lowerTranscript.includes("high") ||
    lowerTranscript.includes("serious")
  ) {
    severity = "HIGH";
  } else if (
    lowerTranscript.includes("low") ||
    lowerTranscript.includes("minor")
  ) {
    severity = "LOW";
  }

  return {
    problemStatement: transcript,
    severity,
    location: context?.location,
    equipment: context?.equipment,
  };
}

/**
 * Classify action type from transcript
 */
function classifyAction(transcript: string): string {
  const lower = transcript.toLowerCase();

  if (
    lower.includes("immediately") ||
    lower.includes("right now") ||
    lower.includes("urgent")
  ) {
    return "immediateActions";
  }

  if (
    lower.includes("prevent") ||
    lower.includes("stop from happening") ||
    lower.includes("avoid")
  ) {
    return "preventiveActions";
  }

  return "correctiveActions";
}

/**
 * Extract root cause from 5th why answer
 */
function extractRootCause(answer: string): string {
  // In production, use NLP to extract key phrases
  return answer;
}

/**
 * Generate next "why" question
 */
function generateNextWhy(whys: any[]): string {
  const questions = [
    "Why did that happen?",
    "What caused that issue?",
    "Why was that the case?",
    "What was the underlying reason?",
    "What is the root cause?",
  ];

  return questions[whys.length] || "Tell me more about the root cause.";
}

/**
 * Extract status from transcript
 */
function extractStatus(
  transcript: string,
): "OPEN" | "IN_PROGRESS" | "UNDER_REVIEW" | "CLOSED" | null {
  const lower = transcript.toLowerCase();

  if (lower.includes("close") || lower.includes("complete")) return "CLOSED";
  if (lower.includes("review")) return "UNDER_REVIEW";
  if (lower.includes("progress") || lower.includes("working"))
    return "IN_PROGRESS";
  if (lower.includes("open") || lower.includes("start")) return "OPEN";

  return null;
}

/**
 * Parse verification from transcript
 */
function parseVerification(transcript: string): {
  passed: boolean;
  score: number;
} {
  const lower = transcript.toLowerCase();

  let passed = true;
  let score = 85;

  if (lower.includes("fail") || lower.includes("ineffective")) {
    passed = false;
    score = 50;
  }

  // Try to extract numeric score
  const scoreMatch = lower.match(/(\d+)\s*(?:%|percent)/);
  if (scoreMatch) {
    score = parseInt(scoreMatch[1]);
    passed = score >= 70;
  }

  return { passed, score };
}
