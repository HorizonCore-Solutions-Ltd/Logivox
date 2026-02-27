-- TENANT ISOLATION SCHEMA ENHANCEMENTS
-- Adds indexes and constraints for strict multitenancy
-- Run after: npm run db:migrate

-- Phase 1: Add Composite Indexes for Tenant Filtering
-- These improve query performance and enforce logical tenant boundaries

-- Inventory Domain
CREATE INDEX IF NOT EXISTS "idx_inventory_item_org_status" 
  ON "inventory_items"("organizationId", status);

CREATE INDEX IF NOT EXISTS "idx_inventory_item_org_warehouse" 
  ON "inventory_items"("organizationId", "warehouseId");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_inventory_item_org_sku" 
  ON "inventory_items"("organizationId", sku);

-- Fulfillment Domain
CREATE INDEX IF NOT EXISTS "idx_picking_route_org_warehouse_status" 
  ON "picking_routes"("organizationId", "warehouseId", status);

CREATE INDEX IF NOT EXISTS "idx_picking_task_org_route_status" 
  ON "picking_tasks"("organizationId", "routeId", status);

CREATE INDEX IF NOT EXISTS "idx_wave_org_warehouse_status" 
  ON "waves"("organizationId", "warehouseId", status, priority);

CREATE INDEX IF NOT EXISTS "idx_wave_org_status_priority" 
  ON "waves"("organizationId", status, priority);

CREATE INDEX IF NOT EXISTS "idx_sales_order_org_status_created" 
  ON "sales_orders"("organizationId", status, "createdAt" DESC);

-- Master Data Domain
CREATE INDEX IF NOT EXISTS "idx_customer_org_type" 
  ON "customers"("organizationId", "customerType");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_customer_org_code" 
  ON "customers"("organizationId", code);

CREATE INDEX IF NOT EXISTS "idx_supplier_org_code" 
  ON "suppliers"("organizationId", code);

CREATE INDEX IF NOT EXISTS "idx_warehouse_org_code" 
  ON "warehouses"("organizationId", code);

-- Audit & Security Domain
CREATE INDEX IF NOT EXISTS "idx_audit_log_org_created" 
  ON "audit_logs"("organizationId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_audit_log_org_user_action" 
  ON "audit_logs"("organizationId", "userId", action);

CREATE INDEX IF NOT EXISTS "idx_activity_log_org_created" 
  ON "activity_logs"("organizationId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_activity_log_org_user" 
  ON "activity_logs"("organizationId", "userId");

-- API & Integration Security
CREATE INDEX IF NOT EXISTS "idx_api_key_org_active" 
  ON "api_keys"("organizationId", "isActive");

CREATE INDEX IF NOT EXISTS "idx_integration_connection_org_provider" 
  ON "integration_connections"("organizationId", provider);

-- Organization Membership & RBAC
CREATE UNIQUE INDEX IF NOT EXISTS "idx_org_member_unique" 
  ON "organization_members"("organizationId", "userId");

CREATE INDEX IF NOT EXISTS "idx_org_member_role" 
  ON "organization_members"("organizationId", "role", "isActive");

-- Phase 2: Query Performance Indexes
-- These support common filtering patterns

CREATE INDEX IF NOT EXISTS "idx_picking_route_org_assigned" 
  ON "picking_routes"("organizationId", "assignedToId");

CREATE INDEX IF NOT EXISTS "idx_picking_task_org_assigned" 
  ON "picking_tasks"("organizationId", "assignedToId");

CREATE INDEX IF NOT EXISTS "idx_cycle_count_org_status" 
  ON "cycle_counts"("organizationId", status);

CREATE INDEX IF NOT EXISTS "idx_grn_org_status" 
  ON "goods_receipt_notes"("organizationId", status);

-- Phase 3: Full-Text Search Support (Optional)
-- For organizations that need search across tenant boundaries

-- CREATE INDEX IF NOT EXISTS "idx_inventory_item_org_search" 
--   ON "inventory_items" USING GIN (
--     to_tsvector('english', name || ' ' || sku)
--   ) WHERE "organizationId" = current_setting('app.current_org_id')::text;

-- Phase 4: Verify Indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Phase 5: Analyze table statistics for query planner
ANALYZE inventory_items;
ANALYZE picking_routes;
ANALYZE picking_tasks;
ANALYZE waves;
ANALYZE sales_orders;
ANALYZE customers;
ANALYZE suppliers;
ANALYZE warehouses;
ANALYZE audit_logs;
ANALYZE activity_logs;
ANALYZE organization_members;

-- Phase 6: Document enforcement strategy
-- NOTE: The following is enforced at the application layer via Prisma middleware:
-- 1. All queries on tenant-scoped models MUST include organizationId in WHERE clause
-- 2. All CREATE operations MUST include organizationId in data
-- 3. All UPSERT operations MUST include organizationId in both create & where
-- 4. CI/CD guards reject unscoped queries in test suites
-- 5. Audit logs track all access; anomalies trigger alerts

-- Phase 7: Verify no orphaned records
SELECT 
  'InventoryItem'::text as table_name,
  COUNT(*) as null_org_count
FROM "inventory_items"
WHERE "organizationId" IS NULL
UNION ALL
SELECT 
  'PickingRoute'::text,
  COUNT(*)
FROM "picking_routes"
WHERE "organizationId" IS NULL
UNION ALL
SELECT 
  'SalesOrder'::text,
  COUNT(*)
FROM "sales_orders"
WHERE "organizationId" IS NULL
UNION ALL
SELECT 
  'Customer'::text,
  COUNT(*)
FROM "customers"
WHERE "organizationId" IS NULL;

-- Phase 8: Set up Row-Level Security (Optional, Advanced)
-- For additional security layer, enable RLS on all tenant-scoped tables
-- This would add a database-level tenant boundary check

-- ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE picking_routes ENABLE ROW LEVEL SECURITY;
-- ... etc for all tenant-scoped models

-- CREATE POLICY inventory_item_org_policy ON inventory_items
--   USING ("organizationId" = current_setting('app.current_org_id')::uuid)
--   WITH CHECK ("organizationId" = current_setting('app.current_org_id')::uuid);

-- Phase 9: Verify index coverage for common operations
-- Run these queries to ensure indexes are being used:

EXPLAIN ANALYZE
SELECT * FROM inventory_items 
WHERE "organizationId" = '123' AND status = 'ACTIVE'
LIMIT 10;

EXPLAIN ANALYZE
SELECT * FROM picking_routes 
WHERE "organizationId" = '123' AND "warehouseId" = '456' AND status = 'PENDING'
LIMIT 20;

EXPLAIN ANALYZE
SELECT * FROM audit_logs 
WHERE "organizationId" = '123' 
ORDER BY "createdAt" DESC
LIMIT 100;
