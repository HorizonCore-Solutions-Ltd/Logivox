import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function authenticateApiKey(
  request: NextRequest
): Promise<{
  authenticated: boolean
  organizationId?: string
  apiKeyId?: string
  error?: NextResponse
}> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { message: "Missing or invalid authorization header" },
        { status: 401 }
      ),
    }
  }

  const apiKey = authHeader.substring(7) // Remove 'Bearer '

  if (!apiKey.startsWith("fsk_")) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { message: "Invalid API key format" },
        { status: 401 }
      ),
    }
  }

  // Hash the provided API key
  const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex")

  // Find API key in database
  const dbApiKey = await prisma.apiKey.findFirst({
    where: {
      key: hashedKey,
      isActive: true,
    },
    include: {
      organization: true,
    },
  })

  if (!dbApiKey) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { message: "Invalid or inactive API key" },
        { status: 401 }
      ),
    }
  }

  // Check if API key is expired
  if (dbApiKey.expiresAt && dbApiKey.expiresAt < new Date()) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { message: "API key has expired" },
        { status: 401 }
      ),
    }
  }

  // Update last used timestamp (fire and forget)
  prisma.apiKey
    .update({
      where: { id: dbApiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err: unknown) => console.error("Failed to update lastUsedAt:", err))

  return {
    authenticated: true,
    organizationId: dbApiKey.organizationId,
    apiKeyId: dbApiKey.id,
  }
}

export function checkApiKeyScope(
  apiKey: { scopes: string[] },
  requiredScope: string
): boolean {
  // If no scopes are defined, allow all
  if (!apiKey.scopes || apiKey.scopes.length === 0) {
    return true
  }

  // Check if the required scope is in the API key's scopes
  return apiKey.scopes.includes(requiredScope) || apiKey.scopes.includes("*")
}
