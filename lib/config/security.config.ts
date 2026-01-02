/**
 * Security Configuration
 * Centralized security settings for the application
 */

export const SecurityConfig = {
  /**
   * Password Requirements
   */
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    bcryptRounds: 12,
  },

  /**
   * Session Configuration
   */
  session: {
    maxAge: 86400, // 24 hours
    updateAge: 3600, // Update session every hour
    cookieName: 'session_token',
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    },
  },

  /**
   * Token Expiry Times (in seconds)
   */
  tokens: {
    passwordReset: 3600, // 1 hour
    emailVerification: 86400, // 24 hours
    apiKey: 31536000, // 1 year
    refreshToken: 2592000, // 30 days
  },

  /**
   * Rate Limiting Configuration
   */
  rateLimit: {
    // Authentication endpoints
    auth: {
      maxRequests: 5,
      windowSeconds: 900, // 15 minutes
    },
    // Standard API endpoints
    api: {
      maxRequests: 100,
      windowSeconds: 60,
    },
    // Read operations
    read: {
      maxRequests: 300,
      windowSeconds: 60,
    },
    // Write operations
    write: {
      maxRequests: 50,
      windowSeconds: 60,
    },
    // Password reset
    passwordReset: {
      maxRequests: 3,
      windowSeconds: 3600, // 1 hour
    },
  },

  /**
   * File Upload Configuration
   */
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.xls', '.xlsx'],
  },

  /**
   * CORS Configuration
   */
  cors: {
    allowedOrigins:
      process.env.NODE_ENV === 'production'
        ? [process.env.APP_URL || 'https://yourcompany.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
    ],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials: true,
    maxAge: 86400, // 24 hours
  },

  /**
   * Content Security Policy
   */
  csp: {
    production: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'sha256-...'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https://cdn.yourcompany.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'connect-src': ["'self'", 'https://api.yourcompany.com'],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': true,
      'block-all-mixed-content': true,
    },
    development: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:*'],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:', 'http://localhost:*'],
      'font-src': ["'self'", 'data:'],
      'connect-src': ["'self'", 'ws://localhost:*', 'http://localhost:*'],
    },
  },

  /**
   * Audit Logging Configuration
   */
  audit: {
    enabled: process.env.ENABLE_AUDIT_LOGS !== 'false',
    retentionDays: 90,
    logLevel: process.env.LOG_LEVEL || 'info',
    sensitiveFields: ['password', 'passwordHash', 'token', 'secret', 'apiKey'],
  },

  /**
   * Two-Factor Authentication
   */
  twoFactor: {
    enabled: process.env.ENABLE_2FA === 'true',
    issuer: process.env.APP_NAME || 'LogiVox WMS',
    window: 1, // Allow 1 time step before/after
    backupCodesCount: 10,
  },

  /**
   * IP Whitelist/Blacklist
   */
  ipFiltering: {
    enabled: false,
    whitelist: [] as string[],
    blacklist: [] as string[],
  },

  /**
   * Brute Force Protection
   */
  bruteForce: {
    maxAttempts: 5,
    lockoutDuration: 900, // 15 minutes
    trackByIp: true,
    trackByEmail: true,
  },

  /**
   * Security Headers
   */
  headers: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },

  /**
   * API Key Configuration
   */
  apiKeys: {
    enabled: process.env.ENABLE_API_KEYS === 'true',
    prefix: 'wms_',
    length: 32,
    expiryDays: 365,
  },
} as const;

export default SecurityConfig;
