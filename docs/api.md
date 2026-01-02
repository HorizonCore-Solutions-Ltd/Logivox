# LogiVox API Documentation

## Overview

The LogiVox API is a RESTful API built with Node.js, Express, and TypeScript. It provides endpoints for managing warehouses, inventory, purchase orders, suppliers, and integrations.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {...},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Corp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "admin"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### Warehouses

#### GET /api/warehouses
Get list of warehouses for the authenticated user's organization.

**Response:**
```json
{
  "success": true,
  "data": {
    "warehouses": [
      {
        "id": "wh_123",
        "name": "Main Warehouse",
        "code": "WH001",
        "address": {
          "street": "123 Industrial Ave",
          "city": "Manufacturing City",
          "state": "CA",
          "country": "USA",
          "postalCode": "12345"
        },
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

#### POST /api/warehouses
Create a new warehouse.

**Request Body:**
```json
{
  "name": "New Warehouse",
  "code": "WH002",
  "description": "Secondary warehouse facility",
  "address": {
    "street": "456 Storage St",
    "city": "Warehouse City",
    "state": "NY",
    "country": "USA",
    "postalCode": "67890"
  }
}
```

#### GET /api/warehouses/:id
Get specific warehouse details.

#### PUT /api/warehouses/:id
Update warehouse information.

#### DELETE /api/warehouses/:id
Delete a warehouse (soft delete).

### Inventory

#### GET /api/inventory
Get inventory items with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search by SKU or name
- `category` (string): Filter by category
- `warehouseId` (string): Filter by warehouse
- `status` (string): Filter by status (active, inactive, discontinued)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item_123",
        "sku": "WIDGET-001",
        "name": "Premium Widget",
        "description": "High-quality widget for industrial applications",
        "category": "Electronics",
        "quantity": 100,
        "availableQuantity": 95,
        "reservedQuantity": 5,
        "reorderLevel": 20,
        "costPrice": 25.50,
        "sellingPrice": 45.00,
        "currency": "USD",
        "warehouse": {
          "id": "wh_123",
          "name": "Main Warehouse"
        },
        "location": {
          "id": "loc_123",
          "name": "A1-01-001"
        },
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### POST /api/inventory
Create a new inventory item.

#### GET /api/inventory/:id
Get specific inventory item details.

#### PUT /api/inventory/:id
Update inventory item.

#### POST /api/inventory/:id/scan
Record a barcode scan for inventory item.

**Request Body:**
```json
{
  "barcode": "1234567890123",
  "quantity": 1,
  "location": "A1-01-001",
  "notes": "Scanned during receiving"
}
```

### Purchase Orders

#### GET /api/purchase-orders
Get list of purchase orders with filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status (draft, pending, approved, sent, received, etc.)
- `supplierId`: Filter by supplier
- `dateFrom`, `dateTo`: Date range filter

#### POST /api/purchase-orders
Create a new purchase order.

**Request Body:**
```json
{
  "supplierId": "sup_123",
  "orderDate": "2024-01-01",
  "expectedDate": "2024-01-15",
  "notes": "Urgent order",
  "items": [
    {
      "inventoryItemId": "item_123",
      "quantity": 50,
      "unitPrice": 25.50,
      "description": "Premium widgets"
    }
  ]
}
```

#### GET /api/purchase-orders/:id
Get specific purchase order with line items.

#### PUT /api/purchase-orders/:id
Update purchase order.

#### POST /api/purchase-orders/:id/receive
Mark purchase order as received and update inventory.

### Suppliers

#### GET /api/suppliers
Get list of suppliers.

#### POST /api/suppliers
Create a new supplier.

**Request Body:**
```json
{
  "name": "ABC Electronics",
  "code": "SUP001",
  "email": "orders@abcelectronics.com",
  "phone": "+1-555-0123",
  "website": "https://abcelectronics.com",
  "address": {
    "street": "456 Supplier St",
    "city": "Supplier City",
    "state": "NY",
    "country": "USA",
    "postalCode": "67890"
  },
  "paymentTerms": "Net 30",
  "taxId": "123-45-6789"
}
```

### Integrations

#### GET /api/integrations/erp/systems
Get list of available ERP systems.

#### POST /api/integrations/erp/:system/connect
Connect to an ERP system.

#### GET /api/integrations/erp/status
Get current ERP integration status.

#### POST /api/integrations/sync
Trigger manual sync with connected ERP systems.

### Reports

#### GET /api/reporting/dashboard
Get dashboard data with key metrics.

#### GET /api/reporting/analytics/inventory
Get inventory analytics data.

#### POST /api/reporting/reports/custom
Generate custom report.

**Request Body:**
```json
{
  "name": "Monthly Inventory Report",
  "type": "inventory",
  "filters": {
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "warehouseIds": ["wh_123"],
    "categories": ["Electronics"]
  },
  "groupBy": ["category", "supplier"],
  "metrics": ["quantity", "value", "turnover"]
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Requested resource not found |
| `VALIDATION_ERROR` | Request data validation failed |
| `DUPLICATE_ENTRY` | Attempting to create duplicate resource |
| `INTEGRATION_ERROR` | ERP integration failure |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## Rate Limiting

- **Standard endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Upload endpoints**: 10 requests per minute per user

## WebSocket Events

The API supports real-time updates via WebSocket connections at `/socket.io`.

### Events

- `inventory_updated`: Fired when inventory quantities change
- `order_status_changed`: Fired when purchase order status updates
- `sync_completed`: Fired when ERP sync completes
- `low_stock_alert`: Fired when items reach reorder level

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join warehouse-specific updates
socket.emit('join_warehouse', 'warehouse_id');

// Listen for inventory updates
socket.on('inventory_updated', (data) => {
  console.log('Inventory updated:', data);
});
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @logivox/sdk
```

```javascript
import { LogiVoxClient } from '@logivox/sdk';

const client = new LogiVoxClient({
  apiUrl: 'http://localhost:5000/api',
  apiKey: 'your-api-key'
});

// Get inventory
const inventory = await client.inventory.list({
  warehouseId: 'wh_123'
});
```

## Changelog

### v1.0.0
- Initial API release
- Basic CRUD operations for all entities
- JWT authentication
- WebSocket real-time updates
- ERP integration framework

## Support

For API support, please:
1. Check this documentation
2. Review the [GitHub issues](https://github.com/flowstock/flowstock/issues)
3. Contact support at api-support@logivox.ai