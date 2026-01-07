# Flowstock API Documentation

**Version:** 1.0.0  
**Base URL:** `https://api.logivox.ai/v1`  
**Authentication:** Bearer Token (JWT)

## Table of Contents

1. [Authentication](#authentication)
2. [Inventory Management](#inventory-management)
3. [Order Management](#order-management)
4. [Warehouse Operations](#warehouse-operations)
5. [Advanced Operations](#advanced-operations)
6. [Analytics & Reporting](#analytics--reporting)
7. [External Integrations](#external-integrations)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Webhooks](#webhooks)

---

## Authentication

### POST /auth/login

Authenticate user and receive access token.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "WAREHOUSE_MANAGER"
  },
  "expiresIn": 3600
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

---

## Inventory Management

### GET /inventory/items

List all inventory items with filtering and pagination.

**Query Parameters:**

- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 100)
- `search` (string): Search by SKU, name, or description
- `category` (string): Filter by category
- `status` (string): Filter by status (ACTIVE, INACTIVE, DISCONTINUED)
- `lowStock` (boolean): Filter items with low stock
- `warehouseId` (string): Filter by warehouse

**Response:**

```json
{
  "items": [
    {
      "id": "item_123",
      "sku": "WIDGET-001",
      "name": "Premium Widget",
      "description": "High-quality widget for industrial use",
      "category": "COMPONENTS",
      "uom": "EA",
      "reorderPoint": 50,
      "reorderQuantity": 200,
      "stockOnHand": 145,
      "stockReserved": 30,
      "stockAvailable": 115,
      "averageCost": 12.5,
      "retailPrice": 24.99,
      "status": "ACTIVE",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-10-15T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1247,
    "totalPages": 25
  }
}
```

### POST /inventory/items

Create new inventory item.

**Request:**

```json
{
  "sku": "WIDGET-002",
  "name": "Standard Widget",
  "description": "Standard quality widget",
  "category": "COMPONENTS",
  "uom": "EA",
  "reorderPoint": 30,
  "reorderQuantity": 150,
  "averageCost": 8.5,
  "retailPrice": 17.99,
  "supplier": {
    "id": "supplier_456",
    "leadTime": 7
  },
  "barcode": "1234567890123",
  "weight": 0.5,
  "dimensions": {
    "length": 10,
    "width": 5,
    "height": 3,
    "unit": "cm"
  }
}
```

**Response:**

```json
{
  "id": "item_124",
  "sku": "WIDGET-002",
  "name": "Standard Widget",
  "status": "ACTIVE",
  "createdAt": "2025-10-16T09:15:00Z"
}
```

### GET /inventory/items/{id}

Get detailed information about a specific inventory item.

**Response:**

```json
{
  "id": "item_123",
  "sku": "WIDGET-001",
  "name": "Premium Widget",
  "description": "High-quality widget for industrial use",
  "category": "COMPONENTS",
  "uom": "EA",
  "reorderPoint": 50,
  "reorderQuantity": 200,
  "stockLevels": [
    {
      "warehouse": {
        "id": "wh_001",
        "name": "Main Warehouse"
      },
      "onHand": 145,
      "reserved": 30,
      "available": 115,
      "onOrder": 200
    }
  ],
  "locations": [
    {
      "id": "loc_001",
      "name": "A-01-01",
      "zone": "A",
      "quantity": 100
    }
  ],
  "lotTracking": true,
  "serialTracking": false,
  "supplier": {
    "id": "supplier_456",
    "name": "ACME Corp",
    "leadTime": 7
  },
  "metrics": {
    "turnoverRate": 8.5,
    "daysOnHand": 42,
    "fillRate": 98.5
  }
}
```

### PATCH /inventory/items/{id}

Update inventory item.

**Request:**

```json
{
  "name": "Premium Widget Pro",
  "retailPrice": 27.99,
  "reorderPoint": 60
}
```

---

## Order Management

### GET /orders/sales

List sales orders with filtering.

**Query Parameters:**

- `page` (integer): Page number
- `limit` (integer): Orders per page
- `status` (string): DRAFT, PENDING, CONFIRMED, PICKING, PACKED, SHIPPED, DELIVERED, CANCELLED
- `customerId` (string): Filter by customer
- `dateFrom` (string): Start date (ISO 8601)
- `dateTo` (string): End date (ISO 8601)
- `priority` (string): LOW, NORMAL, HIGH, URGENT

**Response:**

```json
{
  "orders": [
    {
      "id": "so_123",
      "soNumber": "SO-20251016-0001",
      "customer": {
        "id": "cust_456",
        "name": "ABC Industries"
      },
      "status": "CONFIRMED",
      "priority": "HIGH",
      "orderDate": "2025-10-16T08:00:00Z",
      "expectedShipDate": "2025-10-18T00:00:00Z",
      "totalItems": 15,
      "totalQuantity": 150,
      "totalAmount": 1299.99,
      "lines": [
        {
          "id": "line_001",
          "item": {
            "id": "item_123",
            "sku": "WIDGET-001",
            "name": "Premium Widget"
          },
          "quantity": 50,
          "unitPrice": 24.99,
          "lineTotal": 1249.5,
          "status": "PENDING"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 342,
    "totalPages": 7
  }
}
```

### POST /orders/sales

Create new sales order.

**Request:**

```json
{
  "customerId": "cust_456",
  "priority": "NORMAL",
  "expectedShipDate": "2025-10-20T00:00:00Z",
  "shippingAddress": {
    "name": "ABC Industries",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "lines": [
    {
      "inventoryItemId": "item_123",
      "quantity": 50,
      "unitPrice": 24.99
    },
    {
      "inventoryItemId": "item_124",
      "quantity": 100,
      "unitPrice": 17.99
    }
  ],
  "notes": "Rush order - ship ASAP"
}
```

**Response:**

```json
{
  "id": "so_124",
  "soNumber": "SO-20251016-0002",
  "status": "DRAFT",
  "totalAmount": 3048.5,
  "createdAt": "2025-10-16T10:30:00Z"
}
```

### GET /orders/purchase

List purchase orders.

**Response:** Similar structure to sales orders.

---

## Warehouse Operations

### GET /warehouses

List all warehouses.

**Response:**

```json
{
  "warehouses": [
    {
      "id": "wh_001",
      "name": "Main Warehouse",
      "code": "WH-MAIN",
      "type": "DISTRIBUTION_CENTER",
      "address": {
        "street": "789 Industrial Blvd",
        "city": "Chicago",
        "state": "IL",
        "zipCode": "60601"
      },
      "capacity": {
        "totalLocations": 5000,
        "usedLocations": 3245,
        "utilizationRate": 64.9
      },
      "isActive": true
    }
  ]
}
```

### GET /locations

List warehouse locations.

**Query Parameters:**

- `warehouseId` (string): Filter by warehouse
- `zone` (string): Filter by zone
- `locationType` (string): STORAGE, RECEIVING, SHIPPING, PACKING, STAGING
- `isEmpty` (boolean): Filter empty locations

**Response:**

```json
{
  "locations": [
    {
      "id": "loc_001",
      "name": "A-01-01",
      "barcode": "LOC-A0101",
      "zone": "A",
      "aisle": "01",
      "rack": "01",
      "bin": "01",
      "locationType": "STORAGE",
      "capacity": 100,
      "currentQuantity": 75,
      "isEmpty": false,
      "isActive": true,
      "items": [
        {
          "inventoryItemId": "item_123",
          "quantity": 75,
          "lotNumber": "LOT-2025-001"
        }
      ]
    }
  ]
}
```

### POST /transfers

Create inventory transfer between locations.

**Request:**

```json
{
  "fromLocationId": "loc_001",
  "toLocationId": "loc_002",
  "inventoryItemId": "item_123",
  "quantity": 25,
  "reason": "REPLENISHMENT",
  "notes": "Restocking pick location"
}
```

---

## Advanced Operations

### POST /waves

Create wave picking batch.

**Request:**

```json
{
  "warehouseId": "wh_001",
  "name": "Morning Pick Wave",
  "waveType": "BATCH",
  "priority": "NORMAL",
  "strategy": "ZONE_BASED",
  "groupingCriteria": {
    "zone": ["A", "B"],
    "carrier": "FedEx",
    "maxOrders": 50
  },
  "scheduledFor": "2025-10-17T08:00:00Z",
  "orderIds": ["so_123", "so_124", "so_125"]
}
```

**Response:**

```json
{
  "id": "wave_001",
  "waveNumber": "WAVE-20251016-0001",
  "status": "PLANNED",
  "totalOrders": 3,
  "totalLines": 45,
  "createdAt": "2025-10-16T14:30:00Z"
}
```

### PATCH /waves/{id}

Update wave or perform action.

**Request (Release Wave):**

```json
{
  "action": "release"
}
```

**Request (Assign Wave):**

```json
{
  "action": "assign",
  "assignedToId": "user_123"
}
```

### GET /picking-tasks

List picking tasks.

**Query Parameters:**

- `status` (string): PENDING, ASSIGNED, IN_PROGRESS, COMPLETED
- `assignedToId` (string): Filter by assigned user
- `priority` (string): LOW, NORMAL, HIGH, URGENT
- `warehouseId` (string): Filter by warehouse

**Response:**

```json
{
  "tasks": [
    {
      "id": "task_001",
      "taskNumber": "TASK-20251016-0001",
      "taskType": "PICK",
      "priority": "HIGH",
      "status": "ASSIGNED",
      "title": "Pick items for SO-20251016-0001",
      "assignedTo": {
        "id": "user_123",
        "name": "John Picker"
      },
      "fromLocation": {
        "id": "loc_001",
        "name": "A-01-01"
      },
      "scheduledFor": "2025-10-17T09:00:00Z",
      "progress": 0
    }
  ]
}
```

### POST /routes/optimize

Calculate optimized picking route.

**Request:**

```json
{
  "warehouseId": "wh_001",
  "wavePickId": "wave_001",
  "optimizationMethod": "SHORTEST_PATH",
  "startLocationId": "loc_shipping",
  "endLocationId": "loc_packing",
  "locationIds": ["loc_001", "loc_015", "loc_032", "loc_045"]
}
```

**Response:**

```json
{
  "id": "route_001",
  "routeNumber": "ROUTE-20251016-0001",
  "totalStops": 4,
  "totalDistance": 245.5,
  "estimatedDuration": 420,
  "waypoints": [
    {
      "sequence": 1,
      "locationId": "loc_001",
      "distance": 0,
      "estimatedTime": 0
    },
    {
      "sequence": 2,
      "locationId": "loc_015",
      "distance": 65.2,
      "estimatedTime": 90
    }
  ]
}
```

### POST /task-automations

Create task automation rule.

**Request:**

```json
{
  "name": "Auto Replenishment",
  "code": "AUTO_REPLENISH_01",
  "triggerEvent": "LOW_STOCK",
  "triggerConditions": {
    "field": "stockAvailable",
    "operator": "lte",
    "value": "reorderPoint"
  },
  "taskType": "REPLENISH",
  "taskPriority": "NORMAL",
  "taskTemplate": {
    "title": "Replenish {{item.sku}}",
    "instructions": "Move {{reorderQuantity}} units to pick location"
  },
  "assignmentRule": "LEAST_BUSY",
  "isActive": true
}
```

---

## Analytics & Reporting

### GET /analytics/dashboard

Get dashboard statistics.

**Query Parameters:**

- `dateFrom` (string): Start date
- `dateTo` (string): End date
- `warehouseId` (string): Filter by warehouse

**Response:**

```json
{
  "period": {
    "from": "2025-10-01T00:00:00Z",
    "to": "2025-10-16T23:59:59Z"
  },
  "metrics": {
    "totalOrders": 1247,
    "ordersShipped": 1189,
    "ordersFulfillmentRate": 95.35,
    "averagePickTime": 12.5,
    "inventoryTurnover": 8.2,
    "stockAccuracy": 99.1,
    "revenue": 145678.9
  },
  "trends": {
    "ordersGrowth": 12.5,
    "revenueGrowth": 18.3
  }
}
```

### POST /reports/generate

Generate custom report.

**Request:**

```json
{
  "reportType": "INVENTORY_VALUATION",
  "format": "PDF",
  "parameters": {
    "warehouseId": "wh_001",
    "asOfDate": "2025-10-16T00:00:00Z",
    "includeInactive": false
  },
  "email": "manager@example.com"
}
```

**Response:**

```json
{
  "id": "report_001",
  "status": "GENERATING",
  "estimatedCompletion": "2025-10-16T15:05:00Z",
  "downloadUrl": null
}
```

### GET /reports/{id}

Check report status and download.

**Response:**

```json
{
  "id": "report_001",
  "status": "COMPLETED",
  "downloadUrl": "https://api.logivox.ai/reports/download/report_001.pdf",
  "expiresAt": "2025-10-23T15:00:00Z"
}
```

---

## External Integrations

### GET /integrations

List configured integrations.

**Response:**

```json
{
  "integrations": [
    {
      "id": "int_001",
      "provider": "QUICKBOOKS_ONLINE",
      "category": "ACCOUNTING",
      "status": "ACTIVE",
      "healthStatus": "HEALTHY",
      "lastSync": "2025-10-16T14:00:00Z",
      "uptime": 99.8
    }
  ]
}
```

### POST /integrations/{id}/sync

Trigger manual sync.

**Request:**

```json
{
  "syncType": "EXPORT",
  "entityType": "SALES_ORDERS",
  "dateFrom": "2025-10-15T00:00:00Z"
}
```

---

## Error Handling

All errors follow this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "quantity",
        "message": "Must be a positive number"
      }
    ],
    "requestId": "req_abc123"
  }
}
```

**Common Error Codes:**

- `AUTHENTICATION_FAILED` (401)
- `UNAUTHORIZED` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `CONFLICT` (409)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_SERVER_ERROR` (500)

---

## Rate Limiting

- **Standard tier:** 1000 requests/hour
- **Premium tier:** 5000 requests/hour
- **Enterprise tier:** Unlimited

Rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1697472000
```

---

## Webhooks

Subscribe to real-time events.

### POST /webhooks

Register webhook endpoint.

**Request:**

```json
{
  "url": "https://yourapp.com/webhooks/flowstock",
  "events": [
    "order.created",
    "order.shipped",
    "inventory.low_stock",
    "wave.completed"
  ],
  "secret": "your_webhook_secret"
}
```

**Webhook Payload Example:**

```json
{
  "event": "order.shipped",
  "timestamp": "2025-10-16T15:30:00Z",
  "data": {
    "orderId": "so_123",
    "orderNumber": "SO-20251016-0001",
    "trackingNumber": "1Z999AA10123456784"
  },
  "signature": "sha256=..."
}
```

---

## SDK & Client Libraries

- **JavaScript/TypeScript:** `npm install @logivox/sdk`
- **Python:** `pip install logivox-sdk`
- **C#/.NET:** `dotnet add package Flowstock.SDK`
- **PHP:** `composer require flowstock/sdk`

---

**Support:** api-support@logivox.ai  
**Status Page:** https://status.logivox.ai
