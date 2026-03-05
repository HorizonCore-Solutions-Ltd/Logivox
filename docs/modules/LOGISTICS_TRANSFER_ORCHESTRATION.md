# Logistics & Global Inventory Orchestration

**Status**: ✅ Enterprise Turnkey  
**Type**: Operational / Multi-Echelon / Supply Chain

---

## 📋 Module Overview
This module manages the physical movement of goods across the entire network (Hub & Spoke), enabling advanced flows like Cross-Docking and Inter-Entity Transfers.

## 🔑 Key Capabilities

### 1. Global Inventory Mesh
- **Function**: `findGlobalStock` searches availability across all branches, not just local stock.
- **Logic**: Prioritizes nearest fulfillment node to reduce shipping costs.

### 2. Inter-Organization Transfers
- **Scenario**: Moving stock from "US Corp" to "Canada Corp".
- **Turnkey**: Handles inventory decrement, "In-Transit" creation, and financial invoicing in one transaction.

### 3. Zero-Touch Cross-Docking ("Pass-Through")
- **Scenario**: Goods meant for Branch B arrive at Hub A.
- **Action**: System detects the final destination upon scan at Hub A.
- **Result**: Item is auto-routed to outbound lane without putaway or admin approval.

### 4. End-to-End Traceability
- **Tracking**: Mandatory `boxId` and `originalOrderId` on all transfer records.
- **Audit**: Exact chain of custody from Source -> Hub -> Destination.

### 5. Global Recall
- **Function**: Identification of stagnant stock (>90 days) network-wide and automated recall creation.

## 🛠️ Technical Implementation
- **Orchestrator**: `apps/web/src/lib/logistics/transfer-service.ts`
- **Database**: `WarehouseTransfer` (enhanced with `type`, `destinationOrgId`), `InventoryItem`.

## 🚀 Usage
**Manual Transfer**:
```bash
POST /api/logistics/transfers/manual
{ "sourceOrgId": "A", "targetOrgId": "B", "sku": "ITEM-1", "quantity": 10 }
```
