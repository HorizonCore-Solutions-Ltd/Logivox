import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function validateWebhookSignature(
  request: NextRequest,
  secret: string
): Promise<{ isValid: boolean; payload: string }> {
  try {
    const signature = request.headers.get("x-webhook-signature");
    if (!signature) return { isValid: false, payload: "" };

    const payload = await request.text();
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return {
      isValid: crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      ),
      payload
    };
  } catch (error) {
    return { isValid: false, payload: "" };
  }
}

