# TENANT SCOPING - QUICK START GUIDE
## For API Developers

### Step 1: Import Tenant Context
```typescript
import { resolveTenantFromRequest } from "@/lib/tenant-context";
```

### Step 2: Resolve Tenant at Route Start
```typescript
export async function GET(request: NextRequest) {
  try {
    const tenant = await resolveTenantFromRequest(request);
    // tenant.organizationId ← Use this in all queries
    // tenant.userId
    // tenant.role ("OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "GUEST")
    // tenant.isAdmin
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
```

### Step 3: Add organizationId to WHERE Clause
```typescript
// ✅ CORRECT
const items = await prisma.inventoryItem.findMany({
  where: {
    organizationId: tenant.organizationId,  // ← REQUIRED
    status: "ACTIVE",
  },
});

// ❌ WRONG
const items = await prisma.inventoryItem.findMany({
  where: {
    status: "ACTIVE",  // Missing organizationId!
  },
});
```

### Step 4: Add organizationId to CREATE Data
```typescript
// ✅ CORRECT
const item = await prisma.inventoryItem.create({
  data: {
    organizationId: tenant.organizationId,  // ← REQUIRED
    warehouseId: body.warehouseId,
    name: body.name,
    sku: body.sku,
  },
});

// ❌ WRONG
const item = await prisma.inventoryItem.create({
  data: {
    warehouseId: body.warehouseId,
    name: body.name,
    sku: body.sku,
    // Missing organizationId!
  },
});
```

### Step 5: Verify Role (Optional but Recommended)
```typescript
import { assertRole } from "@/lib/tenant-context";

// For admin-only endpoints
assertRole(tenant, ["OWNER", "ADMIN"]);

// For editor endpoints
assertRole(tenant, ["OWNER", "ADMIN", "EDITOR"]);
```

### Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Tenant scope required" error | Add `organizationId` to your where/data clause |
| "Unauthorized" when accessing other org | Make sure you're using `tenant.organizationId` not user input |
| Can't find records that should exist | Verify `organizationId` value matches - don't trust from URL/body |
| Queries are slow | Check indexes are applied - run migration |

### Testing Your Endpoint

```typescript
describe("Tenant Scoping", () => {
  it("should enforce organizationId", async () => {
    try {
      await prisma.inventoryItem.findMany({
        where: { status: "ACTIVE" },  // Missing organizationId
      });
      fail("Should have thrown");
    } catch (error) {
      expect(error.message).toContain("Tenant scope required");
    }
  });
});
```

### Full Example Endpoint

```typescript
// GET /api/inventory?status=ACTIVE&limit=50
export async function GET(request: NextRequest) {
  try {
    // 1. Resolve tenant (enforces authentication)
    const tenant = await resolveTenantFromRequest(request);

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 1000);

    // 3. Build where clause WITH organizationId
    const where: any = {
      organizationId: tenant.organizationId,  // ← ALWAYS FIRST
    };
    if (status) where.status = status;

    // 4. Query (will auto-validate at Prisma middleware)
    const items = await prisma.inventoryItem.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // 5. Return results
    return NextResponse.json(items);
  } catch (error) {
    if (error.message.includes("Tenant")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
```

### Checklist for Your Endpoint

- [ ] Import `resolveTenantFromRequest`
- [ ] Call `await resolveTenantFromRequest(request)` at start
- [ ] Add `organizationId: tenant.organizationId` to all WHERE clauses
- [ ] Add `organizationId: tenant.organizationId` to all CREATE data
- [ ] Test with missing organizationId (should throw)
- [ ] Test with different organizationId (should get 403)
- [ ] Check query performance (run EXPLAIN ANALYZE)

### Need Help?

**Reference Documentation:**
- Full patterns: `docs/technical/TENANT_SCOPING_PATTERNS.ts`
- Schema audit: `docs/technical/SCHEMA_AUDIT_TENANT_SCOPING.md`
- Implementation summary: `docs/technical/TENANT_SCOPING_IMPLEMENTATION_SUMMARY.md`

**Common Questions:**

Q: What if the model doesn't have organizationId?  
A: Use the parent model that does (e.g., Warehouse has it, query through warehouse)

Q: Can I trust organizationId from request body?  
A: NO! Always use `tenant.organizationId` from the resolved context

Q: What about updating/deleting?  
A: Same rule - `organizationId` must be in WHERE clause

Q: How do I get organizationId in nested queries?  
A: Parent model auto-scopes if it has organizationId; verify the relationship

Q: Should I add organizationId to indexes?  
A: YES! See schema migration file for recommended indexes
