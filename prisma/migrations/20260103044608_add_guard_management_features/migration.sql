-- CreateEnum
CREATE TYPE "PatrolCheckpointType" AS ENUM ('QR_CODE', 'NFC', 'GPS', 'MANUAL');

-- CreateEnum
CREATE TYPE "PatrolStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PanicAlertStatus" AS ENUM ('ACTIVE', 'RESPONDING', 'RESOLVED', 'FALSE_ALARM');

-- CreateEnum
CREATE TYPE "PanicResponseType" AS ENUM ('ACKNOWLEDGED', 'EN_ROUTE', 'ARRIVED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "GeofenceType" AS ENUM ('ALLOWED', 'RESTRICTED', 'ALERT_ONLY', 'SAFETY_ZONE');

-- CreateEnum
CREATE TYPE "GeofenceViolationType" AS ENUM ('ENTERED_RESTRICTED', 'EXITED_ALLOWED', 'ENTERED_ALERT_ZONE', 'SPEEDING', 'LOITERING');

-- CreateEnum
CREATE TYPE "DARStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('RADIO', 'TORCH', 'BATON', 'KEYS', 'ACCESS_CARD', 'VEHICLE', 'CAMERA', 'TABLET', 'FIRST_AID_KIT', 'FIRE_EXTINGUISHER', 'OTHER');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'DAMAGED', 'LOST', 'RETIRED');

-- CreateEnum
CREATE TYPE "EquipmentCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'BROKEN');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('ROUTINE', 'REPAIR', 'CALIBRATION', 'BATTERY_REPLACEMENT', 'SOFTWARE_UPDATE', 'INSPECTION');

-- CreateEnum
CREATE TYPE "HandoverStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "CertificationType" AS ENUM ('SIA_LICENSE', 'FIRST_AID', 'FIRE_SAFETY', 'CPR', 'DRIVERS_LICENSE', 'FORKLIFT', 'CCTV_OPERATOR', 'CONFLICT_MANAGEMENT', 'HEALTH_SAFETY', 'OTHER');

-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('VALID', 'EXPIRING_SOON', 'EXPIRED', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('ONBOARDING', 'COMPLIANCE', 'SAFETY', 'TECHNICAL', 'SOFT_SKILLS', 'REFRESHER');

-- CreateEnum
CREATE TYPE "ManifestStatus" AS ENUM ('PENDING', 'VERIFIED', 'DISCREPANCY', 'FORWARDED');

-- CreateTable
CREATE TABLE "patrol_routes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "warehouseId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT,
    "estimatedMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patrol_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrol_checkpoints" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "checkpointNumber" INTEGER NOT NULL,
    "checkpointType" "PatrolCheckpointType" NOT NULL DEFAULT 'QR_CODE',
    "qrCode" TEXT,
    "nfcId" TEXT,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,
    "gpsRadius" DOUBLE PRECISION DEFAULT 50,
    "instructions" TEXT,
    "photoRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patrol_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrol_executions" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" "PatrolStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalCheckpoints" INTEGER NOT NULL,
    "scannedCheckpoints" INTEGER NOT NULL DEFAULT 0,
    "missedCheckpoints" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "completionRate" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patrol_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoint_scans" (
    "id" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "scanTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanMethod" "PatrolCheckpointType" NOT NULL,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "notes" TEXT,
    "issueReported" BOOLEAN NOT NULL DEFAULT false,
    "issueDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkpoint_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panic_alerts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "location" TEXT,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,
    "audioUrl" TEXT,
    "videoUrl" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PanicAlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "isFalseAlarm" BOOLEAN NOT NULL DEFAULT false,
    "responseTime" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panic_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panic_responses" (
    "id" TEXT NOT NULL,
    "panicAlertId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "responderName" TEXT NOT NULL,
    "responseType" "PanicResponseType" NOT NULL,
    "responseTime" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "panic_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guard_locations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "gpsLat" DOUBLE PRECISION NOT NULL,
    "gpsLng" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "batteryLevel" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "guard_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geofences" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "warehouseId" TEXT,
    "zoneType" "GeofenceType" NOT NULL,
    "coordinates" JSONB NOT NULL,
    "radius" DOUBLE PRECISION,
    "centerLat" DOUBLE PRECISION,
    "centerLng" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "alertOnEntry" BOOLEAN NOT NULL DEFAULT false,
    "alertOnExit" BOOLEAN NOT NULL DEFAULT false,
    "allowedGuards" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geofences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geofence_violations" (
    "id" TEXT NOT NULL,
    "geofenceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "violationType" "GeofenceViolationType" NOT NULL,
    "gpsLat" DOUBLE PRECISION NOT NULL,
    "gpsLng" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "geofence_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_activity_reports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "warehouseId" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "shiftType" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "supervisorId" TEXT,
    "supervisorName" TEXT,
    "shiftStart" TIMESTAMP(3) NOT NULL,
    "shiftEnd" TIMESTAMP(3) NOT NULL,
    "totalHours" DOUBLE PRECISION,
    "gateEntries" INTEGER NOT NULL DEFAULT 0,
    "gateExits" INTEGER NOT NULL DEFAULT 0,
    "visitorCheckIns" INTEGER NOT NULL DEFAULT 0,
    "visitorCheckOuts" INTEGER NOT NULL DEFAULT 0,
    "incidentsReported" INTEGER NOT NULL DEFAULT 0,
    "patrolsCompleted" INTEGER NOT NULL DEFAULT 0,
    "checkpointsScanned" INTEGER NOT NULL DEFAULT 0,
    "weatherConditions" TEXT,
    "temperature" DOUBLE PRECISION,
    "equipmentStatus" JSONB,
    "observations" TEXT,
    "significantEvents" TEXT,
    "handoverNotes" TEXT,
    "guardSignature" TEXT,
    "guardSignedAt" TIMESTAMP(3),
    "supervisorSignature" TEXT,
    "supervisorSignedAt" TIMESTAMP(3),
    "status" "DARStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_activity_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "equipmentType" "EquipmentType" NOT NULL,
    "equipmentNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" "EquipmentCondition" NOT NULL DEFAULT 'GOOD',
    "currentGuardId" TEXT,
    "location" TEXT,
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_checkouts" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "checkoutTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturn" TIMESTAMP(3),
    "returnTime" TIMESTAMP(3),
    "returnedBy" TEXT,
    "condition" "EquipmentCondition",
    "notes" TEXT,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "equipment_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_maintenance" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "maintenanceType" "MaintenanceType" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "maintenanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDueDate" TIMESTAMP(3),
    "cost" DECIMAL(10,2),
    "description" TEXT NOT NULL,
    "partsReplaced" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_handovers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "handoverNumber" TEXT NOT NULL,
    "warehouseId" TEXT,
    "handoverDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outgoingGuardId" TEXT NOT NULL,
    "outgoingGuardName" TEXT NOT NULL,
    "outgoingShift" TEXT NOT NULL,
    "outgoingSignature" TEXT,
    "outgoingSignedAt" TIMESTAMP(3),
    "incomingGuardId" TEXT NOT NULL,
    "incomingGuardName" TEXT NOT NULL,
    "incomingShift" TEXT NOT NULL,
    "incomingSignature" TEXT,
    "incomingSignedAt" TIMESTAMP(3),
    "gateEntriesCount" INTEGER NOT NULL DEFAULT 0,
    "gateExitsCount" INTEGER NOT NULL DEFAULT 0,
    "currentVehiclesOnSite" INTEGER NOT NULL DEFAULT 0,
    "visitorsCount" INTEGER NOT NULL DEFAULT 0,
    "incidentsCount" INTEGER NOT NULL DEFAULT 0,
    "patrolsCompleted" INTEGER NOT NULL DEFAULT 0,
    "keyEvents" JSONB,
    "ongoingIssues" TEXT,
    "equipmentStatus" JSONB,
    "notesForNextShift" TEXT,
    "status" "HandoverStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guard_certifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "certificationType" "CertificationType" NOT NULL,
    "certificationName" TEXT NOT NULL,
    "certificationNumber" TEXT,
    "issuer" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "status" "CertificationStatus" NOT NULL DEFAULT 'VALID',
    "documentUrl" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guard_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_courses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "description" TEXT,
    "courseType" "CourseType" NOT NULL,
    "duration" INTEGER,
    "validityPeriod" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "contentUrl" TEXT,
    "passingScore" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_completions" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "completionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "score" INTEGER,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "certificateUrl" TEXT,
    "instructorId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "truck_manifests" (
    "id" TEXT NOT NULL,
    "gateEntryId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "manifestNumber" TEXT,
    "manifestPhoto" TEXT,
    "ocrText" TEXT,
    "supplier" TEXT,
    "poNumbers" TEXT[],
    "expectedUnits" INTEGER,
    "actualUnits" INTEGER,
    "hasDiscrepancy" BOOLEAN NOT NULL DEFAULT false,
    "discrepancyNotes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationStatus" "ManifestStatus" NOT NULL DEFAULT 'PENDING',
    "forwardedToWarehouse" BOOLEAN NOT NULL DEFAULT false,
    "forwardedAt" TIMESTAMP(3),
    "forwardedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "truck_manifests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" DOUBLE PRECISION NOT NULL,
    "feelsLike" DOUBLE PRECISION,
    "humidity" INTEGER,
    "windSpeed" DOUBLE PRECISION,
    "windDirection" TEXT,
    "conditions" TEXT NOT NULL,
    "visibility" DOUBLE PRECISION,
    "pressure" DOUBLE PRECISION,
    "hasAlert" BOOLEAN NOT NULL DEFAULT false,
    "alertType" TEXT,
    "alertSeverity" TEXT,
    "alertMessage" TEXT,
    "source" TEXT NOT NULL DEFAULT 'OpenWeather',

    CONSTRAINT "weather_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patrol_routes_organizationId_idx" ON "patrol_routes"("organizationId");

-- CreateIndex
CREATE INDEX "patrol_routes_warehouseId_idx" ON "patrol_routes"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "patrol_checkpoints_qrCode_key" ON "patrol_checkpoints"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "patrol_checkpoints_nfcId_key" ON "patrol_checkpoints"("nfcId");

-- CreateIndex
CREATE INDEX "patrol_checkpoints_organizationId_idx" ON "patrol_checkpoints"("organizationId");

-- CreateIndex
CREATE INDEX "patrol_checkpoints_routeId_idx" ON "patrol_checkpoints"("routeId");

-- CreateIndex
CREATE INDEX "patrol_checkpoints_qrCode_idx" ON "patrol_checkpoints"("qrCode");

-- CreateIndex
CREATE INDEX "patrol_checkpoints_nfcId_idx" ON "patrol_checkpoints"("nfcId");

-- CreateIndex
CREATE INDEX "patrol_executions_organizationId_idx" ON "patrol_executions"("organizationId");

-- CreateIndex
CREATE INDEX "patrol_executions_routeId_idx" ON "patrol_executions"("routeId");

-- CreateIndex
CREATE INDEX "patrol_executions_guardId_idx" ON "patrol_executions"("guardId");

-- CreateIndex
CREATE INDEX "patrol_executions_startTime_idx" ON "patrol_executions"("startTime");

-- CreateIndex
CREATE INDEX "checkpoint_scans_organizationId_idx" ON "checkpoint_scans"("organizationId");

-- CreateIndex
CREATE INDEX "checkpoint_scans_checkpointId_idx" ON "checkpoint_scans"("checkpointId");

-- CreateIndex
CREATE INDEX "checkpoint_scans_executionId_idx" ON "checkpoint_scans"("executionId");

-- CreateIndex
CREATE INDEX "checkpoint_scans_guardId_idx" ON "checkpoint_scans"("guardId");

-- CreateIndex
CREATE INDEX "checkpoint_scans_scanTime_idx" ON "checkpoint_scans"("scanTime");

-- CreateIndex
CREATE INDEX "panic_alerts_organizationId_idx" ON "panic_alerts"("organizationId");

-- CreateIndex
CREATE INDEX "panic_alerts_guardId_idx" ON "panic_alerts"("guardId");

-- CreateIndex
CREATE INDEX "panic_alerts_triggeredAt_idx" ON "panic_alerts"("triggeredAt");

-- CreateIndex
CREATE INDEX "panic_alerts_status_idx" ON "panic_alerts"("status");

-- CreateIndex
CREATE INDEX "panic_responses_panicAlertId_idx" ON "panic_responses"("panicAlertId");

-- CreateIndex
CREATE INDEX "panic_responses_responderId_idx" ON "panic_responses"("responderId");

-- CreateIndex
CREATE INDEX "guard_locations_organizationId_idx" ON "guard_locations"("organizationId");

-- CreateIndex
CREATE INDEX "guard_locations_guardId_idx" ON "guard_locations"("guardId");

-- CreateIndex
CREATE INDEX "guard_locations_timestamp_idx" ON "guard_locations"("timestamp");

-- CreateIndex
CREATE INDEX "geofences_organizationId_idx" ON "geofences"("organizationId");

-- CreateIndex
CREATE INDEX "geofences_warehouseId_idx" ON "geofences"("warehouseId");

-- CreateIndex
CREATE INDEX "geofences_zoneType_idx" ON "geofences"("zoneType");

-- CreateIndex
CREATE INDEX "geofence_violations_organizationId_idx" ON "geofence_violations"("organizationId");

-- CreateIndex
CREATE INDEX "geofence_violations_geofenceId_idx" ON "geofence_violations"("geofenceId");

-- CreateIndex
CREATE INDEX "geofence_violations_guardId_idx" ON "geofence_violations"("guardId");

-- CreateIndex
CREATE INDEX "geofence_violations_timestamp_idx" ON "geofence_violations"("timestamp");

-- CreateIndex
CREATE INDEX "daily_activity_reports_organizationId_idx" ON "daily_activity_reports"("organizationId");

-- CreateIndex
CREATE INDEX "daily_activity_reports_reportDate_idx" ON "daily_activity_reports"("reportDate");

-- CreateIndex
CREATE INDEX "daily_activity_reports_guardId_idx" ON "daily_activity_reports"("guardId");

-- CreateIndex
CREATE INDEX "daily_activity_reports_status_idx" ON "daily_activity_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "daily_activity_reports_organizationId_reportNumber_key" ON "daily_activity_reports"("organizationId", "reportNumber");

-- CreateIndex
CREATE INDEX "equipment_organizationId_idx" ON "equipment"("organizationId");

-- CreateIndex
CREATE INDEX "equipment_equipmentType_idx" ON "equipment"("equipmentType");

-- CreateIndex
CREATE INDEX "equipment_status_idx" ON "equipment"("status");

-- CreateIndex
CREATE INDEX "equipment_currentGuardId_idx" ON "equipment"("currentGuardId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_organizationId_equipmentNumber_key" ON "equipment"("organizationId", "equipmentNumber");

-- CreateIndex
CREATE INDEX "equipment_checkouts_organizationId_idx" ON "equipment_checkouts"("organizationId");

-- CreateIndex
CREATE INDEX "equipment_checkouts_equipmentId_idx" ON "equipment_checkouts"("equipmentId");

-- CreateIndex
CREATE INDEX "equipment_checkouts_guardId_idx" ON "equipment_checkouts"("guardId");

-- CreateIndex
CREATE INDEX "equipment_checkouts_checkoutTime_idx" ON "equipment_checkouts"("checkoutTime");

-- CreateIndex
CREATE INDEX "equipment_maintenance_organizationId_idx" ON "equipment_maintenance"("organizationId");

-- CreateIndex
CREATE INDEX "equipment_maintenance_equipmentId_idx" ON "equipment_maintenance"("equipmentId");

-- CreateIndex
CREATE INDEX "equipment_maintenance_maintenanceDate_idx" ON "equipment_maintenance"("maintenanceDate");

-- CreateIndex
CREATE INDEX "shift_handovers_organizationId_idx" ON "shift_handovers"("organizationId");

-- CreateIndex
CREATE INDEX "shift_handovers_handoverDate_idx" ON "shift_handovers"("handoverDate");

-- CreateIndex
CREATE INDEX "shift_handovers_outgoingGuardId_idx" ON "shift_handovers"("outgoingGuardId");

-- CreateIndex
CREATE INDEX "shift_handovers_incomingGuardId_idx" ON "shift_handovers"("incomingGuardId");

-- CreateIndex
CREATE UNIQUE INDEX "shift_handovers_organizationId_handoverNumber_key" ON "shift_handovers"("organizationId", "handoverNumber");

-- CreateIndex
CREATE INDEX "guard_certifications_organizationId_idx" ON "guard_certifications"("organizationId");

-- CreateIndex
CREATE INDEX "guard_certifications_guardId_idx" ON "guard_certifications"("guardId");

-- CreateIndex
CREATE INDEX "guard_certifications_expiryDate_idx" ON "guard_certifications"("expiryDate");

-- CreateIndex
CREATE INDEX "guard_certifications_status_idx" ON "guard_certifications"("status");

-- CreateIndex
CREATE INDEX "training_courses_organizationId_idx" ON "training_courses"("organizationId");

-- CreateIndex
CREATE INDEX "training_courses_courseType_idx" ON "training_courses"("courseType");

-- CreateIndex
CREATE INDEX "training_completions_organizationId_idx" ON "training_completions"("organizationId");

-- CreateIndex
CREATE INDEX "training_completions_courseId_idx" ON "training_completions"("courseId");

-- CreateIndex
CREATE INDEX "training_completions_guardId_idx" ON "training_completions"("guardId");

-- CreateIndex
CREATE INDEX "training_completions_expiryDate_idx" ON "training_completions"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "truck_manifests_gateEntryId_key" ON "truck_manifests"("gateEntryId");

-- CreateIndex
CREATE INDEX "truck_manifests_organizationId_idx" ON "truck_manifests"("organizationId");

-- CreateIndex
CREATE INDEX "truck_manifests_gateEntryId_idx" ON "truck_manifests"("gateEntryId");

-- CreateIndex
CREATE INDEX "truck_manifests_verificationStatus_idx" ON "truck_manifests"("verificationStatus");

-- CreateIndex
CREATE INDEX "weather_logs_organizationId_idx" ON "weather_logs"("organizationId");

-- CreateIndex
CREATE INDEX "weather_logs_warehouseId_idx" ON "weather_logs"("warehouseId");

-- CreateIndex
CREATE INDEX "weather_logs_timestamp_idx" ON "weather_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "patrol_routes" ADD CONSTRAINT "patrol_routes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_checkpoints" ADD CONSTRAINT "patrol_checkpoints_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "patrol_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_executions" ADD CONSTRAINT "patrol_executions_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "patrol_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_scans" ADD CONSTRAINT "checkpoint_scans_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "patrol_checkpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_scans" ADD CONSTRAINT "checkpoint_scans_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "patrol_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panic_alerts" ADD CONSTRAINT "panic_alerts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panic_responses" ADD CONSTRAINT "panic_responses_panicAlertId_fkey" FOREIGN KEY ("panicAlertId") REFERENCES "panic_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guard_locations" ADD CONSTRAINT "guard_locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofence_violations" ADD CONSTRAINT "geofence_violations_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "geofences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activity_reports" ADD CONSTRAINT "daily_activity_reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_checkouts" ADD CONSTRAINT "equipment_checkouts_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_handovers" ADD CONSTRAINT "shift_handovers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guard_certifications" ADD CONSTRAINT "guard_certifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "truck_manifests" ADD CONSTRAINT "truck_manifests_gateEntryId_fkey" FOREIGN KEY ("gateEntryId") REFERENCES "gate_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_logs" ADD CONSTRAINT "weather_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
