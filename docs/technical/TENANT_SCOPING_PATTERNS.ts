/**
 * TENANT SCOPING PATTERNS & BEST PRACTICES
 * Reference guide for API developers implementing tenant-aware endpoints
 */

/**
 * ✅ PATTERN 1: Using Tenant Context in Route Handlers
 *
 * Most secure and recommended approach
 */
export const PATTERN_1_TENANT_CONTEXT = `
// File: apps/web/src/app/api/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { resolveTenantFromRequest } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Step 1: Resolve tenant context (enforces tenant isolation)
    const tenant = await resolveTenantFromRequest(request);

    // Step 2: All queries automatically scoped to tenant
    const items = await prisma.inventoryItem.findMany({
      where: {
        organizationId: tenant.organizationId,  // ← REQUIRED 
        status: "ACTIVE",
      },
      skip: 0,
      take: 50,
    });

    return NextResponse.json(items);
  } catch (error) {
    if (error.message.includes("Tenant")) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
`;

/**
 * ✅ PATTERN 2: Creating Records with Tenant Scope
 */
export const PATTERN_2_CREATE_WITH_TENANT = `
export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenantFromRequest(request);
    const body = await request.json();

    // Role check (optional but recommended)
    if (!["OWNER", "ADMIN", "MANAGER"].includes(tenant.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Create with organizationId automatically scoped
    const item = await prisma.inventoryItem.create({
      data: {
        organizationId: tenant.organizationId,  // ← REQUIRED
        warehouseId: body.warehouseId,
        name: body.name,
        sku: body.sku,
        quantity: body.quantity,
        minStockLevel: body.minStockLevel,
      },
    });

    // Audit log (also scoped to tenant)
    await prisma.auditLog.create({
      data: {
        organizationId: tenant.organizationId,  // ← REQUIRED
        userId: tenant.userId,
        action: "INVENTORY_ITEM_CREATED",
        resourceId: item.id,
        resourceType: "InventoryItem",
        metadata: { sku: item.sku },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    // Prisma middleware will throw if organizationId is missing
    if (error.message.includes("Tenant scope required")) {
      console.error("CRITICAL: Unscoped query detected", error);
      return NextResponse.json(
        { error: "Internal error" },
        { status: 500 }
      );
    }
    throw error;
  }
}
`;

/**
 * ❌ BAD PATTERN 1: Unscoped Query
 *
 * This will be REJECTED by Prisma middleware
 */
export const BAD_PATTERN_1_UNSCOPED = `
// ❌ WRONG - Missing organizationId in where clause
const items = await prisma.inventoryItem.findMany({
  where: {
    status: "ACTIVE",  // ← Only status, no organizationId!
  },
});
// Error: Tenant scope required: InventoryItem findMany must include 
// organizationId in where clause.
`;

/**
 * ❌ BAD PATTERN 2: Assuming organizationId from Request Body
 *
 * Trusting user input without verification
 */
export const BAD_PATTERN_2_UNVERIFIED = `
// ❌ WRONG - Trusting organizationId from request body
const body = await request.json();
const items = await prisma.inventoryItem.findMany({
  where: {
    organizationId: body.organizationId,  // ← User can fake this!
  },
});

// ✅ CORRECT - Get organizationId from verified session/headers
const tenant = await resolveTenantFromRequest(request);
const items = await prisma.inventoryItem.findMany({
  where: {
    organizationId: tenant.organizationId,  // ← From verified tenant context
  },
});
`;

/**
 * ❌ BAD PATTERN 3: Creating Without organizationId
 */
export const BAD_PATTERN_3_CREATE_UNSCOPED = `
// ❌ WRONG - Missing organizationId in create data
const item = await prisma.inventoryItem.create({
  data: {
    name: body.name,
    sku: body.sku,
    // organizationId missing!
  },
});
// Error: Tenant scope required: InventoryItem create must include 
// organizationId in data.
`;

/**
 * ✅ PATTERN 3: Complex Filters with Tenant Scoping
 */
export const PATTERN_3_COMPLEX_FILTERS = `
export async function GET(request: NextRequest) {
  const tenant = await resolveTenantFromRequest(request);
  const { searchParams } = new URL(request.url);

  // Extract query parameters
  const status = searchParams.get("status");
  const warehouseId = searchParams.get("warehouseId");
  const search = searchParams.get("search");

  // Build where clause - always include organizationId
  const where: any = {
    organizationId: tenant.organizationId,  // ← ALWAYS PRESENT
  };

  if (status) where.status = status;
  if (warehouseId) where.warehouseId = warehouseId;

  // Handle search with OR (must include organizationId in all branches)
  if (search) {
    where.AND = [
      { organizationId: tenant.organizationId },  // ← Redundant but explicit
      {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    skip: parseInt(searchParams.get("skip") || "0"),
    take: Math.min(parseInt(searchParams.get("take") || "50"), 1000),
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}
`;

/**
 * ✅ PATTERN 4: Upsert with Tenant Scoping
 */
export const PATTERN_4_UPSERT = `
export async function PUT(request: NextRequest) {
  const tenant = await resolveTenantFromRequest(request);
  const body = await request.json();

  const item = await prisma.inventoryItem.upsert({
    where: {
      id: body.id,
    },
    // For upsert, BOTH create and update must be scoped
    create: {
      organizationId: tenant.organizationId,  // ← REQUIRED
      warehouseId: body.warehouseId,
      name: body.name,
      sku: body.sku,
      quantity: body.quantity,
    },
    update: {
      // Note: organizationId cannot be updated (immutable)
      name: body.name,
      quantity: body.quantity,
    },
  });

  return NextResponse.json(item);
}
`;

