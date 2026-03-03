# Returns Management System (RMS) Specification

## 1. Overview
The Logivox RMS is a high-volume, multi-channel returns module designed to handle the end-to-end lifecycle of returned inventory. It integrates intake, grading, routing, and credit issuance into a seamless workflow.

## 2. Core Workflows

### 2.1 Returns Intake (Receiving)
- **Objective**: Rapidly identify and book returned parcels.
- **Methods**:
    - **Pre-Advised**: Scan RMA ID or Carrier Tracking Number -> System fetches expected items.
    - **Blind Return**: Scan Order ID -> System lists potential returnable items.
- **Context Data**:
    - Customer Risk Profile (Fraud check)
    - Original Order Data (Price, Date)
- **Outcome**: RMA Status moves to `RECEIVED`. Inventory recorded in "Receiving" or "Returns" staging location.

### 2.2 Grading & Inspection
- **Objective**: Assess condition and determine financial/physical disposition.
- **Grading Logic** (Configurable via UI Rules):
    - **Grade A (New/Open Box)**: Return to Stock.
    - **Grade B (Cosmetic Damage)**: Discounted Resale / Refurb.
    - **Grade C (Functional Defect)**: Repair / Vendor Warranty.
    - **Grade D (Scrap)**: Recycle / Dispose.
- **Evidence**: Mandatory photos for damaged items.

### 2.3 Disposition & Routing
- **Routes**:
    1.  **Back to Stock**: Generate Putaway Task.
    2.  **Refurbishment**: Generate Transfer Task to Refurb Zone.
    3.  **RTV (Return to Vendor)**: Aggregate in Vendor Bin.
    4.  **Scrap**: Transfer to Disposal Cage.
- **Automation**: Routing can be auto-assigned based on Grade + SKU (e.g., "All iPhones < Grade B go to Refurb").

### 2.4 Financial Reconciliation
- **Triggers**:
    - **Instant**: Credit issued upon carrier scan (Low risk customers).
    - **Inspection-Based**: Credit issued only after Grading (Default).
- **Actions**: Trigger Webhook to ERP/Commerce for Refund/Store Credit.

## 3. Data Model (Prisma)

### Existing Models Used:
- `RMA`: Header for the return request.
- `RMAItem`: Line item details (Condition, Action, Refund Amount).
- `ReturnCondition`: Enum (NEW, GOOD, FAIR, DAMAGED, DEFECTIVE).
- `ReturnAction`: Enum (REFUND, EXCHANGE, REPAIR, DISPOSE).

### New/Extended Concepts:
- **GradingRules**: Stored in JSON metadata or new model to map Questions -> Grades.
- **ReturnsWorkstation**: UI dedicated to the Inspector role.

## 4. Architecture & API

### Endpoints
- `POST /api/returns/intake`: Search and Receive RMA.
- `GET /api/returns/queue`: List items awaiting inspection.
- `POST /api/returns/inspect`: Submit grade and disposition.
- `POST /api/returns/process-disposition`: Generate tasks for physical movement.

## 5. User Interfaces (Dashboard)

1.  **Returns Control Tower**: KPIs, SLAs, Queue Depths.
2.  **Intake Station**: High-speed scanning interface.
3.  **Inspection Station**: Detailed grading form with photo upload and rule guidance.

## 6. Phased Roadmap

- **Phase 1 (MVP)**: Intake Scan, Basic Grading (Condition Enum), Disposition Routing (Stock/Scrap), Basic Dashboard.
- **Phase 2**: Flexible Rule Engine (UI), Refurb Integration, Customer Portal.
- **Phase 3**: AI Visual Grading, Predictive Fraud Analysis.
