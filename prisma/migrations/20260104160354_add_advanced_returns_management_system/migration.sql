/*
  Warnings:

  - The values [CUSTOMER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `customerId` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER', 'VIEWER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_customerId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "customerId";

-- CreateTable
CREATE TABLE "return_labels" (
    "id" TEXT NOT NULL,
    "rma_id" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "service_level" TEXT,
    "tracking_number" TEXT NOT NULL,
    "label_url" TEXT,
    "label_data" BYTEA,
    "qr_code_url" TEXT,
    "cost" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'USD',
    "type" TEXT NOT NULL,
    "format" TEXT,
    "tracking_status" TEXT,
    "tracking_events" JSONB,
    "delivered_at" TIMESTAMP(3),
    "voided_at" TIMESTAMP(3),
    "voided_by" TEXT,
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_analyses" (
    "id" TEXT NOT NULL,
    "rma_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "risk_level" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "signals" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "rules_triggered" JSONB NOT NULL,
    "ml_features" JSONB,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "fraud_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refurb_work_orders" (
    "id" TEXT NOT NULL,
    "rma_item_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "estimated_days" INTEGER,
    "estimated_cost" DECIMAL(10,2),
    "actual_cost" DECIMAL(10,2),
    "steps" JSONB NOT NULL,
    "current_step_index" INTEGER NOT NULL DEFAULT 0,
    "parts_used" JSONB NOT NULL DEFAULT '[]',
    "qa_results" JSONB NOT NULL DEFAULT '[]',
    "qa_passed" BOOLEAN,
    "qa_completed_at" TIMESTAMP(3),
    "assigned_to" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refurb_work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refurb_templates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "estimated_days" INTEGER NOT NULL,
    "steps" JSONB NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refurb_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resale_candidates" (
    "id" TEXT NOT NULL,
    "rma_item_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "original_price" DECIMAL(10,2) NOT NULL,
    "recommended_price" DECIMAL(10,2) NOT NULL,
    "estimated_profit" DECIMAL(10,2) NOT NULL,
    "market_data" JSONB NOT NULL,
    "evaluated_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resale_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resale_listings" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "external_id" TEXT,
    "external_url" TEXT,
    "synced_at" TIMESTAMP(3),
    "sold_at" TIMESTAMP(3),
    "sold_price" DECIMAL(10,2),
    "fees" DECIMAL(10,2),
    "net_profit" DECIMAL(10,2),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resale_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rtv_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "rma_item_ids" TEXT[],
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requested_action" TEXT NOT NULL,
    "estimated_value" DECIMAL(10,2) NOT NULL,
    "items" JSONB NOT NULL,
    "requires_authorization" BOOLEAN NOT NULL DEFAULT true,
    "authorization_number" TEXT,
    "authorized_at" TIMESTAMP(3),
    "authorization_expires_at" TIMESTAMP(3),
    "tracking_number" TEXT,
    "carrier" TEXT,
    "shipped_at" TIMESTAMP(3),
    "shipping_cost" DECIMAL(10,2),
    "credit_amount" DECIMAL(10,2),
    "credit_type" TEXT,
    "credit_reference" TEXT,
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rtv_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_return_policies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "allows_returns" BOOLEAN NOT NULL DEFAULT true,
    "return_window_days" INTEGER NOT NULL,
    "requires_authorization" BOOLEAN NOT NULL DEFAULT true,
    "restocking_fee" DECIMAL(5,2),
    "accepted_conditions" JSONB NOT NULL,
    "accepted_reasons" JSONB NOT NULL,
    "shipping_responsibility" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_return_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_settings" (
    "organization_id" TEXT NOT NULL,
    "general" JSONB NOT NULL,
    "labels" JSONB NOT NULL,
    "fraud" JSONB NOT NULL,
    "refurbishment" JSONB NOT NULL,
    "resale" JSONB NOT NULL,
    "rtv" JSONB NOT NULL,
    "forecasting" JSONB NOT NULL,
    "notifications" JSONB NOT NULL,
    "customer_portal" JSONB NOT NULL,
    "automation" JSONB NOT NULL,
    "compliance" JSONB NOT NULL,
    "reporting" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_settings_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "qc_receiving_inspections" (
    "id" TEXT NOT NULL,
    "inspection_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "grn_id" TEXT,
    "po_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "inspector_id" TEXT NOT NULL,
    "inspection_type" TEXT NOT NULL,
    "sample_size" INTEGER,
    "total_units" INTEGER NOT NULL,
    "inspected_units" INTEGER NOT NULL,
    "passed_units" INTEGER NOT NULL DEFAULT 0,
    "failed_units" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "result" TEXT,
    "overall_notes" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_receiving_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_inspection_items" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "expected_qty" INTEGER NOT NULL,
    "inspected_qty" INTEGER NOT NULL,
    "passed_qty" INTEGER NOT NULL DEFAULT 0,
    "failed_qty" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT,
    "checklist_data" JSONB NOT NULL,
    "notes" TEXT,
    "inspector_notes" TEXT,
    "photo_urls" TEXT[],
    "inspected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_defects" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "defect_type" TEXT NOT NULL,
    "defect_category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity_affected" INTEGER NOT NULL,
    "estimated_cost" DECIMAL(10,2),
    "photo_urls" TEXT[],
    "video_urls" TEXT[],
    "resolution_status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution_notes" TEXT,
    "resolution_date" TIMESTAMP(3),
    "root_cause" TEXT,
    "corrective_action" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_defects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rtvs" (
    "id" TEXT NOT NULL,
    "rtv_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "defect_id" TEXT NOT NULL,
    "po_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "vendor_rma_number" TEXT,
    "vendor_response_date" TIMESTAMP(3),
    "vendor_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "carrier" TEXT,
    "tracking_number" TEXT,
    "label_url" TEXT,
    "shipping_cost" DECIMAL(8,2),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "resolution_type" TEXT,
    "credit_amount" DECIMAL(10,2),
    "credit_memo_number" TEXT,
    "credited_at" TIMESTAMP(3),
    "replacement_po_id" TEXT,
    "replacement_received" BOOLEAN NOT NULL DEFAULT false,
    "replacement_date" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" TEXT,
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rtvs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rtv_activities" (
    "id" TEXT NOT NULL,
    "rtv_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rtv_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_quality_scores" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "total_purchase_orders" INTEGER NOT NULL DEFAULT 0,
    "total_units_received" INTEGER NOT NULL DEFAULT 0,
    "total_defective_units" INTEGER NOT NULL DEFAULT 0,
    "total_rtv_count" INTEGER NOT NULL DEFAULT 0,
    "total_rtv_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "recent_90days_orders" INTEGER NOT NULL DEFAULT 0,
    "recent_90days_units" INTEGER NOT NULL DEFAULT 0,
    "recent_90days_defects" INTEGER NOT NULL DEFAULT 0,
    "recent_90days_rtv" INTEGER NOT NULL DEFAULT 0,
    "lifetime_defect_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "recent_90_defect_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "avg_resolution_days" INTEGER,
    "quality_score" INTEGER NOT NULL DEFAULT 100,
    "reliability_score" INTEGER NOT NULL DEFAULT 100,
    "response_score" INTEGER NOT NULL DEFAULT 100,
    "overall_score" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "tier" TEXT NOT NULL DEFAULT 'STANDARD',
    "last_defect_date" TIMESTAMP(3),
    "last_rtv_date" TIMESTAMP(3),
    "last_inspection_date" TIMESTAMP(3),
    "consecutive_good_orders" INTEGER NOT NULL DEFAULT 0,
    "last_review_date" TIMESTAMP(3),
    "last_reviewed_by" TEXT,
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_quality_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_inspection_templates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template_type" TEXT NOT NULL,
    "target_id" TEXT,
    "inspection_type" TEXT NOT NULL,
    "sample_size_percent" INTEGER,
    "min_sample_size" INTEGER,
    "max_sample_size" INTEGER,
    "checklist" JSONB NOT NULL,
    "aql_level" TEXT,
    "critical_defect_aql" DECIMAL(4,2),
    "major_defect_aql" DECIMAL(4,2),
    "minor_defect_aql" DECIMAL(4,2),
    "require_photos" BOOLEAN NOT NULL DEFAULT false,
    "photo_min_count" INTEGER,
    "auto_assign" BOOLEAN NOT NULL DEFAULT true,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_inspection_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_inspection_activities" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_inspection_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_settings" (
    "organization_id" TEXT NOT NULL,
    "enable_auto_inspection" BOOLEAN NOT NULL DEFAULT true,
    "inspection_trigger" TEXT NOT NULL DEFAULT 'ON_RECEIPT',
    "default_inspection_type" TEXT NOT NULL DEFAULT 'SAMPLE',
    "default_sample_percent" INTEGER NOT NULL DEFAULT 10,
    "new_vendor_inspection" TEXT NOT NULL DEFAULT 'FULL',
    "trusted_vendor_sampling" INTEGER NOT NULL DEFAULT 5,
    "auto_quarantine" BOOLEAN NOT NULL DEFAULT true,
    "auto_create_rtv" BOOLEAN NOT NULL DEFAULT false,
    "critical_defect_action" TEXT NOT NULL DEFAULT 'REJECT',
    "require_defect_photos" BOOLEAN NOT NULL DEFAULT true,
    "min_defect_photos" INTEGER NOT NULL DEFAULT 2,
    "notify_on_defect" BOOLEAN NOT NULL DEFAULT true,
    "notify_vendor_automatic" BOOLEAN NOT NULL DEFAULT false,
    "escalation_threshold" INTEGER NOT NULL DEFAULT 3,
    "update_vendor_scores" BOOLEAN NOT NULL DEFAULT true,
    "score_update_frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "rtv_approval_required" BOOLEAN NOT NULL DEFAULT true,
    "rtv_approval_threshold" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "auto_request_vendor_rma" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_settings_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "returns_forecasts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "forecast_date" TIMESTAMP(3) NOT NULL,
    "period_days" INTEGER NOT NULL,
    "predicted_count" INTEGER NOT NULL,
    "predicted_value" DECIMAL(12,2) NOT NULL,
    "confidence_level" DOUBLE PRECISION NOT NULL,
    "seasonal_factors" JSONB NOT NULL,
    "model_metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "returns_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instant_refunds" (
    "id" TEXT NOT NULL,
    "rma_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_trust_score" INTEGER NOT NULL,
    "trust_tier" TEXT NOT NULL,
    "trust_factors" JSONB NOT NULL,
    "risk_factors" JSONB NOT NULL,
    "refund_amount" DECIMAL(10,2) NOT NULL,
    "refund_method" TEXT NOT NULL,
    "refund_issued_at" TIMESTAMP(3) NOT NULL,
    "payment_processor" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "verification_deadline" TIMESTAMP(3) NOT NULL,
    "requires_photos" BOOLEAN NOT NULL,
    "requires_serial_number" BOOLEAN NOT NULL,
    "requires_tracking_update" BOOLEAN NOT NULL,
    "requires_signature" BOOLEAN NOT NULL,
    "verification_status" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3),
    "item_received_at" TIMESTAMP(3),
    "discrepancies" TEXT[],
    "chargeback_required" BOOLEAN NOT NULL DEFAULT false,
    "chargeback_amount" DECIMAL(10,2),
    "chargeback_reason" TEXT,
    "chargeback_initiated_at" TIMESTAMP(3),
    "chargeback_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instant_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_returns" (
    "id" TEXT NOT NULL,
    "rma_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "qr_code" TEXT NOT NULL,
    "qr_payload" JSONB NOT NULL,
    "qr_image_url" TEXT NOT NULL,
    "qr_image_data" TEXT,
    "drop_off_location_id" TEXT NOT NULL,
    "drop_off_carrier" TEXT NOT NULL,
    "drop_off_address" TEXT NOT NULL,
    "drop_off_hours" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scanned_at" TIMESTAMP(3),
    "tracking_number" TEXT,
    "label_url" TEXT,
    "label_generated_at" TIMESTAMP(3),
    "scan_events" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aggregated_returns" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "rma_ids" TEXT[],
    "total_items" INTEGER NOT NULL,
    "total_weight" DECIMAL(10,2) NOT NULL,
    "original_shipping_cost" DECIMAL(10,2) NOT NULL,
    "aggregated_shipping_cost" DECIMAL(10,2) NOT NULL,
    "cost_savings" DECIMAL(10,2) NOT NULL,
    "savings_percentage" DECIMAL(5,2) NOT NULL,
    "consolidated_label" TEXT,
    "tracking_number" TEXT,
    "carrier" TEXT,
    "packing_instructions" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aggregated_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serial_tracking" (
    "id" TEXT NOT NULL,
    "rma_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "original_order_id" TEXT NOT NULL,
    "purchased_date" TIMESTAMP(3) NOT NULL,
    "validation_status" TEXT NOT NULL,
    "validation_checks" JSONB NOT NULL,
    "swap_detected" BOOLEAN NOT NULL DEFAULT false,
    "swap_confidence" DECIMAL(5,2) NOT NULL,
    "swap_evidence" JSONB,
    "counterfeit_risk" DECIMAL(5,2) NOT NULL,
    "lifecycle_events" JSONB NOT NULL,
    "warranty_status" TEXT NOT NULL,
    "warranty_expires_at" TIMESTAMP(3),
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flag_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serial_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_chargebacks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "rma_ids" TEXT[],
    "defect_rate" DECIMAL(5,2) NOT NULL,
    "defect_threshold" DECIMAL(5,2) NOT NULL,
    "merchandise_cost" DECIMAL(10,2) NOT NULL,
    "inspection_cost" DECIMAL(10,2) NOT NULL,
    "handling_fees" DECIMAL(10,2) NOT NULL,
    "shipping_cost" DECIMAL(10,2) NOT NULL,
    "penalty_amount" DECIMAL(10,2) NOT NULL,
    "total_chargeback_amount" DECIMAL(10,2) NOT NULL,
    "invoice_number" TEXT,
    "invoice_url" TEXT,
    "dispute_status" TEXT NOT NULL DEFAULT 'PENDING',
    "dispute_reason" TEXT,
    "dispute_documents" JSONB,
    "dispute_resolution" TEXT,
    "dispute_resolved_at" TIMESTAMP(3),
    "payment_deduction" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_chargebacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sustainability_reports" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "rma_id" TEXT,
    "report_type" TEXT NOT NULL,
    "period" JSONB,
    "shipping_emissions" DECIMAL(10,2) NOT NULL,
    "packaging_emissions" DECIMAL(10,2) NOT NULL,
    "processing_emissions" DECIMAL(10,2) NOT NULL,
    "total_co2_emissions" DECIMAL(10,2) NOT NULL,
    "total_co2_saved" DECIMAL(10,2) NOT NULL,
    "circularity_score" DECIMAL(5,2) NOT NULL,
    "circularity_grade" TEXT NOT NULL,
    "restocked_count" INTEGER NOT NULL,
    "refurbished_count" INTEGER NOT NULL,
    "donated_count" INTEGER NOT NULL,
    "recycled_count" INTEGER NOT NULL,
    "scrap_count" INTEGER NOT NULL,
    "product_lifecycle_extension" DECIMAL(10,2) NOT NULL,
    "second_life_revenue" DECIMAL(10,2) NOT NULL,
    "green_score" DECIMAL(5,2),
    "customer_message" TEXT,
    "certifications" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sustainability_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_border_returns" (
    "id" TEXT NOT NULL,
    "rma_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "origin_country" TEXT NOT NULL,
    "destination_country" TEXT NOT NULL,
    "routing_decision" TEXT NOT NULL,
    "routing_reasoning" TEXT NOT NULL,
    "local_warehouse_id" TEXT,
    "local_partner" TEXT,
    "estimated_cost_savings" DECIMAL(10,2) NOT NULL,
    "duty_paid" DECIMAL(10,2) NOT NULL,
    "vat_paid" DECIMAL(10,2) NOT NULL,
    "duty_refund" DECIMAL(10,2) NOT NULL,
    "vat_refund" DECIMAL(10,2) NOT NULL,
    "customs_declaration" JSONB NOT NULL,
    "customs_status" TEXT NOT NULL,
    "customs_clearance_date" TIMESTAMP(3),
    "original_currency" TEXT NOT NULL,
    "refund_currency" TEXT NOT NULL,
    "exchange_rate" DECIMAL(10,6) NOT NULL,
    "refund_amount_original" DECIMAL(10,2) NOT NULL,
    "refund_amount_converted" DECIMAL(10,2) NOT NULL,
    "compliance_checks" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cross_border_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_risk_predictions" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "rma_id" TEXT,
    "overall_risk_score" DECIMAL(5,2) NOT NULL,
    "risk_level" TEXT NOT NULL,
    "return_probability" DECIMAL(5,2) NOT NULL,
    "will_return" BOOLEAN NOT NULL,
    "product_risk_score" DECIMAL(5,2) NOT NULL,
    "customer_risk_score" DECIMAL(5,2) NOT NULL,
    "order_risk_score" DECIMAL(5,2) NOT NULL,
    "seasonal_risk_score" DECIMAL(5,2) NOT NULL,
    "risk_factors" JSONB NOT NULL,
    "prevention_opportunities" JSONB NOT NULL,
    "prevention_actions" JSONB,
    "predicted_at" TIMESTAMP(3) NOT NULL,
    "actually_returned" BOOLEAN,
    "actual_return_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_risk_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_return_analyses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "total_sold" INTEGER NOT NULL,
    "total_returned" INTEGER NOT NULL,
    "return_rate" DECIMAL(5,2) NOT NULL,
    "financial_impact" DECIMAL(10,2) NOT NULL,
    "projected_annual_loss" DECIMAL(10,2) NOT NULL,
    "root_causes" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "listing_quality_score" DECIMAL(5,2) NOT NULL,
    "customer_sentiment" JSONB NOT NULL,
    "analysis_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_return_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_return_profiles" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "total_orders" INTEGER NOT NULL,
    "total_returns" INTEGER NOT NULL,
    "return_rate" DECIMAL(5,2) NOT NULL,
    "serial_returner" BOOLEAN NOT NULL DEFAULT false,
    "wardrobing_detected" BOOLEAN NOT NULL DEFAULT false,
    "bracketing_detected" BOOLEAN NOT NULL DEFAULT false,
    "risk_score" DECIMAL(5,2) NOT NULL,
    "risk_tier" TEXT,
    "lifetime_value" DECIMAL(10,2) NOT NULL,
    "lifetime_return_value" DECIMAL(10,2) NOT NULL,
    "recommendations" JSONB,
    "instant_refunds_received" INTEGER NOT NULL DEFAULT 0,
    "instant_refunds_abused" INTEGER NOT NULL DEFAULT 0,
    "last_return_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_return_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "return_labels_rma_id_idx" ON "return_labels"("rma_id");

-- CreateIndex
CREATE INDEX "return_labels_tracking_number_idx" ON "return_labels"("tracking_number");

-- CreateIndex
CREATE INDEX "return_labels_created_at_idx" ON "return_labels"("created_at");

-- CreateIndex
CREATE INDEX "fraud_analyses_rma_id_idx" ON "fraud_analyses"("rma_id");

-- CreateIndex
CREATE INDEX "fraud_analyses_customer_id_idx" ON "fraud_analyses"("customer_id");

-- CreateIndex
CREATE INDEX "fraud_analyses_risk_level_idx" ON "fraud_analyses"("risk_level");

-- CreateIndex
CREATE INDEX "fraud_analyses_created_at_idx" ON "fraud_analyses"("created_at");

-- CreateIndex
CREATE INDEX "refurb_work_orders_rma_item_id_idx" ON "refurb_work_orders"("rma_item_id");

-- CreateIndex
CREATE INDEX "refurb_work_orders_product_id_idx" ON "refurb_work_orders"("product_id");

-- CreateIndex
CREATE INDEX "refurb_work_orders_status_idx" ON "refurb_work_orders"("status");

-- CreateIndex
CREATE INDEX "refurb_work_orders_priority_idx" ON "refurb_work_orders"("priority");

-- CreateIndex
CREATE INDEX "refurb_work_orders_assigned_to_idx" ON "refurb_work_orders"("assigned_to");

-- CreateIndex
CREATE INDEX "refurb_templates_organization_id_idx" ON "refurb_templates"("organization_id");

-- CreateIndex
CREATE INDEX "refurb_templates_category_idx" ON "refurb_templates"("category");

-- CreateIndex
CREATE INDEX "resale_candidates_rma_item_id_idx" ON "resale_candidates"("rma_item_id");

-- CreateIndex
CREATE INDEX "resale_candidates_sku_idx" ON "resale_candidates"("sku");

-- CreateIndex
CREATE INDEX "resale_candidates_status_idx" ON "resale_candidates"("status");

-- CreateIndex
CREATE INDEX "resale_listings_candidate_id_idx" ON "resale_listings"("candidate_id");

-- CreateIndex
CREATE INDEX "resale_listings_channel_idx" ON "resale_listings"("channel");

-- CreateIndex
CREATE INDEX "resale_listings_status_idx" ON "resale_listings"("status");

-- CreateIndex
CREATE INDEX "resale_listings_external_id_idx" ON "resale_listings"("external_id");

-- CreateIndex
CREATE INDEX "rtv_requests_organization_id_idx" ON "rtv_requests"("organization_id");

-- CreateIndex
CREATE INDEX "rtv_requests_vendor_id_idx" ON "rtv_requests"("vendor_id");

-- CreateIndex
CREATE INDEX "rtv_requests_status_idx" ON "rtv_requests"("status");

-- CreateIndex
CREATE INDEX "vendor_return_policies_organization_id_idx" ON "vendor_return_policies"("organization_id");

-- CreateIndex
CREATE INDEX "vendor_return_policies_vendor_id_idx" ON "vendor_return_policies"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_return_policies_organization_id_vendor_id_key" ON "vendor_return_policies"("organization_id", "vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "qc_receiving_inspections_inspection_number_key" ON "qc_receiving_inspections"("inspection_number");

-- CreateIndex
CREATE INDEX "qc_receiving_inspections_organization_id_idx" ON "qc_receiving_inspections"("organization_id");

-- CreateIndex
CREATE INDEX "qc_receiving_inspections_warehouse_id_idx" ON "qc_receiving_inspections"("warehouse_id");

-- CreateIndex
CREATE INDEX "qc_receiving_inspections_po_id_idx" ON "qc_receiving_inspections"("po_id");

-- CreateIndex
CREATE INDEX "qc_receiving_inspections_supplier_id_idx" ON "qc_receiving_inspections"("supplier_id");

-- CreateIndex
CREATE INDEX "qc_receiving_inspections_inspector_id_idx" ON "qc_receiving_inspections"("inspector_id");

-- CreateIndex
CREATE INDEX "qc_receiving_inspections_status_idx" ON "qc_receiving_inspections"("status");

-- CreateIndex
CREATE INDEX "qc_receiving_inspections_result_idx" ON "qc_receiving_inspections"("result");

-- CreateIndex
CREATE INDEX "qc_receiving_inspections_created_at_idx" ON "qc_receiving_inspections"("created_at");

-- CreateIndex
CREATE INDEX "qc_inspection_items_inspection_id_idx" ON "qc_inspection_items"("inspection_id");

-- CreateIndex
CREATE INDEX "qc_inspection_items_product_id_idx" ON "qc_inspection_items"("product_id");

-- CreateIndex
CREATE INDEX "qc_inspection_items_sku_idx" ON "qc_inspection_items"("sku");

-- CreateIndex
CREATE INDEX "qc_inspection_items_result_idx" ON "qc_inspection_items"("result");

-- CreateIndex
CREATE INDEX "qc_defects_inspection_id_idx" ON "qc_defects"("inspection_id");

-- CreateIndex
CREATE INDEX "qc_defects_item_id_idx" ON "qc_defects"("item_id");

-- CreateIndex
CREATE INDEX "qc_defects_organization_id_idx" ON "qc_defects"("organization_id");

-- CreateIndex
CREATE INDEX "qc_defects_defect_type_idx" ON "qc_defects"("defect_type");

-- CreateIndex
CREATE INDEX "qc_defects_defect_category_idx" ON "qc_defects"("defect_category");

-- CreateIndex
CREATE INDEX "qc_defects_resolution_status_idx" ON "qc_defects"("resolution_status");

-- CreateIndex
CREATE INDEX "qc_defects_created_at_idx" ON "qc_defects"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "rtvs_rtv_number_key" ON "rtvs"("rtv_number");

-- CreateIndex
CREATE UNIQUE INDEX "rtvs_defect_id_key" ON "rtvs"("defect_id");

-- CreateIndex
CREATE INDEX "rtvs_organization_id_idx" ON "rtvs"("organization_id");

-- CreateIndex
CREATE INDEX "rtvs_supplier_id_idx" ON "rtvs"("supplier_id");

-- CreateIndex
CREATE INDEX "rtvs_warehouse_id_idx" ON "rtvs"("warehouse_id");

-- CreateIndex
CREATE INDEX "rtvs_po_id_idx" ON "rtvs"("po_id");

-- CreateIndex
CREATE INDEX "rtvs_status_idx" ON "rtvs"("status");

-- CreateIndex
CREATE INDEX "rtvs_created_at_idx" ON "rtvs"("created_at");

-- CreateIndex
CREATE INDEX "rtv_activities_rtv_id_idx" ON "rtv_activities"("rtv_id");

-- CreateIndex
CREATE INDEX "rtv_activities_created_at_idx" ON "rtv_activities"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_quality_scores_supplier_id_key" ON "vendor_quality_scores"("supplier_id");

-- CreateIndex
CREATE INDEX "vendor_quality_scores_organization_id_idx" ON "vendor_quality_scores"("organization_id");

-- CreateIndex
CREATE INDEX "vendor_quality_scores_supplier_id_idx" ON "vendor_quality_scores"("supplier_id");

-- CreateIndex
CREATE INDEX "vendor_quality_scores_quality_score_idx" ON "vendor_quality_scores"("quality_score");

-- CreateIndex
CREATE INDEX "vendor_quality_scores_status_idx" ON "vendor_quality_scores"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_quality_scores_organization_id_supplier_id_key" ON "vendor_quality_scores"("organization_id", "supplier_id");

-- CreateIndex
CREATE INDEX "qc_inspection_templates_organization_id_idx" ON "qc_inspection_templates"("organization_id");

-- CreateIndex
CREATE INDEX "qc_inspection_templates_template_type_idx" ON "qc_inspection_templates"("template_type");

-- CreateIndex
CREATE INDEX "qc_inspection_templates_active_idx" ON "qc_inspection_templates"("active");

-- CreateIndex
CREATE INDEX "qc_inspection_activities_inspection_id_idx" ON "qc_inspection_activities"("inspection_id");

-- CreateIndex
CREATE INDEX "qc_inspection_activities_created_at_idx" ON "qc_inspection_activities"("created_at");

-- CreateIndex
CREATE INDEX "returns_forecasts_organization_id_idx" ON "returns_forecasts"("organization_id");

-- CreateIndex
CREATE INDEX "returns_forecasts_forecast_date_idx" ON "returns_forecasts"("forecast_date");

-- CreateIndex
CREATE UNIQUE INDEX "instant_refunds_rma_id_key" ON "instant_refunds"("rma_id");

-- CreateIndex
CREATE INDEX "instant_refunds_organization_id_idx" ON "instant_refunds"("organization_id");

-- CreateIndex
CREATE INDEX "instant_refunds_customer_id_idx" ON "instant_refunds"("customer_id");

-- CreateIndex
CREATE INDEX "instant_refunds_verification_status_idx" ON "instant_refunds"("verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "qr_returns_rma_id_key" ON "qr_returns"("rma_id");

-- CreateIndex
CREATE UNIQUE INDEX "qr_returns_qr_code_key" ON "qr_returns"("qr_code");

-- CreateIndex
CREATE INDEX "qr_returns_organization_id_idx" ON "qr_returns"("organization_id");

-- CreateIndex
CREATE INDEX "qr_returns_qr_code_idx" ON "qr_returns"("qr_code");

-- CreateIndex
CREATE INDEX "qr_returns_expires_at_idx" ON "qr_returns"("expires_at");

-- CreateIndex
CREATE INDEX "aggregated_returns_organization_id_idx" ON "aggregated_returns"("organization_id");

-- CreateIndex
CREATE INDEX "aggregated_returns_customer_id_idx" ON "aggregated_returns"("customer_id");

-- CreateIndex
CREATE INDEX "aggregated_returns_status_idx" ON "aggregated_returns"("status");

-- CreateIndex
CREATE INDEX "serial_tracking_organization_id_idx" ON "serial_tracking"("organization_id");

-- CreateIndex
CREATE INDEX "serial_tracking_serial_number_idx" ON "serial_tracking"("serial_number");

-- CreateIndex
CREATE INDEX "serial_tracking_validation_status_idx" ON "serial_tracking"("validation_status");

-- CreateIndex
CREATE INDEX "vendor_chargebacks_organization_id_idx" ON "vendor_chargebacks"("organization_id");

-- CreateIndex
CREATE INDEX "vendor_chargebacks_supplier_id_idx" ON "vendor_chargebacks"("supplier_id");

-- CreateIndex
CREATE INDEX "vendor_chargebacks_dispute_status_idx" ON "vendor_chargebacks"("dispute_status");

-- CreateIndex
CREATE INDEX "sustainability_reports_organization_id_idx" ON "sustainability_reports"("organization_id");

-- CreateIndex
CREATE INDEX "sustainability_reports_report_type_idx" ON "sustainability_reports"("report_type");

-- CreateIndex
CREATE UNIQUE INDEX "cross_border_returns_rma_id_key" ON "cross_border_returns"("rma_id");

-- CreateIndex
CREATE INDEX "cross_border_returns_organization_id_idx" ON "cross_border_returns"("organization_id");

-- CreateIndex
CREATE INDEX "cross_border_returns_origin_country_idx" ON "cross_border_returns"("origin_country");

-- CreateIndex
CREATE INDEX "cross_border_returns_customs_status_idx" ON "cross_border_returns"("customs_status");

-- CreateIndex
CREATE INDEX "return_risk_predictions_organization_id_idx" ON "return_risk_predictions"("organization_id");

-- CreateIndex
CREATE INDEX "return_risk_predictions_order_id_idx" ON "return_risk_predictions"("order_id");

-- CreateIndex
CREATE INDEX "return_risk_predictions_risk_level_idx" ON "return_risk_predictions"("risk_level");

-- CreateIndex
CREATE INDEX "product_return_analyses_organization_id_idx" ON "product_return_analyses"("organization_id");

-- CreateIndex
CREATE INDEX "product_return_analyses_product_sku_idx" ON "product_return_analyses"("product_sku");

-- CreateIndex
CREATE INDEX "product_return_analyses_return_rate_idx" ON "product_return_analyses"("return_rate");

-- CreateIndex
CREATE UNIQUE INDEX "customer_return_profiles_customer_id_key" ON "customer_return_profiles"("customer_id");

-- CreateIndex
CREATE INDEX "customer_return_profiles_organization_id_idx" ON "customer_return_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "customer_return_profiles_customer_id_idx" ON "customer_return_profiles"("customer_id");

-- CreateIndex
CREATE INDEX "customer_return_profiles_risk_score_idx" ON "customer_return_profiles"("risk_score");

-- AddForeignKey
ALTER TABLE "return_labels" ADD CONSTRAINT "return_labels_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "rmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_analyses" ADD CONSTRAINT "fraud_analyses_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "rmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_analyses" ADD CONSTRAINT "fraud_analyses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refurb_work_orders" ADD CONSTRAINT "refurb_work_orders_rma_item_id_fkey" FOREIGN KEY ("rma_item_id") REFERENCES "rma_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refurb_work_orders" ADD CONSTRAINT "refurb_work_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refurb_templates" ADD CONSTRAINT "refurb_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resale_candidates" ADD CONSTRAINT "resale_candidates_rma_item_id_fkey" FOREIGN KEY ("rma_item_id") REFERENCES "rma_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resale_listings" ADD CONSTRAINT "resale_listings_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "resale_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rtv_requests" ADD CONSTRAINT "rtv_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rtv_requests" ADD CONSTRAINT "rtv_requests_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_return_policies" ADD CONSTRAINT "vendor_return_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_return_policies" ADD CONSTRAINT "vendor_return_policies_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_settings" ADD CONSTRAINT "return_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_receiving_inspections" ADD CONSTRAINT "qc_receiving_inspections_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_receiving_inspections" ADD CONSTRAINT "qc_receiving_inspections_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_receiving_inspections" ADD CONSTRAINT "qc_receiving_inspections_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_receiving_inspections" ADD CONSTRAINT "qc_receiving_inspections_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_receiving_inspections" ADD CONSTRAINT "qc_receiving_inspections_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_receiving_inspections" ADD CONSTRAINT "qc_receiving_inspections_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "goods_receipt_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspection_items" ADD CONSTRAINT "qc_inspection_items_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "qc_receiving_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspection_items" ADD CONSTRAINT "qc_inspection_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_defects" ADD CONSTRAINT "qc_defects_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "qc_receiving_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_defects" ADD CONSTRAINT "qc_defects_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "qc_inspection_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_defects" ADD CONSTRAINT "qc_defects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rtvs" ADD CONSTRAINT "rtvs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rtvs" ADD CONSTRAINT "rtvs_defect_id_fkey" FOREIGN KEY ("defect_id") REFERENCES "qc_defects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rtvs" ADD CONSTRAINT "rtvs_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rtvs" ADD CONSTRAINT "rtvs_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rtvs" ADD CONSTRAINT "rtvs_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rtv_activities" ADD CONSTRAINT "rtv_activities_rtv_id_fkey" FOREIGN KEY ("rtv_id") REFERENCES "rtvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_quality_scores" ADD CONSTRAINT "vendor_quality_scores_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_quality_scores" ADD CONSTRAINT "vendor_quality_scores_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspection_templates" ADD CONSTRAINT "qc_inspection_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspection_activities" ADD CONSTRAINT "qc_inspection_activities_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "qc_receiving_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_settings" ADD CONSTRAINT "qc_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns_forecasts" ADD CONSTRAINT "returns_forecasts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instant_refunds" ADD CONSTRAINT "instant_refunds_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "rmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instant_refunds" ADD CONSTRAINT "instant_refunds_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instant_refunds" ADD CONSTRAINT "instant_refunds_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_returns" ADD CONSTRAINT "qr_returns_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "rmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_returns" ADD CONSTRAINT "qr_returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_returns" ADD CONSTRAINT "qr_returns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aggregated_returns" ADD CONSTRAINT "aggregated_returns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aggregated_returns" ADD CONSTRAINT "aggregated_returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_tracking" ADD CONSTRAINT "serial_tracking_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "rmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_tracking" ADD CONSTRAINT "serial_tracking_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_chargebacks" ADD CONSTRAINT "vendor_chargebacks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_chargebacks" ADD CONSTRAINT "vendor_chargebacks_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sustainability_reports" ADD CONSTRAINT "sustainability_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sustainability_reports" ADD CONSTRAINT "sustainability_reports_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "rmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_border_returns" ADD CONSTRAINT "cross_border_returns_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "rmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_border_returns" ADD CONSTRAINT "cross_border_returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_border_returns" ADD CONSTRAINT "cross_border_returns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_risk_predictions" ADD CONSTRAINT "return_risk_predictions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_risk_predictions" ADD CONSTRAINT "return_risk_predictions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_return_analyses" ADD CONSTRAINT "product_return_analyses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_return_profiles" ADD CONSTRAINT "customer_return_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_return_profiles" ADD CONSTRAINT "customer_return_profiles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
