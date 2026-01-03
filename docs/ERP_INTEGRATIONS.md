# 🔌 ERP INTEGRATIONS
## LogiVox WMS - Enterprise Resource Planning Connectors

### Overview

LogiVox provides bidirectional integration with major ERP systems to synchronize products, orders, customers, and inventory levels. The ERP connector framework offers a unified interface across SAP, Oracle NetSuite, Microsoft Dynamics, and QuickBooks.

---

## 🎯 Supported ERP Systems

| ERP System | Products | Orders | Customers | Inventory | Invoices | Status |
|------------|----------|--------|-----------|-----------|----------|--------|
| **SAP** | ✅ | ✅ | ✅ | ✅ | 🔜 | Production Ready |
| **Oracle NetSuite** | 🔜 | 🔜 | 🔜 | 🔜 | 🔜 | Framework Ready |
| **Microsoft Dynamics 365** | 🔜 | 🔜 | 🔜 | 🔜 | 🔜 | Planned Q2 2026 |
| **QuickBooks** | 🔜 | 🔜 | 🔜 | ❌ | 🔜 | Planned Q2 2026 |

---

## 📋 Integration Patterns

### 1. **Pull from ERP** (Import)
Synchronize data from ERP to LogiVox:
- Product catalog
- Customer master data
- Sales orders
- Inventory levels

### 2. **Push to ERP** (Export)
Send data from LogiVox to ERP:
- Shipment confirmations
- Inventory adjustments
- Invoices
- Order status updates

### 3. **Webhook Events** (Real-time)
Real-time notifications for critical events:
- Order created in ERP → Auto-create in LogiVox
- Shipment dispatched → Update ERP order status
- Inventory adjusted → Sync to ERP inventory

---

## 🚀 SAP Integration

### Architecture

LogiVox connects to SAP via OData API (SAP Business Technology Platform):

```
LogiVox WMS → SAP OData API → SAP S/4HANA / ECC
```

### Supported SAP Modules

- **MM (Materials Management)**: Product master data, inventory
- **SD (Sales & Distribution)**: Sales orders, deliveries
- **FI (Financial Accounting)**: Customer master, invoices

### Authentication

SAP uses OAuth 2.0 client credentials flow:

```typescript
POST https://your-sap-instance.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id=YOUR_CLIENT_ID
client_secret=YOUR_CLIENT_SECRET
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### API Operations

#### Get Products

```typescript
import { sapConnector } from '@/lib/services/erp-connectors';

// Get all products
const products = await sapConnector.getProducts();

// Get products modified since date
const recentProducts = await sapConnector.getProducts(
  new Date('2026-01-01')
);

// Get single product
const product = await sapConnector.getProduct('PRODUCT-001');
```

**SAP OData Endpoint:**
```
GET /A_Product
GET /A_Product?$filter=LastChangeDateTime gt datetime'2026-01-01T00:00:00'
GET /A_Product('PRODUCT-001')
```

**Response Format:**
```json
{
  "erpId": "PRODUCT-001",
  "sku": "PRODUCT-001",
  "name": "Widget Pro 3000",
  "description": "Professional grade widget",
  "price": 99.99,
  "cost": 45.50,
  "uom": "EA",
  "category": "WIDGETS"
}
```

#### Get Orders

```typescript
// Get orders in date range
const orders = await sapConnector.getOrders(
  new Date('2026-01-01'),
  new Date('2026-01-31')
);

// Get single order with line items
const order = await sapConnector.getOrder('SAP-ORDER-12345');
```

**SAP OData Endpoint:**
```
GET /A_SalesOrder?$filter=SalesOrderDate ge datetime'2026-01-01' and SalesOrderDate le datetime'2026-01-31'
GET /A_SalesOrder('SAP-ORDER-12345')?$expand=to_Item
```

**Response Format:**
```json
{
  "erpId": "SAP-ORDER-12345",
  "orderNumber": "SAP-ORDER-12345",
  "customerErpId": "CUST-001",
  "orderDate": "2026-01-15T00:00:00Z",
  "status": "In Process",
  "total": 1234.56,
  "currency": "USD",
  "lineItems": [
    {
      "erpId": "10",
      "productErpId": "PRODUCT-001",
      "sku": "PRODUCT-001",
      "quantity": 10,
      "unitPrice": 99.99,
      "total": 999.90
    }
  ]
}
```

#### Get Customers

```typescript
// Get all customers
const customers = await sapConnector.getCustomers();

// Get customer by ERP ID
const customer = await sapConnector.getCustomer('CUST-001');
```

**SAP OData Endpoint:**
```
GET /A_Customer
GET /A_Customer('CUST-001')
```

**Response Format:**
```json
{
  "erpId": "CUST-001",
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "phone": "+1-555-0100",
  "creditLimit": 50000.00
}
```

#### Get Inventory Level

```typescript
// Get inventory for SKU across all locations
const quantity = await sapConnector.getInventoryLevel('PRODUCT-001');

