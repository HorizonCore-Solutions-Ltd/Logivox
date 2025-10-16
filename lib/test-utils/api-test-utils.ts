/**
 * API Test Utilities
 * Helper functions for testing API routes
 */

import { NextRequest } from 'next/server';

/**
 * Create mock NextRequest for testing
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
    searchParams = {},
  } = options;

  // Build URL with search params
  const fullUrl = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    fullUrl.searchParams.append(key, value);
  });

  // Create request
  const request = new NextRequest(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
}

/**
 * Create authenticated mock request
 */
export function createAuthenticatedRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
  userId?: string;
  userRole?: string;
}): NextRequest {
  const { userId = 'test-user-id', userRole = 'ADMIN', headers, ...requestOptions } = options;

  // Create mock JWT token
  const mockToken = Buffer.from(
    JSON.stringify({
      sub: userId,
      role: userRole,
      email: 'test@example.com',
    })
  ).toString('base64');

  return createMockRequest({
    ...requestOptions,
    headers: {
      Authorization: `Bearer ${mockToken}`,
      ...headers,
    },
  });
}

/**
 * Parse response from API route
 */
export async function parseResponse(response: Response) {
  const text = await response.text();
  
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Mock Prisma client for testing
 */
export function createMockPrisma() {
  return {
    inventoryItem: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({}),
    },
    salesOrder: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
    purchaseOrder: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    warehouse: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    location: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    stockLevel: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    pickingTask: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    wavePick: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback()),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Create mock session for testing
 */
export function createMockSession(overrides?: any) {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'ADMIN',
      ...overrides?.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

/**
 * Test data factories
 */
export const factories = {
  inventoryItem: (overrides?: any) => ({
    id: 'test-item-id',
    sku: 'TEST-SKU-001',
    name: 'Test Product',
    description: 'Test description',
    barcode: '1234567890123',
    categoryId: 'cat-1',
    supplierId: 'sup-1',
    unitPrice: 99.99,
    unitCost: 49.99,
    reorderPoint: 10,
    reorderQuantity: 100,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  salesOrder: (overrides?: any) => ({
    id: 'test-order-id',
    soNumber: 'SO-20251016-0001',
    status: 'CONFIRMED',
    customerId: 'cust-1',
    warehouseId: 'wh-1',
    orderDate: new Date(),
    requiredDate: new Date(),
    shippedDate: null,
    totalAmount: 199.98,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  purchaseOrder: (overrides?: any) => ({
    id: 'test-po-id',
    poNumber: 'PO-20251016-0001',
    status: 'CONFIRMED',
    supplierId: 'sup-1',
    warehouseId: 'wh-1',
    orderDate: new Date(),
    expectedDate: new Date(),
    receivedDate: null,
    totalAmount: 499.95,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  warehouse: (overrides?: any) => ({
    id: 'test-wh-id',
    name: 'Test Warehouse',
    code: 'WH-TEST',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345',
    country: 'US',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  location: (overrides?: any) => ({
    id: 'test-loc-id',
    name: 'A-01-01-01',
    barcode: 'LOC-A-01-01-01',
    warehouseId: 'wh-1',
    zone: 'A',
    aisle: '01',
    rack: '01',
    bin: '01',
    locationType: 'STORAGE',
    isActive: true,
    capacity: 100,
    currentUtilization: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  stockLevel: (overrides?: any) => ({
    id: 'test-stock-id',
    inventoryItemId: 'item-1',
    warehouseId: 'wh-1',
    locationId: 'loc-1',
    quantity: 100,
    allocatedQuantity: 20,
    availableQuantity: 80,
    reservedQuantity: 0,
    lotNumber: null,
    expiryDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  pickingTask: (overrides?: any) => ({
    id: 'test-task-id',
    taskNumber: 'TASK-20251016-0001',
    taskType: 'PICKING',
    status: 'PENDING',
    priority: 5,
    warehouseId: 'wh-1',
    assignedToId: 'user-1',
    fromLocationId: 'loc-1',
    toLocationId: 'loc-2',
    inventoryItemId: 'item-1',
    quantity: 10,
    scheduledFor: new Date(),
    startedAt: null,
    completedAt: null,
    duration: null,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  user: (overrides?: any) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

/**
 * Assert response structure
 */
export function assertSuccessResponse(data: any) {
  expect(data).toHaveProperty('success', true);
  expect(data).toHaveProperty('data');
}

export function assertErrorResponse(data: any, errorCode?: string) {
  expect(data).toHaveProperty('success', false);
  expect(data).toHaveProperty('error');
  
  if (errorCode) {
    expect(data.error).toHaveProperty('code', errorCode);
  }
}

/**
 * Assert pagination response
 */
export function assertPaginationResponse(data: any) {
  assertSuccessResponse(data);
  expect(data.data).toHaveProperty('items');
  expect(data.data).toHaveProperty('total');
  expect(data.data).toHaveProperty('page');
  expect(data.data).toHaveProperty('limit');
  expect(Array.isArray(data.data.items)).toBe(true);
}
