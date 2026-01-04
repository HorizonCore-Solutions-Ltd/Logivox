/**
 * Notification Service for Returns Management
 * Handles email and SMS notifications for return events
 */

import { prisma } from '@/lib/prisma';

export interface NotificationRecipient {
  email?: string;
  phone?: string;
  name?: string;
}

export interface NotificationContext {
  rma: {
    id: string;
    rmaNumber: string;
    status: string;
    totalRefundAmount?: number;
    trackingNumber?: string;
    carrier?: string;
  };
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
  organization: {
    id: string;
    name: string;
  };
  metadata?: Record<string, any>;
}

export type NotificationEvent =
  | 'return_created'
  | 'return_approved'
  | 'return_rejected'
  | 'label_generated'
  | 'return_received'
  | 'return_inspected'
  | 'return_processed'
  | 'refund_issued'
  | 'fraud_alert';

export class ReturnsNotificationService {
  /**
   * Send notification for return event
   */
  async sendNotification(
    event: NotificationEvent,
    recipient: NotificationRecipient,
    context: NotificationContext
  ): Promise<void> {
    try {
      // Get notification settings
      const settings = await prisma.$queryRaw`
        SELECT notifications FROM return_settings
        WHERE organization_id = ${context.organization.id}
      ` as any[];

      const notificationSettings = settings[0]?.notifications || {
        email: { enabled: true },
        sms: { enabled: false },
      };

      // Send email if enabled and email provided
      if (notificationSettings.email?.enabled && recipient.email) {
        await this.sendEmail(event, recipient.email, context);
      }

      // Send SMS if enabled and phone provided
      if (notificationSettings.sms?.enabled && recipient.phone) {
        await this.sendSMS(event, recipient.phone, context);
      }

      // Log notification
      await prisma.activityLog.create({
        data: {
          organizationId: context.organization.id,
          userId: 'system',
          action: 'NOTIFICATION_SENT',
          entityType: 'RMA',
          entityId: context.rma.id,
          metadata: {
            event,
            recipient: recipient.email || recipient.phone,
            channels: {
              email: notificationSettings.email?.enabled,
              sms: notificationSettings.sms?.enabled,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(
    event: NotificationEvent,
    email: string,
    context: NotificationContext
  ): Promise<void> {
    const template = this.getEmailTemplate(event, context);

    // Use SendGrid, AWS SES, or your email provider
    if (process.env.SENDGRID_API_KEY) {
      await this.sendViaProvider(email, template);
    } else {
      console.log(`[EMAIL] To: ${email}, Subject: ${template.subject}`);
      console.log(`[EMAIL] Body: ${template.body}`);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(
    event: NotificationEvent,
    phone: string,
    context: NotificationContext
  ): Promise<void> {
    const message = this.getSMSTemplate(event, context);

    // Use Twilio, AWS SNS, or your SMS provider
    if (process.env.TWILIO_ACCOUNT_SID) {
      await this.sendSMSViaProvider(phone, message);
    } else {
      console.log(`[SMS] To: ${phone}, Message: ${message}`);
    }
  }

  /**
   * Get email template for event
   */
  private getEmailTemplate(
    event: NotificationEvent,
    context: NotificationContext
  ): { subject: string; body: string } {
    const { rma, customer, organization } = context;

    const templates: Record<NotificationEvent, { subject: string; body: string }> = {
      return_created: {
        subject: `Return Request Submitted - ${rma.rmaNumber}`,
        body: `
          Dear ${customer?.name || 'Customer'},

          Your return request has been submitted successfully.

          Return Number: ${rma.rmaNumber}
          Status: Pending Review

          We will review your request and send you updates via email.

          Thank you,
          ${organization.name}
        `,
      },
      return_approved: {
        subject: `Return Approved - ${rma.rmaNumber}`,
        body: `
          Dear ${customer?.name || 'Customer'},

          Your return request has been approved.

          Return Number: ${rma.rmaNumber}
          Status: Approved

          ${rma.trackingNumber ? `A prepaid return label has been generated. Tracking: ${rma.trackingNumber}` : 'Please package your items and ship them back to us.'}

          Thank you,
          ${organization.name}
        `,
      },
      return_rejected: {
        subject: `Return Request Update - ${rma.rmaNumber}`,
        body: `
          Dear ${customer?.name || 'Customer'},

          We're unable to approve your return request at this time.

          Return Number: ${rma.rmaNumber}
          Status: Not Approved

          For questions, please contact our customer service team.

          Thank you,
          ${organization.name}
        `,
      },
      label_generated: {
        subject: `Return Label Ready - ${rma.rmaNumber}`,
        body: `
          Dear ${customer?.name || 'Customer'},

          Your prepaid return label is ready.

          Return Number: ${rma.rmaNumber}
          Carrier: ${rma.carrier}
          Tracking Number: ${rma.trackingNumber}

          Please print the label and attach it to your package.

          Thank you,
          ${organization.name}
        `,
      },
      return_received: {
        subject: `Return Received - ${rma.rmaNumber}`,
        body: `
          Dear ${customer?.name || 'Customer'},

          We've received your return.

          Return Number: ${rma.rmaNumber}
          Status: Received - Under Inspection

          We will inspect your items and process your refund shortly.

          Thank you,
          ${organization.name}
        `,
      },
      return_inspected: {
        subject: `Return Inspected - ${rma.rmaNumber}`,
        body: `
          Dear ${customer?.name || 'Customer'},

          Your return has been inspected.

          Return Number: ${rma.rmaNumber}
          Status: Inspection Complete

          Your refund is being processed.

          Thank you,
          ${organization.name}
        `,
      },
      return_processed: {
        subject: `Return Processed - ${rma.rmaNumber}`,
        body: `
          Dear ${customer?.name || 'Customer'},

          Your return has been processed.

          Return Number: ${rma.rmaNumber}
          Status: Complete

          ${rma.totalRefundAmount ? `Refund Amount: $${rma.totalRefundAmount.toFixed(2)}` : ''}

          Thank you,
          ${organization.name}
        `,
      },
      refund_issued: {
        subject: `Refund Issued - ${rma.rmaNumber}`,
        body: `
          Dear ${customer?.name || 'Customer'},

          Your refund has been issued.

          Return Number: ${rma.rmaNumber}
          Refund Amount: $${rma.totalRefundAmount?.toFixed(2)}

          Please allow 5-10 business days for the refund to appear in your account.

          Thank you,
          ${organization.name}
        `,
      },
      fraud_alert: {
        subject: `ALERT: High-Risk Return Detected - ${rma.rmaNumber}`,
        body: `
          FRAUD ALERT

          A high-risk return has been flagged for review.

          Return Number: ${rma.rmaNumber}
          Customer: ${customer?.name}

          Please review this return immediately in the dashboard.

          ${organization.name} Security Team
        `,
      },
    };

    return templates[event];
  }

  /**
   * Get SMS template for event
   */
  private getSMSTemplate(
    event: NotificationEvent,
    context: NotificationContext
  ): string {
    const { rma, organization } = context;

    const templates: Record<NotificationEvent, string> = {
      return_created: `${organization.name}: Your return ${rma.rmaNumber} has been submitted.`,
      return_approved: `${organization.name}: Return ${rma.rmaNumber} approved. ${rma.trackingNumber ? `Track: ${rma.trackingNumber}` : ''}`,
      return_rejected: `${organization.name}: Return ${rma.rmaNumber} could not be approved.`,
      label_generated: `${organization.name}: Return label ready for ${rma.rmaNumber}. Track: ${rma.trackingNumber}`,
      return_received: `${organization.name}: We received your return ${rma.rmaNumber}.`,
      return_inspected: `${organization.name}: Return ${rma.rmaNumber} inspected. Processing refund.`,
      return_processed: `${organization.name}: Return ${rma.rmaNumber} complete.`,
      refund_issued: `${organization.name}: Refund of $${rma.totalRefundAmount?.toFixed(2)} issued for ${rma.rmaNumber}.`,
      fraud_alert: `ALERT: High-risk return ${rma.rmaNumber} requires review.`,
    };

    return templates[event];
  }

  /**
   * Send email via provider (SendGrid example)
   */
  private async sendViaProvider(
    email: string,
    template: { subject: string; body: string }
  ): Promise<void> {
    // Example SendGrid implementation
    if (!process.env.SENDGRID_API_KEY) return;

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'returns@yourcompany.com',
            name: process.env.SENDGRID_FROM_NAME || 'Returns Team',
          },
          subject: template.subject,
          content: [
            {
              type: 'text/plain',
              value: template.body,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`SendGrid error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('SendGrid send error:', error);
      throw error;
    }
  }

  /**
   * Send SMS via provider (Twilio example)
   */
  private async sendSMSViaProvider(phone: string, message: string): Promise<void> {
    if (!process.env.TWILIO_ACCOUNT_SID) return;

    try {
      const auth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64');

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            From: process.env.TWILIO_PHONE_NUMBER || '',
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Twilio send error:', error);
      throw error;
    }
  }

  /**
   * Notify customer of return status change
   */
  async notifyCustomer(
    event: NotificationEvent,
    rmaId: string
  ): Promise<void> {
    try {
      // Get RMA with customer details
      const rma = await prisma.rMA.findUnique({
        where: { id: rmaId },
        include: {
          customer: true,
          organization: true,
        },
      });

      if (!rma || !rma.notifyCustomer) return;

      const context: NotificationContext = {
        rma: {
          id: rma.id,
          rmaNumber: rma.rmaNumber,
          status: rma.status,
          totalRefundAmount: rma.totalRefundAmount?.toNumber(),
          trackingNumber: rma.returnTrackingNumber || undefined,
          carrier: rma.returnCarrier || undefined,
        },
        customer: {
          id: rma.customer.id,
          name: rma.customer.name,
          email: rma.customer.email || undefined,
        },
        organization: {
          id: rma.organization.id,
          name: rma.organization.name,
        },
      };

      await this.sendNotification(
        event,
        {
          email: rma.customer.email || undefined,
          phone: rma.customer.phone || undefined,
          name: rma.customer.name,
        },
        context
      );
    } catch (error) {
      console.error('Error notifying customer:', error);
      // Non-critical, don't throw
    }
  }
}

// Export singleton
export const returnsNotificationService = new ReturnsNotificationService();
