# Logivox Fulfillment Brain: Specification & Design Architecture

**Version:** 1.0  
**Date:** March 3, 2026  
**Target:** Production-Grade, Multi-Tenant Logic Engine for Logivox WMS

---

## 1. Executive Summary

The **Fulfillment Brain** is the central nervous system of Logivox. Unlike traditional WMS architectures that treat modules (Inventory, Labor, Order) as silos, the Fulfillment Brain unifies them into a single **Event-Driven Task Grid**. It orchestrates the movement of goods, people, and robots based on a configurable "Governance Mode" ranging from manual oversight to fully autonomous, AI-driven operations.

This system is designed to be **UI-configurable**, supporting complex multi-tenant operations (3PL, Retail, E-com) without custom code.

---

## 2. Roles and Surfaces

### Surfaces

1.  **Logivox Mobile (The "Hand"):** Android/iOS industrial app. Context-aware, oversized UI elements, haptic feedback, voice-enabled. Focus: _Execution_.
2.  **Logivox Control Tower (The "Eye"):** React-based web console. Drag-and-drop configuration, live 3D digital twin, node-based rules engine. Focus: _Orchestration & Exception Management_.
3.  **Logivox Headless (The "Voice"):** GraphQL/gRPC API layer for ERPs, AMRs (Robots), and external carriers.

### Key Roles

| Role                 | Primary Surface          | Core Responsibility                                       | Minimal Interaction Goal                                   |
| :------------------- | :----------------------- | :-------------------------------------------------------- | :--------------------------------------------------------- |
| **Picker**           | Mobile                   | Execute pick tasks (Cluster, Zone, Discrete).             | Scan-Location -> Pick -> Scan-Item -> Confirm (4 actions). |
| **Replen Driver**    | Mobile + Vehicle Mount   | Move bulk stock from Reserve to Forward.                  | Scan-Pallet -> Drive -> Scan-Drop-Loc (3 actions).         |
| **Returns Receiver** | Mobile / Tablet          | Receive inbound RMAs, grade condition, route item.        | Scan-RMA -> Tap-Grade -> Apply-Label (3 actions).          |
| **Dispatcher**       | Control Tower            | Monitor carrier cut-offs, close loads, manage dock doors. | 1 Click to "Force Close" wave/load.                        |
| **Planner (Admin)**  | Control Tower            | Configure rules, release waves, manage exceptions.        | Drag-and-drop rule modification.                           |
| **Refurb Tech**      | Tablet (Workbench)       | Repair items, log parts used, re-induct to stock.         | Scan-Item -> Tap-Repair-Code -> Confirm-Test (3 actions).  |
| **Supervisor**       | Mobile (Supervisor Mode) | Override anomalies, audit picks, manage labor.            | Scan-Badge -> Approve-Override (2 actions).                |

---

## 3. Fulfillment Governance Modes

Defining the level of autonomy. Configurable per **Workflow** (e.g., Returns can be Autonomous while Outbound is Admin-Controlled).

### Mode 1: Admin-Controlled (Manual)

- **Philosophy:** "The System suggests, the Human decides."
- **Behavior:** Orders pool in the dashboard. Admin selects them and clicks "Create Wave." Replenishment tasks are generated but sit in a queue waiting for assignment. Exceptions halt the workflow until approved. Backorders require manual confirmation.
- **Best For:** High-value/low-volume goods, regulatory/hazmat environments, new client onboarding.

### Mode 2: Admin-Assisted (Hybrid/Copilot)

- **Philosophy:** "The System drives, the Human steers."
- **Behavior:** Rules auto-release continuous waves (Waveless) based on standard logic. System auto-assigns tasks. Admins get "Alerts" only when SLAs are at risk or inventory is tight. Invoicing is auto-drafted but requires approval.
- **Best For:** Standard E-commerce, 3PL operations, steady-state fulfillment.

### Mode 3: Adminless (Fully Autonomous)

- **Philosophy:** "The System is the Warehouse Manager."
- **Behavior:** The Brain continuously re-sequences the entire Task Grid. It re-batches orders dynamically if a picker moves faster than expected. It auto-upgrades shipping methods if a packer is slow. It auto-credits returns based on image analysis. Invoices are sent automatically.
- **Best For:** High-volume retail replenishment, fast fashion, mature operations with robotic integrations.

**Switching Logic:** A "Panic Button" or "Override Switch" exists on the Control Tower to immediately downgrade a workflow from Mode 3 to Mode 1 in case of systemic error.

