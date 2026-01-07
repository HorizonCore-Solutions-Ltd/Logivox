-- CreateTable
CREATE TABLE "supplier_performance_reviews" (
    "id" TEXT NOT NULL,
    "review_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "review_period" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "review_type" TEXT NOT NULL,
    "quality_score" INTEGER NOT NULL,
    "delivery_score" INTEGER NOT NULL,
    "responsiveness_score" INTEGER NOT NULL,
    "pricing_score" INTEGER NOT NULL,
    "compliance_score" INTEGER NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "metrics_snapshot" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "improvement_areas" JSONB NOT NULL,
    "action_items" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "recommendation" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_performance_reviews_review_number_key" ON "supplier_performance_reviews"("review_number");

-- CreateIndex
CREATE INDEX "supplier_performance_reviews_organization_id_idx" ON "supplier_performance_reviews"("organization_id");

-- CreateIndex
CREATE INDEX "supplier_performance_reviews_vendor_id_idx" ON "supplier_performance_reviews"("vendor_id");

-- CreateIndex
CREATE INDEX "supplier_performance_reviews_status_idx" ON "supplier_performance_reviews"("status");

-- AddForeignKey
ALTER TABLE "supplier_performance_reviews" ADD CONSTRAINT "supplier_performance_reviews_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_performance_reviews" ADD CONSTRAINT "supplier_performance_reviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
