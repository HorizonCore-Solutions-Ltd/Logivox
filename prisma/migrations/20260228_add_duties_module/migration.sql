-- =============================================================================
-- Duties Module: DutyType, Duty, DutyEvidence + enums
-- =============================================================================

-- Enums
CREATE TYPE "DutyStatus" AS ENUM ('PLANNED','ACTIVE','PAUSED','DONE','CANCELLED','SKIPPED','ESCALATED');
CREATE TYPE "DutyPriority" AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
CREATE TYPE "DutyCategory" AS ENUM ('RECEIVING','PICKING','PACKING','QUALITY_CHECK','SAFETY_INSPECTION','MAINTENANCE','CAPA_CONTAINMENT','CAPA_INVESTIGATION','CAPA_CORRECTIVE','CAPA_PREVENTIVE','CAPA_VERIFICATION','CLEANING','TRAINING','HANDOVER','AUDIT','OTHER');
CREATE TYPE "EvidenceType" AS ENUM ('PHOTO','VOICE_NOTE','TEXT_NOTE','NUMERIC_READING','SIGNATURE','BARCODE_SCAN','TEMPERATURE','CHECKLIST');

-- DutyType
CREATE TABLE "duty_types" (
    "id"               TEXT NOT NULL,
    "organizationId"   TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "category"         "DutyCategory" NOT NULL DEFAULT 'OTHER',
    "description"      TEXT,
    "requiredSkills"   TEXT[] DEFAULT '{}',
    "requiredCerts"    TEXT[] DEFAULT '{}',
    "defaultDuration"  INTEGER NOT NULL DEFAULT 30,
    "voiceTemplate"    JSONB,
    "checklistItems"   JSONB,
    "requiresEvidence" BOOLEAN NOT NULL DEFAULT false,
    "evidenceTypes"    TEXT[] DEFAULT '{}',
    "isActive"         BOOLEAN NOT NULL DEFAULT true,
    "metadata"         JSONB,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "duty_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "duty_types_organizationId_name_key" ON "duty_types"("organizationId","name");
CREATE INDEX "duty_types_organizationId_idx" ON "duty_types"("organizationId");
CREATE INDEX "duty_types_category_idx" ON "duty_types"("category");
ALTER TABLE "duty_types" ADD CONSTRAINT "duty_types_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Duty
CREATE TABLE "duties" (
    "id"                 TEXT NOT NULL,
    "organizationId"     TEXT NOT NULL,
    "dutyTypeId"         TEXT,
    "shiftId"            TEXT,
    "employeeId"         TEXT,
    "assignedBy"         TEXT,
    "zoneId"             TEXT,
    "zoneName"           TEXT,
    "warehouseId"        TEXT,
    "title"              TEXT NOT NULL,
    "description"        TEXT,
    "category"           "DutyCategory" NOT NULL DEFAULT 'OTHER',
    "status"             "DutyStatus" NOT NULL DEFAULT 'PLANNED',
    "priority"           "DutyPriority" NOT NULL DEFAULT 'MEDIUM',
    "scheduledStart"     TIMESTAMP(3),
    "scheduledEnd"       TIMESTAMP(3),
    "actualStart"        TIMESTAMP(3),
    "actualEnd"          TIMESTAMP(3),
    "durationMinutes"    INTEGER,
    "slaMinutes"         INTEGER,
    "slaBreached"        BOOLEAN NOT NULL DEFAULT false,
    "capaId"             TEXT,
    "capaStage"          TEXT,
    "ncrId"              TEXT,
    "autoAssigned"       BOOLEAN NOT NULL DEFAULT false,
    "assignmentRule"     TEXT,
    "voiceScriptRef"     TEXT,
    "voiceSessionId"     TEXT,
    "checklistItems"     JSONB,
    "completionNotes"    TEXT,
    "rejectionReason"    TEXT,
    "previousEmployeeId" TEXT,
    "reassignReason"     TEXT,
    "reassignCount"      INTEGER NOT NULL DEFAULT 0,
    "metadata"           JSONB,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "duties_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "duties_organizationId_idx" ON "duties"("organizationId");
CREATE INDEX "duties_status_idx" ON "duties"("status");
CREATE INDEX "duties_employeeId_idx" ON "duties"("employeeId");
CREATE INDEX "duties_shiftId_idx" ON "duties"("shiftId");
CREATE INDEX "duties_capaId_idx" ON "duties"("capaId");
CREATE INDEX "duties_scheduledStart_idx" ON "duties"("scheduledStart");
CREATE INDEX "duties_slaBreached_idx" ON "duties"("slaBreached");
ALTER TABLE "duties" ADD CONSTRAINT "duties_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "duties" ADD CONSTRAINT "duties_dutyTypeId_fkey"
    FOREIGN KEY ("dutyTypeId") REFERENCES "duty_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DutyEvidence
CREATE TABLE "duty_evidence" (
    "id"           TEXT NOT NULL,
    "dutyId"       TEXT NOT NULL,
    "evidenceType" "EvidenceType" NOT NULL,
    "label"        TEXT,
    "value"        TEXT,
    "fileKey"      TEXT,
    "capturedBy"   TEXT,
    "capturedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata"     JSONB,
    CONSTRAINT "duty_evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "duty_evidence_dutyId_idx" ON "duty_evidence"("dutyId");
ALTER TABLE "duty_evidence" ADD CONSTRAINT "duty_evidence_dutyId_fkey"
    FOREIGN KEY ("dutyId") REFERENCES "duties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
