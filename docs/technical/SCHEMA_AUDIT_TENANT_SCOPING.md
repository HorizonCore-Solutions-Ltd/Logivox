/\*\*

- SCHEMA AUDIT: TENANT SCOPING REQUIREMENTS
- Identifies models missing organizationId and suggests fixes
- Action items for making multitenancy strict
  \*/

// Models with organizationId (GOOD - tenant-scoped):
const SCOPED_MODELS_WITH_ISSUES = {
// Optional organizationId - should be NOT NULL + indexed
InventoryItem: {
current: "organizationId String (no NOT NULL, no explicit index)",
issues: ["organizationId is nullable in some contexts", "No composite index on (organizationId, sku)"],
fix: `     model InventoryItem {
      id                      String                   @id @default(cuid())
      organizationId          String                   @db.Text  // Already there
      warehouseId             String
      ...
      @@unique([organizationId, sku])
      @@index([organizationId])
      @@index([organizationId, status])
      @@map("inventory_items")
    }
    `,
},

PickingRoute: {
current: "organizationId String (no explicit indexes)",
issues: ["No composite indexes for filtering", "Slow lookups when finding routes by organization"],
fix: `     model PickingRoute {
      id                String   @id @default(cuid())
      organizationId    String
      warehouseId       String
      ...
      @@index([organizationId])
      @@index([organizationId, warehouseId])
      @@index([organizationId, status])
      @@map("picking_routes")
    }
    `,
},

PickingTask: {
current: "organizationId String (no explicit indexes)",
issues: ["Queries may do full table scans", "No index on (organizationId, routeId)"],
fix: `Add @@index([organizationId, routeId, status])`,
},

WavePick: {
current: "organizationId String",
issues: ["Missing composite indexes for common filters"],
fix: `     @@index([organizationId])
    @@index([organizationId, warehouseId])
    @@index([organizationId, status, priority])
    `,
},

SalesOrder: {
current: "organizationId String",
issues: ["Missing index for org + status filtering"],
fix: `     @@index([organizationId])
    @@index([organizationId, status, createdAt])
    `,
},

Customer: {
current: "organizationId String",
issues: ["Missing index for org + type filtering"],
fix: `     @@index([organizationId])
    @@index([organizationId, type])
    @@unique([organizationId, email])
    `,
},

Supplier: {
current: "organizationId String",
issues: ["Missing indexes"],
fix: `     @@index([organizationId])
    @@unique([organizationId, code])
    `,
},
};

// Models that may need organizationId but don't have it:
const MODELS_MISSING_TENANT_SCOPE = {
Document: {
has_organizationId: false,
issue: "Documents can be shared across orgs or private to one - needs clarification",
suggestion: "Add organizationId OR implement explicit sharing policy",
},

ApiKey: {
has_organizationId: true,
issue: "Verify @@index([organizationId])",
suggestion: "Add index for security filtering",
},

AuditLog: {
has_organizationId: true,
issue: "Critical for compliance - verify NOT NULL + indexed",
suggestion: `     model AuditLog {
      ...
      organizationId String @db.Text  // NOT NULL
      ...
      @@index([organizationId, createdAt])  // For audit queries
      @@index([organizationId, userId, action])
    }
    `,
},

ActivityLog: {
has_organizationId: true,
issue: "Verify NOT NULL and queryability",
indexes: `     @@index([organizationId])
    @@index([organizationId, createdAt])
    `,
},

IntegrationConnection: {
has_organizationId: true,
issue: "Verify scope",
indexes: `     @@index([organizationId])
    @@index([organizationId, provider])
    `,
},

NotificationPreference: {
has_organizationId: false,
issue: "User notifications may be global but could be org-scoped",
suggestion: "Clarify business logic; may need to scope per org",
},

Dashboard: {
has_organizationId: true,
issue: "Verify indexes",
indexes: `     @@index([organizationId])
    @@index([organizationId, createdById])
    `,
},
};

// Migration Strategy:
export const MIGRATION_PLAN = `

# TENANT SCOPING SCHEMA MIGRATION PLAN

## Phase 1: Analysis & Validation (NOW)

- [ ] Audit all models with organizationId
- [ ] Verify data consistency (no orphaned records)
- [ ] Identify models missing organizationId
- [ ] Review business logic for shared vs tenant-private resources

## Phase 2: Add Indexes (Week 1)

- [ ] Add @@index([organizationId]) to all tenant-scoped models
- [ ] Add composite indexes for common query patterns
- [ ] Test query performance improvements
- [ ] Deploy indexes to staging

## Phase 3: Add NOT NULL Constraints (Week 2)

- For each model:
  1. Backfill any NULL organizationId values or delete orphaned records
  2. Add NOT NULL constraint to schema
  3. Deploy migration
  4. Verify no errors in production

## Phase 4: Add Unique Constraints (Week 3)

- [ ] Add @@unique([organizationId, externalId]) where needed
- [ ] Add @@unique([organizationId, slug]) for human identifiers
- [ ] Examples:
  - InventoryItem: unique(organizationId, sku)
  - Customer: unique(organizationId, code + externalId)
  - Warehouse: unique(organizationId, code)

## Phase 5: Enforce at Data Layer (Week 4)

- [ ] Enable Prisma middleware on all tenant-scoped models
- [ ] CI guard to detect unscoped queries in tests
- [ ] Run security audit: attempt cross-tenant access

## Phase 6: Documentation & Runbooks (Ongoing)

- [ ] Document tenant scoping patterns
- [ ] Add linting rules for query patterns
- [ ] Create runbook for responding to tenant isolation issues
      `;

export const RECOMMENDED_INDEXES = `

# RECOMMENDED COMPOSITE INDEXES FOR PERFORMANCE

Inventory Domain:

- (organizationId, status) - filter active items
- (organizationId, warehouseId) - warehouse-level queries
- (organizationId, categoryId) - category browsing
- (organizationId, sku) - SKU lookups

Fulfillment Domain:

- (organizationId, status, priority) - wave/route filtering
- (organizationId, warehouseId, status) - warehouse operations
- (organizationId, assignedToId) - user assignments
- (organizationId, createdAt DESC) - recent activity

Audit Domain:

- (organizationId, createdAt DESC) - audit trail
- (organizationId, userId, action) - user activity
- (organizationId, resource, resourceId) - resource changes

General (All Tenant Models):

- (organizationId) - MUST HAVE
- (organizationId, isActive) - active records filtering
- (organizationId, createdAt DESC) - temporal queries
  `;

console.log("=" .repeat(80));
console.log("SCHEMA AUDIT: TENANT SCOPING");
console.log("=" .repeat(80));
console.log("\nModels with Issues:");
Object.entries(SCOPED_MODELS_WITH_ISSUES).forEach(([model, info]) => {
console.log(`\n${model}:`);
console.log(`  Current: ${info.current}`);
console.log(`  Issues: ${info.issues.join(", ")}`);
});

console.log("\n\nModels to Verify:");
Object.entries(MODELS_MISSING_TENANT_SCOPE).forEach(([model, info]) => {
console.log(`\n${model}:`);
console.log(`  Has organizationId: ${info.has_organizationId}`);
console.log(`  Issue: ${info.issue}`);
});

console.log("\n" + "=".repeat(80));
console.log("MIGRATION PLAN");
console.log("=".repeat(80));
console.log(MIGRATION_PLAN);

console.log("\n" + "=".repeat(80));
console.log("RECOMMENDED INDEXES");
console.log("=".repeat(80));
console.log(RECOMMENDED_INDEXES);
