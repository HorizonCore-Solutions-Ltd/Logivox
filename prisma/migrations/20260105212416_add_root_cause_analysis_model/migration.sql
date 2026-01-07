-- CreateTable
CREATE TABLE "root_cause_analyses" (
    "id" TEXT NOT NULL,
    "rca_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "issue_title" TEXT NOT NULL,
    "issue_description" TEXT NOT NULL,
    "issue_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "affected_products" JSONB NOT NULL,
    "affected_orders" JSONB NOT NULL,
    "related_rtvs" TEXT[],
    "quantity_affected" INTEGER NOT NULL,
    "financial_impact" DECIMAL(12,2) NOT NULL,
    "customer_impact" TEXT,
    "five_whys" JSONB NOT NULL,
    "root_cause" TEXT NOT NULL,
    "root_cause_category" TEXT NOT NULL,
    "immediate_actions" JSONB NOT NULL,
    "corrective_actions" JSONB NOT NULL,
    "preventive_actions" JSONB NOT NULL,
    "responsible_party" TEXT NOT NULL,
    "target_completion_date" TIMESTAMP(3) NOT NULL,
    "actual_completion_date" TIMESTAMP(3),
    "verification_required" BOOLEAN NOT NULL DEFAULT false,
    "verification_method" TEXT,
    "verification_date" TIMESTAMP(3),
    "verification_passed" BOOLEAN,
    "effectiveness_score" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "root_cause_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "root_cause_analyses_rca_number_key" ON "root_cause_analyses"("rca_number");

-- CreateIndex
CREATE INDEX "root_cause_analyses_organization_id_idx" ON "root_cause_analyses"("organization_id");

-- CreateIndex
CREATE INDEX "root_cause_analyses_vendor_id_idx" ON "root_cause_analyses"("vendor_id");

-- CreateIndex
CREATE INDEX "root_cause_analyses_status_idx" ON "root_cause_analyses"("status");

-- CreateIndex
CREATE INDEX "root_cause_analyses_severity_idx" ON "root_cause_analyses"("severity");

-- AddForeignKey
ALTER TABLE "root_cause_analyses" ADD CONSTRAINT "root_cause_analyses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "root_cause_analyses" ADD CONSTRAINT "root_cause_analyses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
