// =============================================================================
// SMS SERVICE - Twilio Integration
// =============================================================================
// Send SMS notifications for alerts, OTP, and emergency communications

import twilio from 'twilio';
import { logger } from './logger';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let twilioClient: ReturnType<typeof twilio> | null = null;

// Initialize client only if credentials are provided
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

export interface SMSOptions {
  to: string;
  message: string;
  from?: string;
}

export interface OTPOptions {
  to: string;
  channel?: 'sms' | 'call' | 'email';
}

export interface VerifyOTPOptions {
  to: string;
  code: string;
}

/**
 * Check if SMS service is configured
 */
export function isSMSConfigured(): boolean {
  return !!(accountSid && authToken && phoneNumber);
}

/**
 * Send SMS message
 */
export async function sendSMS(options: SMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!twilioClient) {
      logger.error('SMS service not configured. Please set TWILIO credentials.');
      return { success: false, error: 'SMS service not configured' };
    }

    const startTime = Date.now();

    const message = await twilioClient.messages.create({
      body: options.message,
      from: options.from || phoneNumber,
      to: options.to,
    });

    const duration = Date.now() - startTime;

    logger.info('SMS sent successfully', {
      messageId: message.sid,
      to: options.to,
      duration,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    logger.error('Failed to send SMS', {
      error,
      to: options.to,
      errorMessage: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send OTP using Twilio Verify
 */
export async function sendOTP(options: OTPOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (!twilioClient || !verifyServiceSid) {
      logger.error('Twilio Verify service not configured');
      return { success: false, error: 'Verify service not configured' };
    }

    const startTime = Date.now();

    await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: options.to,
        channel: options.channel || 'sms',
      });

    const duration = Date.now() - startTime;

    logger.info('OTP sent successfully', {
      to: options.to,
      channel: options.channel || 'sms',
      duration,
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Failed to send OTP', {
      error,
      to: options.to,
      errorMessage: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(options: VerifyOTPOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (!twilioClient || !verifyServiceSid) {
      logger.error('Twilio Verify service not configured');
      return { success: false, error: 'Verify service not configured' };
    }

    const startTime = Date.now();

    const verificationCheck = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: options.to,
        code: options.code,
      });

    const duration = Date.now() - startTime;

    const success = verificationCheck.status === 'approved';

    logger.info('OTP verification completed', {
      to: options.to,
      success,
      status: verificationCheck.status,
      duration,
    });

    return {
      success,
      error: success ? undefined : 'Invalid or expired code',
    };
  } catch (error: any) {
    logger.error('Failed to verify OTP', {
      error,
      to: options.to,
      errorMessage: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send gate entry notification
 */
export async function sendGateEntryNotification(phoneNumber: string, details: {
  visitorName: string;
  gateName: string;
  time: string;
}): Promise<{ success: boolean }> {
  const message = `🚪 Gate Entry Alert\n\nVisitor: ${details.visitorName}\nGate: ${details.gateName}\nTime: ${details.time}\n\nLogiVox WMS`;

  const result = await sendSMS({
    to: phoneNumber,
    message,
  });

  return { success: result.success };
}

/**
 * Send emergency panic alert
 */
export async function sendPanicAlert(phoneNumbers: string[], details: {
  location: string;
  triggeredBy: string;
  time: string;
}): Promise<{ success: boolean; sent: number; failed: number }> {
  const message = `🚨 EMERGENCY ALERT\n\nLocation: ${details.location}\nTriggered by: ${details.triggeredBy}\nTime: ${details.time}\n\nImmediate response required!`;

  let sent = 0;
  let failed = 0;

  for (const phoneNumber of phoneNumbers) {
    const result = await sendSMS({
      to: phoneNumber,
      message,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { success: sent > 0, sent, failed };
}

/**
 * Send low stock alert
 */
export async function sendLowStockAlert(phoneNumber: string, details: {
  itemName: string;
  currentQty: number;
  minQty: number;
  warehouse: string;
}): Promise<{ success: boolean }> {
  const message = `⚠️ Low Stock Alert\n\nItem: ${details.itemName}\nCurrent: ${details.currentQty}\nMinimum: ${details.minQty}\nWarehouse: ${details.warehouse}\n\nLogiVox WMS`;

  const result = await sendSMS({
    to: phoneNumber,
    message,
  });

  return { success: result.success };
}

/**
 * Send shipment notification
 */
export async function sendShipmentNotification(phoneNumber: string, details: {
  trackingNumber: string;
  carrier: string;
  status: string;
}): Promise<{ success: boolean }> {
  const message = `📦 Shipment Update\n\nTracking: ${details.trackingNumber}\nCarrier: ${details.carrier}\nStatus: ${details.status}\n\nLogiVox WMS`;

  const result = await sendSMS({
    to: phoneNumber,
    message,
  });

  return { success: result.success };
}

/**
 * Send order ready notification
 */
export async function sendOrderReadyNotification(phoneNumber: string, details: {
  orderNumber: string;
  customerName: string;
}): Promise<{ success: boolean }> {
  const message = `✅ Order Ready for Pickup\n\nOrder: ${details.orderNumber}\nCustomer: ${details.customerName}\n\nLogiVox WMS`;

  const result = await sendSMS({
    to: phoneNumber,
    message,
  });

  return { success: result.success };
}

export const SMSService = {
  isSMSConfigured,
  sendSMS,
  sendOTP,
  verifyOTP,
  sendGateEntryNotification,
  sendPanicAlert,
  sendLowStockAlert,
  sendShipmentNotification,
  sendOrderReadyNotification,
};

export default SMSService;
