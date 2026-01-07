/**
 * Main Security Middleware
 * Orchestrates all security features
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RateLimitPresets } from "./rate-limiter";
import { securityHeaders, developmentCSP } from "./security-headers";
import { csrfProtection } from "./csrf-protection";

/**
 * Security middleware configuration
 */
export interface SecurityConfig {
  /**
   * Enable rate limiting
   */
  rateLimit?: boolean;

  /**
   * Rate limit preset
   */
  rateLimitPreset?: keyof typeof RateLimitPresets;

  /**
   * Enable security headers
   */
  securityHeaders?: boolean;

  /**
   * Enable CSRF protection
   */
  csrfProtection?: boolean;

  /**
   * Custom CSP for development
   */
  developmentMode?: boolean;
}

/**
 * Apply all security middleware
 */
export async function applySecurity(
  req: NextRequest,
  config: SecurityConfig = {},
): Promise<NextResponse> {
  let response = NextResponse.next();

  // Apply rate limiting
  if (config.rateLimit !== false) {
    const preset = config.rateLimitPreset || "API";
    const rateLimitResult = await rateLimit(req, RateLimitPresets[preset]);

    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }
  }

  // Apply CSRF protection
  if (config.csrfProtection !== false) {
    const csrfResult = await csrfProtection(req);

    if (csrfResult && csrfResult.status === 403) {
      return csrfResult;
    }

    if (csrfResult) {
      response = csrfResult;
    }
  }

  // Apply security headers
  if (config.securityHeaders !== false) {
    const headerConfig = config.developmentMode
      ? {
          contentSecurityPolicy: developmentCSP,
          strictTransportSecurity: false,
        }
      : undefined;

    const securityHeadersMiddleware = securityHeaders(headerConfig);
    response = securityHeadersMiddleware(req);
  }

  return response;
}

/**
 * Security middleware for API routes
 */
export function apiSecurity(config?: SecurityConfig) {
  return async (req: NextRequest) => {
    const apiConfig: SecurityConfig = {
      rateLimit: true,
      rateLimitPreset: "API",
      securityHeaders: true,
      csrfProtection: false, // API routes typically use bearer tokens
      developmentMode: process.env.NODE_ENV === "development",
      ...config,
    };

    return applySecurity(req, apiConfig);
  };
}

/**
 * Security middleware for authentication endpoints
 */
export function authSecurity(config?: SecurityConfig) {
  return async (req: NextRequest) => {
    const authConfig: SecurityConfig = {
      rateLimit: true,
      rateLimitPreset: "AUTH",
      securityHeaders: true,
      csrfProtection: true,
      developmentMode: process.env.NODE_ENV === "development",
      ...config,
    };

    return applySecurity(req, authConfig);
  };
}

/**
 * Security middleware for write operations
 */
export function writeSecurity(config?: SecurityConfig) {
  return async (req: NextRequest) => {
    const writeConfig: SecurityConfig = {
      rateLimit: true,
      rateLimitPreset: "WRITE",
      securityHeaders: true,
      csrfProtection: true,
      developmentMode: process.env.NODE_ENV === "development",
      ...config,
    };

    return applySecurity(req, writeConfig);
  };
}

/**
 * Security middleware for read operations
 */
export function readSecurity(config?: SecurityConfig) {
  return async (req: NextRequest) => {
    const readConfig: SecurityConfig = {
      rateLimit: true,
      rateLimitPreset: "READ",
      securityHeaders: true,
      csrfProtection: false,
      developmentMode: process.env.NODE_ENV === "development",
      ...config,
    };

    return applySecurity(req, readConfig);
  };
}
