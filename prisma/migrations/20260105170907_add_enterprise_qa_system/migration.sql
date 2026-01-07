/*
  Warnings:

  - You are about to drop the column `defect_rate` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - You are about to drop the column `defect_threshold` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - You are about to drop the column `dispute_documents` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - You are about to drop the column `dispute_resolution` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - You are about to drop the column `handling_fees` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - You are about to drop the column `invoice_url` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - You are about to drop the column `merchandise_cost` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - You are about to drop the column `payment_deduction` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - You are about to drop the column `penalty_amount` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - You are about to drop the column `rma_ids` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - You are about to drop the column `supplier_id` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - You are about to drop the column `total_chargeback_amount` on the `vendor_chargebacks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[chargeback_number]` on the table `vendor_chargebacks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `administrative_fee` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chargeback_number` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_refunds` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defective_merchandise_cost` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dispute_deadline` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dispute_window` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `handling_cost` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoice_date` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_due` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_terms` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quality_penalty` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendor_id` to the `vendor_chargebacks` table without a default value. This is not possible if the table is not empty.
  - Made the column `invoice_number` on table `vendor_chargebacks` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "BlogCategory" AS ENUM ('GENERAL', 'TECHNOLOGY', 'SECURITY', 'ARCHITECTURE', 'OPERATIONS', 'BUSINESS', 'CASE_STUDY', 'PRODUCT', 'BEST_PRACTICES', 'INDUSTRY_NEWS');

-- DropForeignKey
ALTER TABLE "public"."vendor_chargebacks" DROP CONSTRAINT "vendor_chargebacks_supplier_id_fkey";

-- DropIndex
DROP INDEX "public"."vendor_chargebacks_dispute_status_idx";

-- DropIndex
DROP INDEX "public"."vendor_chargebacks_supplier_id_idx";

-- AlterTable
ALTER TABLE "iot_devices" ADD COLUMN     "lastCalibration" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastSeen" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "signalStrength" DOUBLE PRECISION DEFAULT 100;

-- AlterTable
ALTER TABLE "vendor_chargebacks" DROP COLUMN "defect_rate",
DROP COLUMN "defect_threshold",
DROP COLUMN "dispute_documents",
DROP COLUMN "dispute_resolution",
DROP COLUMN "handling_fees",
DROP COLUMN "invoice_url",
DROP COLUMN "merchandise_cost",
DROP COLUMN "payment_deduction",
DROP COLUMN "penalty_amount",
DROP COLUMN "rma_ids",
DROP COLUMN "supplier_id",
DROP COLUMN "total_chargeback_amount",
ADD COLUMN     "adjusted_amount" DECIMAL(10,2),
ADD COLUMN     "administrative_fee" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "auto_deduct_from_payment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "chargeback_number" TEXT NOT NULL,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "customer_refunds" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "deduction_amount" DECIMAL(10,2),
ADD COLUMN     "deduction_date" TIMESTAMP(3),
ADD COLUMN     "deduction_scheduled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defective_merchandise_cost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "dispute_deadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dispute_outcome" TEXT,
ADD COLUMN     "dispute_window" INTEGER NOT NULL,
ADD COLUMN     "disputed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "disputed_amount" DECIMAL(10,2),
ADD COLUMN     "handling_cost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "invoice_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "invoice_pdf_url" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paid_amount" DECIMAL(10,2),
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payment_due" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "payment_terms" TEXT NOT NULL,
ADD COLUMN     "quality_penalty" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "rtv_ids" TEXT[],
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "supporting_documents" JSONB,
ADD COLUMN     "total_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "vendor_id" TEXT NOT NULL,
ALTER COLUMN "invoice_number" SET NOT NULL,
ALTER COLUMN "dispute_status" DROP NOT NULL,
ALTER COLUMN "dispute_status" DROP DEFAULT;

-- CreateTable
CREATE TABLE "autonomous_decisions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "decision_type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" JSONB NOT NULL,
    "action_taken" BOOLEAN NOT NULL DEFAULT false,
    "result" TEXT,
    "estimated_cost" DECIMAL(10,2) NOT NULL,
    "estimated_savings" DECIMAL(10,2),
    "metadata" JSONB,
    "purchase_order_id" TEXT,
    "transfer_id" TEXT,
    "adjustment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomous_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_forecasts" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "horizon_days" INTEGER NOT NULL,
    "predictions" JSONB NOT NULL,
    "avg_daily_demand" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "model_type" TEXT NOT NULL,
    "metadata" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_readings" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "reading_type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "iot_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "velocity_classifications" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "velocity_class" TEXT NOT NULL,
    "velocity_score" DOUBLE PRECISION NOT NULL,
    "turnover_rate" DOUBLE PRECISION NOT NULL,
    "annual_revenue" DECIMAL(10,2) NOT NULL,
    "last_calculated" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "velocity_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_twin_states" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "physical_state" JSONB NOT NULL,
    "digital_state" JSONB NOT NULL,
    "discrepancies" JSONB NOT NULL,
    "sync_confidence" DOUBLE PRECISION NOT NULL,
    "last_sync" TIMESTAMP(3),
    "needs_sync" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_twin_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environmental_readings" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "zone_id" TEXT,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "product_ids" TEXT[],
    "violations" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environmental_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autonomous_configs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "min_trust_score" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "approval_threshold" DECIMAL(10,2) NOT NULL DEFAULT 10000,
    "max_order_value" DECIMAL(10,2) NOT NULL DEFAULT 50000,
    "iot_discrepancy_threshold" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "max_adjustment_value" DECIMAL(10,2) NOT NULL DEFAULT 5000,
    "require_verification" BOOLEAN NOT NULL DEFAULT true,
    "enable_auto_reorders" BOOLEAN NOT NULL DEFAULT true,
    "enable_auto_transfers" BOOLEAN NOT NULL DEFAULT true,
    "enable_auto_adjustments" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomous_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "author_role" TEXT,
    "category" "BlogCategory" NOT NULL DEFAULT 'GENERAL',
    "tags" TEXT[],
    "read_time" TEXT NOT NULL DEFAULT '5 min read',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "trending" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT,
    "author_name" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_debit_memos" (
    "id" TEXT NOT NULL,
    "debit_memo_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reason_description" TEXT NOT NULL,
    "purchase_order_id" TEXT,
    "grn_id" TEXT,
    "rtv_id" TEXT,
    "debit_amount" DECIMAL(10,2) NOT NULL,
    "calculation_method" TEXT NOT NULL,
    "calculation_details" JSONB NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "payment_terms" TEXT NOT NULL,
    "payment_due" TIMESTAMP(3) NOT NULL,
    "offset_from_payment" BOOLEAN NOT NULL DEFAULT true,
    "offset_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "offset_date" TIMESTAMP(3),
    "disputed" BOOLEAN NOT NULL DEFAULT false,
    "dispute_reason" TEXT,
    "dispute_status" TEXT,
    "dispute_resolved_at" TIMESTAMP(3),
    "dispute_outcome" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "collected_at" TIMESTAMP(3),
    "collected_amount" DECIMAL(10,2),
    "invoice_pdf_url" TEXT,
    "supporting_documents" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_debit_memos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_concessions" (
    "id" TEXT NOT NULL,
    "concession_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "concession_type" TEXT NOT NULL,
    "related_issue" TEXT NOT NULL,
    "rtv_id" TEXT,
    "chargeback_id" TEXT,
    "debit_memo_id" TEXT,
    "original_claim_amount" DECIMAL(10,2) NOT NULL,
    "concession_value" DECIMAL(10,2) NOT NULL,
    "concession_description" TEXT NOT NULL,
    "applicable_orders" INTEGER,
    "expires_at" TIMESTAMP(3),
    "minimum_order_value" DECIMAL(10,2),
    "terms_and_conditions" TEXT,
    "utilization_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "utilization_count" INTEGER NOT NULL DEFAULT 0,
    "remaining_value" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "activated_at" TIMESTAMP(3),
    "fully_utilized_at" TIMESTAMP(3),
    "agreement_document_url" TEXT,
    "vendor_accepted_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_concessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_conformance_reports" (
    "id" TEXT NOT NULL,
    "ncr_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discovered_by" TEXT NOT NULL,
    "discovery_location" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT,
    "supplier_id" TEXT,
    "supplier_name" TEXT,
    "po_number" TEXT,
    "product_sku" TEXT,
    "product_description" TEXT,
    "lot_number" TEXT,
    "serial_number" TEXT,
    "quantity_affected" INTEGER NOT NULL,
    "nonconformance_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "suspected_root_cause" TEXT,
    "confirmed_root_cause" TEXT,
    "root_cause_method" TEXT,
    "rca_completed_date" TIMESTAMP(3),
    "rca_performed_by" TEXT,
    "disposition" TEXT NOT NULL,
    "disposition_details" TEXT,
    "disposition_date" TIMESTAMP(3),
    "disposition_by" TEXT,
    "estimated_cost" DECIMAL(10,2),
    "actual_cost" DECIMAL(10,2),
    "claim_amount" DECIMAL(10,2),
    "claim_status" TEXT,
    "claim_submitted_date" TIMESTAMP(3),
    "claim_approved_date" TIMESTAMP(3),
    "claim_paid_amount" DECIMAL(10,2),
    "claim_notes" TEXT,
    "capa_required" BOOLEAN NOT NULL DEFAULT false,
    "capa_ids" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" TEXT,
    "due_date" TIMESTAMP(3),
    "closed_date" TIMESTAMP(3),
    "closed_by" TEXT,
    "closure_notes" TEXT,
    "photos" JSONB,
    "documents" JSONB,
    "customer_impact" BOOLEAN NOT NULL DEFAULT false,
    "customers_affected" INTEGER,
    "customer_complaint_id" TEXT,
    "regulatory_notification" BOOLEAN NOT NULL DEFAULT false,
    "regulatory_body" TEXT,
    "regulatory_report_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "non_conformance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corrective_preventive_actions" (
    "id" TEXT NOT NULL,
    "capa_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "capa_type" TEXT NOT NULL,
    "action_category" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT,
    "ncr_id" TEXT,
    "problem_statement" TEXT NOT NULL,
    "problem_severity" TEXT NOT NULL,
    "root_cause_method" TEXT NOT NULL,
    "root_cause_analysis" JSONB NOT NULL,
    "root_cause" TEXT NOT NULL,
    "contributing_factors" JSONB,
    "risk_priority" INTEGER,
    "risk_severity" INTEGER,
    "risk_occurrence" INTEGER,
    "risk_detection" INTEGER,
    "immediate_actions" JSONB NOT NULL,
    "containment_complete" BOOLEAN NOT NULL DEFAULT false,
    "containment_date" TIMESTAMP(3),
    "corrective_actions" JSONB NOT NULL,
    "corrective_actions_owner" TEXT,
    "corrective_target_date" TIMESTAMP(3),
    "corrective_completed_date" TIMESTAMP(3),
    "preventive_actions" JSONB NOT NULL,
    "preventive_actions_owner" TEXT,
    "preventive_target_date" TIMESTAMP(3),
    "preventive_completed_date" TIMESTAMP(3),
    "responsible_person" TEXT NOT NULL,
    "department_responsible" TEXT,
    "target_completion_date" TIMESTAMP(3) NOT NULL,
    "actual_completion_date" TIMESTAMP(3),
    "verification_method" TEXT,
    "verification_criteria" TEXT,
    "verification_date" TIMESTAMP(3),
    "verification_performed_by" TEXT,
    "verification_passed" BOOLEAN,
    "effectiveness_check_date" TIMESTAMP(3),
    "effectiveness_score" INTEGER,
    "effectiveness_notes" TEXT,
    "management_review_required" BOOLEAN NOT NULL DEFAULT false,
    "management_review_date" TIMESTAMP(3),
    "management_reviewed_by" TEXT,
    "management_approval" TEXT,
    "management_comments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "closed_date" TIMESTAMP(3),
    "closed_by" TEXT,
    "closure_approved" BOOLEAN,
    "closure_approved_by" TEXT,
    "closure_approved_date" TIMESTAMP(3),
    "documents" JSONB,
    "updated_procedures" JSONB,
    "training_required" BOOLEAN NOT NULL DEFAULT false,
    "training_completed" BOOLEAN NOT NULL DEFAULT false,
    "training_completed_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corrective_preventive_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_holds" (
    "id" TEXT NOT NULL,
    "hold_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "hold_type" TEXT NOT NULL,
    "hold_level" TEXT NOT NULL,
    "product_sku" TEXT,
    "product_name" TEXT,
    "lot_number" TEXT,
    "serial_numbers" TEXT[],
    "location_id" TEXT,
    "location_name" TEXT,
    "vendor_id" TEXT,
    "order_id" TEXT,
    "quantity_on_hold" INTEGER NOT NULL,
    "quantity_released" INTEGER NOT NULL DEFAULT 0,
    "quantity_rejected" INTEGER NOT NULL DEFAULT 0,
    "quantity_remaining" INTEGER NOT NULL,
    "hold_reason" TEXT NOT NULL,
    "hold_description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "initiated_by" TEXT NOT NULL,
    "initiated_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT,
    "ncr_id" TEXT,
    "disposition" TEXT,
    "disposition_reason" TEXT,
    "disposition_date" TIMESTAMP(3),
    "disposition_by" TEXT,
    "disposition_approved_by" TEXT,
    "estimated_value" DECIMAL(10,2),
    "actual_loss" DECIMAL(10,2),
    "release_requested" BOOLEAN NOT NULL DEFAULT false,
    "release_request_date" TIMESTAMP(3),
    "release_requested_by" TEXT,
    "release_approved" BOOLEAN,
    "release_approved_date" TIMESTAMP(3),
    "release_approved_by" TEXT,
    "release_conditions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "investigation_required" BOOLEAN NOT NULL DEFAULT true,
    "investigation_status" TEXT,
    "investigation_notes" TEXT,
    "photos" JSONB,
    "documents" JSONB,
    "notifications_sent" JSONB,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalated_date" TIMESTAMP(3),
    "escalated_to" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sampling_plans" (
    "id" TEXT NOT NULL,
    "plan_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "plan_description" TEXT,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "target_name" TEXT,
    "inspection_type" TEXT NOT NULL,
    "standard" TEXT NOT NULL DEFAULT 'ANSI_Z1_4',
    "inspection_level" TEXT NOT NULL,
    "aql_critical" DECIMAL(5,3),
    "aql_major" DECIMAL(5,3),
    "aql_minor" DECIMAL(5,3),
    "sampling_type" TEXT NOT NULL,
    "sample_size_code" TEXT,
    "use_percentage" BOOLEAN NOT NULL DEFAULT false,
    "sample_percentage" DECIMAL(5,2),
    "minimum_sample_size" INTEGER,
    "maximum_sample_size" INTEGER,
    "lot_size_ranges" JSONB,
    "acceptance_number" INTEGER,
    "rejection_number" INTEGER,
    "plan_type" TEXT NOT NULL,
    "measurement_required" BOOLEAN NOT NULL DEFAULT false,
    "measurement_specs" JSONB,
    "inspection_frequency" TEXT,
    "frequency_value" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "expiration_date" TIMESTAMP(3),
    "superseded_by" TEXT,
    "times_used" INTEGER NOT NULL DEFAULT 0,
    "last_used_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sampling_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_measurements" (
    "id" TEXT NOT NULL,
    "measurement_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "inspection_id" TEXT,
    "ncr_id" TEXT,
    "product_sku" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "lot_number" TEXT,
    "serial_number" TEXT,
    "measurement_type" TEXT NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "nominal_value" DECIMAL(12,4),
    "lower_spec_limit" DECIMAL(12,4),
    "upper_spec_limit" DECIMAL(12,4),
    "lower_control_limit" DECIMAL(12,4),
    "upper_control_limit" DECIMAL(12,4),
    "measured_value" DECIMAL(12,4) NOT NULL,
    "deviation" DECIMAL(12,4),
    "deviation_percentage" DECIMAL(5,2),
    "within_spec" BOOLEAN NOT NULL,
    "within_control" BOOLEAN NOT NULL,
    "conformance_status" TEXT NOT NULL,
    "measurement_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "measured_by" TEXT NOT NULL,
    "measurement_location" TEXT,
    "environmental_conditions" JSONB,
    "equipment_id" TEXT,
    "equipment_name" TEXT,
    "calibration_due_date" TIMESTAMP(3),
    "calibration_current" BOOLEAN NOT NULL DEFAULT true,
    "sample_size" INTEGER,
    "sample_number" INTEGER,
    "measurement_count" INTEGER NOT NULL DEFAULT 1,
    "mean_value" DECIMAL(12,4),
    "standard_deviation" DECIMAL(12,4),
    "range_value" DECIMAL(12,4),
    "cpk" DECIMAL(5,3),
    "ppk" DECIMAL(5,3),
    "action_required" BOOLEAN NOT NULL DEFAULT false,
    "action_taken" TEXT,
    "photos" JSONB,
    "chart_image" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_reports" (
    "id" TEXT NOT NULL,
    "report_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "report_category" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" JSONB NOT NULL,
    "total_inspections" INTEGER NOT NULL DEFAULT 0,
    "passed_inspections" INTEGER NOT NULL DEFAULT 0,
    "failed_inspections" INTEGER NOT NULL DEFAULT 0,
    "inspection_pass_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_defects" INTEGER NOT NULL DEFAULT 0,
    "critical_defects" INTEGER NOT NULL DEFAULT 0,
    "major_defects" INTEGER NOT NULL DEFAULT 0,
    "minor_defects" INTEGER NOT NULL DEFAULT 0,
    "defect_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "total_ncrs" INTEGER NOT NULL DEFAULT 0,
    "open_ncrs" INTEGER NOT NULL DEFAULT 0,
    "closed_ncrs" INTEGER NOT NULL DEFAULT 0,
    "ncr_closure_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_capas" INTEGER NOT NULL DEFAULT 0,
    "open_capas" INTEGER NOT NULL DEFAULT 0,
    "completed_capas" INTEGER NOT NULL DEFAULT 0,
    "overdue_capas" INTEGER NOT NULL DEFAULT 0,
    "capa_effectiveness" DECIMAL(5,2),
    "suppliers_evaluated" INTEGER NOT NULL DEFAULT 0,
    "avg_supplier_score" DECIMAL(5,2),
    "total_quality_cost" DECIMAL(12,2),
    "total_claim_amount" DECIMAL(12,2),
    "total_recovered_amount" DECIMAL(12,2),
    "top_defect_types" JSONB,
    "top_supplier_issues" JSONB,
    "top_products" JSONB,
    "trend_analysis" JSONB,
    "improvement_areas" JSONB,
    "concern_areas" JSONB,
    "chart_data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "published_date" TIMESTAMP(3),
    "published_by" TEXT,
    "recipients" JSONB,
    "distributed_date" TIMESTAMP(3),
    "pdf_url" TEXT,
    "excel_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_compliance_checks" (
    "id" TEXT NOT NULL,
    "check_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "check_type" TEXT NOT NULL,
    "check_date" TIMESTAMP(3) NOT NULL,
    "inspector_id" TEXT NOT NULL,
    "checklist_items" JSONB NOT NULL,
    "total_items" INTEGER NOT NULL,
    "passed_items" INTEGER NOT NULL,
    "failed_items" INTEGER NOT NULL,
    "compliance_rate" DECIMAL(5,2) NOT NULL,
    "violations" JSONB,
    "violation_count" INTEGER NOT NULL DEFAULT 0,
    "critical_violations" INTEGER NOT NULL DEFAULT 0,
    "major_violations" INTEGER NOT NULL DEFAULT 0,
    "minor_violations" INTEGER NOT NULL DEFAULT 0,
    "corrective_actions_required" BOOLEAN NOT NULL DEFAULT false,
    "corrective_actions" JSONB,
    "penalty_assessed" BOOLEAN NOT NULL DEFAULT false,
    "penalty_amount" DECIMAL(10,2),
    "penalty_reason" TEXT,
    "overall_result" TEXT NOT NULL,
    "follow_up_required" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_date" TIMESTAMP(3),
    "follow_up_completed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "report_pdf_url" TEXT,
    "photos" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "autonomous_decisions_organization_id_idx" ON "autonomous_decisions"("organization_id");

-- CreateIndex
CREATE INDEX "autonomous_decisions_product_id_idx" ON "autonomous_decisions"("product_id");

-- CreateIndex
CREATE INDEX "autonomous_decisions_decision_type_idx" ON "autonomous_decisions"("decision_type");

-- CreateIndex
CREATE INDEX "autonomous_decisions_result_idx" ON "autonomous_decisions"("result");

-- CreateIndex
CREATE INDEX "autonomous_decisions_created_at_idx" ON "autonomous_decisions"("created_at");

-- CreateIndex
CREATE INDEX "demand_forecasts_product_id_idx" ON "demand_forecasts"("product_id");

-- CreateIndex
CREATE INDEX "demand_forecasts_generated_at_idx" ON "demand_forecasts"("generated_at");

-- CreateIndex
CREATE INDEX "demand_forecasts_confidence_idx" ON "demand_forecasts"("confidence");

-- CreateIndex
CREATE INDEX "iot_readings_device_id_idx" ON "iot_readings"("device_id");

-- CreateIndex
CREATE INDEX "iot_readings_timestamp_idx" ON "iot_readings"("timestamp");

-- CreateIndex
CREATE INDEX "iot_readings_reading_type_idx" ON "iot_readings"("reading_type");

-- CreateIndex
CREATE UNIQUE INDEX "velocity_classifications_product_id_key" ON "velocity_classifications"("product_id");

-- CreateIndex
CREATE INDEX "velocity_classifications_velocity_class_idx" ON "velocity_classifications"("velocity_class");

-- CreateIndex
CREATE INDEX "velocity_classifications_last_calculated_idx" ON "velocity_classifications"("last_calculated");

-- CreateIndex
CREATE INDEX "digital_twin_states_product_id_idx" ON "digital_twin_states"("product_id");

-- CreateIndex
CREATE INDEX "digital_twin_states_timestamp_idx" ON "digital_twin_states"("timestamp");

-- CreateIndex
CREATE INDEX "digital_twin_states_needs_sync_idx" ON "digital_twin_states"("needs_sync");

-- CreateIndex
CREATE INDEX "environmental_readings_device_id_idx" ON "environmental_readings"("device_id");

-- CreateIndex
CREATE INDEX "environmental_readings_zone_id_idx" ON "environmental_readings"("zone_id");

-- CreateIndex
CREATE INDEX "environmental_readings_timestamp_idx" ON "environmental_readings"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "autonomous_configs_organization_id_key" ON "autonomous_configs"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category");

-- CreateIndex
CREATE INDEX "blog_posts_published_idx" ON "blog_posts"("published");

-- CreateIndex
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts"("published_at");

-- CreateIndex
CREATE INDEX "blog_comments_post_id_idx" ON "blog_comments"("post_id");

-- CreateIndex
CREATE INDEX "blog_comments_user_id_idx" ON "blog_comments"("user_id");

-- CreateIndex
CREATE INDEX "blog_comments_approved_idx" ON "blog_comments"("approved");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_debit_memos_debit_memo_number_key" ON "vendor_debit_memos"("debit_memo_number");

-- CreateIndex
CREATE INDEX "vendor_debit_memos_organization_id_idx" ON "vendor_debit_memos"("organization_id");

-- CreateIndex
CREATE INDEX "vendor_debit_memos_vendor_id_idx" ON "vendor_debit_memos"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_debit_memos_status_idx" ON "vendor_debit_memos"("status");

-- CreateIndex
CREATE INDEX "vendor_debit_memos_payment_due_idx" ON "vendor_debit_memos"("payment_due");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_concessions_concession_number_key" ON "vendor_concessions"("concession_number");

-- CreateIndex
CREATE INDEX "vendor_concessions_organization_id_idx" ON "vendor_concessions"("organization_id");

-- CreateIndex
CREATE INDEX "vendor_concessions_vendor_id_idx" ON "vendor_concessions"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_concessions_status_idx" ON "vendor_concessions"("status");

-- CreateIndex
CREATE INDEX "vendor_concessions_expires_at_idx" ON "vendor_concessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "non_conformance_reports_ncr_number_key" ON "non_conformance_reports"("ncr_number");

-- CreateIndex
CREATE INDEX "non_conformance_reports_organization_id_idx" ON "non_conformance_reports"("organization_id");

-- CreateIndex
CREATE INDEX "non_conformance_reports_supplier_id_idx" ON "non_conformance_reports"("supplier_id");

-- CreateIndex
CREATE INDEX "non_conformance_reports_status_idx" ON "non_conformance_reports"("status");

-- CreateIndex
CREATE INDEX "non_conformance_reports_severity_idx" ON "non_conformance_reports"("severity");

-- CreateIndex
CREATE INDEX "non_conformance_reports_claim_status_idx" ON "non_conformance_reports"("claim_status");

-- CreateIndex
CREATE INDEX "non_conformance_reports_report_date_idx" ON "non_conformance_reports"("report_date");

-- CreateIndex
CREATE UNIQUE INDEX "corrective_preventive_actions_capa_number_key" ON "corrective_preventive_actions"("capa_number");

-- CreateIndex
CREATE INDEX "corrective_preventive_actions_organization_id_idx" ON "corrective_preventive_actions"("organization_id");

-- CreateIndex
CREATE INDEX "corrective_preventive_actions_ncr_id_idx" ON "corrective_preventive_actions"("ncr_id");

-- CreateIndex
CREATE INDEX "corrective_preventive_actions_status_idx" ON "corrective_preventive_actions"("status");

-- CreateIndex
CREATE INDEX "corrective_preventive_actions_priority_idx" ON "corrective_preventive_actions"("priority");

-- CreateIndex
CREATE INDEX "corrective_preventive_actions_capa_type_idx" ON "corrective_preventive_actions"("capa_type");

-- CreateIndex
CREATE INDEX "corrective_preventive_actions_target_completion_date_idx" ON "corrective_preventive_actions"("target_completion_date");

-- CreateIndex
CREATE UNIQUE INDEX "quality_holds_hold_number_key" ON "quality_holds"("hold_number");

-- CreateIndex
CREATE INDEX "quality_holds_organization_id_idx" ON "quality_holds"("organization_id");

-- CreateIndex
CREATE INDEX "quality_holds_status_idx" ON "quality_holds"("status");

-- CreateIndex
CREATE INDEX "quality_holds_hold_type_idx" ON "quality_holds"("hold_type");

-- CreateIndex
CREATE INDEX "quality_holds_severity_idx" ON "quality_holds"("severity");

-- CreateIndex
CREATE INDEX "quality_holds_vendor_id_idx" ON "quality_holds"("vendor_id");

-- CreateIndex
CREATE INDEX "quality_holds_product_sku_idx" ON "quality_holds"("product_sku");

-- CreateIndex
CREATE INDEX "quality_holds_lot_number_idx" ON "quality_holds"("lot_number");

-- CreateIndex
CREATE UNIQUE INDEX "sampling_plans_plan_number_key" ON "sampling_plans"("plan_number");

-- CreateIndex
CREATE INDEX "sampling_plans_organization_id_idx" ON "sampling_plans"("organization_id");

-- CreateIndex
CREATE INDEX "sampling_plans_target_type_idx" ON "sampling_plans"("target_type");

-- CreateIndex
CREATE INDEX "sampling_plans_target_id_idx" ON "sampling_plans"("target_id");

-- CreateIndex
CREATE INDEX "sampling_plans_status_idx" ON "sampling_plans"("status");

-- CreateIndex
CREATE INDEX "sampling_plans_inspection_type_idx" ON "sampling_plans"("inspection_type");

-- CreateIndex
CREATE UNIQUE INDEX "quality_measurements_measurement_number_key" ON "quality_measurements"("measurement_number");

-- CreateIndex
CREATE INDEX "quality_measurements_organization_id_idx" ON "quality_measurements"("organization_id");

-- CreateIndex
CREATE INDEX "quality_measurements_inspection_id_idx" ON "quality_measurements"("inspection_id");

-- CreateIndex
CREATE INDEX "quality_measurements_product_sku_idx" ON "quality_measurements"("product_sku");

-- CreateIndex
CREATE INDEX "quality_measurements_measurement_type_idx" ON "quality_measurements"("measurement_type");

-- CreateIndex
CREATE INDEX "quality_measurements_measurement_date_idx" ON "quality_measurements"("measurement_date");

-- CreateIndex
CREATE INDEX "quality_measurements_conformance_status_idx" ON "quality_measurements"("conformance_status");

-- CreateIndex
CREATE UNIQUE INDEX "quality_reports_report_number_key" ON "quality_reports"("report_number");

-- CreateIndex
CREATE INDEX "quality_reports_organization_id_idx" ON "quality_reports"("organization_id");

-- CreateIndex
CREATE INDEX "quality_reports_report_type_idx" ON "quality_reports"("report_type");

-- CreateIndex
CREATE INDEX "quality_reports_report_category_idx" ON "quality_reports"("report_category");

-- CreateIndex
CREATE INDEX "quality_reports_period_start_idx" ON "quality_reports"("period_start");

-- CreateIndex
CREATE INDEX "quality_reports_period_end_idx" ON "quality_reports"("period_end");

-- CreateIndex
CREATE INDEX "quality_reports_status_idx" ON "quality_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_compliance_checks_check_number_key" ON "vendor_compliance_checks"("check_number");

-- CreateIndex
CREATE INDEX "vendor_compliance_checks_organization_id_idx" ON "vendor_compliance_checks"("organization_id");

-- CreateIndex
CREATE INDEX "vendor_compliance_checks_vendor_id_idx" ON "vendor_compliance_checks"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_compliance_checks_check_type_idx" ON "vendor_compliance_checks"("check_type");

-- CreateIndex
CREATE INDEX "vendor_compliance_checks_check_date_idx" ON "vendor_compliance_checks"("check_date");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_chargebacks_chargeback_number_key" ON "vendor_chargebacks"("chargeback_number");

-- CreateIndex
CREATE INDEX "vendor_chargebacks_vendor_id_idx" ON "vendor_chargebacks"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_chargebacks_status_idx" ON "vendor_chargebacks"("status");

-- CreateIndex
CREATE INDEX "vendor_chargebacks_payment_due_idx" ON "vendor_chargebacks"("payment_due");

-- AddForeignKey
ALTER TABLE "autonomous_decisions" ADD CONSTRAINT "autonomous_decisions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autonomous_decisions" ADD CONSTRAINT "autonomous_decisions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autonomous_decisions" ADD CONSTRAINT "autonomous_decisions_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autonomous_decisions" ADD CONSTRAINT "autonomous_decisions_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "warehouse_transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autonomous_decisions" ADD CONSTRAINT "autonomous_decisions_adjustment_id_fkey" FOREIGN KEY ("adjustment_id") REFERENCES "stock_adjustments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_readings" ADD CONSTRAINT "iot_readings_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "iot_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "velocity_classifications" ADD CONSTRAINT "velocity_classifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_twin_states" ADD CONSTRAINT "digital_twin_states_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_readings" ADD CONSTRAINT "environmental_readings_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "iot_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autonomous_configs" ADD CONSTRAINT "autonomous_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_chargebacks" ADD CONSTRAINT "vendor_chargebacks_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_debit_memos" ADD CONSTRAINT "vendor_debit_memos_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_debit_memos" ADD CONSTRAINT "vendor_debit_memos_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_concessions" ADD CONSTRAINT "vendor_concessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_concessions" ADD CONSTRAINT "vendor_concessions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformance_reports" ADD CONSTRAINT "non_conformance_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformance_reports" ADD CONSTRAINT "non_conformance_reports_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_preventive_actions" ADD CONSTRAINT "corrective_preventive_actions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_preventive_actions" ADD CONSTRAINT "corrective_preventive_actions_ncr_id_fkey" FOREIGN KEY ("ncr_id") REFERENCES "non_conformance_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_holds" ADD CONSTRAINT "quality_holds_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sampling_plans" ADD CONSTRAINT "sampling_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_measurements" ADD CONSTRAINT "quality_measurements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_reports" ADD CONSTRAINT "quality_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_compliance_checks" ADD CONSTRAINT "vendor_compliance_checks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_compliance_checks" ADD CONSTRAINT "vendor_compliance_checks_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
