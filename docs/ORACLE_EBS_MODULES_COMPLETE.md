# Oracle E-Business Suite (EBS) - Complete Module Overview
## Integration Reference for LogiVox WMS

**Last Updated:** January 4, 2026  
**Oracle EBS Version Coverage:** R12.2.x (Current), 11i (Legacy)

---

## 📋 Executive Summary

Oracle E-Business Suite (EBS) is Oracle's legacy integrated application suite for enterprise resource planning (ERP). While considered "ancient" by modern standards (first released in 1987), it remains widely used by large enterprises due to:

- **Deep functionality**: 30+ years of feature development
- **Massive deployments**: Thousands of Fortune 500 companies
- **High switching costs**: Complex implementations = difficult migrations
- **Industry-specific**: Specialized modules for manufacturing, retail, pharma, etc.

**Key for WMS Integration**: Oracle EBS has robust APIs (XML Gateway, REST, SOAP) that allow real-time integration with warehouse systems like LogiVox.

---

## 🏗️ Oracle EBS Architecture

### Core Layers
1. **Database Layer**: Oracle Database (11g, 12c, 19c)
2. **Application Layer**: Forms, Concurrent Processing, Workflow
3. **Integration Layer**: XML Gateway, SOA Suite, APIs
4. **User Interface**: Forms (old), OA Framework (newer), REST APIs

### Integration Methods
- **XML Gateway**: Canonical message-based integration
- **APIs**: PL/SQL packages (e.g., `INV_TRANSFER_ORDER_PUB`)
- **Web Services**: SOAP/REST endpoints
- **Database Views**: Direct query access (read-only recommended)
- **Concurrent Programs**: Batch processing via FTP/file drops
- **Business Events**: Event-driven triggers

---

## 📦 Complete Module Catalog (100+ Modules)

### 1. **Supply Chain Management (SCM)** - Critical for WMS

#### Inventory Management (INV) ⭐⭐⭐
**Integration Priority: CRITICAL**

**Key Functions:**
- Item master management
- On-hand inventory tracking
- Transaction processing (receipts, issues, transfers)
- Lot/serial tracking
- Cycle counting
- ABC classification
- Min-max planning

**Key Tables:**
- `MTL_SYSTEM_ITEMS_B` - Item master
- `MTL_ONHAND_QUANTITIES` - On-hand inventory
- `MTL_MATERIAL_TRANSACTIONS` - Transaction history
- `MTL_TRANSACTION_TYPES` - Transaction codes

**Key APIs:**
```sql
-- Create inventory transaction
INV_TRANSACTION_MANAGER_PUB.PROCESS_TRANSACTIONS()

-- Transfer between subinventories
INV_TRANSFER_ORDER_PUB.PROCESS_TRANSFER_ORDER()

-- Cycle count
INV_CYCLE_COUNT_PUB.CREATE_CYCLE_COUNT()
```

**WMS Integration Points:**
- **Inbound**: Receive item master updates, on-hand quantities
- **Outbound**: Send inventory transactions (picks, puts, adjustments)
- **Real-time**: Sync inventory balances every 5-15 minutes

---

#### Order Management (OM) ⭐⭐⭐
**Integration Priority: CRITICAL**

**Key Functions:**
- Sales order entry
- Order promising (ATP)
- Pick release
- Shipping execution
- Invoicing
- Returns management

**Key Tables:**
- `OE_ORDER_HEADERS_ALL` - Order headers
- `OE_ORDER_LINES_ALL` - Order lines
- `WSH_DELIVERY_DETAILS` - Shipping details
- `WSH_NEW_DELIVERIES` - Deliveries

**Key APIs:**
```sql
-- Create sales order
OE_ORDER_PUB.PROCESS_ORDER()

-- Pick release
WSH_PICKING_BATCHES_PUB.CREATE_BATCH()

-- Ship confirm
WSH_DELIVERIES_PUB.DELIVERY_ACTION(
  p_action_code => 'CONFIRM'
)
```

