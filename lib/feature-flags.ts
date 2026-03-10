import { NextResponse } from "next/server";
import { prisma } from "./prisma";

// Basic centralized feature flag registry
export async function isFeatureEnabled(flagName: string, organizationId?: string): Promise<boolean> {
  // If no DB flags present, fallback to env vars natively for zero-latency
  const envFallback = process.env[`NEXT_PUBLIC_FEATURE_${flagName.toUpperCase()}`];
  if (envFallback) return envFallback === "true";

  // If using DB flags
  try {
    /* 
    const flag = await prisma.featureFlag.findUnique({ where: { name: flagName }});
    return flag?.enabled ?? false;
    */
    return false;
  } catch (e) {
    return false;
  }
}

