# Financial & Billing Engine

**Status**: ✅ Enterprise Turnkey  
**Type**: Financial Control / Profit Protection / Invoicing

---

## 📋 Module Overview
The Financial Engine ensures that LogiVox is not just operationally efficient but **profit-aware**. It integrates billing, cost-analysis, and margin protection directly into the operational workflow.

## 🔑 Key Capabilities

### 1. Automated Invoice Generation
- **Logic**: Aggregates `BillingTransaction` records into `ClientInvoice`.
- **Trigger**: Periodic (Cron) or Event-based (Post-Shipment).
- **Features**: Supports 3PL multi-client billing, tiered pricing, and accessorial charges.

### 2. Autonomous Financial Governance (Profit Protection)
- **Component**: `FinancialGovernor`
- **Function**: Evaluates every order before fulfillment.
- **Logic**: Calculates `Revenue - COGS - Est.FulfillmentCosts`.
- **Action**: Automatically places orders on **FINANCIAL_HOLD** if the predicted margin is below 10% (configurable policy).

### 3. Real-Time Cost Tracking
- **Granularity**: Tracks costs at the `Order` and `LineItem` level.
- **Metrics**: Captures Labor Cost (Time * Rate), Packaging Material Cost, and allocated Overhead.

### 4. Inter-Company Settlement
- **Scenario**: Transfer between Branch A and Branch B (separate legal entities).
- **Execution**: Automatically generates "Sale" invoice for Branch A and "Purchase" bill for Branch B.

## 🛠️ Technical Implementation
- **Governors**: `apps/web/src/lib/cognitive/governors/financial-governor.ts`
- **Services**: `apps/web/src/lib/billing/invoiceService.ts`
- **Database**: `ClientInvoice`, `BillingTransaction`, `CognitivePolicy`

## 🚀 Usage
**Manual Trigger**:
```bash
POST /api/billing/generate-invoices
{ "organizationId": "org_1", "periodEnd": "2023-10-31" }
```
