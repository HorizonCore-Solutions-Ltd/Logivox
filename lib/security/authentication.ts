/**
 * Authentication Security Utilities
 * Implements secure authentication practices
 */

import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';

/**
 * Password hashing configuration
 */
const BCRYPT_ROUNDS = 12; // Recommended for production
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

/**
 * Password strength requirements
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(`Password must not exceed ${PASSWORD_MAX_LENGTH} characters`);
  }

  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || !hash) return false;

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Check password strength
 */
export function checkPasswordStrength(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }

  // Length check
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters`);
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must not exceed ${PASSWORD_MAX_LENGTH} characters`);
  }

  // Uppercase check
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Lowercase check
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Numbers check
  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Special characters check
  if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Common password check
  if (isCommonPassword(password)) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if password is in common passwords list
 */
function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'monkey',
    '1234567',
    'letmein',
    'trustno1',
    'dragon',
    'baseball',
    'iloveyou',
    'master',
    'sunshine',
    'ashley',
    'bailey',
    'passw0rd',
    'shadow',
    '123123',
    '654321',
  ];

  const lowerPassword = password.toLowerCase();
  return commonPasswords.some((common) => lowerPassword.includes(common));
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate password reset token with expiry
 */
export function generatePasswordResetToken(): {
  token: string;
  hash: string;
  expiresAt: Date;
} {
  const token = generateSecureToken(32);
  const hash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  return { token, hash, expiresAt };
}

/**
 * Verify password reset token
 */
export function verifyPasswordResetToken(token: string, hash: string): boolean {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return tokenHash === hash;
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(): {
  token: string;
  hash: string;
  expiresAt: Date;
} {
  const token = generateSecureToken(32);
  const hash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 86400000); // 24 hours

  return { token, hash, expiresAt };
}

/**
 * Generate 2FA secret
 */
export function generate2FASecret(): string {
  return randomBytes(20).toString('hex');
}

/**
 * Generate 2FA backup codes
 */
export function generate2FABackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(randomBytes(4).toString('hex'));
  }
  return codes;
}

/**
 * Hash 2FA backup code
 */
export async function hash2FABackupCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

/**
 * Verify 2FA backup code
 */
export async function verify2FABackupCode(
  code: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(code, hash);
  } catch {
    return false;
  }
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return generateSecureToken(32);
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate API key
 */
export function generateApiKey(): {
  key: string;
  hash: string;
} {
  const key = `wms_${generateSecureToken(32)}`;
  const hash = createHash('sha256').update(key).digest('hex');

  return { key, hash };
}

/**
 * Verify API key
 */
export function verifyApiKey(key: string, hash: string): boolean {
  const keyHash = createHash('sha256').update(key).digest('hex');
  return constantTimeCompare(keyHash, hash);
}

/**
 * Generate device fingerprint
 */
export function generateDeviceFingerprint(
  userAgent: string,
  ip: string
): string {
  return createHash('sha256')
    .update(`${userAgent}:${ip}`)
    .digest('hex');
}

/**
 * Check if password has been compromised (using first 5 chars of SHA1 hash)
 * In production, integrate with HaveIBeenPwned API
 */
export function checkPasswordCompromised(password: string): boolean {
  // This is a placeholder - in production, call HaveIBeenPwned API
  // https://haveibeenpwned.com/API/v3#PwnedPasswords
  
  const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = hash.substring(0, 5);
  
  // In production:
  // 1. Call https://api.pwnedpasswords.com/range/{prefix}
  // 2. Check if suffix exists in response
  // 3. Return true if found
  
  return false; // Placeholder
}

/**
 * Log security event
 */
export interface SecurityEvent {
  userId?: string;
  email?: string;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  metadata?: Record<string, any>;
}

export function logSecurityEvent(event: SecurityEvent): void {
  // In production, send to security logging service
  console.log('[SECURITY EVENT]', {
    timestamp: new Date().toISOString(),
    ...event,
  });
}