/**
 * ✅ PATTERN 5: Nested Tenant Queries
 */
export const PATTERN_5_NESTED_QUERIES = `
export async function GET(request: NextRequest) {
  const tenant = await resolveTenantFromRequest(request);
  const { searchParams } = new URL(request.url);
  const warehouseId = searchParams.get("warehouseId");

  // Get warehouse with nested inventory - all scoped to tenant
  const warehouse = await prisma.warehouse.findFirst({
    where: {
      organizationId: tenant.organizationId,  // ← Tenant scoped
      id: warehouseId,
    },
    include: {
      inventoryItems: {
        where: {
          // ⚠️ Note: Nested where doesn't re-check organizationId by default
          // Prisma assumes if parent is scoped, children are too
          // BUT you should verify the relationship is secure
          status: "ACTIVE",
        },
        take: 50,
      },
    },
  });

  if (!warehouse) {
    return NextResponse.json(
      { error: "Warehouse not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(warehouse);
}
`;

/**
 * ✅ PATTERN 6: Bulk Operations with Tenant Scoping
 */
export const PATTERN_6_BULK_OPERATIONS = `
export async function POST(request: NextRequest) {
  const tenant = await resolveTenantFromRequest(request);
  const { itemIds, newStatus } = await request.json();

  // Verify all items belong to tenant before updating
  const existingItems = await prisma.inventoryItem.findMany({
    where: {
      organizationId: tenant.organizationId,  // ← Verify tenant ownership
      id: { in: itemIds },
    },
    select: { id: true },
  });

  const foundIds = new Set(existingItems.map((i) => i.id));
  const missingIds = itemIds.filter((id: string) => !foundIds.has(id));

  if (missingIds.length > 0) {
    return NextResponse.json(
      { error: "Some items not found or not in organization" },
      { status: 404 }
    );
  }

  // Bulk update - still requires organizationId in where
  const updated = await prisma.inventoryItem.updateMany({
    where: {
      organizationId: tenant.organizationId,  // ← REQUIRED
      id: { in: itemIds },
    },
    data: {
      status: newStatus,
    },
  });

  return NextResponse.json({
    updated: updated.count,
  });
}
`;

/**
 * ✅ PATTERN 7: Error Handling & Logging
 */
export const PATTERN_7_ERROR_HANDLING = `
export async function DELETE(request: NextRequest) {
  try {
    // Step 1: Resolve tenant (fails if no valid context)
    const tenant = await resolveTenantFromRequest(request);

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("id");

    // Step 2: Verify resource belongs to tenant
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        organizationId: tenant.organizationId,  // ← Double-check ownership
      },
    });

    if (!item) {
      // Don't reveal if item exists in another org
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    // Step 3: Delete
    await prisma.inventoryItem.create({
      data: {
        organizationId: tenant.organizationId,
        userId: tenant.userId,
        action: "INVENTORY_ITEM_DELETED",
        resourceId: itemId,
        metadata: { sku: item.sku },
      },
    });

    await prisma.inventoryItem.delete({
      where: {
        id: itemId,
      },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    // Distinguish tenant errors from application errors
    if (error.message.includes("Tenant scope required")) {
      console.error(
        "[SECURITY] Unscoped query detected",
        error.message,
      );
      return NextResponse.json(
        { error: "Internal error" },
        { status: 500 }
      );
    }

    if (error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    console.error("[ERROR] Delete failed", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
`;

/**
 * TESTING PATTERNS
 */
export const TEST_PATTERNS = `
// ✅ GOOD TEST: Verify tenant scoping works
describe("Tenant Scoping", () => {
  it("should reject cross-tenant access", async () => {
    // Create item in org1
    const org1Item = await prisma.inventoryItem.create({
      data: {
        organizationId: "org-1",
        warehouseId: "wh-1",
        name: "Item",
        sku: "SKU-001",
      },
    });

    // Try to access as org2 - should fail
    try {
      await prisma.inventoryItem.findUnique({
        where: {
          id: org1Item.id,
          organizationId: "org-2",  // ← Wrong org
        },
      });
      fail("Should have thrown");
    } catch (error) {
      expect(error.message).toContain("Tenant");
    }
  });

  it("should enforce organizationId in where clause", async () => {
    try {
      // ❌ Missing organizationId in where
      await prisma.inventoryItem.findMany({
        where: {
          status: "ACTIVE",
        },
      });
      fail("Should have thrown");
    } catch (error) {
      expect(error.message).toContain("Tenant scope required");
    }
  });

  it("should enforce organizationId in create data", async () => {
    try {
      // ❌ Missing organizationId in data
      await prisma.inventoryItem.create({
        data: {
          warehouseId: "wh-1",
          name: "Item",
          sku: "SKU-001",
        },
      });
      fail("Should have thrown");
    } catch (error) {
      expect(error.message).toContain("Tenant scope required");
    }
  });
});
`;

// Export all patterns
export const ALL_PATTERNS = {
  PATTERN_1_TENANT_CONTEXT,
  PATTERN_2_CREATE_WITH_TENANT,
  BAD_PATTERN_1_UNSCOPED,
  BAD_PATTERN_2_UNVERIFIED,
  BAD_PATTERN_3_CREATE_UNSCOPED,
  PATTERN_3_COMPLEX_FILTERS,
  PATTERN_4_UPSERT,
  PATTERN_5_NESTED_QUERIES,
  PATTERN_6_BULK_OPERATIONS,
  PATTERN_7_ERROR_HANDLING,
  TEST_PATTERNS,
};

console.log("✅ Tenant Scoping Patterns Reference");
console.log("See docs/technical/TENANT_SCOPING_PATTERNS.md for full examples");
