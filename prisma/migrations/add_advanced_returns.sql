-- Advanced Returns Management System - Schema Extensions
-- Add new tables for label generation, fraud detection, refurbishment, resale, RTV

-- Return Label tracking
CREATE TABLE IF NOT EXISTS "return_labels" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "rma_id" TEXT NOT NULL,
  "carrier" TEXT NOT NULL,
  "service_level" TEXT,
  "tracking_number" TEXT,
  "label_url" TEXT,
  "label_data" TEXT,
  "qr_code_url" TEXT,
  "cost" DECIMAL(10, 2),
  "currency" TEXT DEFAULT 'USD',
  "type" TEXT NOT NULL, -- PREPAID, CUSTOMER_PAID, COLLECT
  "format" TEXT DEFAULT 'PDF',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP,
  "voided_at" TIMESTAMP,
  "metadata" JSONB
);

-- Fraud Analysis Results
CREATE TABLE IF NOT EXISTS "fraud_analyses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "rma_id" TEXT NOT NULL,
  "customer_id" TEXT,
  "fraud_score" INTEGER NOT NULL, -- 0-100
  "risk_level" TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
  "recommendation" TEXT NOT NULL, -- FLAG, HOLD, REVIEW, REJECT, ALLOW
  "requires_review" BOOLEAN DEFAULT false,
  "signals" JSONB, -- Array of detected fraud signals
  "customer_risk_profile" JSONB,
  "ml_model_version" TEXT,
  "analyzed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Refurbishment Work Orders
CREATE TABLE IF NOT EXISTS "refurb_work_orders" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "rwo_number" TEXT NOT NULL UNIQUE,
  "organization_id" TEXT NOT NULL,
  "rma_id" TEXT,
  "receipt_line_id" TEXT,
  "sku" TEXT NOT NULL,
  "serial" TEXT,
  "lot" TEXT,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "initial_grade" TEXT NOT NULL,
  "target_grade" TEXT NOT NULL,
  "current_grade" TEXT,
  "final_grade" TEXT,
  "reported_issues" JSONB,
  "symptoms" TEXT,
  "workflow_template" TEXT,
  "steps" JSONB, -- Array of refurb steps
  "current_step_index" INTEGER DEFAULT 0,
  "assigned_to" TEXT,
  "assigned_at" TIMESTAMP,
  "team" TEXT,
  "parts_used" JSONB,
  "labor_hours" DECIMAL(10, 2) DEFAULT 0,
  "labor_rate" DECIMAL(10, 2) DEFAULT 25,
  "costs" JSONB, -- labor, parts, overhead, total
  "outcome" TEXT,
  "restock_location_id" TEXT,
  "photos" JSONB,
  "notes" JSONB,
  "sla_deadline" TIMESTAMP,
  "sla_breach" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "estimated_completion_at" TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Refurbishment Workflow Templates
CREATE TABLE IF NOT EXISTS "refurb_templates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT, -- NULL for category-wide
  "category" TEXT,
  "applicable_for" JSONB, -- conditions
  "steps" JSONB, -- template steps
  "estimated_labor_hours" DECIMAL(10, 2),
  "estimated_parts_cost" DECIMAL(10, 2),
  "active" BOOLEAN DEFAULT true,
  "version" INTEGER DEFAULT 1,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Resale Candidates
CREATE TABLE IF NOT EXISTS "resale_candidates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "rma_id" TEXT,
  "refurb_work_order_id" TEXT,
  "receipt_line_id" TEXT,
  "sku" TEXT NOT NULL,
  "serial" TEXT,
  "lot" TEXT,
  "grade" TEXT NOT NULL,
  "condition_description" TEXT,
  "functionality_score" INTEGER, -- 0-100
  "cosmetic_score" INTEGER, -- 0-100
  "original_price" DECIMAL(10, 2),
  "original_currency" TEXT DEFAULT 'USD',
  "category" TEXT,
  "brand" TEXT,
  "model" TEXT,
  "defects" JSONB,
  "missing_items" JSONB,
  "included_accessories" JSONB,
  "acquisition_cost" DECIMAL(10, 2),
  "refurb_cost" DECIMAL(10, 2),
  "total_cost" DECIMAL(10, 2),
  "photos" JSONB,
  "pricing_recommendation" JSONB,
  "recommended_channels" JSONB,
  "status" TEXT DEFAULT 'EVALUATING',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Resale Listings
CREATE TABLE IF NOT EXISTS "resale_listings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "candidate_id" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "external_listing_id" TEXT,
  "listing_url" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "list_price" DECIMAL(10, 2) NOT NULL,
  "currency" TEXT DEFAULT 'USD',
  "accept_offers" BOOLEAN DEFAULT true,
  "minimum_offer" DECIMAL(10, 2),
  "condition_grade" TEXT,
  "condition_notes" TEXT,
  "photos" JSONB,
  "main_photo_index" INTEGER DEFAULT 0,
  "quantity" INTEGER DEFAULT 1,
  "quantity_sold" INTEGER DEFAULT 0,
  "quantity_available" INTEGER DEFAULT 1,
  "fulfillment_method" TEXT DEFAULT 'SELF',
  "shipping_profile" TEXT,
  "handling_time" INTEGER DEFAULT 2,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "views" INTEGER DEFAULT 0,
  "watchers" INTEGER DEFAULT 0,
  "offers" INTEGER DEFAULT 0,
  "listed_at" TIMESTAMP,
  "sold_at" TIMESTAMP,
  "expires_at" TIMESTAMP,
  "final_price" DECIMAL(10, 2),
  "fees" JSONB,
  "net_revenue" DECIMAL(10, 2),
  "buyer_id" TEXT,
  "buyer_username" TEXT,
  "last_sync_at" TIMESTAMP,
  "sync_errors" JSONB,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Return-to-Vendor (RTV) Requests
