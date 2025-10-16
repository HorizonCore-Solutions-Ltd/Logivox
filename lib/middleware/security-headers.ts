/**
 * Security Headers Middleware
 * Implements security best practices via HTTP headers
 */

import { NextRequest, NextResponse } from 'next/server';

export interface SecurityHeadersConfig {
  /**
   * Content Security Policy directives
   */
  contentSecurityPolicy?: string | CSPDirectives;

  /**
   * Enable Strict-Transport-Security (HSTS)
   */
  strictTransportSecurity?: boolean | HSTSConfig;

  /**
   * X-Frame-Options header value
   */
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string;

  /**
   * X-Content-Type-Options
   */
  contentTypeOptions?: boolean;

  /**
   * Referrer-Policy
   */
  referrerPolicy?: string;

  /**
   * Permissions-Policy
   */
  permissionsPolicy?: string | PermissionsPolicyDirectives;

  /**
   * Cross-Origin policies
   */
  crossOriginEmbedderPolicy?: string;
  crossOriginOpenerPolicy?: string;
  crossOriginResourcePolicy?: string;
}

export interface HSTSConfig {
  maxAge: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'frame-src'?: string[];
  'object-src'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

export interface PermissionsPolicyDirectives {
  camera?: string[];
  microphone?: string[];
  geolocation?: string[];
  payment?: string[];
  usb?: string[];
  [key: string]: string[] | undefined;
}

/**
 * Default security configuration
 */
const defaultConfig: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': true,
    'block-all-mixed-content': true,
  },
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
  },
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
};

/**
 * Build Content-Security-Policy header value
 */
function buildCSP(directives: CSPDirectives): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(directives)) {
    if (value === true) {
      parts.push(key);
    } else if (Array.isArray(value) && value.length > 0) {
      parts.push(`${key} ${value.join(' ')}`);
    }
  }

  return parts.join('; ');
}

/**
 * Build Strict-Transport-Security header value
 */
function buildHSTS(config: HSTSConfig): string {
  const parts = [`max-age=${config.maxAge}`];

  if (config.includeSubDomains) {
    parts.push('includeSubDomains');
  }

  if (config.preload) {
    parts.push('preload');
  }

  return parts.join('; ');
}

/**
 * Build Permissions-Policy header value
 */
function buildPermissionsPolicy(directives: PermissionsPolicyDirectives): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(directives)) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        parts.push(`${key}=()`);
      } else {
        parts.push(`${key}=(${value.join(' ')})`);
      }
    }
  }

  return parts.join(', ');
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = defaultConfig
): NextResponse {
  const headers = new Headers(response.headers);

  // Content-Security-Policy
  if (config.contentSecurityPolicy) {
    const csp =
      typeof config.contentSecurityPolicy === 'string'
        ? config.contentSecurityPolicy
        : buildCSP(config.contentSecurityPolicy);
    headers.set('Content-Security-Policy', csp);
  }

  // Strict-Transport-Security
  if (config.strictTransportSecurity) {
    const hsts =
      typeof config.strictTransportSecurity === 'boolean'
        ? 'max-age=31536000; includeSubDomains'
        : buildHSTS(config.strictTransportSecurity);
    headers.set('Strict-Transport-Security', hsts);
  }

  // X-Frame-Options
  if (config.frameOptions) {
    headers.set('X-Frame-Options', config.frameOptions);
  }

  // X-Content-Type-Options
  if (config.contentTypeOptions) {
    headers.set('X-Content-Type-Options', 'nosniff');
  }

  // Referrer-Policy
  if (config.referrerPolicy) {
    headers.set('Referrer-Policy', config.referrerPolicy);
  }

  // Permissions-Policy
  if (config.permissionsPolicy) {
    const policy =
      typeof config.permissionsPolicy === 'string'
        ? config.permissionsPolicy
        : buildPermissionsPolicy(config.permissionsPolicy);
    headers.set('Permissions-Policy', policy);
  }

  // Cross-Origin-Embedder-Policy
  if (config.crossOriginEmbedderPolicy) {
    headers.set('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy);
  }

  // Cross-Origin-Opener-Policy
  if (config.crossOriginOpenerPolicy) {
    headers.set('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy);
  }

  // Cross-Origin-Resource-Policy
  if (config.crossOriginResourcePolicy) {
    headers.set('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy);
  }

  // Remove sensitive headers
  headers.delete('X-Powered-By');
  headers.delete('Server');

  return NextResponse.next({
    request: {
      headers: response.headers,
    },
    headers,
  });
}

/**
 * Security headers middleware
 */
export function securityHeaders(config?: SecurityHeadersConfig) {
  return (req: NextRequest) => {
    const response = NextResponse.next();
    return applySecurityHeaders(response, { ...defaultConfig, ...config });
  };
}

/**
 * Relaxed CSP for development
 */
export const developmentCSP: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:*'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', 'http://localhost:*'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'ws://localhost:*', 'http://localhost:*'],
  'frame-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
};

/**
 * Production CSP for warehouse management
 */
export const productionCSP: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'sha256-...'"], // Replace with actual hashes
  'style-src': ["'self'"],
  'img-src': ["'self'", 'data:', 'https://cdn.yourdomain.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https://api.yourdomain.com'],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': true,
  'block-all-mixed-content': true,
};
