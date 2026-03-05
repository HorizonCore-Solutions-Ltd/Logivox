# 🌐 Supplier, Carrier & Customer Collaboration Portals

**Module**: 10 - Collaboration Portals  
**Status**: ✅ Complete Specification  
**Type**: External Facing / Multi-Tenant / Secure

---

## 📋 Executive Summary
This module acts as the external nervous system of LogiVox, providing **role-specific, secure portals** for Suppliers, Carriers, Customers, and 3PL Clients. It eliminates email ping-pong by enabling external partners to directly book appointments, upload ASNs, view QC evidence, and manage exceptions—turning logistics into a collaborative, transparent ecosystem.

---

## 1. Purpose and Scope

To provide a unified, secure interface for all external stakeholders to interact with the warehouse data relevant to them.

**Core Objectives:**
- **Self-Service:** Empower partners to book their own slots and check their own status.
- **Data Quality:** Force validation of ASNs and Documents *before* trucks arrive.
- **Transparency:** Provide "Glass Pipeline" visibility into inventory and order status.
- **Automation:** Trigger internal workflows (like QC or CAPA) based on external inputs.

---

## 2. Roles and Surfaces

### Roles
- **Supplier:** Sends goods. Needs to book deliveries and see payment/QC status.
- **Carrier:** Moves goods. Needs dock appointments and detention visibility.
- **Customer (B2B/B2C):** Receives goods. Needs tracking, proof of delivery, and returns.
- **3PL Client:** Owns the goods. Needs full visibility of *their* stock in *your* warehouse.
- **Auditor:** Needs read-only access to compliance records.

### Surfaces
- **Supplier Portal:** `portal.logivox.com/supplier`
- **Carrier Portal:** `portal.logivox.com/carrier`
- **Customer/3PL Portal:** `portal.logivox.com/client`
- **Public Tracking Pages:** Tokenized, no-login status pages for end-consumers.
- **API Interfaces:** EDI/REST endpoints for ERP-to-WMS direct connection.

---

## 3. Supplier Portal

### Capabilities
- **ASN Management:** web-form or CSV upload of shipment details (SKU, Qty, Lot).
- **Booking:** Schedule inbound dock appointments against a Purchase Order.
- **Compliance:** Upload COA, MSDS, and Insurance Certificates.
- **QC Feedback:** View photos of damaged goods; respond to CAPA (Corrective Action) requests.
- **Performance:** View their own "Vendor Scorecard" (On-time %, Accuracy %).

### Automation
- **Auto-Approval:** ASNs within tolerance (<5% variance) are auto-accepted.
- **Blocklist:** Auto-block appointment booking for suppliers with expired insurance.

---

## 4. Carrier Portal

### Capabilities
- **Self-Scheduling:** Book pickup/delivery slots based on warehouse operational hours.
- **Dock Assignment:** Receive digital "Gate Pass" with assigned door number.
- **POD Upload:** Driver uploads photo of signed paperwork to close the load.
- **Detention Tracking:** View timestamps of arrival vs. departure.

### Automation
- **Load Matching:** Auto-suggests "Backhaul" opportunities if the carrier is delivering and Flowstock has outbound freight going their way.

---

## 5. Customer & 3PL Client Portal

### Operational Visibility
- **Virtual Inventory:** View stock levels across all Flowstock nodes.
- **Order Injection:** Manually create orders (if not using API).
- **Return Authorization:** Approve/Reject RMAs based on warehouse QC photos.

### Financial Visibility
- **Billing:** View invoices for storage, handling, and VAS (Value Added Services).
- **SLA Reporting:** "Order to Ship" time performance charts.

---

## 6. Public Tracking Pages

For end-consumers who do not need a login.
- **Secure Link:** sent via SMS/Email (`logivox.com/track/t_394857...`).
- **Milestones:** "Picked" -> "Packed" -> "Shipped" -> "Delivered".
- **Proof:** View photo of package at doorstep.

---

## 7. Document Management & Intelligence

Central repository for all trade documents.
- **Auto-Classification:** AI scans uploaded PDF and tags it as "Packing List" or "Invoice".
- **Linkage:** Automatically links a uploaded "BOL" to the relevant `Shipment` record.
- **Expiry Alerts:** Notifies Suppliers 30 days before their ISO certification expires.

---

## 8. Exception Management (The "Adminless" workflow)

Instead of emailing a warehouse manager, exceptions are handled in-portal.

**Scenario: Damaged Inbound**
1. Warehouse worker snaps photo of crushed box.
2. System auto-creates `ExceptionRecord` and emails Supplier.
3. Supplier logs in, views photo.
4. Supplier clicks "Dispose" or "Return to Vendor".
5. Warehouse worker gets task on handheld: "Dispose Item".
*(No phone calls required).*

---

## 9. Technical Implementation

### Database Schema (Prisma)
- **`PortalUser`**: Extends `User`. linked to `Vendor` or `Customer` account.
- **`VendorScorecard`**: Aggregated metrics (One-time, Defect Rate).
- **`Appointment`**: Time slots linked to `DockDoor` and `PurchaseOrder`.
- **`Document`**: Metadata for files stored in S3/Blob, linked to any entity.

### Security
- **RBAC:** Strict isolation. Supplier A cannot see Supplier B's data.
- **Audit Log:** Every "Approve" click is cryptographically signed and logged.

---

## 10. Roadmap

**v1 (MVP):**
- ASN Upload.
- Dock Appointment Booking.
- Order Tracking visibility.

**v2 (Advanced):**
- 3PL Billing Dashboard.
- Vendor Scorecards.
- Document OCR/Auto-tagging.

**v3 (Leapfrog):**
- **Blockchain:** Immutable ledger for organic/pharma chain-of-custody.
- **AI Prediction:** "Supplier A is usually 2 days late, adjusting ETA."
