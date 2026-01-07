// =============================================================================
// EMAIL SERVICE - SendGrid Integration
// =============================================================================
// Send transactional emails for notifications, alerts, and communications

import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";
import { logger } from "./logger";

// Configure SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

// Configure SMTP as fallback
const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.sendgrid.net",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@logivox.ai";
const fromName = process.env.SMTP_FROM_NAME || "LogiVox WMS";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(sendGridApiKey || (process.env.SMTP_HOST && process.env.SMTP_USER));
}

/**
 * Send email using SendGrid or SMTP
 */
export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const startTime = Date.now();

    // Try SendGrid first if configured
    if (sendGridApiKey) {
      const msg = {
        to: options.to,
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content.toString("base64"),
          type: att.contentType,
          disposition: "attachment",
        })),
      };

      const [response] = await sgMail.send(msg);
      const duration = Date.now() - startTime;

      logger.info("Email sent via SendGrid", {
        to: options.to,
        subject: options.subject,
        messageId: response.headers["x-message-id"],
        duration,
      });

      return {
        success: true,
        messageId: response.headers["x-message-id"] as string,
      };
    }

    // Fallback to SMTP
    if (process.env.SMTP_HOST) {
      const info = await smtpTransporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments,
      });

      const duration = Date.now() - startTime;

      logger.info("Email sent via SMTP", {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
        duration,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    }

    logger.error("Email service not configured");
    return { success: false, error: "Email service not configured" };
  } catch (error: any) {
    logger.error("Failed to send email", {
      error,
      to: options.to,
      subject: options.subject,
      errorMessage: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<{ success: boolean }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to LogiVox WMS!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for joining LogiVox, the most advanced Warehouse Management System powered by AI and voice operations.</p>
            <p>Your account has been successfully created and you can now access all features:</p>
            <ul>
              <li>Real-time inventory tracking</li>
              <li>Voice-enabled warehouse operations</li>
              <li>AI-powered forecasting and optimization</li>
              <li>Comprehensive reporting and analytics</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, our support team is here to help at <a href="mailto:support@logivox.ai">support@logivox.ai</a>.</p>
            <p>Best regards,<br>The LogiVox Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 LogiVox. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const result = await sendEmail({
    to: email,
    subject: "Welcome to LogiVox WMS",
    html,
    text: `Hi ${name}, welcome to LogiVox WMS!`,
  });

  return { success: result.success };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
): Promise<{ success: boolean }> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>You requested to reset your password for your LogiVox account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
            <div class="warning">
              <strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email or contact support if you have concerns.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 LogiVox. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const result = await sendEmail({
    to: email,
    subject: "Reset Your Password - LogiVox WMS",
    html,
    text: `Reset your password: ${resetUrl}`,
  });

  return { success: result.success };
}

/**
 * Send MFA setup email with QR code
 */
export async function sendMFASetupEmail(
  email: string,
  qrCodeUrl: string,
): Promise<{ success: boolean }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; text-align: center; }
          .qr-code { margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Two-Factor Authentication Setup</h1>
          </div>
          <div class="content">
            <p>Your two-factor authentication is being set up.</p>
            <p>Scan this QR code with your authenticator app:</p>
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="MFA QR Code" width="250" height="250" />
            </div>
            <p><strong>Your account security is our priority.</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 LogiVox. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const result = await sendEmail({
    to: email,
    subject: "Two-Factor Authentication Setup - LogiVox WMS",
    html,
  });

  return { success: result.success };
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderDetails: {
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number }>;
    total: number;
  },
): Promise<{ success: boolean }> {
  const itemsHtml = orderDetails.items
    .map((item) => `<li>${item.name} - Qty: ${item.quantity}</li>`)
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .order-details { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed</h1>
          </div>
          <div class="content">
            <p>Hi ${orderDetails.customerName},</p>
            <p>Your order has been confirmed and is being processed.</p>
            <div class="order-details">
              <h3>Order #${orderDetails.orderNumber}</h3>
              <ul>${itemsHtml}</ul>
              <p><strong>Total: $${orderDetails.total.toFixed(2)}</strong></p>
            </div>
            <p>You'll receive another email when your order ships.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 LogiVox. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const result = await sendEmail({
    to: email,
    subject: `Order Confirmation #${orderDetails.orderNumber}`,
    html,
  });

  return { success: result.success };
}

/**
 * Send low stock alert email
 */
export async function sendLowStockAlertEmail(
  email: string,
  items: Array<{
    name: string;
    currentQty: number;
    minQty: number;
    warehouse: string;
  }>,
): Promise<{ success: boolean }> {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.currentQty}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.minQty}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.warehouse}</td>
      </tr>
    `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #2563eb; color: white; padding: 10px; text-align: left; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Stock Alert</h1>
          </div>
          <div class="content">
            <p>The following items are running low in stock:</p>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Current</th>
                  <th>Minimum</th>
                  <th>Warehouse</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <p>Please review and replenish stock as needed.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 LogiVox. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const result = await sendEmail({
    to: email,
    subject: "⚠️ Low Stock Alert - LogiVox WMS",
    html,
  });

  return { success: result.success };
}

export const EmailService = {
  isEmailConfigured,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendMFASetupEmail,
  sendOrderConfirmationEmail,
  sendLowStockAlertEmail,
};

export default EmailService;
