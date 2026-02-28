# PHASE 2: ENDPOINT MIGRATION GUIDE

## Tenant Scoping Implementation for Existing API Routes

**Date:** February 27, 2026  
**Phase:** 2 - Endpoint Migration  
**Estimated Duration:** 1-2 weeks

---

## 🎯 PRIORITY LEVELS

### 🔴 CRITICAL (Data-Sensitive, Fix This Week)

These endpoints handle sensitive data and must be tenant-scoped immediately:

1. **Inventory Management** (`/api/inventory/*`)
   - `GET /api/inventory` - List items (PARTIALLY DONE - verify organizationId in query)
   - `GET /api/inventory/[id]` - Get item detail
   - `POST /api/inventory` - Create item
   - `PUT /api/inventory/[id]` - Update item
   - `DELETE /api/inventory/[id]` - Delete item
   - `POST /api/inventory/import` - Bulk import
   - `POST /api/inventory/export` - Export data
   - `GET /api/inventory/forecast/*` - Demand forecasting
   - `GET /api/inventory/autonomous/*` - Autonomous decisions

2. **Orders** (`/api/sales-orders`, `/api/purchase-orders`)
   - All order list/detail/create/update operations
   - HIGH: Direct financial impact

3. **Customers** (`/api/customers/*`)
   - Customer list/detail/create/update
   - HIGH: Privacy-sensitive data

4. **Warehouses** (`/api/warehouses/*`)
   - Warehouse configuration
   - CRITICAL: Infrastructure scoping

5. **Reports** (`/api/reports/*`)
   - All report execution and export
   - CRITICAL: Can leak cross-tenant data

### 🟠 HIGH (Business-Critical, Fix in Week 1-2)

1. **Picking/Wave Management** (`/api/waves/*`, `/api/picking-tasks/*`)
2. **Receiving** (`/api/grn/*`, `/api/receiving/*`)
3. **Returns** (`/api/returns/*`, `/api/rmas/*`)
4. **Billing** (`/api/billing/*`, `/api/invoices/*`)

### 🟡 MEDIUM (Standard Operations, Fix in Week 2)

1. **Categories** (`/api/categories/*`)
2. **Suppliers** (`/api/suppliers/*`)
3. **Serial Numbers** (`/api/serial-numbers/*`)
4. **Cycle Counts** (`/api/cycle-counts/*`)

### 🟢 LOW (Support Functions, Fix Later)

1. **Notifications** (`/api/notifications/*`)
2. **Integrations** (`/api/integrations/*`)
3. **API Keys** (`/api/api-keys/*`)
4. **Activity Logs** (`/api/activity-logs/*`)

---

## 🔧 REFACTORING PATTERN

### Pattern 1: Using withTenantContext HOF (Recommended for New Code)

**File:** `apps/web/src/app/api/customers/route.ts`

```typescript
// BEFORE:
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizations: true },
    });

    if (!user?.organizations?.[0]?.id) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizations[0].id;

    const customers = await prisma.customer.findMany({
      where: { organizationId },
    });

    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}

// AFTER (Using new helper):
import { withTenantContext } from "@/lib/tenant-route-helpers";

export const GET = withTenantContext(async (request) => {
  const organizationId = request.tenant!.organizationId;

  const customers = await prisma.customer.findMany({
    where: { organizationId },
  });

  return NextResponse.json(customers);
});
```

**Advantages:**

- ✅ Automatic tenant resolution
- ✅ Consistent error handling
- ✅ 80% less boilerplate code
- ✅ Always fails closed on auth errors
- ✅ Tenant context available globally in handler

---

### Pattern 2: Manual Refactoring (For Complex Existing Routes)

**File:** `apps/web/src/app/api/inventory/route.ts`

This route is already quite complex. Minimal changes needed:

```typescript
import { resolveTenantFromRequest } from "@/lib/tenant-context";

export async function GET(request: NextRequest) {
  try {
    // CHANGE 1: Use tenant context resolver instead of manual lookup
    const tenant = await resolveTenantFromRequest(request);

    // ... existing security checks ...

    // CHANGE 2: Store resolved tennantId
    const organizationId = tenant.organizationId;

    // CHANGE 3: Use in query (already doing this via rawParams.organizationId)
    // but now they're guaranteed from verified context
    const where: any = {
      organizationId,  // ← Now from tenant context, not user input
      // ... rest of query unchanged
    };

    const items = await prisma.inventoryItem.findMany({ where, ... });

    return NextResponse.json(items);
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    // ... existing error handling
  }
}
```

---

## 📋 MIGRATION CHECKLIST