**WMS Integration Points:**
- **Inbound**: Receive sales orders for picking
- **Outbound**: Send pick confirmations, pack lists, ship confirmations
- **Real-time**: Order status updates

---

#### Purchasing (PO) ⭐⭐⭐
**Integration Priority: CRITICAL**

**Key Functions:**
- Purchase requisitions
- Purchase orders
- Receiving
- Supplier management
- Vendor invoicing

**Key Tables:**
- `PO_HEADERS_ALL` - PO headers
- `PO_LINES_ALL` - PO lines
- `RCV_SHIPMENT_HEADERS` - Receipt headers
- `RCV_TRANSACTIONS` - Receipt transactions

**Key APIs:**
```sql
-- Create PO
PO_CREATE_DOCUMENT_PVT.CREATE_PURCHASE_ORDER()

-- Receive goods
RCV_TRANSACTION_API.PROCESS_TRANSACTION()

-- ASN processing
RCV_ROI_HEADER_REC_TYPE.PROCESS_ASN()
```

**WMS Integration Points:**
- **Inbound**: Receive ASNs (Advanced Ship Notices), POs for expected receipts
- **Outbound**: Send receipt confirmations (GRNs), put-away completions
- **Real-time**: Receipt status updates

---

#### Warehouse Management (WMS) ⭐⭐
**Integration Priority: HIGH (Overlap)**

**Note:** Oracle has its own WMS module, but many companies replace it with specialized WMS like LogiVox.

**Key Functions:**
- Task management (picks, puts, replenishments)
- Directed put-away
- Wave planning
- Cross-docking
- Labor management
- Mobile RF devices

**Why Companies Replace Oracle WMS:**
- Complex implementation (12-18 months)
- Expensive licensing ($$$)
- Rigid workflows
- Poor user experience
- Slow performance on RF devices
- Limited voice-directed capabilities ❌

**LogiVox Advantages:**
- ✅ Voice-directed operations
- ✅ AI supervision
- ✅ Real-time analytics
- ✅ Modern UX
- ✅ Faster implementation (2-3 months)
- ✅ Lower total cost of ownership

**Integration Strategy:**
- Replace Oracle WMS with LogiVox
- Keep Oracle INV for item master and on-hand tracking
- Bidirectional sync: Oracle INV ↔ LogiVox

---

#### Manufacturing (WIP, BOM, Routing) ⭐⭐
**Integration Priority: MEDIUM**

**Key Functions:**
- Bill of materials (BOM)
- Routings
- Work orders
- Production scheduling
- Material requirements (MRP)
- Shop floor control

**Key APIs:**
```sql
-- Create work order
WIP_JOB_SCHEDULE_INTERFACE

-- Issue materials to production
INV_TXN_MANAGER_GRP.PROCESS_TRANSACTIONS()

-- Complete production
WIP_MOVPROC_PUB.MOVE_TRANSACTION()
```

**WMS Integration Points:**
- **Inbound**: Receive work orders, component picks
- **Outbound**: Send component issues, finished goods receipts
- **Batch**: Nightly BOM/routing sync

---

#### Advanced Supply Chain Planning (ASCP) ⭐
**Integration Priority: LOW**

**Key Functions:**
- Demand planning
- Supply planning
- MRP/MPS
- Finite scheduling
- Supplier collaboration

**WMS Integration Points:**
- **Inbound**: Receive planned orders
- **Read-only**: Query safety stock levels

---

### 2. **Financials (FIN)** - Moderate for WMS

#### General Ledger (GL) ⭐
**Integration Priority: LOW**

**Key Functions:**
- Chart of accounts
- Journal entries
- Financial reporting
- Period close

**WMS Integration Points:**
- **Outbound**: Cost accounting entries (inventory value changes)
- **Batch**: Daily/monthly GL interface

