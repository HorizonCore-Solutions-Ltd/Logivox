// Notification Service for Security Automation
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export interface NotificationPayload {
  organizationId: string;
  type: string;
  priority?: string;
  title: string;
  message: string;
  recipientType: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  deliveryMethod: string;
  relatedEntity?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  metadata?: any;
}

export class SecurityNotificationService {
  private static emailTransporter: nodemailer.Transporter | null = null;

  static async initialize() {
    // Initialize email transporter
    if (process.env.SMTP_HOST && !this.emailTransporter) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        } : undefined,
      });
    }
  }

  static async sendNotification(payload: NotificationPayload) {
    // Create notification record
    const notification = await prisma.securityNotification.create({
      data: {
        organizationId: payload.organizationId,
        type: payload.type as any,
        priority: payload.priority as any || 'NORMAL',
        title: payload.title,
        message: payload.message,
        recipientType: payload.recipientType as any,
        recipientId: payload.recipientId,
        recipientEmail: payload.recipientEmail,
        recipientPhone: payload.recipientPhone,
        recipientName: payload.recipientName,
        deliveryMethod: payload.deliveryMethod as any,
        status: 'PENDING',
        relatedEntity: payload.relatedEntity,
        relatedEntityId: payload.relatedEntityId,
        actionUrl: payload.actionUrl,
        metadata: payload.metadata,
      },
    });

    // Dispatch notification based on delivery method
    try {
      await this.dispatch(notification);
    } catch (error) {
      console.error('Notification dispatch failed:', error);
      await prisma.securityNotification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    return notification;
  }

  private static async dispatch(notification: any) {
    await prisma.securityNotification.update({
      where: { id: notification.id },
      data: { status: 'SENDING', sentAt: new Date() },
    });

    switch (notification.deliveryMethod) {
      case 'EMAIL':
        await this.sendEmail(notification);
        break;
      case 'SMS':
        await this.sendSMS(notification);
        break;
      case 'IN_APP':
        // In-app notifications are already created in DB
        await this.markDelivered(notification.id);
        break;
      case 'WEBHOOK':
        await this.sendWebhook(notification);
        break;
      default:
        throw new Error(`Unsupported delivery method: ${notification.deliveryMethod}`);
    }
  }

  private static async sendEmail(notification: any) {
    if (!this.emailTransporter || !notification.recipientEmail) {
      throw new Error('Email transporter not configured or no recipient email');
    }

    await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'security@logivox.com',
      to: notification.recipientEmail,
      subject: `[${notification.priority}] ${notification.title}`,
      html: `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        ${notification.actionUrl ? `<p><a href="${notification.actionUrl}">View Details</a></p>` : ''}
        <hr>
        <p style="color: #666; font-size: 12px;">LogiVox Security Notification</p>
      `,
    });

    await this.markDelivered(notification.id);
  }

  private static async sendSMS(notification: any) {
    if (!process.env.TWILIO_ACCOUNT_SID || !notification.recipientPhone) {
      throw new Error('SMS service not configured or no recipient phone');
    }

    // Twilio integration would go here
    // For now, just mark as sent
    console.log(`SMS would be sent to ${notification.recipientPhone}: ${notification.message}`);
    await this.markDelivered(notification.id);
  }

  private static async sendWebhook(notification: any) {
    const webhookUrl = notification.metadata?.webhookUrl || process.env.SECURITY_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('No webhook URL configured');
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: notification.id,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        timestamp: new Date().toISOString(),
        relatedEntity: notification.relatedEntity,
        relatedEntityId: notification.relatedEntityId,
        actionUrl: notification.actionUrl,
      }),
    });

    await this.markDelivered(notification.id);
  }

  private static async markDelivered(notificationId: string) {
    await prisma.securityNotification.update({
      where: { id: notificationId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
    });
  }

  // Pre-built notification templates
  static async notifyVisitorArrival(
    organizationId: string,
    visitor: any,
    hostEmail?: string,
    hostName?: string
  ) {
    if (!hostEmail) return;

    await this.sendNotification({
      organizationId,
      type: 'VISITOR_ARRIVAL',
      priority: 'NORMAL',
      title: 'Visitor Arrival',
      message: `${visitor.firstName} ${visitor.lastName} from ${visitor.company || 'N/A'} has arrived and is waiting at reception.`,
      recipientType: 'HOST',
      recipientEmail: hostEmail,
      recipientName: hostName,
      deliveryMethod: 'EMAIL',
      relatedEntity: 'VISITOR',
      relatedEntityId: visitor.id,
      actionUrl: `/security/visitors/${visitor.id}`,
      metadata: { visitorBadge: visitor.badgeNumber },
    });
  }

  static async notifyVisitorOverdue(
    organizationId: string,
    visitor: any
  ) {
    await this.sendNotification({
      organizationId,
      type: 'VISITOR_OVERDUE',
      priority: 'HIGH',
      title: 'Visitor Overdue',
      message: `Visitor ${visitor.firstName} ${visitor.lastName} (Badge: ${visitor.badgeNumber}) is still on-site past expected checkout time.`,
      recipientType: 'SECURITY_PERSONNEL',
      deliveryMethod: 'IN_APP',
      relatedEntity: 'VISITOR',
      relatedEntityId: visitor.id,
      actionUrl: `/security/visitors/${visitor.id}`,
    });
  }

  static async notifyIncidentReported(
    organizationId: string,
    incident: any,
    recipients: { email: string; name: string }[]
  ) {
    for (const recipient of recipients) {
      await this.sendNotification({
        organizationId,
        type: 'INCIDENT_REPORTED',
        priority: incident.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
        title: `Security Incident: ${incident.title}`,
        message: `A ${incident.severity} severity ${incident.incidentType} incident has been reported at ${incident.location}.`,
        recipientType: 'SECURITY_PERSONNEL',
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        deliveryMethod: 'EMAIL',
        relatedEntity: 'INCIDENT',
        relatedEntityId: incident.id,
        actionUrl: `/security/incidents/${incident.id}`,
      });
    }
  }

  static async notifyGateEntry(
    organizationId: string,
    gateEntry: any,
    blacklisted: boolean = false
  ) {
    if (blacklisted) {
      await this.sendNotification({
        organizationId,
        type: 'BLACKLIST_DETECTED',
        priority: 'URGENT',
        title: 'Blacklisted Vehicle Detected',
        message: `Vehicle ${gateEntry.licensePlate} is on the blacklist and has been flagged at the gate.`,
        recipientType: 'SECURITY_PERSONNEL',
        deliveryMethod: 'IN_APP',
        relatedEntity: 'GATE_ENTRY',
        relatedEntityId: gateEntry.id,
        actionUrl: `/security/gate-entries/${gateEntry.id}`,
      });
    }
  }
}
