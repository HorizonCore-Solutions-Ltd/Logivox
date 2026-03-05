# Predictive Analytics & Enterprise Reporting

**Status**: ✅ Live  
**Module**: Business Intelligence & Operations Planning

---

## 📊 Overview
Flowstock provides a centralized **Reporting Hub** that goes beyond static data exports. It includes a real-time **Outbound Trajectory Engine** that aids in dock scheduling and labor allocation.

## 🔮 Predictive Logic: "Pick Status Forecast"
This feature answers the question: *"What will be ready for loading in the next 2 hours?"*

### How It Works
1.  **Backlog Analysis**: Scans all `PENDING` and `IN_PROGRESS` `PickingTask` records.
2.  **Labor Capacity**: Detects currently active users with the `PICKER` role.
3.  **Throughput Calculation**: 
    $$ \text{Rate}_{\text{total}} = (\text{Active Pickers}) \times (\text{Avg Rate Per User}) $$
4.  **Projection**:
    - Calculates estimated completion timestamps for each active Wave.
    - Projects total item throughput for +1h, +2h, +3h, +4h windows.

### Usage
- **For Dock Managers**: View the "Trailer Loading Planner" widget to know exactly when a wave (e.g., "Morning Rush") will be 100% picked and ready for staging.
- **For Supervisors**: If the projection shows a delay, add more pickers to the shift immediately to meet the deadline.

## 📥 Standard Reports
The following reports are available for instant CSV download:
- **Inventory Snapshot**: Real-time stock levels and valuation.
- **Picking Efficiency**: User productivity logs and error rates.
- **Shipping Manifests**: Daily outbound volume.
- **Receiving Logs**: Inbound discrepancies and dock activity.

## 🛠 Technical Implementation
- **Frontend**: `apps/web/src/app/(dashboard)/reports/page.tsx`
- **Forecast API**: `GET /api/reports/outbound-forecast`
- **Export API**: `GET /api/reports/download?type={report_type}`