---

## 4. Advanced Replenishment Module

### Core Logic: "Zero Wasted Motion"

1.  **Task Interleaving:** The system never creates a "deadhead" trip. If a forklift drops a pallet at the dock, the system finds the nearest "Put-away" or "Internal Move" task to bring back to the racking.
2.  **Predictive Triggers:**
    - _Reactive:_ Picker marks loc empty -> System creates urgent task.
    - _Forecast:_ System looks at "released but not picked" orders + "predicted orders (next 4h)" to trigger moves before stock runs out.
3.  **Dynamic Slotting:**
    - System suggests moving high-velocity SKUs to "Golden Zone" (convenient height) based on last 7 days of picking data.

### Driver Job Pool (Uber-Style)

- **Autonomous Mode:** Drivers execute the task on screen. No skipping.
- **Admin Mode:** Drivers verify a queue.
- **Self-Selection:** (Configurable) Drivers can "Claim" a zone or specific aisle to work in.

### Exception handling

- **Ghost Stock:** Picker scans bin, reports "Empty".
  - _Action:_ System auto-freezes bin, marks order "Short", triggers "Inventory Investigation" task, and re-allocates order to a secondary location if available.

---

## 5. Returns Module (Reverse Logistics Brain)

### The Intake Flow

1.  **Blind vs. Expected:** Support scanning tracking numbers to pull up the RMA. If blind, fuzzy match against sales history.
2.  **Grading Matrix & Visual AI:**
    - _Grade A (New):_ Auto-route to Put-wall for immediate resale (Cross-dock to outbound).
    - _Grade B (Open Box):_ Route to "Discount" virtual bin.
    - _Grade C (Damaged):_ Route to Refurb/RTV.
    - _Grade D (Scrap):_ Route to recycling.
3.  **Refurbishment Workflow:**
    - Tracks labor time and parts cost against the item to determine if repair is profitable vs. liquidation.

### Value-Add Features

- **Instant Credit:** If Customer Reliability Score > 90 and Item = Low Risk, trigger Refund API hook immediately upon "Carrier Scan" or "Grading Complete."
- **Fraud Detection:** Alerts for "Weight Mismatch" (Brick in box) or "Serial Swapping" during grading.

---

## 6. Order Capture & Release Strategies

### Ingestion Profiles

Orders are tagged upon entry: `[VIP]`, `[SameDay]`, `[Intl]`, `[Hazmat]`.

### Release Engines

1.  **Wave (Traditional):** Group 500 orders -> Print labels -> Pick -> Sort.
2.  **Waveless (Flow):** Orders trickle in. System assigns priority score. As a packer finishes a box, the system releases the _exact next optimal order_ to the picker to maintain flow balance.
3.  **Hybrid:** E-com orders flow (Waveless); Retail store orders batch (Wave).

### Dynamic Re-batching (The "Killer Feature")

In **Autonomous Mode**, if an urgent "SameDay" order arrives but the picker has already passed the aisle, the system can:

1.  Detect a _second_ picker approaching that aisle.
2.  Inject the pick into the second picker's active cluster.
3.  Direct both pickers to a merge point.

---

## 7. Inventory Constraints & Substitution

### Allocation Logic

- **Soft Allocation:** Reserved in database, not physically locked.
- **Hard Allocation:** Linked to a specific Task ID.

### Scenarios

1.  **Partial Ship:**
    - _Rule:_ "If order value > $100 and 80% available, ship partial. Else hold."
2.  **Order Cutting:**
    - _Rule:_ "If item out of stock and SLA is < 2 hours, cut line and refund difference."
3.  **Substitution:**
    - _Manual:_ Picker suggests sub -> Admin approves.
    - _Auto:_ "Black Shirt L" is out -> Auto swap to "Black Shirt L (Version 2)" if mapped in SKU alias table.

---

## 8. Picking: Methods & Intelligence

### Methods Supported

`Discrete` (One order), `Cluster` (Multi-tote cart), `Batch` (Consolidated wave), `Zone` (Pick & Pass), `Pallet` (Case Pick).

### Picker Device Flows

