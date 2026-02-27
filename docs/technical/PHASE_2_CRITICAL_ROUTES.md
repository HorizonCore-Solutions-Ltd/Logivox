# Phase 2: CRITICAL Routes for Tenant Scoping

**Status:** Generated from endpoint scanner analysis  
**Date:** February 27, 2026  
**Total Routes Analyzed:** 214  
**CRITICAL Routes:** 33 (need immediate fixing)

---

## 🔴 CRITICAL Routes Priority Order

| Priority | Route | Unscoped Queries | Impact | Status |
|----------|-------|-----------------|--------|--------|
| 1 | /api/activity-logs | 1 | Audit trail visibility | TODO |
| 2 | /api/admin | 1 | Super admin access | TODO |
| 3 | /api/ai-intervention | 1 | AI decision logging | TODO |
| 4 | /api/assembly-orders | 7 | Manufacturing workflows | TODO |
| 5 | /api/auth | 2 | Authentication context | TODO |
| 6 | /api/boms | 3 | Bill of materials | TODO |
| 7 | /api/carriers | 1 | Shipping integration | TODO |
| 8 | /api/categories | 5 | Inventory categories | TODO |
| 9 | /api/integrations | 3 | Third-party integrations | TODO |
| 10 | /api/inventory | 11 | Core inventory module | REVIEW |
| 11 | /api/invitations | 1 | Organization access | TODO |
| 12 | /api/mobile | 2 | Mobile app endpoints | TODO |
| 13 | /api/notifications | 4 | User notifications | TODO |
| 14 | /api/organizations | 1 | Organization mgmt | TODO |
| 15 | /api/picking-tasks | 11 | Warehouse operations | TODO |
| 16 | /api/portal | 1 | Customer portal | TODO |
| 17 | /api/purchase-orders | 13 | Procurement (multiple routes) | TODO |
| 18 | /api/receiving | 2 | Goods receipt | TODO |
| 19 | /api/returns | 2 | Return management | TODO |
| 20 | /api/slotting-optimization | 2 | Bin optimization | TODO |
| 21 | /api/task-automations | 1 | Workflow automation | TODO |
| 22 | /api/warehouses | 5 | Warehouse master data | TODO |
| 23 | /api/waves | 13 | Wave management | REVIEWED✅ |

---

## ⚠️ Key Findings

### Routes That Need Review
- `/api/waves` - Scanner flagged as CRITICAL (13 queries) but **already uses tenant context properly** ✅
- `/api/inventory` - Multiple endpoints; some properly scoped, some need review
- `/api/purchase-orders` - Split across multiple files with varying maturity levels

### Routes Definitely Needing Work
- `/api/activity-logs` - Likely missing organizationId in logging queries
- `/api/admin` - Super-admin routes may not enforce tenant boundaries
- `/api/picking-tasks` - 11 unscoped queries suggest incomplete scoping
- `/api/notifications` - Cross-tenant notification leaks possible

---

## 📋 Migration Pattern

For each CRITICAL route:

### Step 1: Audit Current Implementation
```bash
# Look for:
# 1. Session.user.organizationId availability
# 2. organizationId in WHERE clauses
# 3. organizationId in CREATE data payloads
# 4. validateOrganizationAccess() or similar checks
```

### Step 2: Apply Pattern

**Option A: Use HOF Wrapper (Recommended for new routes)**
```typescript
export const GET = withTenantContext(async (request, tenant) => {
  const items = await prisma.model.findMany({
    where: { organizationId: tenant.organizationId, ...filters },
  });
  return NextResponse.json(items);
});
```

**Option B: Manual Context (For complex routes)**
```typescript
export async function GET(request: NextRequest) {
  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const items = await prisma.model.findMany({
    where: { organizationId: tenant.organizationId, ...filters },
  });
  return NextResponse.json(items);
}
```

### Step 3: Validate
```typescript
// Verify:
// 1. All findMany/findFirst/create/update/delete include organizationId
// 2. Nested queries scope to same organization
// 3. E2E tests include cross-tenant verification
```

---

## 🧪 Testing Each Route

After migration, run:

```bash
# 1. Unit test for same-tenant access (should work)
npm test -- route-name.test.ts -- -t "same org"

# 2. Unit test for cross-tenant access (should fail)
npm test -- route-name.test.ts -- -t "different org"

# 3. E2E test
npm run test:e2e -- --grep "route-name"
```

---

## 📅 Recommended Timeline

**Day 1-2 (Today):** Routes 1-5 (auth, admin, basics)
- /api/activity-logs
- /api/admin  
- /api/auth
- /api/organizations
- /api/invitations

**Day 3-4:** Routes 6-15 (operational)
- /api/boms
- /api/carriers
- /api/categories
- /api/integrations
- /api/inventory audit
- /api/mobile
- /api/notifications
- /api/picking-tasks
- /api/portal
- /api/task-automations

**Day 5+:** Routes 16+ (complex)
- /api/purchase-orders (13 queries - 2-3 day effort)
- /api/warehouses
- /api/waves (audit only, already compliant)
- /api/returns
- /api/receiving
- /api/slotting-optimization

---

## ✅ Completion Criteria

Route is DONE when:
1. ✅ All queries include organizationId filter
2. ✅ All creates/updates include organizationId in data
3. ✅ Unit tests pass (same-org + cross-org isolation)
4. ✅ E2E tests pass
5. ✅ CI guard reports 0 violations
6. ✅ Code review approved

---

## 🚀 Next Action

**Start with `/api/activity-logs` (smallest, highest impact)**
- Simple single query
- Used for compliance/auditing
- Serves as good template for team
- ~30 minutes to complete
