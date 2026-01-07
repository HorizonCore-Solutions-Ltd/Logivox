/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateCSRFToken,
  constantTimeCompare,
} from "@/lib/security/authentication";
import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * CSRF protection configuration
 */
export interface CSRFConfig {
  /**
   * Cookie options
   */
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    maxAge?: number;
  };

  /**
   * Exempt paths (regex patterns)
   */
  exemptPaths?: RegExp[];

  /**
   * Exempt methods (default: GET, HEAD, OPTIONS)
   */
  exemptMethods?: string[];

  /**
   * Custom error message
   */
  errorMessage?: string;
}

const defaultConfig: CSRFConfig = {
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 86400, // 24 hours
  },
  exemptMethods: ["GET", "HEAD", "OPTIONS"],
  errorMessage: "Invalid or missing CSRF token",
};

/**
 * Generate and set CSRF token cookie
 */
export function setCSRFToken(
  response: NextResponse,
  config: CSRFConfig = defaultConfig,
): string {
  const token = generateCSRFToken();

  response.cookies.set(CSRF_COOKIE_NAME, token, {
    ...defaultConfig.cookieOptions,
    ...config.cookieOptions,
  });

  return token;
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFTokenFromCookie(req: NextRequest): string | null {
  return req.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Get CSRF token from header
 */
export function getCSRFTokenFromHeader(req: NextRequest): string | null {
  return req.headers.get(CSRF_HEADER_NAME) || null;
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(req: NextRequest): boolean {
  const cookieToken = getCSRFTokenFromCookie(req);
  const headerToken = getCSRFTokenFromHeader(req);

  if (!cookieToken || !headerToken) {
    return false;
  }

  return constantTimeCompare(cookieToken, headerToken);
}

/**
 * Check if path is exempt from CSRF protection
 */
function isExemptPath(pathname: string, exemptPaths: RegExp[] = []): boolean {
  return exemptPaths.some((pattern) => pattern.test(pathname));
}

/**
 * Check if method is exempt from CSRF protection
 */
function isExemptMethod(method: string, exemptMethods: string[] = []): boolean {
  return exemptMethods.includes(method.toUpperCase());
}

/**
 * CSRF protection middleware
 */
export async function csrfProtection(
  req: NextRequest,
  config: CSRFConfig = defaultConfig,
): Promise<NextResponse | null> {
  const mergedConfig = { ...defaultConfig, ...config };
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Check if path is exempt
  if (isExemptPath(pathname, mergedConfig.exemptPaths)) {
    return null;
  }

  // Check if method is exempt
  if (isExemptMethod(method, mergedConfig.exemptMethods)) {
    // For exempt methods, ensure token exists (create if needed)
    const response = NextResponse.next();
    const existingToken = getCSRFTokenFromCookie(req);

    if (!existingToken) {
      setCSRFToken(response, mergedConfig);
    }

    return response;
  }

  // For non-exempt methods, verify token
  const valid = verifyCSRFToken(req);

  if (!valid) {
    return NextResponse.json(
      {
        success: false,
        error: mergedConfig.errorMessage,
        code: "CSRF_TOKEN_INVALID",
      },
      { status: 403 },
    );
  }

  return null;
}

/**
 * Create CSRF protection middleware with custom config
 */
export function createCSRFProtection(config?: CSRFConfig) {
  return async (req: NextRequest) => csrfProtection(req, config);
}

/**
 * Get CSRF token for client-side use
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    token = generateCSRFToken();
    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
    });
  }

  return token;
}

/**
 * CSRF token provider for API routes
 */
export async function GET_CSRF_TOKEN() {
  const token = await getCSRFToken();

  return NextResponse.json({
    success: true,
    data: { token },
  });
}