// Get inventory for SKU at specific location
const warehouseQty = await sapConnector.getInventoryLevel(
  'PRODUCT-001',
  'WH01'
);
```

**SAP OData Endpoint:**
```
GET /A_MaterialStock?$filter=Material eq 'PRODUCT-001'
GET /A_MaterialStock?$filter=Material eq 'PRODUCT-001' and Plant eq 'WH01'
```

**Response:**
```typescript
145 // Total quantity available
```

#### Update Product

```typescript
// Update product details
const updated = await sapConnector.updateProduct('PRODUCT-001', {
  name: 'Widget Pro 3000 v2',
  price: 109.99,
  cost: 48.00
});
```

**SAP OData Endpoint:**
```
PATCH /A_Product('PRODUCT-001')
Content-Type: application/json

{
  "ProductDescription": "Widget Pro 3000 v2",
  "NetPrice": "109.99",
  "StandardCost": "48.00"
}
```

### SAP Field Mapping

| LogiVox | SAP OData | Type | Notes |
|---------|-----------|------|-------|
| `sku` | `Product` | String | Material number |
| `name` | `ProductDescription` | String | Short description |
| `description` | `ProductLongText` | String | Long text |
| `price` | `NetPrice` | Decimal | Selling price |
| `cost` | `StandardCost` | Decimal | Cost price |
| `uom` | `BaseUnit` | String | EA, KG, etc. |
| `category` | `ProductGroup` | String | Product hierarchy |
| `quantity` | `MatlWrhsStkQtyInMatlBaseUnit` | Decimal | Stock quantity |

### Error Handling

```typescript
try {
  const products = await sapConnector.getProducts();
} catch (error) {
  if (error.message.includes('authentication failed')) {
    // Refresh credentials
  } else if (error.message.includes('rate limit')) {
    // Implement backoff
  }
}
```

### Rate Limits

SAP OData APIs typically support:
- **100 requests/minute** per user
- **10,000 requests/day** per application

---

## 🔮 Oracle NetSuite Integration

### Architecture

LogiVox connects to NetSuite via SuiteTalk REST Web Services:

```
LogiVox WMS → NetSuite REST API → NetSuite ERP
```

### Authentication

NetSuite uses Token-Based Authentication (TBA) with OAuth 1.0a:

```typescript
Authorization: OAuth realm="YOUR_ACCOUNT_ID",
  oauth_consumer_key="YOUR_CONSUMER_KEY",
  oauth_token="YOUR_TOKEN_ID",
  oauth_signature_method="HMAC-SHA256",
  oauth_timestamp="1609459200",
  oauth_nonce="abc123",
  oauth_version="1.0",
  oauth_signature="CALCULATED_SIGNATURE"
```

### Setup Steps

1. **Enable Token-Based Authentication**
   - Setup → Company → Enable Features → SuiteCloud → Token-Based Authentication

2. **Create Integration Record**
   - Setup → Integrations → New
   - Note Consumer Key/Secret

3. **Create Access Token**
   - Setup → Users/Roles → Access Tokens → New
   - Note Token ID/Secret

4. **Configure LogiVox**
   ```env
   NETSUITE_ACCOUNT_ID=123456
   NETSUITE_CONSUMER_KEY=abc...
   NETSUITE_CONSUMER_SECRET=xyz...
   NETSUITE_TOKEN_ID=token123
   NETSUITE_TOKEN_SECRET=secret456
   ```

### API Operations (Coming Soon)

```typescript
import { netsuiteConnector } from '@/lib/services/erp-connectors';

// Get items
const items = await netsuiteConnector.getProducts();

// Get sales orders
const orders = await netsuiteConnector.getOrders();

// Get customers
const customers = await netsuiteConnector.getCustomers();
```

**NetSuite REST Endpoints:**
```
GET /services/rest/record/v1/inventoryItem
GET /services/rest/record/v1/salesOrder
GET /services/rest/record/v1/customer
```

---

## 🔄 Synchronization Strategies

### 1. **Scheduled Sync** (Batch)

Import data on a schedule (e.g., every 30 minutes):

```typescript
// Cron job: */30 * * * *
async function syncProducts() {
  const lastSync = await getLastSyncTime('products');
  const products = await sapConnector.getProducts(lastSync);
  
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        price: product.price,
        cost: product.cost,
        erpId: product.erpId,
        erpSyncedAt: new Date()
      },
      create: {
        sku: product.sku,
        name: product.name,
        price: product.price,
        cost: product.cost,
        erpId: product.erpId,
        organizationId: 'org-id'
      }
    });
  }
  
  await updateLastSyncTime('products', new Date());
}
```

### 2. **Real-time Sync** (Webhooks)

React to ERP events immediately:

```typescript
// POST /api/webhooks/erp/order-created
export async function POST(request: Request) {
  const order = await request.json();
  
  // Create order in LogiVox
  await prisma.salesOrder.create({
    data: {
      orderNumber: order.orderNumber,
      erpOrderId: order.erpId,
      customerId: await getCustomerByErpId(order.customerErpId),
      status: 'PENDING',
      lineItems: {
        create: order.lineItems.map(line => ({
          productId: await getProductByErpId(line.productErpId),
          quantity: line.quantity,
          unitPrice: line.unitPrice
        }))
      }
    }
  });
  
  return Response.json({ success: true });
}
```

### 3. **On-Demand Sync**

Sync specific records when needed:

```typescript
// Sync single product before order fulfillment
async function ensureProductSync(sku: string) {
  const product = await prisma.product.findUnique({
    where: { sku }
  });
  
  if (!product?.erpSyncedAt || 
      product.erpSyncedAt < new Date(Date.now() - 3600000)) {
    const erpProduct = await sapConnector.getProduct(product.erpId);
    
    await prisma.product.update({
      where: { sku },
      data: {
        price: erpProduct.price,
        cost: erpProduct.cost,
        erpSyncedAt: new Date()
      }
    });
  }
}
```

---

## 🛠️ Data Mapping

### Product Mapping

```typescript
interface ProductMapping {
  logivox: {
    sku: string;
    name: string;
    description: string;
    price: number;
    cost: number;
    weight: number;
    dimensions: { l: number, w: number, h: number };
  };
  
