/**
 * API Route Auth Guard
 *
 * Single source of truth for authenticating Next.js API route handlers.
 * Returns the session + scoped organizationId, or a ready-to-return 401/403
 * NextResponse so every handler can do:
 *
 *   const auth = await requireApiAuth(request);
 *   if ("error" in auth) return auth.error;
 *   const { session, organizationId } = auth;
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

export interface AuthContext {
  session: Session;
  organizationId: string;
  userId: string;
  role: string;
}

export interface AuthError {
  error: NextResponse;
}

export type AuthResult = AuthContext | AuthError;

/**
 * Require a valid session.  Optionally enforce one or more roles.
 *
 * Usage:
 *   const auth = await requireApiAuth();
 *   if ("error" in auth) return auth.error;
 *   const { organizationId } = auth;
 */
export async function requireApiAuth(
  allowedRoles?: string[],
): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHENTICATED" },
        { status: 401 },
      ),
    };
  }

  const organizationId: string | undefined = (session.user as any)
    .organizationId;

  if (!organizationId) {
    return {
      error: NextResponse.json(
        { error: "No organisation context", code: "NO_ORG" },
        { status: 403 },
      ),
    };
  }

  const role: string = (session.user as any).role ?? "MEMBER";

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return {
      error: NextResponse.json(
        {
          error: "Insufficient permissions",
          code: "FORBIDDEN",
          required: allowedRoles,
          actual: role,
        },
        { status: 403 },
      ),
    };
  }

  return {
    session,
    organizationId,
    userId: (session.user as any).id ?? "",
    role,
  };
}