For each endpoint, follow this sequence:

### Step 1: Identify Tenant-Scoped Models

```typescript
// ✅ These models need organizationId scoping:
-InventoryItem -
  SalesOrder -
  PurchaseOrder -
  Customer -
  Supplier -
  Warehouse -
  PickingRoute -
  PickingTask -
  WavePick -
  GoodsReceiptNote -
  Invoice -
  CycleCount -
  Category -
  Employee -
  DeliveryRoute - // ... ~40 models total from schema
  // ❌ These models are NOT tenant-scoped (global):
  -User -
  Organization -
  OrganizationMember -
  Account(OAuth) -
  Session -
  SecurityProfile;
```

### Step 2: Add organizationId to WHERE Clause

Every select/read/delete/update must include:

```typescript
where: {
  organizationId: tenant.organizationId,  // ← ADD THIS LINE
  // ... other filters unchanged
}
```

### Step 3: Add organizationId to CREATE Data

Every create/upsert must include:

```typescript
data: {
  organizationId: tenant.organizationId,  // ← ADD THIS LINE
  // ... other fields unchanged
}
```

### Step 4: Test in Two Scenarios

1. **Same-tenant access**: Should work ✅
2. **Cross-tenant access**: Should fail with 403 ❌

```typescript
test("should block cross-tenant access", async () => {
  // Create data in org1
  const item = await prisma.inventoryItem.create({
    data: {
      organizationId: "org-1",
      // ...
    },
  });

  // Try to query as org2
  const result = await prisma.inventoryItem.findMany({
    where: {
      organizationId: "org-2", // ← Different org
      id: item.id,
    },
  });

  expect(result).toHaveLength(0); // ← Should return empty
});
```

---

## 🚀 IMPLEMENTATION ORDER

### Week 1: Foundation + Top 10 Routes

**Days 1-2: Setup & Enable Guards**

- [ ] Merge Phase 1 PR (tenant context + middleware)
- [ ] Run database migration: `tenant-isolation-indexes.sql`
- [ ] Enable Prisma middleware logging (non-blocking)

**Days 2-3: Critical Routes (Inventory, Orders)**
Priority: Highest volume, most sensitive data

1. ✅ `/api/inventory/route.ts` - **ALREADY PARTIALLY DONE**
   - Verify organizationId is used correctly
   - Add tenant context resolver
   - Test with Prisma middleware

2. `/api/sales-orders/route.ts`
3. `/api/purchase-orders/route.ts`
4. `/api/customers/route.ts`
5. `/api/suppliers/route.ts`

**Days 3-5: Warehousing Routes** 6. `/api/warehouses/route.ts` 7. `/api/waves/route.ts` 8. `/api/picking-tasks/route.ts` 9. `/api/grn/route.ts` (Goods Receipt Notes) 10. `/api/reports/route.ts` - **HIGHEST PRIORITY**

**Days 5-7: Testing & Hardening**

- [ ] Run full E2E test suite
- [ ] Run CI guard on all fixed endpoints
- [ ] Performance testing (verify indexes help)
- [ ] Security audit: attempt cross-tenant access

### Week 2: Remaining Routes + Deployment

**Days 8-10: Medium Priority Routes**

- [ ] Billing endpoints
- [ ] Returns management
- [ ] Cycle counts
- [ ] Serial numbers

**Days 10-12: Low Priority + Testing**

- [ ] Notifications
- [ ] Integrations
- [ ] API keys
- [ ] Activity logs
- [ ] Final E2E pass

**Days 13-14: Deployment**

- [ ] Staging deployment
- [ ] Canary to 10% of traffic
- [ ] Monitor for "Tenant scope required" errors
- [ ] Full rollout if clean

---

## 📊 VIOLATION DETECTION

### Automated Detection (CI Guard)

Run on all API files to find violations:

```bash
cd /workspaces/Flowstock
npx ts-node scripts/tenant-scoping-ci-guard.ts apps/web/src/app/api
```

**Expected patterns to flag:**

```typescript
// ❌ FLAG: Missing organizationId in WHERE
await prisma.inventoryItem.findMany({ where: { status: "ACTIVE" } });

// ❌ FLAG: Missing organizationId in CREATE
await prisma.customer.create({ data: { name: "Acme Corp" } });

// ❌ FLAG: Bare findUnique without context
await prisma.organization.findUnique({ where: { id } });

// ✅ OK: System models are exempt
await prisma.user.findUnique({ where: { id } });

// ✅ OK: Has organizationId
await prisma.inventoryItem.findMany({
  where: { organizationId, status: "ACTIVE" },
});
```