  sap: {
    Material: string;
    MaterialDescription: string;
    MaterialLongText: string;
    NetPrice: string;
    StandardCost: string;
    GrossWeight: string;
    MaterialLength: string;
    MaterialWidth: string;
    MaterialHeight: string;
  };
  
  netsuite: {
    itemId: string;
    displayName: string;
    description: string;
    basePrice: number;
    cost: number;
    weight: number;
    // dimensions in custom fields
  };
}
```

### Custom Field Mapping

Store ERP-specific fields in `customFields` JSON:

```typescript
await prisma.product.create({
  data: {
    sku: 'PRODUCT-001',
    name: 'Widget',
    customFields: {
      sapMaterialType: 'FERT',
      sapProductHierarchy: '001/002/003',
      netsuiteItemType: 'InvtPart',
      netsuiteTaxSchedule: 'STANDARD'
    }
  }
});
```

---

## 📊 Sync Status Monitoring

### Sync History Table

```sql
CREATE TABLE erp_sync_log (
  id UUID PRIMARY KEY,
  erp_system VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- product, order, customer
  sync_type VARCHAR(20) NOT NULL, -- pull, push
  records_processed INT NOT NULL,
  records_success INT NOT NULL,
  records_failed INT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  errors JSONB,
  organization_id UUID NOT NULL
);
```

### Monitoring Dashboard

```typescript
// GET /api/erp/sync-status
export async function GET() {
  const logs = await prisma.erpSyncLog.findMany({
    where: {
      startedAt: {
        gte: new Date(Date.now() - 86400000) // Last 24 hours
      }
    },
    orderBy: { startedAt: 'desc' }
  });
  
  return Response.json({
    totalSyncs: logs.length,
    successfulSyncs: logs.filter(l => l.recordsFailed === 0).length,
    failedSyncs: logs.filter(l => l.recordsFailed > 0).length,
    recordsProcessed: logs.reduce((sum, l) => sum + l.recordsProcessed, 0),
    recentLogs: logs.slice(0, 10)
  });
}
```

---

## 🚨 Error Handling

### Common ERP Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `AUTHENTICATION_FAILED` | Invalid credentials | Refresh OAuth token |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement exponential backoff |
| `RECORD_NOT_FOUND` | ERP ID invalid | Re-sync or remove mapping |
| `DUPLICATE_KEY` | Record already exists | Update instead of create |
| `FIELD_VALIDATION` | Invalid data format | Check field mapping |

### Retry Strategy

```typescript
async function syncWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      
      // Don't retry on auth errors
      if (error.message.includes('authentication')) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 🔐 Security Best Practices

### 1. **Credential Storage**

Never store ERP credentials in code. Use:
- **Development**: `.env.local` file (git-ignored)
- **Production**: AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault

### 2. **Token Rotation**

Rotate OAuth tokens periodically:
```typescript
// Refresh token before expiry
if (this.tokenExpiry && this.tokenExpiry < new Date(Date.now() + 300000)) {
  this.token = await this.refreshAccessToken();
}
```

### 3. **Audit Logging**

Log all ERP operations:
```typescript
await prisma.activityLog.create({
  data: {
    action: 'ERP_SYNC',
    entityType: 'Product',
    userId: 'system',
    metadata: {
      erpSystem: 'SAP',
      operation: 'getProducts',
      recordCount: products.length
    }
  }
});
```

---

## 📞 Support

**SAP Issues:**
- Documentation: https://api.sap.com/
- Support: https://support.sap.com/

**NetSuite Issues:**
- Documentation: https://system.netsuite.com/app/help/helpcenter.nl
- Support: https://netsuite.custhelp.com/

**LogiVox Integration:**
- Email: support@logivox.com
- Documentation: https://docs.logivox.com
- Slack: #erp-integrations

---

**Last Updated:** January 3, 2026  
**Framework Version:** 1.0  
**Status:** SAP Production Ready, NetSuite Framework Ready
