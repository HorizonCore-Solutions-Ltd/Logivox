// =============================================================================
// MFA (Multi-Factor Authentication) Service
// =============================================================================
// Handles TOTP (Time-based One-Time Password) generation and verification
// for two-factor authentication using the authenticator app method.

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

// Configure OTP library
authenticator.options = {
  window: 1, // Allow 1 step before and after current time
  step: 30, // 30 second time step
};

export interface MFASetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAUser {
  id: string;
  email: string;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaBackupCodes: string[];
}

/**
 * Generate MFA secret and QR code for user enrollment
 */
export async function generateMFASetup(
  userId: string,
  userEmail: string,
  appName: string = 'LogiVox WMS'
): Promise<MFASetupData> {
  // Generate a secret key
  const secret = authenticator.generateSecret();

  // Generate OTP auth URL for QR code
  const otpauthUrl = authenticator.keyuri(userEmail, appName, secret);

  // Generate QR code as data URL
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);

  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verify TOTP code from authenticator app
 */
export function verifyMFACode(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('Error verifying MFA code:', error);
    return false;
  }
}

/**
 * Generate recovery/backup codes for account recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX for better readability
    const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    codes.push(formattedCode);
  }

  return codes;
}

/**
 * Hash backup codes for secure storage
 * Use bcrypt to hash codes before storing in database
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const bcrypt = require('bcrypt');
  const saltRounds = 12;

  const hashedCodes = await Promise.all(
    codes.map((code) => bcrypt.hash(code.replace('-', ''), saltRounds))
  );

  return hashedCodes;
}

/**
 * Verify a backup code
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; codeIndex: number }> {
  const bcrypt = require('bcrypt');
  const normalizedCode = code.replace('-', '').toUpperCase();

  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await bcrypt.compare(normalizedCode, hashedCodes[i]);
    if (isValid) {
      return { valid: true, codeIndex: i };
    }
  }

  return { valid: false, codeIndex: -1 };
}

/**
 * Validate MFA setup by verifying initial code
 */
export function validateMFASetup(secret: string, token: string): boolean {
  return verifyMFACode(secret, token);
}

/**
 * Generate a temporary MFA bypass code for support/emergency access
 * This should only be used in exceptional circumstances
 */
export function generateBypassCode(): string {
  const code = randomBytes(6).toString('hex').toUpperCase();
  return `BYPASS-${code}`;
}

/**
 * Check if MFA is required based on user role and org settings
 */
export function isMFARequired(
  userRole: string,
  orgSettings: { mfaRequired: boolean; mfaRequiredRoles: string[] }
): boolean {
  if (!orgSettings.mfaRequired) return false;

  // Check if user's role requires MFA
  return orgSettings.mfaRequiredRoles.includes(userRole);
}

/**
 * Get remaining time until current TOTP expires (for UI countdown)
 */
export function getRemainingTime(): number {
  const epoch = Math.floor(Date.now() / 1000);
  const step = authenticator.options.step || 30;
  return step - (epoch % step);
}

/**
 * Generate MFA recovery options for user
 */
export interface MFARecoveryOptions {
  backupCodesAvailable: number;
  backupCodesUsed: number;
  canRegenerateBackupCodes: boolean;
  trustedDevices: number;
}

export function getMFARecoveryOptions(user: MFAUser): MFARecoveryOptions {
  return {
    backupCodesAvailable: user.mfaBackupCodes.length,
    backupCodesUsed: 10 - user.mfaBackupCodes.length, // Assuming 10 initial codes
    canRegenerateBackupCodes: user.mfaEnabled,
    trustedDevices: 0, // TODO: Implement trusted devices tracking
  };
}

export const MFAService = {
  generateMFASetup,
  verifyMFACode,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  validateMFASetup,
  generateBypassCode,
  isMFARequired,
  getRemainingTime,
  getMFARecoveryOptions,
};

export default MFAService;
