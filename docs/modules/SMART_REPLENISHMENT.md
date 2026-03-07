# Smart Replenishment & Procurement

Flowstock replaces traditional, manual "Requisitions" with an automated **Smart Replenishment** system. This ensures procurement is proactive, data-driven, and seamlessly integrated with your inventory levels.

## How it Works

Instead of waiting for a warehouse manager to notice stock is low and fill out a paper form:

1.  **Continuous Monitoring**: The system constantly monitors `Available Quantity` vs. `Minimum Stock Level` for every item in your warehouse.
2.  **Automated Recommendations**: When stock dips below the threshold, Flowstock generates a **Replenishment Recommendation**.
3.  **Draft Purchase Orders**: These recommendations can be converted into **Draft Purchase Orders** with a single click.
4.  **Approval Workflow**: Purchasing managers review, edit (if needed), and "Approve" the Draft PO, which sends it to the supplier.

## Key Features

### 1. Replenishment Dashboard

Located under **Optimization > Supplier Integration**, this dashboard serves as your "Requisition Hub".

- **Urgency Levels**: Items are flagged as `CRITICAL` (Out of Stock) or `HIGH` (Below Minimum).
- **Cost Estimation**: Instantly see the estimated cost of restocking based on supplier history.
- **One-Click PO**: Generate a purchase order instantly.

### 2. Draft Mode (The "Requisition")

A **Draft Purchase Order** acts as a requisition.

- It has no effect on accounting or inventory yet.
- It allows users to add notes, change quantities, or add approval signatures.
- Once approved, it becomes a formal PO.

### 3. Rules Engine

Replenishment logic is governed by:

- **Min/Max Levels**: Simple threshold-based reordering.
- **Reorder Quantity**: Fixed batch sizes (e.g., "Always order 500 units").
- **Lead Time Analysis**: (Advanced) The system learns supplier lead times to order _before_ you run out.

## Workflow Statuses

| Status                 | Meaning                                                                 |
| :--------------------- | :---------------------------------------------------------------------- |
| **DRAFT**              | Created by system or user. Equivalent to a "Requisition". Needs review. |
| **PENDING**            | Submitted for internal approval (optional).                             |
| **SENT**               | Emailed/transmitted to the Supplier.                                    |
| **PARTIALLY_RECEIVED** | Some goods have arrived at the dock.                                    |
| **RECEIVED**           | Order is complete. Inventory is updated.                                |

## Configuration

To set up auto-replenishment for an item:

1.  Navigate to **Inventory > Items**.
2.  Select an item and edit **Planning Details**.
3.  Set a `Minimum Stock Level`.
4.  (Optional) Assign a `Default Supplier` to enable one-click PO generation.

---

_Note: Manual creation of Draft POs is also supported via `Purchasing > New Order` for ad-hoc requests._