### Manual Inspection Points

For each file, search for:

1. `prisma.TENANT_MODEL.find*` - Must have organizationId in where
2. `prisma.TENANT_MODEL.create` - Must have organizationId in data
3. `prisma.TENANT_MODEL.update` - Must have organizationId in where
4. `prisma.TENANT_MODEL.delete` - Must have organizationId in where

**Example grep:**

```bash
grep -n "prisma\.inventoryItem\.findMany" apps/web/src/app/api/**/*.ts
# Then verify each has: where: { organizationId, ...
```

---

## ⚠️ COMMON PITFALLS & SOLUTIONS

| Problem                                            | Solution                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| "organizationId is not defined"                    | Use tenant context: `await resolveTenantFromRequest(request)`         |
| Queries returning items from wrong org             | Verify WHERE clause includes: `organizationId: tenant.organizationId` |
| "Tenant scope required" error in Prisma middleware | Add `organizationId` to your query WHERE or CREATE data               |
| Forgetting to update nested creates                | Check upsert/batch operations - ALL create data needs organizationId  |
| Using hardcoded organizationId                     | Always derive from tenant context, never from user input              |
| Tests passing but Middleware logs violations       | CI tests may not catch nested where clauses - review manually         |

---

## ✅ SIGN-OFF CRITERIA

Each endpoint is "complete" when:

- [x] All WHERE clauses include `organizationId: tenant.organizationId`
- [x] All CREATE/UPSERT include `organizationId` in data payload
- [x] Endpoint tested with two different organizations
- [x] Cross-tenant access attempt returns 403 or empty results
- [x] No "Tenant scope required" errors in CI guard
- [x] No "Tenant scope required" logged from Prisma middleware
- [x] Audit log shows action with correct organizationId
- [x] Performance acceptable (query time < 100ms with indexes)

---

## 🔍 TESTING FRAMEWORK

### Unit Test Template

```typescript
describe("Tenant Scoping - /api/inventory", () => {
  let org1: Organization;
  let org2: Organization;
  let user1Session: any;
  let user2Session: any;

  beforeAll(async () => {
    // Create two orgs with users
    org1 = await setupOrganization("org1");
    org2 = await setupOrganization("org2");
    user1Session = await createSession(org1.userId);
    user2Session = await createSession(org2.userId);
  });

  it("should return only org1 items when accessed by org1 user", async () => {
    const response = await fetch("/api/inventory", {
      headers: { "x-organization-id": org1.id, ...user1Session },
    });
    const { data } = await response.json();

    expect(response.status).toBe(200);
    expect(data.every((item) => item.organizationId === org1.id)).toBe(true);
  });

  it("should return empty when org1 user tries org2 query", async () => {
    const response = await fetch("/api/inventory", {
      headers: { "x-organization-id": org2.id, ...user1Session },
    });
    expect(response.status).toBe(403);
  });

  it("should block unscoped query attempts", async () => {
    try {
      // This should throw from Prisma middleware
      await prisma.inventoryItem.findMany({
        where: { status: "ACTIVE" }, // Missing organizationId
      });
      fail("Should have thrown");
    } catch (error) {
      expect(error.message).toContain("Tenant scope required");
    }
  });
});
```

---

## 📞 SUPPORT & ESCALATION

**If you get stuck:**

1. **"Tenant scope required" error** → Add `organizationId` to your WHERE/CREATE
2. **Cross-tenant data leaking** → Verify organizationId in ALL branches of OR/AND
3. **Nested includes not scoped** → Parent must be scoped; Prisma handles child scoping
4. **Feeling overwhelmed** → Use `withTenantContext` HOF for new endpoints instead of refactoring

**Reference docs:**

- Quick Start: `docs/technical/TENANT_SCOPING_QUICK_START.md`
- Patterns: `docs/technical/TENANT_SCOPING_PATTERNS.ts`
- Full Implementation: `docs/technical/TENANT_SCOPING_IMPLEMENTATION_SUMMARY.md`

---

## 🎉 SUCCESS METRICS

**Week 1 Goals:**

- ✅ 10 critical routes fixed & tested
- ✅ 0 "Tenant scope required" errors from Prisma middleware
- ✅ E2E tests passing
- ✅ Cross-tenant access blocked

**Week 2 Goals:**

- ✅ All routes migrated
- ✅ CI guard integrated (blocks PRs with violations)
- ✅ Staging deployment clean
- ✅ Ready for production rollout

---

**Created:** February 27, 2026  
**Last Updated:** February 27, 2026  
**Next Review:** March 6, 2026 (End of Week 1)