1.  **Best-Next-Task Logic:** Calculated via real-time A\* pathfinding. Considers congestion (don't send 3 pickers to Aisle 4).
2.  **Visual Confirmation:** Show product image + "Look for red box".
3.  **Interleaving:**
    - "You are at Bin A-12. Pick Item X. Also, catch a Cycle Count for Bin A-13 while you are here."

---

## 9. Packing & Staging

### Cartonization Engine

- AI suggests: "Use Box Type B, dunnage level 2."
- Validates total weight against carrier limits.

### Staging Logic

- **Lane Assignment:** Dynamic assignment based on Carrier Cut-off time.
- **Consolidation:** "Put Wall" logic for multi-zone orders. Scanner directs packer: "Slot A4 is ready to pack."
- **Dangerous Goods:** Auto-print UN labels if logic detects hazmat items.

---

## 10. Dispatch & Carrier Orchestration

### Features

- **Live Cut-Off Countdown:** Dashboard shows "UPS Ground: 45 mins left, 12 orders pending."
- **Load Building:** Drag-and-drop pallets onto virtual trucks.
- **One-Scan Dispatch:** Scan door barcode -> "Close Load" -> Triggers ASN to customer -> Updates Order Status.

---

## 11. Invoicing & Billing Automation

_A fully integrated billing engine for 3PLs or internal cost allocation._

### Triggers

- **Transactional:** Bill $0.50 per Pick, $2.00 per Box.
- **Storage:** Snapshot inventory at midnight -> Bill volume relative to storage curve using weighted average.
- **Value-Added:** Bill per "Gift Wrap" task completion or "Refurb" hour.

### Automation

- System generates PDF Invoice at end of selected period (Day/Week).
- API hooks to QuickBooks/NetSuite/Xero.
- **Dispute Portal:** Customers can view line-item breakdown and click "Dispute" on specific charges.

---

## 12. No-Code Rules Engine

_The core of configurability._

### Structure

Nodes connected by logic wires (Blockly/Node-RED style).

- **Input:** `Order Arrived`
- **Condition:** `If Total Value > $500` AND `Destination = NY`
- **Action:** `Assign Priority Class: High`, `Route to: VIP Pack Station`.

### Simulation Sandbox

Before saving a rule, click "Simulate". System replays the last 7 days of data with the _new_ rule and reports:

- "This change would have increased picking efficiency by 4%."
- "This change would have delayed 12 orders beyond cut-off."

---

## 13. Data Model Summary (High Level)

### Core Entities

- **WorkUnit (Polymorphic):** The atom of work. Types: `Pick`, `Pack`, `Move`, `Count`, `Load`. Has `status`, `assignee`, `priority`.
- **InventoryQuant:** Unique record of Item + Location + Lot + Status + LPN (License Plate Number).
- **Wave / Batch:** Logical grouping of orders.
- **Zone / Location:** Spatial definitions with (X,Y,Z) coordinates.
- **RuleSet:** JSON configuration powering the logic engine.
- **BillingEvent:** Immutable log of billable actions.

### Key Events

- `ORDER_RELEASED`, `WAVE_COMPLETED`
- `PICK_CONFIRMED`, `SHORT_PICK_REPORTED`
- `PACK_COMPLETED`, `SHIPMENT_DISPATCHED`
- `RETURN_GRADED`, `CREDIT_ISSUED`
- `SLA_BREACH_WARNING`

---

## 14. KPIs & Visibility

### Dashboards

1.  **The Pulse:** Live active users, throughput (Lines/Hour), SLA status.
2.  **The Bottleneck:** Heatmap of zones showing congestion.
3.  **The Wallet:** Live billing estimation (for 3PLs).
4.  **Quality Control:** Reject rates by vendor, Picker error rates.

### Auditability

- **Time-Travel Debugging:** Replay the state of the warehouse at any second in time to understand why a decision was made.

---

## 15. Implementation Roadmap

### Phase 1: The Core (Months 1-6)

- **Goal:** Replace standard WMS functionality.
- **Features:** Basic Inventory, Mobile Picking (Discrete/Cluster), Replen (Manual), Receiving, Shipping, Mode 1 (Admin Controlled).

### Phase 2: The Logic (Months 7-12)

- **Goal:** Efficiency & Automation.
- **Features:** Task Interleaving, Waveless Release, Advanced Returns (Grading/Routing), Mode 2 (Admin Assisted), Billing Engine.

### Phase 3: The Brain (Year 2+)

- **Goal:** Autonomy & Optimization.
- **Features:** Mode 3 (Fully Autonomous), Dynamic Re-batching, Simulation Sandbox, Predictive visual pathing, AR integration, Predictive Replenishment.