---

#### Accounts Payable (AP) ⭐
**Integration Priority: LOW**

**Key Functions:**
- Vendor invoices
- Payment processing
- Expense reports

**WMS Integration Points:**
- **Inbound**: 3PL warehouse invoices (if applicable)
- **Batch**: Monthly invoice uploads

---

#### Accounts Receivable (AR) ⭐
**Integration Priority: LOW**

**Key Functions:**
- Customer invoices
- Payment receipts
- Credit management

**WMS Integration Points:**
- **None directly** (unless WMS handles invoicing)

---

#### Fixed Assets (FA) ⭐
**Integration Priority: NONE**

**Key Functions:**
- Asset tracking
- Depreciation
- Lease management

**WMS Integration Points:**
- **None** (warehouse equipment tracking separate)

---

### 3. **Human Capital Management (HCM)** - Low for WMS

#### Human Resources (HR) ⭐
**Integration Priority: LOW**

**Key Functions:**
- Employee master
- Organization hierarchy
- Compensation
- Benefits

**WMS Integration Points:**
- **Inbound**: Employee roster for user provisioning
- **Batch**: Daily employee sync

---

#### Payroll (PAY) ⭐
**Integration Priority: NONE**

---

#### Time & Labor (OTL) ⭐
**Integration Priority: MEDIUM**

**Key Functions:**
- Timecard entry
- Labor reporting
- Absence tracking

**WMS Integration Points:**
- **Outbound**: Worker hours from LogiVox AI supervision
- **Real-time**: Clock in/out via WMS

---

### 4. **Customer Relationship Management (CRM)** - Low for WMS

#### Sales (SLS) ⭐
**Integration Priority: NONE**

#### Marketing (MKT) ⭐
**Integration Priority: NONE**

#### Service (CS) ⭐
**Integration Priority: LOW**

**WMS Integration Points:**
- **Inbound**: RMA (return) orders
- **Outbound**: Return receipts, refurb inventory

---

### 5. **Project Management (PROJ)** - None for WMS

#### Projects (PA) ⭐
**Integration Priority: NONE**

---

### 6. **Procurement (PROC)** - Covered by PO

#### Sourcing (SRC) ⭐
**Integration Priority: NONE**

#### Contracts (OCM) ⭐
**Integration Priority: NONE**

---

### 7. **Product Lifecycle Management (PLM)** - Low for WMS

#### Product Hub (PHB) ⭐
**Integration Priority: LOW**

**WMS Integration Points:**
- **Inbound**: New product introductions
- **Batch**: Weekly product attribute sync

---

## 🔗 Integration Architecture for LogiVox ↔ Oracle EBS

### Recommended Integration Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    Oracle E-Business Suite               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │   INV   │  │   OM    │  │   PO    │  │   WIP   │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │
│       │            │            │            │          │
└───────┼────────────┼────────────┼────────────┼──────────┘
        │            │            │            │
        │            │            │            │
    ┌───▼────────────▼────────────▼────────────▼───┐
    │       Integration Middleware Layer            │
    │  ┌──────────────────────────────────────┐    │
    │  │  Oracle SOA Suite / Oracle Integration│    │
    │  │  Cloud (OIC) / MuleSoft / Dell Boomi  │    │
    │  └──────────────────────────────────────┘    │
    │                                                │
    │  Features:                                    │
    │  • Message transformation (XML ↔ JSON)       │
    │  • Error handling & retry                    │
    │  • Message queuing (JMS/AQ)                  │
    │  • API orchestration                         │
    │  • Security (OAuth, SSL)                     │
    └────────────────┬───────────────────────────────┘
                     │
                     │ REST APIs
                     │
    ┌────────────────▼───────────────────────────────┐
    │              LogiVox WMS                       │
    │  ┌──────────────────────────────────────┐     │
    │  │  Integration API Layer                │     │
    │  │  /api/integrations/route.ts          │     │
    │  └──────────────────────────────────────┘     │
    │                                                │
    │  • Voice-directed operations                  │
    │  • Real-time inventory sync                   │
    │  • Order fulfillment                          │
    │  • Shipping execution                         │
    └────────────────────────────────────────────────┘
