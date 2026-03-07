# Load Sheet & PDF Capabilities

**Status**: ✅ Live  
**Module**: Outbound Logistics & Documentation

---

## 🚚 Overview

The **Load Sheet** is the critical document that summarizes a trailer's manifest. It lists every container, total weight, carrier details, and departure schedule.

## 📄 PDF Generation

Users can now download a professional PDF version of the Load Sheet directly from the Marshalling Board.

### Features

- **Client-Side Generation**: Uses `jspdf` and `jspdf-autotable` for instant, fast generation without server lag.
- **Detailed Manifest**: Includes a full table of containers, types, statuses, item counts, and weights.
- **Verification Data**: Displays scheduled vs. actual times, vehicle type, and bay door assignment.

### How to Use

1.  Navigate to **Operations -> Marshalling Board**.
2.  Locate an "Active Load".
3.  Click the blue `<Printer>` icon in the card footer.
4.  The PDF (`LoadSheet_LS-XXXX.pdf`) will download automatically.

## 🛠 Technical Implementation

- **Frontend**: `apps/web/src/app/(dashboard)/operations/marshalling/page.tsx`
  - Function: `handlePrintLoadSheet`
  - Libs: `jspdf`, `jspdf-autotable`
- **Backend**: `GET /api/operations/loadsheet/[id]`
  - Returns full nested object: `LoadSheet -> Containers -> ContainerItems`.
