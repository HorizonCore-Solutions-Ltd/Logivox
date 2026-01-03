/*
  Warnings:

  - You are about to drop the column `createdAt` on the `dock_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `dock_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `dock_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `dock_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `specialInstructions` on the `dock_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `dock_appointments` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SecurityPersonnelStatus" AS ENUM ('ACTIVE', 'ON_DUTY', 'OFF_DUTY', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "SecurityClearanceLevel" AS ENUM ('VISITOR', 'STANDARD', 'ELEVATED', 'HIGH', 'MAXIMUM');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GateEntryType" AS ENUM ('DELIVERY', 'PICKUP', 'VISITOR', 'EMPLOYEE', 'CONTRACTOR', 'SERVICE_VEHICLE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "EntryDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('TRUCK', 'VAN', 'CAR', 'MOTORCYCLE', 'FORKLIFT', 'TRAILER', 'CONTAINER', 'OTHER');

-- CreateEnum
CREATE TYPE "GateEntryStatus" AS ENUM ('SCHEDULED', 'CHECKED_IN', 'PROCESSING', 'APPROVED', 'DENIED', 'CHECKED_OUT', 'OVERSTAYED');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('PRE_REGISTERED', 'CHECKED_IN', 'ON_PREMISES', 'CHECKED_OUT', 'BANNED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SecurityIncidentType" AS ENUM ('THEFT', 'VANDALISM', 'TRESPASSING', 'UNAUTHORIZED_ACCESS', 'SAFETY_VIOLATION', 'FIRE', 'MEDICAL_EMERGENCY', 'VEHICLE_ACCIDENT', 'SUSPICIOUS_ACTIVITY', 'POLICY_VIOLATION', 'EQUIPMENT_DAMAGE', 'MISSING_PERSON', 'ALTERCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('REPORTED', 'INVESTIGATING', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('ENTRY', 'EXIT', 'ATTEMPT');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('EMPLOYEE', 'VISITOR', 'CONTRACTOR', 'SECURITY_PERSONNEL', 'DELIVERY_DRIVER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AccessMethod" AS ENUM ('BADGE', 'PIN', 'BIOMETRIC', 'FACIAL_RECOGNITION', 'LICENSE_PLATE', 'MANUAL_OVERRIDE', 'QR_CODE', 'MOBILE_APP');

-- CreateEnum
CREATE TYPE "CameraType" AS ENUM ('FIXED', 'PTZ', 'DOME', 'BULLET', 'THERMAL', 'LICENSE_PLATE_READER', 'BODY_CAMERA');

-- AlterTable
ALTER TABLE "dock_appointments" DROP COLUMN "createdAt",
DROP COLUMN "createdById",
DROP COLUMN "metadata",
DROP COLUMN "notes",
DROP COLUMN "specialInstructions",
DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "security_personnel" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "badgeNumber" TEXT NOT NULL,
    "status" "SecurityPersonnelStatus" NOT NULL DEFAULT 'ACTIVE',
    "hireDate" TIMESTAMP(3) NOT NULL,
    "terminationDate" TIMESTAMP(3),
    "warehouseId" TEXT,
    "primaryZone" TEXT,
    "clearanceLevel" "SecurityClearanceLevel" NOT NULL DEFAULT 'STANDARD',
    "certifications" JSONB,
    "trainingExpiry" TIMESTAMP(3),
    "accessCardNumber" TEXT,
    "accessCardExpiry" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_shifts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "shiftDate" TIMESTAMP(3) NOT NULL,
    "shiftType" "ShiftType" NOT NULL DEFAULT 'DAY',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "warehouseId" TEXT,
    "assignedZone" TEXT,
    "assignedPost" TEXT,
    "status" "ShiftStatus" NOT NULL DEFAULT 'SCHEDULED',
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "patrols" INTEGER NOT NULL DEFAULT 0,
    "incidentsReported" INTEGER NOT NULL DEFAULT 0,
    "visitorsProcessed" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_entries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "entryType" "GateEntryType" NOT NULL,
    "direction" "EntryDirection" NOT NULL,
    "warehouseId" TEXT,
    "gateNumber" TEXT,
    "vehicleType" "VehicleType",
    "vehicleNumber" TEXT,
    "licensePlate" TEXT,
    "trailerNumber" TEXT,
    "driverName" TEXT,
    "driverLicense" TEXT,
    "driverPhone" TEXT,
    "carrierName" TEXT,
    "visitorName" TEXT,
    "visitorCompany" TEXT,
    "visitorId" TEXT,
    "visitorPhone" TEXT,
    "visitorEmail" TEXT,
    "purposeOfVisit" TEXT,
    "hostName" TEXT,
    "appointmentId" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "referenceNumber" TEXT,
    "securityPersonnelId" TEXT,
    "securityCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "securityNotes" TEXT,
    "scheduledTime" TIMESTAMP(3),
    "entryTime" TIMESTAMP(3) NOT NULL,
    "exitTime" TIMESTAMP(3),
    "duration" INTEGER,
    "cargoDescription" TEXT,
    "numberOfPallets" INTEGER,
    "estimatedWeight" DOUBLE PRECISION,
    "hasDangerousGoods" BOOLEAN NOT NULL DEFAULT false,
    "vehiclePhoto" TEXT,
    "driverIdPhoto" TEXT,
    "documents" JSONB,
    "status" "GateEntryStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gate_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "idType" TEXT,
    "idNumber" TEXT,
    "badgeNumber" TEXT,
    "badgeIssued" TIMESTAMP(3),
    "badgeReturned" TIMESTAMP(3),
    "visitDate" TIMESTAMP(3) NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TIMESTAMP(3),
    "purposeOfVisit" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "hostDepartment" TEXT,
    "hostPhone" TEXT,
    "warehouseId" TEXT,
    "allowedAreas" JSONB,
    "securityCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "securityPersonnelId" TEXT,
    "photo" TEXT,
    "idPhoto" TEXT,
    "status" "VisitorStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "escortRequired" BOOLEAN NOT NULL DEFAULT false,
    "escortName" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_incidents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "incidentNumber" TEXT NOT NULL,
    "incidentType" "SecurityIncidentType" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "warehouseId" TEXT,
    "locationDetails" TEXT,
    "zoneId" TEXT,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,
    "investigatorId" TEXT,
    "personsInvolved" JSONB,
    "witnesses" JSONB,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "investigationNotes" TEXT,
    "actionTaken" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "policeNotified" BOOLEAN NOT NULL DEFAULT false,
    "policeReportNumber" TEXT,
    "policeDepartment" TEXT,
    "photos" JSONB,
    "videos" JSONB,
    "documents" JSONB,
    "cameraFootage" JSONB,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_access_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "accessTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessType" "AccessType" NOT NULL,
    "accessPoint" TEXT NOT NULL,
    "personType" "PersonType" NOT NULL,
    "personId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "badgeNumber" TEXT,
    "personnelId" TEXT,
    "warehouseId" TEXT,
    "zoneId" TEXT,
    "locationId" TEXT,
    "accessGranted" BOOLEAN NOT NULL,
    "accessMethod" "AccessMethod" NOT NULL,
    "denialReason" TEXT,
    "deviceId" TEXT,
    "deviceType" TEXT,
    "metadata" JSONB,

    CONSTRAINT "security_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camera_systems" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "cameraName" TEXT NOT NULL,
    "cameraType" "CameraType" NOT NULL,
    "manufacturer" TEXT,
    "modelNumber" TEXT,
    "warehouseId" TEXT,
    "locationDetails" TEXT NOT NULL,
    "zoneId" TEXT,
    "mountingType" TEXT,
    "viewDirection" TEXT,
    "coverageArea" TEXT,
    "fieldOfView" INTEGER,
    "resolution" TEXT,
    "hasNightVision" BOOLEAN NOT NULL DEFAULT false,
    "hasPTZ" BOOLEAN NOT NULL DEFAULT false,
    "hasAudio" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "streamUrl" TEXT,
    "recordingUrl" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'OFFLINE',
    "isRecording" BOOLEAN NOT NULL DEFAULT false,
    "lastOnline" TIMESTAMP(3),
    "storageLocation" TEXT,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "metadata" JSONB,
    "installedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "camera_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_control_zones" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "zoneName" TEXT NOT NULL,
    "zoneCode" TEXT NOT NULL,
    "description" TEXT,
    "warehouseId" TEXT,
    "parentZoneId" TEXT,
    "securityLevel" "SecurityClearanceLevel" NOT NULL DEFAULT 'STANDARD',
    "requiresEscort" BOOLEAN NOT NULL DEFAULT false,
    "allowedRoles" JSONB,
    "restrictedTimes" JSONB,
    "maxOccupancy" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_control_zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "security_personnel_employeeId_key" ON "security_personnel"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "security_personnel_badgeNumber_key" ON "security_personnel"("badgeNumber");

-- CreateIndex
CREATE INDEX "security_personnel_organizationId_idx" ON "security_personnel"("organizationId");

-- CreateIndex
CREATE INDEX "security_personnel_warehouseId_idx" ON "security_personnel"("warehouseId");

-- CreateIndex
CREATE INDEX "security_personnel_status_idx" ON "security_personnel"("status");

-- CreateIndex
CREATE INDEX "security_personnel_clearanceLevel_idx" ON "security_personnel"("clearanceLevel");

-- CreateIndex
CREATE UNIQUE INDEX "security_personnel_organizationId_badgeNumber_key" ON "security_personnel"("organizationId", "badgeNumber");

-- CreateIndex
CREATE INDEX "security_shifts_organizationId_idx" ON "security_shifts"("organizationId");

-- CreateIndex
CREATE INDEX "security_shifts_personnelId_idx" ON "security_shifts"("personnelId");

-- CreateIndex
CREATE INDEX "security_shifts_shiftDate_idx" ON "security_shifts"("shiftDate");

-- CreateIndex
CREATE INDEX "security_shifts_warehouseId_idx" ON "security_shifts"("warehouseId");

-- CreateIndex
CREATE INDEX "gate_entries_organizationId_idx" ON "gate_entries"("organizationId");

-- CreateIndex
CREATE INDEX "gate_entries_appointmentId_idx" ON "gate_entries"("appointmentId");

-- CreateIndex
CREATE INDEX "gate_entries_warehouseId_idx" ON "gate_entries"("warehouseId");

-- CreateIndex
CREATE INDEX "gate_entries_entryTime_idx" ON "gate_entries"("entryTime");

-- CreateIndex
CREATE INDEX "gate_entries_licensePlate_idx" ON "gate_entries"("licensePlate");

-- CreateIndex
CREATE INDEX "gate_entries_status_idx" ON "gate_entries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "gate_entries_organizationId_entryNumber_key" ON "gate_entries"("organizationId", "entryNumber");

-- CreateIndex
CREATE INDEX "visitors_organizationId_idx" ON "visitors"("organizationId");

-- CreateIndex
CREATE INDEX "visitors_warehouseId_idx" ON "visitors"("warehouseId");

-- CreateIndex
CREATE INDEX "visitors_visitDate_idx" ON "visitors"("visitDate");

-- CreateIndex
CREATE INDEX "visitors_status_idx" ON "visitors"("status");

-- CreateIndex
CREATE INDEX "visitors_phone_idx" ON "visitors"("phone");

-- CreateIndex
CREATE INDEX "security_incidents_organizationId_idx" ON "security_incidents"("organizationId");

-- CreateIndex
CREATE INDEX "security_incidents_warehouseId_idx" ON "security_incidents"("warehouseId");

-- CreateIndex
CREATE INDEX "security_incidents_incidentDate_idx" ON "security_incidents"("incidentDate");

-- CreateIndex
CREATE INDEX "security_incidents_incidentType_idx" ON "security_incidents"("incidentType");

-- CreateIndex
CREATE INDEX "security_incidents_severity_idx" ON "security_incidents"("severity");

-- CreateIndex
CREATE INDEX "security_incidents_status_idx" ON "security_incidents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "security_incidents_organizationId_incidentNumber_key" ON "security_incidents"("organizationId", "incidentNumber");

-- CreateIndex
CREATE INDEX "security_access_logs_organizationId_idx" ON "security_access_logs"("organizationId");

-- CreateIndex
CREATE INDEX "security_access_logs_accessTime_idx" ON "security_access_logs"("accessTime");

-- CreateIndex
CREATE INDEX "security_access_logs_personId_idx" ON "security_access_logs"("personId");

-- CreateIndex
CREATE INDEX "security_access_logs_warehouseId_idx" ON "security_access_logs"("warehouseId");

-- CreateIndex
CREATE INDEX "security_access_logs_accessGranted_idx" ON "security_access_logs"("accessGranted");

-- CreateIndex
CREATE UNIQUE INDEX "camera_systems_cameraId_key" ON "camera_systems"("cameraId");

-- CreateIndex
CREATE INDEX "camera_systems_organizationId_idx" ON "camera_systems"("organizationId");

-- CreateIndex
CREATE INDEX "camera_systems_warehouseId_idx" ON "camera_systems"("warehouseId");

-- CreateIndex
CREATE INDEX "camera_systems_status_idx" ON "camera_systems"("status");

-- CreateIndex
CREATE INDEX "camera_systems_isRecording_idx" ON "camera_systems"("isRecording");

-- CreateIndex
CREATE INDEX "access_control_zones_organizationId_idx" ON "access_control_zones"("organizationId");

-- CreateIndex
CREATE INDEX "access_control_zones_warehouseId_idx" ON "access_control_zones"("warehouseId");

-- CreateIndex
CREATE INDEX "access_control_zones_securityLevel_idx" ON "access_control_zones"("securityLevel");

-- CreateIndex
CREATE UNIQUE INDEX "access_control_zones_organizationId_zoneCode_key" ON "access_control_zones"("organizationId", "zoneCode");

-- AddForeignKey
ALTER TABLE "security_personnel" ADD CONSTRAINT "security_personnel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_personnel" ADD CONSTRAINT "security_personnel_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_shifts" ADD CONSTRAINT "security_shifts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_shifts" ADD CONSTRAINT "security_shifts_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "security_personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_entries" ADD CONSTRAINT "gate_entries_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "dock_appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_entries" ADD CONSTRAINT "gate_entries_securityPersonnelId_fkey" FOREIGN KEY ("securityPersonnelId") REFERENCES "security_personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_entries" ADD CONSTRAINT "gate_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_securityPersonnelId_fkey" FOREIGN KEY ("securityPersonnelId") REFERENCES "security_personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "security_personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "security_personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_access_logs" ADD CONSTRAINT "security_access_logs_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "security_personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_access_logs" ADD CONSTRAINT "security_access_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_systems" ADD CONSTRAINT "camera_systems_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_control_zones" ADD CONSTRAINT "access_control_zones_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
