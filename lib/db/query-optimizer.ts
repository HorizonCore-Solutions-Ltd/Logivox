/**
 * Database Query Optimizer
 * Provides optimized query patterns and utilities
 */

import { Prisma } from "@prisma/client";

/**
 * Common select fields to reduce data transfer
 */
export const SelectFields = {
  user: {
    id: true,
    name: true,
    email: true,
    role: true,
    image: true,
  },
  inventory: {
    id: true,
    sku: true,
    name: true,
    quantity: true,
    unitPrice: true,
    warehouseId: true,
    status: true,
    updatedAt: true,
  },
  order: {
    id: true,
    orderNumber: true,
    type: true,
    status: true,
    totalAmount: true,
    customerId: true,
    warehouseId: true,
    createdAt: true,
  },
  warehouse: {
    id: true,
    name: true,
    code: true,
    type: true,
    status: true,
  },
  customer: {
    id: true,
    name: true,
    email: true,
    phone: true,
    company: true,
  },
  supplier: {
    id: true,
    name: true,
    email: true,
    phone: true,
    company: true,
  },
} as const;

/**
 * Pagination utilities
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Query builder utilities
 */
export function buildSearchQuery(
  searchTerm: string,
  fields: string[],
): Prisma.InputJsonValue {
  if (!searchTerm || fields.length === 0) {
    return {};
  }

  const searchConditions = fields.map((field) => ({
    [field]: {
      contains: searchTerm,
      mode: "insensitive" as Prisma.QueryMode,
    },
  }));

  return {
    OR: searchConditions,
  };
}

export function buildDateRangeQuery(
  field: string,
  startDate?: Date,
  endDate?: Date,
): Prisma.InputJsonValue {
  const conditions: any = {};

  if (startDate) {
    conditions.gte = startDate;
  }

  if (endDate) {
    conditions.lte = endDate;
  }

  if (Object.keys(conditions).length === 0) {
    return {};
  }

  return {
    [field]: conditions,
  };
}

export function buildSortOrder(
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc",
): Prisma.InputJsonValue {
  if (!sortBy) {
    return { createdAt: "desc" };
  }

  return {
    [sortBy]: sortOrder,
  };
}

/**
 * Batch operations utilities
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100,
): Promise<R[]> {
  const chunks = chunkArray(items, batchSize);
  const results: R[] = [];

  for (const chunk of chunks) {
    const batchResults = await processor(chunk);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Connection optimization
 */
export const OptimizedIncludes = {
  /**
   * Inventory with minimal relations
   */
  inventoryMinimal: {
    warehouse: {
      select: SelectFields.warehouse,
    },
  },

  /**
   * Inventory with full details
   */
  inventoryFull: {
    warehouse: {
      select: SelectFields.warehouse,
    },
    movements: {
      take: 10,
      orderBy: { createdAt: "desc" as const },
      select: {
        id: true,
        type: true,
        quantity: true,
        fromWarehouseId: true,
        toWarehouseId: true,
        createdAt: true,
        createdBy: {
          select: SelectFields.user,
        },
      },
    },
  },

  /**
   * Order with minimal relations
   */
  orderMinimal: {
    customer: {
      select: SelectFields.customer,
    },
    warehouse: {
      select: SelectFields.warehouse,
    },
  },

  /**
   * Order with full details
   */
  orderFull: {
    customer: {
      select: SelectFields.customer,
    },
    warehouse: {
      select: SelectFields.warehouse,
    },
    items: {
      select: {
        id: true,
        inventoryId: true,
        quantity: true,
        unitPrice: true,
        totalPrice: true,
        inventory: {
          select: SelectFields.inventory,
        },
      },
    },
    createdBy: {
      select: SelectFields.user,
    },
  },

  /**
   * User with minimal relations
   */
  userMinimal: {
    warehouses: {
      select: SelectFields.warehouse,
    },
  },

  /**
   * Warehouse with stats
   */
  warehouseWithStats: {
    _count: {
      select: {
        inventory: true,
        orders: true,
        locations: true,
      },
    },
  },
} as const;

/**
 * Index recommendations for Prisma schema
 */
export const IndexRecommendations = `
// Add these indexes to your Prisma schema for better query performance

model Inventory {
  // ... existing fields
  
  @@index([warehouseId, status])
  @@index([sku])
  @@index([status, quantity])
  @@index([reorderPoint, quantity])
  @@index([createdAt])
  @@index([updatedAt])
  @@fulltext([name, description])
}

model Order {
  // ... existing fields
  
  @@index([customerId, status])
  @@index([warehouseId, status])
  @@index([orderNumber])
  @@index([status, createdAt])
  @@index([type, status])
  @@index([createdAt])
}

model InventoryMovement {
  // ... existing fields
  
  @@index([inventoryId, createdAt])
  @@index([fromWarehouseId, createdAt])
  @@index([toWarehouseId, createdAt])
  @@index([type, createdAt])
  @@index([createdAt])
}

model User {
  // ... existing fields
  
  @@index([email])
  @@index([role])
  @@index([status])
}

model Warehouse {
  // ... existing fields
  
  @@index([code])
  @@index([type, status])
  @@index([status])
}

model Customer {
  // ... existing fields
  
  @@index([email])
  @@index([phone])
  @@index([status])
  @@fulltext([name, company])
}

model Supplier {
  // ... existing fields
  
  @@index([email])
  @@index([phone])
  @@index([status])
  @@fulltext([name, company])
}

model AuditLog {
  // ... existing fields
  
  @@index([userId, timestamp])
  @@index([eventType, timestamp])
  @@index([severity, timestamp])
  @@index([resource, resourceId])
  @@index([timestamp])
}
`;

/**
 * Query performance monitoring
 */
export class QueryPerformanceMonitor {
  private static queries: Map<string, { count: number; totalTime: number }> =
    new Map();

  static track(queryName: string, executionTime: number): void {
    const existing = this.queries.get(queryName) || { count: 0, totalTime: 0 };
    this.queries.set(queryName, {
      count: existing.count + 1,
      totalTime: existing.totalTime + executionTime,
    });
  }

  static getStats(): Array<{
    query: string;
    count: number;
    avgTime: number;
    totalTime: number;
  }> {
    return Array.from(this.queries.entries()).map(([query, stats]) => ({
      query,
      count: stats.count,
      avgTime: stats.totalTime / stats.count,
      totalTime: stats.totalTime,
    }));
  }

  static reset(): void {
    this.queries.clear();
  }
}

/**
 * Decorator for query performance tracking
 */
export function TrackQuery(queryName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      try {
        return await originalMethod.apply(this, args);
      } finally {
        const executionTime = Date.now() - startTime;
        QueryPerformanceMonitor.track(queryName, executionTime);

        // Log slow queries (> 1 second)
        if (executionTime > 1000) {
          console.warn(
            `Slow query detected: ${queryName} took ${executionTime}ms`,
          );
        }
      }
    };

    return descriptor;
  };
}