```

### Integration Scenarios

#### Scenario 1: Inbound Sales Order (OM → LogiVox)
**Frequency:** Real-time (as orders are entered)

```
1. Sales rep enters order in Oracle OM
2. Order workflow triggers business event
3. OIC/middleware polls order (REST/SOAP)
4. Middleware transforms XML → JSON
5. POST /api/integrations
   {
     "action": "createOrder",
     "erpSystem": "ORACLE",
     "order": {
       "orderNumber": "SO-12345",
       "customer": "ACME Corp",
       "lines": [...]
     }
   }
6. LogiVox creates order and wave
7. LogiVox sends acknowledgment back
8. Middleware updates Oracle order status
```

**Oracle API:**
```sql
-- Query orders for WMS
SELECT 
  ooh.order_number,
  ooh.header_id,
  ool.line_number,
  msi.segment1 AS item_number,
  ool.ordered_quantity,
  ool.ship_to_org_id
FROM 
  oe_order_headers_all ooh,
  oe_order_lines_all ool,
  mtl_system_items_b msi
WHERE 
  ooh.header_id = ool.header_id
  AND ool.inventory_item_id = msi.inventory_item_id
  AND ooh.flow_status_code = 'AWAITING_SHIPPING'
  AND ool.line_category_code = 'ORDER'
```

---

#### Scenario 2: Outbound Shipment Confirmation (LogiVox → OM)
**Frequency:** Real-time (as shipments depart)

```
1. Marshal confirms shipment in LogiVox
2. LogiVox triggers webhook
3. POST to middleware: shipment_confirmed event
4. Middleware calls Oracle API:
   WSH_DELIVERIES_PUB.DELIVERY_ACTION(
     p_delivery_id => 12345,
     p_action_code => 'CONFIRM',
     p_actual_departure_date => SYSDATE
   )
5. Oracle updates order status to SHIPPED
6. Oracle triggers invoice creation
7. Middleware sends confirmation to LogiVox
```

---

#### Scenario 3: Inventory Adjustment (LogiVox → INV)
**Frequency:** Near real-time (every 5-15 minutes batch)

```
1. Picker completes cycle count in LogiVox
2. LogiVox queues adjustment transactions
3. Every 15 minutes, batch job runs:
   POST /api/integrations
   {
     "action": "syncInventory",
     "adjustments": [
       {
         "item": "SKU-123",
         "onhand": 100,
         "adjustment": -5,
         "reason": "CYCLE_COUNT"
       }
     ]
   }
4. Middleware transforms to Oracle format
5. Call Oracle API:
   INV_TRANSACTION_MANAGER_PUB.PROCESS_TRANSACTIONS()
6. Oracle updates on-hand quantities
```

---

#### Scenario 4: Inbound Receipt (PO → LogiVox)
**Frequency:** Real-time (as ASNs arrive)

```
1. Supplier sends ASN to Oracle
2. Oracle PO creates expected receipt
3. Business event triggers
4. Middleware sends to LogiVox:
   POST /api/integrations
   {
     "action": "createASN",
     "asn": {
       "poNumber": "PO-9876",
       "vendor": "ABC Supplier",
       "expectedDate": "2026-01-05",
       "lines": [...]
     }
   }
5. LogiVox displays in receiving queue
6. Worker receives goods via voice
7. LogiVox sends receipt confirmation
8. Middleware calls Oracle:
   RCV_TRANSACTION_API.PROCESS_TRANSACTION()
