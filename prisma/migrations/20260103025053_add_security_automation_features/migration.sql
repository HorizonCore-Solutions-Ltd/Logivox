/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,badgeNumber]` on the table `visitors` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SecurityNotificationType" AS ENUM ('VISITOR_ARRIVAL', 'VISITOR_OVERDUE', 'VISITOR_CHECKOUT', 'GATE_ENTRY', 'INCIDENT_REPORTED', 'INCIDENT_ESCALATED', 'INCIDENT_RESOLVED', 'SHIFT_REMINDER', 'SHIFT_NO_SHOW', 'ACCESS_DENIED', 'BLACKLIST_DETECTED', 'SECURITY_ALERT', 'COMPLIANCE_DUE', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "PreRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CHECKED_IN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "SecurityAlertType" AS ENUM ('UNAUTHORIZED_ACCESS', 'TAILGATING', 'LOITERING', 'BLACKLIST_DETECTED', 'VISITOR_OVERDUE', 'ZONE_BREACH', 'AFTER_HOURS_ACCESS', 'FORCED_ENTRY', 'CAMERA_OFFLINE', 'MULTIPLE_FAILED_ACCESS', 'SUSPICIOUS_BEHAVIOR', 'EMERGENCY', 'SYSTEM_MALFUNCTION');

-- CreateEnum
CREATE TYPE "SecurityAlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_ALARM', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ComplianceReportType" AS ENUM ('DAILY_SUMMARY', 'WEEKLY_SUMMARY', 'MONTHLY_SUMMARY', 'VISITOR_LOG', 'INCIDENT_LOG', 'ACCESS_LOG', 'GATE_ACTIVITY', 'SECURITY_AUDIT', 'OSHA_REPORT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VisitorType" AS ENUM ('CONTRACTOR', 'VENDOR', 'CUSTOMER', 'AUDITOR', 'CANDIDATE', 'GUEST', 'OTHER');

-- CreateTable
CREATE TABLE "security_notifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "SecurityNotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'HIGH',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipientType" "RecipientType" NOT NULL,
    "recipientId" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "recipientName" TEXT,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "relatedEntity" TEXT,
    "relatedEntityId" TEXT,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_pre_registrations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "visitorType" "VisitorType" NOT NULL DEFAULT 'GUEST',
    "visitDate" TIMESTAMP(3) NOT NULL,
    "visitPurpose" TEXT NOT NULL,
    "expectedDuration" INTEGER,
    "hostEmployeeId" TEXT,
    "hostName" TEXT NOT NULL,
    "hostEmail" TEXT,
    "hostDepartment" TEXT,
    "escortRequired" BOOLEAN NOT NULL DEFAULT false,
    "allowedAreas" JSONB,
    "specialInstructions" TEXT,
    "status" "PreRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "visitorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_pre_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "alertType" "SecurityAlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'HIGH',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "triggerSource" TEXT,
    "triggerTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseId" TEXT,
    "location" TEXT,
    "zoneId" TEXT,
    "relatedEntity" TEXT,
    "relatedEntityId" TEXT,
    "status" "SecurityAlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "incidentCreated" BOOLEAN NOT NULL DEFAULT false,
    "incidentId" TEXT,
    "notificationsSent" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_compliance_reports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "reportType" "ComplianceReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "statistics" JSONB NOT NULL,
    "recommendations" TEXT,
    "pdfUrl" TEXT,
    "csvUrl" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "recipientEmails" JSONB,
    "sentAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_compliance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_notifications_organizationId_idx" ON "security_notifications"("organizationId");

-- CreateIndex
CREATE INDEX "security_notifications_recipientId_idx" ON "security_notifications"("recipientId");

-- CreateIndex
CREATE INDEX "security_notifications_status_idx" ON "security_notifications"("status");

-- CreateIndex
CREATE INDEX "security_notifications_type_idx" ON "security_notifications"("type");

-- CreateIndex
CREATE INDEX "security_notifications_createdAt_idx" ON "security_notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_pre_registrations_registrationNumber_key" ON "visitor_pre_registrations"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_pre_registrations_qrCode_key" ON "visitor_pre_registrations"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_pre_registrations_visitorId_key" ON "visitor_pre_registrations"("visitorId");

-- CreateIndex
CREATE INDEX "visitor_pre_registrations_organizationId_idx" ON "visitor_pre_registrations"("organizationId");

-- CreateIndex
CREATE INDEX "visitor_pre_registrations_email_idx" ON "visitor_pre_registrations"("email");

-- CreateIndex
CREATE INDEX "visitor_pre_registrations_visitDate_idx" ON "visitor_pre_registrations"("visitDate");

-- CreateIndex
CREATE INDEX "visitor_pre_registrations_status_idx" ON "visitor_pre_registrations"("status");

-- CreateIndex
CREATE INDEX "visitor_pre_registrations_qrCode_idx" ON "visitor_pre_registrations"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_pre_registrations_organizationId_registrationNumber_key" ON "visitor_pre_registrations"("organizationId", "registrationNumber");

-- CreateIndex
CREATE INDEX "security_alerts_organizationId_idx" ON "security_alerts"("organizationId");

-- CreateIndex
CREATE INDEX "security_alerts_alertType_idx" ON "security_alerts"("alertType");

-- CreateIndex
CREATE INDEX "security_alerts_severity_idx" ON "security_alerts"("severity");

-- CreateIndex
CREATE INDEX "security_alerts_status_idx" ON "security_alerts"("status");

-- CreateIndex
CREATE INDEX "security_alerts_triggerTime_idx" ON "security_alerts"("triggerTime");

-- CreateIndex
CREATE INDEX "security_compliance_reports_organizationId_idx" ON "security_compliance_reports"("organizationId");

-- CreateIndex
CREATE INDEX "security_compliance_reports_reportType_idx" ON "security_compliance_reports"("reportType");

-- CreateIndex
CREATE INDEX "security_compliance_reports_periodStart_idx" ON "security_compliance_reports"("periodStart");

-- CreateIndex
CREATE INDEX "security_compliance_reports_status_idx" ON "security_compliance_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "security_compliance_reports_organizationId_reportNumber_key" ON "security_compliance_reports"("organizationId", "reportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_organizationId_badgeNumber_key" ON "visitors"("organizationId", "badgeNumber");

-- AddForeignKey
ALTER TABLE "security_notifications" ADD CONSTRAINT "security_notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_pre_registrations" ADD CONSTRAINT "visitor_pre_registrations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_pre_registrations" ADD CONSTRAINT "visitor_pre_registrations_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_compliance_reports" ADD CONSTRAINT "security_compliance_reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
