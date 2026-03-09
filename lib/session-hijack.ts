import { NextRequest } from "next/server";
import crypto from "crypto";

export function generateSessionFingerprint(req: NextRequest) {
  const ip = req.ip ?? req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  
  // Create a device/IP hash to bind to the JWT session payload
  return crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');
}
