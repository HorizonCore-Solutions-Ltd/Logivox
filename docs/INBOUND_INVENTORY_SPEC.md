# Logivox Inbound & Inventory Matrix Spec

**Version:** 1.0  
**Date:** March 3, 2026  
**Target:** Production-Grade, Configurable Gate-to-Bin Module

---

## 1. Executive Summary

The **Inbound & Inventory Module** is the foundation of accuracy for Logivox. It abandons the traditional "receive first, think later" approach in favor of **Intelligent Ingestion**. Every item entering the facility is immediately evaluated by the **Fulfillment Brain** for Cross-Docking (Backorder fulfillment), Quality Control needs, or Optimal Put-away based on velocity.

It supports three distinct modes of operation:
*   **Active (Gate Check-In):** Strict appointment slots, dock door management, and live unloading metrics.
*   **Passive (Drop-Shipping):** Vendor-managed inventory updates via API.
*   **Hybrid (3PL):** Multi-tenant receiving with client-specific rules (e.g., "Client A requires photos of every damaged box").

---

## 2. Roles, Surfaces & Governance

### Roles
1.  **Gate Clerk:** (Security/Tablet) Manages traffic. "Truck arrived at 08:00 for Appointment A123."
2.  **Dock Receiver:** (Mobile/Rugged) The first line of defense. Scans ASNs, validates counts, snaps photos of damage.
3.  **Put-away Driver:** (Forklift Mount) Guided execution. "Move Pallet X to Aisle 4, Bay 2."
4.  **Inventory Controller:** (Control Tower) The auditor. Manages cycle counts, adjustments, and "Lost & Found."

### Governance Modes
*   **Admin-Controlled:**
    *   *Behavior:* Every shortage/overage > 0 requires Supervisor Override code on the scanner. Put-away locations are fixed and mandatory.
    *   *Usage:* Pharma, High-Value Electronics, Bonded Warehouses.
*   **Admin-Assisted:**
    *   *Behavior:* Shortages < 5% are auto-accepted with a "Flag". System suggests put-away bins, but driver can override with a reason code ("Bin Full").
    *   *Usage:* Standard Retail, FMCG.
*   **Adminless (Autonomous):**
    *   *Behavior:* Auto-receipt via RFID tunnel. Discrepancies auto-trigger a "Vendor Claim" email. Put-away is directed by A* algorithm to nearest empty velocity-matched bin.
    *   *Usage:* High-speed E-com, Cross-dock hubs.

---

## 3. Inbound Flows

### 3.1 ASN-Based Receiving (The Happy Path)
1.  **Ingest:** ASN received via EDI/API (`EXPECTED_ARRIVAL`).
2.  **Gate:** Truck checks in. Dock Door assigned based on product type (Frozen vs Dry).
3.  **Dock:**
    *   Receiver scans "License Plate" (LPN) or Carton Barcode.
    *   System validates against ASN.
    *   *Brain Check:* "Is this item backordered?"
        *   **Yes:** Trigger "Cross-Dock Task" -> Move to Outbound Lane.
        *   **No:** Trigger "Put-Away Task".
4.  **Blind Receipt:** If LPN is unknown, prompt for PO #. If PO unknown, create "Ad-Hoc Receipt" (Quarantined until identified).

### 3.2 Cross-Docking & Flow-Through
The module continuously monitors `Demand` vs `Inbound`.
*   **Opportunity:** 50 units of SKU-A arrive. 20 units are on Backorder.
*   **Action:**
    *   System splits the LPN: "Break Pallet".
    *   20 units -> Generated `Move Task` -> Packing Station (High Priority).
    *   30 units -> Generated `Put-Away Task` -> Reserve Storage.

---

## 4. Put-away Optimization (The Slotting Engine)

### Strategies
*   **Velocity-Based:** Fast movers go to "Golden Zone" (Waist height, near packer). Slow movers go to "Top Shelf" or "Back Aisle".
*   **Family Grouping:** "Keep Shampoo near Conditioner".
*   **Consolidation:** "Bin A-12 has 5 units of SKU-X. Put these new 10 units there to clear space."

### Logic Flow
1.  Item Received.
2.  Query `PutAwayRules` (e.g., Max Weight, Hazmat Compatiability).
3.  Query `LocationCapacity`.
4.  Score Candidates:
    *   Score = (Distance * -1) + (VelocityMatch * 10) + (Consolidation * 5).
5.  Assign highest score location.

---

## 5. Inventory Control & Integrity

### The Stock State Machine
Every unit of inventory exists in one state:
1.  **On-Dock (Receiving):** Counted, not put away.
2.  **Available:** In bin, allocatable.
3.  **Allocated:** Hard-reserved for a specific Order Wave.
4.  **Quarantine:** Damaged, Expired, or QC Pending.
5.  **In-Transit:** Moving between bins (Task active).

### QC & Quarantine
*   **Triggers:**
    *   "Expiry Date < 30 Days" -> Auto-Quarantine.
    *   "Return from Customer" -> Auto-Quarantine (Requires Grading).
*   **Actions:**
    *   `Move to Lab` tasks generated for QC team.

---

## 6. Cycle Counting (The Audit)

### Strategies
*   **ABC Counting:**
    *   A Items (Top 20%): Counted weekly.
    *   B Items: Monthly.
    *   C Items: Quarterly.
*   **Opportunistic:**
    *   "Picker went to Bin A-12. Verification failed (Short Pick)."
    *   *Action:* Auto-trigger "Cycle Count Task" for Bin A-12 immediately.

### Adjustment Governance
*   **Small Variance (<$50):** Auto-adjust, log reason "Shrink".
*   **Large Variance (>$500):** Create "Adjustment Request". Supervisor receives push notification to approve/reject.

---

## 7. Configuration & Rules Engine

### Admin UI (No-Code)
*   **Rule:** "IF Supplier = 'Acme Corp' AND Item = 'Glass', THEN Require Photo on Receipt."
*   **Rule:** "IF Expiry < 90 Days, THEN Reject Receipt."
*   **Put-away:** "Zone B is reserved for 'Flammable' items only."

---

## 8. 5-Year Roadmap

*   **Phase 1 (Now):** ASN Receiving, Basic Put-away based on Fixed Locations, Mobile Cycle Counts.
*   **Phase 2 (Next):** Cross-dock Intelligence (Backorder linking), Velocity-based Slotting with Capacity check.
*   **Phase 3 (Future):** Vision-based Receiving (Camera counts cartons), Drone Cycle Counting (RFID), Predictive Dock Scheduling.
