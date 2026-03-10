import { NextRequest } from "next/server";
export async function generateSessionFingerprint(req: NextRequest) {
  const ip =
    req.ip ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for") ??
    "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const data = new TextEncoder().encode(`${ip}-${userAgent}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
