-- CreateEnum
CREATE TYPE "SupplierRole" AS ENUM ('VIEWER', 'RESPONDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISED');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('PROCESS', 'PRODUCT', 'SUPPLIER', 'REGULATORY', 'SAFETY', 'ENVIRONMENTAL', 'FINANCIAL', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('IDENTIFIED', 'ASSESSED', 'MITIGATION_PLANNED', 'MITIGATING', 'MITIGATED', 'ACCEPTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('INTERNAL', 'SUPPLIER', 'CUSTOMER', 'REGULATORY', 'CERTIFICATION');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'REPORT_ISSUED', 'CLOSED');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('MAJOR', 'MINOR', 'OBSERVATION');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('OPEN', 'CAPA_ASSIGNED', 'PENDING_VERIFICATION', 'VERIFIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SOP', 'WORK_INSTRUCTION', 'FORM', 'QUALITY_MANUAL', 'SPECIFICATION', 'PROCEDURE', 'POLICY', 'DRAWING');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'EFFECTIVE', 'UNDER_REVIEW', 'OBSOLETE');

-- CreateEnum
CREATE TYPE "FMEAType" AS ENUM ('PROCESS_FMEA', 'DESIGN_FMEA', 'SYSTEM_FMEA');

-- CreateEnum
CREATE TYPE "FMEAStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'UNDER_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "FMEAItemStatus" AS ENUM ('OPEN', 'ACTION_PLANNED', 'ACTION_IN_PROGRESS', 'ACTION_COMPLETED', 'CLOSED');

-- CreateTable
CREATE TABLE "supplier_users" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "SupplierRole" NOT NULL,
    "phone" TEXT,
    "last_login" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_responses" (
    "id" TEXT NOT NULL,
    "ncr_id" TEXT NOT NULL,
    "responded_by_id" TEXT NOT NULL,
    "response_date" TIMESTAMP(3) NOT NULL,
    "eightD" JSONB NOT NULL,
    "root_cause" TEXT,
    "corrective_action" TEXT,
    "preventive_action" TEXT,
    "attachments" JSONB,
    "photos" JSONB,
    "status" "ResponseStatus" NOT NULL,
    "approved_by" TEXT,
    "approved_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_register" (
    "id" TEXT NOT NULL,
    "risk_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "RiskCategory" NOT NULL,
    "process_area" TEXT,
    "severity" INTEGER NOT NULL,
    "occurrence" INTEGER NOT NULL,
    "detection" INTEGER NOT NULL,
    "rpn" INTEGER NOT NULL,
    "mitigation_plan" TEXT,
    "mitigation_owner" TEXT,
    "mitigation_date" TIMESTAMP(3),
    "residual_severity" INTEGER,
    "residual_occurrence" INTEGER,
    "residual_detection" INTEGER,
    "residual_rpn" INTEGER,
    "status" "RiskStatus" NOT NULL,
    "owner" TEXT NOT NULL,
    "review_date" TIMESTAMP(3),
    "next_review_date" TIMESTAMP(3),
    "linked_ncr_ids" TEXT[],
    "linked_capa_ids" TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_register_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" TEXT NOT NULL,
    "audit_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "AuditType" NOT NULL,
    "scope" TEXT NOT NULL,
    "standard" TEXT,
    "audit_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "auditor_name" TEXT NOT NULL,
    "auditor_id" TEXT,
    "auditor_org" TEXT,
    "auditee_name" TEXT,
    "auditee_id" TEXT,
    "supplier_id" TEXT,
    "status" "AuditStatus" NOT NULL,
    "report_path" TEXT,
    "summary" TEXT,
    "recommendations" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_findings" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "finding_number" TEXT NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "clause" TEXT,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "requirement" TEXT,
    "ncr_id" TEXT,
    "capa_id" TEXT,
    "status" "FindingStatus" NOT NULL,
    "responsible_person" TEXT,
    "due_date" TIMESTAMP(3),
    "closed_date" TIMESTAMP(3),
    "closure_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "doc_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "description" TEXT,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER,
    "file_type" TEXT,
    "owner" TEXT NOT NULL,
    "department" TEXT,
    "status" "DocumentStatus" NOT NULL,
    "approved_by" TEXT,
    "approved_date" TIMESTAMP(3),
    "effective_date" TIMESTAMP(3),
    "review_date" TIMESTAMP(3),
    "next_review_date" TIMESTAMP(3),
    "obsolete_date" TIMESTAMP(3),
    "linked_ncr_ids" TEXT[],
    "linked_capa_ids" TEXT[],
    "linked_risk_ids" TEXT[],
    "training_required" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_revisions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "document_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_acknowledgments" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "trained_date" TIMESTAMP(3) NOT NULL,
    "signature" TEXT,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "training_acknowledgments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fmeas" (
    "id" TEXT NOT NULL,
    "fmea_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "FMEAType" NOT NULL,
    "process_name" TEXT,
    "product_name" TEXT,
    "scope" TEXT NOT NULL,
    "team_lead" TEXT NOT NULL,
    "teamMembers" JSONB NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "last_review_date" TIMESTAMP(3),
    "status" "FMEAStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fmeas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fmea_failure_modes" (
    "id" TEXT NOT NULL,
    "fmea_id" TEXT NOT NULL,
    "process_step" TEXT NOT NULL,
    "process_function" TEXT NOT NULL,
    "failure_mode" TEXT NOT NULL,
    "effects_of_failure" TEXT NOT NULL,
    "potential_causes" TEXT NOT NULL,
    "current_controls" TEXT,
    "severity" INTEGER NOT NULL,
    "occurrence" INTEGER NOT NULL,
    "detection" INTEGER NOT NULL,
    "rpn" INTEGER NOT NULL,
    "recommended_actions" TEXT,
    "responsible_person" TEXT,
    "target_date" TIMESTAMP(3),
    "actions_taken" TEXT,
    "residual_severity" INTEGER,
    "residual_occurrence" INTEGER,
    "residual_detection" INTEGER,
    "residual_rpn" INTEGER,
    "status" "FMEAItemStatus" NOT NULL,
    "linked_capa_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fmea_failure_modes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_users_email_key" ON "supplier_users"("email");

-- CreateIndex
CREATE INDEX "supplier_users_supplier_id_idx" ON "supplier_users"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_users_email_idx" ON "supplier_users"("email");

-- CreateIndex
CREATE INDEX "supplier_responses_ncr_id_idx" ON "supplier_responses"("ncr_id");

-- CreateIndex
CREATE INDEX "supplier_responses_responded_by_id_idx" ON "supplier_responses"("responded_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "risk_register_risk_number_key" ON "risk_register"("risk_number");

-- CreateIndex
CREATE INDEX "risk_register_organization_id_idx" ON "risk_register"("organization_id");

-- CreateIndex
CREATE INDEX "risk_register_status_idx" ON "risk_register"("status");

-- CreateIndex
CREATE INDEX "risk_register_rpn_idx" ON "risk_register"("rpn");

-- CreateIndex
CREATE UNIQUE INDEX "audits_audit_number_key" ON "audits"("audit_number");

-- CreateIndex
CREATE INDEX "audits_organization_id_idx" ON "audits"("organization_id");

-- CreateIndex
CREATE INDEX "audits_supplier_id_idx" ON "audits"("supplier_id");

-- CreateIndex
CREATE INDEX "audits_type_idx" ON "audits"("type");

-- CreateIndex
CREATE INDEX "audits_status_idx" ON "audits"("status");

-- CreateIndex
CREATE INDEX "audit_findings_audit_id_idx" ON "audit_findings"("audit_id");

-- CreateIndex
CREATE INDEX "audit_findings_severity_idx" ON "audit_findings"("severity");

-- CreateIndex
CREATE INDEX "audit_findings_status_idx" ON "audit_findings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "documents_doc_number_key" ON "documents"("doc_number");

-- CreateIndex
CREATE INDEX "documents_organization_id_idx" ON "documents"("organization_id");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "document_revisions_document_id_idx" ON "document_revisions"("document_id");

-- CreateIndex
CREATE INDEX "training_acknowledgments_document_id_idx" ON "training_acknowledgments"("document_id");

-- CreateIndex
CREATE INDEX "training_acknowledgments_user_id_idx" ON "training_acknowledgments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "fmeas_fmea_number_key" ON "fmeas"("fmea_number");

-- CreateIndex
CREATE INDEX "fmeas_organization_id_idx" ON "fmeas"("organization_id");

-- CreateIndex
CREATE INDEX "fmeas_type_idx" ON "fmeas"("type");

-- CreateIndex
CREATE INDEX "fmea_failure_modes_fmea_id_idx" ON "fmea_failure_modes"("fmea_id");

-- CreateIndex
CREATE INDEX "fmea_failure_modes_rpn_idx" ON "fmea_failure_modes"("rpn");

-- AddForeignKey
ALTER TABLE "supplier_users" ADD CONSTRAINT "supplier_users_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_responses" ADD CONSTRAINT "supplier_responses_ncr_id_fkey" FOREIGN KEY ("ncr_id") REFERENCES "non_conformance_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_responses" ADD CONSTRAINT "supplier_responses_responded_by_id_fkey" FOREIGN KEY ("responded_by_id") REFERENCES "supplier_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_register" ADD CONSTRAINT "risk_register_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_revisions" ADD CONSTRAINT "document_revisions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_acknowledgments" ADD CONSTRAINT "training_acknowledgments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fmeas" ADD CONSTRAINT "fmeas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fmea_failure_modes" ADD CONSTRAINT "fmea_failure_modes_fmea_id_fkey" FOREIGN KEY ("fmea_id") REFERENCES "fmeas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
