import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnalyzeRequest {
  image: string; // Base64 encoded image
  mode:
    | "cycle-count"
    | "damage-detection"
    | "package-verify"
    | "dimensioning"
    | "label-reading";
  locationId?: string;
  sku?: string;
  expectedQuantity?: number;
}

interface AnalysisResult {
  success: boolean;
  mode: string;
  confidence: number;
  results: any;
  processingTime: number;
  detectedItems?: number;
  damageDetected?: boolean;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  labelData?: { barcode?: string; text?: string; sku?: string };
  variance?: number;
  timestamp: Date;
}

/**
 * POST /api/computer-vision/analyze
 * Analyze an image using computer vision
 *
 * This endpoint processes images for various warehouse operations:
 * - cycle-count: Count items automatically
 * - damage-detection: Identify package damage
 * - package-verify: Verify package contents
 * - dimensioning: Measure package dimensions
 * - label-reading: Extract barcode/text from labels
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AnalyzeRequest = await request.json();
    const { image, mode, locationId, sku, expectedQuantity } = body;

    if (!image || !mode) {
      return NextResponse.json(
        { error: "Image and mode are required" },
        { status: 400 },
      );
    }

    const result = await analyzeImage(image, mode, {
      locationId,
      sku,
      expectedQuantity,
    });

    // Log the scan to database
    await prisma.computerVisionScan.create({
      data: {
        mode,
        confidence: result.confidence,
        processingTime: result.processingTime,
        detectedItems: result.detectedItems,
        damageDetected: result.damageDetected,
        variance: result.variance,
        locationId,
        sku,
        expectedQuantity,
        imageData: image.substring(0, 100), // Store thumbnail reference only
        results: result.results as any,
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
    });

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        processingTime,
      },
    });
  } catch (error) {
    console.error("Computer vision analysis error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("not configured")) {
      return NextResponse.json(
        {
          error: "Computer vision service unavailable",
          message,
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        error: "Failed to analyze image",
        message,
      },
      { status: 500 },
    );
  }
}

async function analyzeImage(
  image: string,
  mode: string,
  context: { locationId?: string; sku?: string; expectedQuantity?: number },
): Promise<AnalysisResult> {
  const serviceUrl = process.env.COMPUTER_VISION_SERVICE_URL;
  if (!serviceUrl) {
    throw new Error(
      "Computer vision service is not configured. Set COMPUTER_VISION_SERVICE_URL.",
    );
  }

  const response = await fetch(serviceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.COMPUTER_VISION_SERVICE_API_KEY
        ? {
            Authorization: `Bearer ${process.env.COMPUTER_VISION_SERVICE_API_KEY}`,
          }
        : {}),
    },
    body: JSON.stringify({
      image,
      mode,
      context,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.error ||
        `Computer vision service request failed (${response.status})`,
    );
  }

  if (typeof payload?.confidence !== "number" || payload?.results == null) {
    throw new Error("Computer vision service response missing required fields");
  }

  const timestamp = payload?.timestamp
    ? new Date(payload.timestamp)
    : new Date();

  return {
    success: true,
    mode,
    confidence: payload.confidence,
    results: payload.results,
    processingTime:
      typeof payload.processingTime === "number" ? payload.processingTime : 0,
    detectedItems:
      typeof payload.detectedItems === "number"
        ? payload.detectedItems
        : undefined,
    damageDetected:
      typeof payload.damageDetected === "boolean"
        ? payload.damageDetected
        : undefined,
    dimensions:
      payload.dimensions && typeof payload.dimensions === "object"
        ? payload.dimensions
        : undefined,
    labelData:
      payload.labelData && typeof payload.labelData === "object"
        ? payload.labelData
        : undefined,
    variance:
      typeof payload.variance === "number" ? payload.variance : undefined,
    timestamp,
  };
}