CREATE TABLE IF NOT EXISTS "rtv_requests" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "rtv_number" TEXT NOT NULL UNIQUE,
  "vendor_id" TEXT NOT NULL,
  "vendor_name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "claim_type" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "lines" JSONB, -- RTV line items
  "vendor_rma" TEXT,
  "authorized_by" TEXT,
  "authorized_at" TIMESTAMP,
  "authorization_notes" TEXT,
  "claim_amount" DECIMAL(10, 2) NOT NULL,
  "expected_credit" DECIMAL(10, 2),
  "actual_credit" DECIMAL(10, 2),
  "currency" TEXT DEFAULT 'USD',
  "credit_method" TEXT,
  "carrier" TEXT,
  "tracking_number" TEXT,
  "shipping_cost" DECIMAL(10, 2),
  "prepaid_label" BOOLEAN DEFAULT false,
  "label_url" TEXT,
  "packing_list_url" TEXT,
  "packaged_by" TEXT,
  "packaged_at" TIMESTAMP,
  "requested_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approval_deadline" TIMESTAMP,
  "ship_by_date" TIMESTAMP,
  "shipped_date" TIMESTAMP,
  "delivered_date" TIMESTAMP,
  "credited_date" TIMESTAMP,
  "photos" JSONB,
  "documents" JSONB,
  "notes" JSONB,
  "disputed" BOOLEAN DEFAULT false,
  "dispute_reason" TEXT,
  "dispute_resolved_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT NOT NULL
);

-- Vendor Return Policies
CREATE TABLE IF NOT EXISTS "vendor_return_policies" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "vendor_id" TEXT NOT NULL,
  "vendor_name" TEXT NOT NULL,
  "return_window" INTEGER DEFAULT 30,
  "requires_rma" BOOLEAN DEFAULT true,
  "rma_request_method" TEXT DEFAULT 'EMAIL',
  "rma_contact" JSONB,
  "accepted_reasons" JSONB,
  "requirements" JSONB,
  "shipping" JSONB,
  "credit" JSONB,
  "sla" JSONB,
  "active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("organization_id", "vendor_id")
);

-- Return Settings
CREATE TABLE IF NOT EXISTS "return_settings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization_id" TEXT NOT NULL UNIQUE,
  "general" JSONB,
  "labels" JSONB,
  "eligibility" JSONB,
  "financial" JSONB,
  "inspection" JSONB,
  "disposition" JSONB,
  "fraud" JSONB,
  "customer_experience" JSONB,
  "analytics" JSONB,
  "integrations" JSONB,
  "voice" JSONB,
  "mobile" JSONB,
  "compliance" JSONB,
  "sla" JSONB,
  "custom_fields" JSONB,
  "version" INTEGER DEFAULT 1,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_by" TEXT
);

-- Forecasts
CREATE TABLE IF NOT EXISTS "returns_forecasts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "warehouse_id" TEXT,
  "forecast_period" JSONB,
  "predictions" JSONB,
  "insights" JSONB,
  "top_drivers" JSONB,
  "model_version" TEXT,
  "accuracy" DECIMAL(5, 2),
  "last_trained" TIMESTAMP,
  "generated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_return_labels_rma_id" ON "return_labels"("rma_id");
CREATE INDEX IF NOT EXISTS "idx_fraud_analyses_rma_id" ON "fraud_analyses"("rma_id");
CREATE INDEX IF NOT EXISTS "idx_fraud_analyses_customer_id" ON "fraud_analyses"("customer_id");
CREATE INDEX IF NOT EXISTS "idx_refurb_work_orders_org_id" ON "refurb_work_orders"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_refurb_work_orders_status" ON "refurb_work_orders"("status");
CREATE INDEX IF NOT EXISTS "idx_refurb_work_orders_assigned_to" ON "refurb_work_orders"("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_resale_candidates_org_id" ON "resale_candidates"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_resale_candidates_status" ON "resale_candidates"("status");
CREATE INDEX IF NOT EXISTS "idx_resale_listings_org_id" ON "resale_listings"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_resale_listings_channel" ON "resale_listings"("channel");
CREATE INDEX IF NOT EXISTS "idx_resale_listings_status" ON "resale_listings"("status");
CREATE INDEX IF NOT EXISTS "idx_rtv_requests_org_id" ON "rtv_requests"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_rtv_requests_vendor_id" ON "rtv_requests"("vendor_id");
CREATE INDEX IF NOT EXISTS "idx_rtv_requests_status" ON "rtv_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_vendor_policies_org_vendor" ON "vendor_return_policies"("organization_id", "vendor_id");