```

---

## 📊 Oracle EBS Module Integration Priority Matrix

| Module | Integration | Frequency | Direction | APIs Used | Priority |
|--------|-------------|-----------|-----------|-----------|----------|
| **Inventory (INV)** | Item master, on-hand | 15 min | Bidirectional | INV_TRANSACTION_MANAGER_PUB | 🔴 CRITICAL |
| **Order Mgmt (OM)** | Sales orders, shipments | Real-time | Bidirectional | OE_ORDER_PUB, WSH_DELIVERIES_PUB | 🔴 CRITICAL |
| **Purchasing (PO)** | POs, ASNs, receipts | Real-time | Bidirectional | RCV_TRANSACTION_API | 🔴 CRITICAL |
| **WIP** | Work orders, components | Hourly | Bidirectional | WIP_JOB_SCHEDULE_INTERFACE | 🟡 MEDIUM |
| **HR** | Employee roster | Daily | Inbound | PER_PEOPLE_F table | 🟡 MEDIUM |
| **Time & Labor** | Work hours | Daily | Outbound | HXC_TIME_BUILDING_BLOCKS | 🟡 MEDIUM |
| **GL** | Cost accounting | Daily | Outbound | GL_INTERFACE | 🟢 LOW |
| **Service (CS)** | RMA orders | Ad-hoc | Bidirectional | OE_ORDER_PUB (RMA) | 🟢 LOW |
| **ASCP** | Planned orders | Nightly | Inbound | MSC_ST_SUPPLIES table | 🟢 LOW |
| **All others** | - | - | - | - | ⚪ NONE |

---

## 🔧 Technical Implementation Guide

### 1. Oracle EBS API Authentication

```javascript
// OAuth 2.0 (Oracle EBS 12.2.5+)
const getOracleToken = async () => {
  const response = await fetch('https://oracle-ebs.company.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.ORACLE_CLIENT_ID,
      client_secret: process.env.ORACLE_CLIENT_SECRET,
    }),
  });
  
  const { access_token } = await response.json();
  return access_token;
};

// Call Oracle REST API
const callOracleAPI = async (endpoint, payload) => {
  const token = await getOracleToken();
  
  const response = await fetch(`https://oracle-ebs.company.com/fscmRestApi/resources/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  return response.json();
};
```

### 2. Oracle XML Gateway Integration

```xml
<!-- Oracle XML Gateway Message Format -->
<?xml version="1.0" encoding="UTF-8"?>
<SALES_ORDER>
  <HEADER>
    <ORDER_NUMBER>SO-12345</ORDER_NUMBER>
    <CUSTOMER_ID>1001</CUSTOMER_ID>
    <ORDER_DATE>2026-01-04</ORDER_DATE>
  </HEADER>
  <LINES>
    <LINE>
      <LINE_NUMBER>1</LINE_NUMBER>
      <ITEM_NUMBER>SKU-123</ITEM_NUMBER>
      <QUANTITY>100</QUANTITY>
      <UOM>EA</UOM>
    </LINE>
  </LINES>
</SALES_ORDER>
```

### 3. Database Direct Access (Read-Only Recommended)

```sql
-- Create database link in LogiVox database
CREATE DATABASE LINK oracle_ebs_link
CONNECT TO apps_readonly IDENTIFIED BY password
USING '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=oracle-db.company.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=EBSPROD)))';

-- Query Oracle from LogiVox
SELECT 
  segment1 AS item_number,
  primary_uom_code,
  list_price_per_unit
FROM mtl_system_items_b@oracle_ebs_link
WHERE organization_id = 204
  AND enabled_flag = 'Y';
```

---

## 🚨 Common Oracle EBS Integration Pitfalls

### 1. **Multi-Org Complexity**
- Oracle uses `ORG_ID` for multi-org security
- Must set context: `FND_GLOBAL.APPS_INITIALIZE(user_id, resp_id, resp_appl_id)`
- LogiVox must map warehouses to Oracle orgs

### 2. **UOM Conversions**
- Oracle has complex UOM class hierarchy
- Must convert between EA, CS, PL, etc.
- Use `INV_CONVERT.INV_UM_CONVERT()` function

### 3. **Lot/Serial Tracking**
- Oracle enforces lot/serial at transaction time
- LogiVox must capture and pass through
- Validation at Oracle layer (not bypassed)

### 4. **Transaction Date Control**
- Oracle enforces accounting period open/close
- Transactions must be in open period
- LogiVox must handle date rejection errors

### 5. **Approval Workflows**
- Some Oracle transactions require approval
- Async processing (concurrent programs)
- LogiVox must poll for completion status

---

## 💡 Recommendations for LogiVox ↔ Oracle EBS

### Phase 1: Foundation (Weeks 1-4)
1. ✅ Set up middleware (Oracle OIC or MuleSoft)
2. ✅ Implement Oracle authentication (OAuth)
3. ✅ Build item master sync (INV → LogiVox)
4. ✅ Build on-hand inventory sync (bidirectional)
5. ✅ Test with 100 SKUs in dev environment

### Phase 2: Order Fulfillment (Weeks 5-8)
1. ✅ Implement sales order inbound (OM → LogiVox)
2. ✅ Build pick confirmation outbound (LogiVox → OM)
3. ✅ Build ship confirmation (LogiVox → OM)
4. ✅ Test end-to-end order flow (10 orders)

### Phase 3: Receiving (Weeks 9-12)
1. ✅ Implement ASN inbound (PO → LogiVox)
2. ✅ Build receipt confirmation (LogiVox → PO)
3. ✅ Build put-away completion (LogiVox → INV)
4. ✅ Test receiving flow (10 POs)

### Phase 4: Production (Weeks 13-16)
1. ✅ User acceptance testing
2. ✅ Performance testing (1000 orders/day)
3. ✅ Cutover planning
4. ✅ Go-live support

---

## 📚 Resources

### Oracle Documentation
- **Oracle E-Business Suite Integrated SOA Gateway Developer's Guide**: https://docs.oracle.com/cd/E26401_01/doc.122/e20927/toc.htm
- **Oracle Integration Repository**: https://irep.oracle.com (requires login)
- **Oracle Process Manufacturing APIs**: https://docs.oracle.com/cd/E51367_01/apirefs/index.htm

### Community Resources
- **Oracle EBS Community**: https://community.oracle.com/mosc/categories/ebs-oracleebusinesssuiteapplications
- **Oracle-Base**: https://oracle-base.com
- **Metalink/MOS**: https://support.oracle.com (requires support contract)

### Tools
- **SOAP UI**: Test Oracle SOAP APIs
- **Postman**: Test Oracle REST APIs
- **SQL Developer**: Query Oracle database
- **Oracle OIC**: Cloud-based integration platform

---

## 🎯 Key Takeaways

1. **Oracle EBS is comprehensive but complex** - 100+ modules, 30+ years of cruft
2. **Focus on core modules** - INV, OM, PO are 90% of WMS integration
3. **Use middleware** - Don't integrate point-to-point (maintenance nightmare)
4. **Real-time where it matters** - Orders and shipments = real-time, cost accounting = batch
5. **Oracle WMS is replaceable** - LogiVox is vastly superior for warehouse operations
6. **Plan for 3-4 months** - Oracle integration is not trivial but very doable
7. **Budget for middleware** - Oracle OIC ($$$), MuleSoft ($$$$), Dell Boomi ($$$)

---

**For LogiVox integration implementation, see:**
- `/app/api/integrations/route.ts` - Integration API (already built!)
- `/lib/integrations/oracle-ebs.ts` - Oracle-specific logic (to be created)
- `/docs/ORACLE_INTEGRATION_GUIDE.md` - Detailed technical guide (to be created)

**Status:** 📋 Reference Guide Complete - Ready for Implementation Planning

*Last Updated: January 4, 2026*
