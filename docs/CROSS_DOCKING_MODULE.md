# Cross-Docking Module Documentation

## Overview

The Cross-Docking module enables flow-through distribution operations where incoming goods move directly from receiving to shipping with minimal or no storage time. This is critical for distribution centers, high-velocity operations, and just-in-time fulfillment.

## Key Benefits

- **Reduced Handling Costs**: Minimize touches and eliminate storage
- **Faster Throughput**: Typical dwell time of 4 hours or less
- **Lower Inventory Costs**: No long-term storage required
- **Improved Accuracy**: Direct matching reduces errors
- **Real-time Visibility**: Track items from inbound to outbound

## Core Concepts

### Cross-Dock Types

1. **DIRECT**: Direct transfer from inbound truck to outbound truck
2. **MERGE**: Multiple inbound shipments consolidated to one outbound
3. **SPLIT**: One inbound shipment split to multiple outbound destinations
4. **TRANSLOAD**: Container-to-container or mode-to-mode transfer
5. **CONSOLIDATION**: Shipment combining for efficiency

### Workflow Stages

1. **SCHEDULED**: Appointment created and door assigned
2. **RECEIVING**: Inbound truck being unloaded
3. **SORTING**: Items being sorted and allocated to outbound shipments
4. **STAGED**: Items ready for loading, waiting at staging area
5. **LOADING**: Items being loaded onto outbound trucks
6. **COMPLETED**: All items shipped successfully

### Dwell Time Management

**Dwell time** is the elapsed time from receipt to shipment. Best practices:

- **Default Target**: 4 hours
- **Maximum**: 24 hours (configurable)
- **Warning Threshold**: 80% of max dwell time
- **Critical Threshold**: 100% of max dwell time (triggers alerts)

## Configuration

### Organization Settings

Navigate to **Settings > Cross-Docking** to configure:

```typescript
{
  enableAutomaticMatching: true,          // Auto-allocate inbound to outbound
  matchingStrategy: "FIFO",               // FIFO, LIFO, CLOSEST_DUE_DATE, PRIORITY
  defaultDwellTimeHours: 4,              // Target dwell time
  maxDwellTimeHours: 24,                 // Maximum allowed dwell time
  defaultSortingMethod: "SCAN_SORT",     // MANUAL, SCAN_SORT, CONVEYOR, VOICE, PUT_WALL
  requireScanValidation: true,           // Require barcode scans
  allowPartialAllocations: true,         // Allow partial quantity matching
  targetThroughput: 100,                 // Units per hour target
  notificationSettings: {
    dwellTimeWarning: true,
    allocationComplete: true,
    shipmentReady: true,
  }
}
```

### Matching Strategies

- **FIFO (First In, First Out)**: Oldest receipts matched first
- **LIFO (Last In, First Out)**: Newest receipts matched first
- **CLOSEST_DUE_DATE**: Prioritize shipments with earliest target dates
- **PRIORITY**: Use appointment priority (URGENT > HIGH > MEDIUM > LOW)
- **CUSTOMER_PRIORITY**: Prioritize based on customer tier

## Operations Guide

### Creating Appointments

1. Navigate to **Dashboard > Cross-Dock > Calendar**
2. Click **New Appointment**
3. Fill in details:
   - **Type**: Select cross-dock operation type
   - **Priority**: Set urgency level
   - **Expected Arrival**: When inbound truck arrives
   - **Target Ship Date**: When outbound should leave
   - **Carriers**: Inbound and outbound carrier names
   - **Sorting Method**: How items will be sorted

### Receiving Process

1. Appointment status changes to **RECEIVING** when truck arrives
2. Dock door supervisor updates status via API:

```bash
PATCH /api/cross-dock/appointments/{id}
{
  "action": "updateStatus",
  "status": "RECEIVING"
}
```

3. Create receipt records for incoming items
4. System automatically attempts matching if enabled

### Auto-Matching

When `enableAutomaticMatching` is true, system automatically:

1. Finds inbound receipt items with available quantity
2. Searches for outbound shipments needing those SKUs
3. Applies matching strategy (FIFO, LIFO, etc.)
4. Creates allocations linking receipts to shipments
5. Reports unmatched items and unfulfilled shipments

**Manual Override**:

```bash
POST /api/cross-dock/matching/auto
{
  "appointmentId": "appt-123",
  "strategy": "CLOSEST_DUE_DATE"
}
```

### Sorting Operations

1. System creates sorting task when appointment enters **SORTING** status
2. Worker navigates to **Warehouse > Sorting Station**
3. Scans items and system displays:
   - Product details
   - Source receipt
   - Destination shipment
   - Quantity to pick
4. Worker confirms pick, system updates:
   - Allocation status (ALLOCATED → PICKING → PICKED)
   - Sorting task progress
   - Receipt item quantities
   - Shipment totals

### Staging and Loading

After picking:

```bash
# Stage allocation
PATCH /api/cross-dock/allocations/{id}
{
  "action": "stage",
  "locationId": "STAGE-A-01"
}

# Load onto truck
PATCH /api/cross-dock/allocations/{id}
{
  "action": "load"
}

# Mark shipped
PATCH /api/cross-dock/allocations/{id}
{
  "action": "ship"
}
```

When all allocations for a shipment are shipped, shipment status automatically changes to **SHIPPED**.

## API Reference

### Appointments

#### List Appointments
```bash
GET /api/cross-dock/appointments?warehouseId=wh-1&status=RECEIVING&status=SORTING
```

#### Create Appointment
```bash
POST /api/cross-dock/appointments
{
  "warehouseId": "wh-1",
  "type": "DIRECT",
  "priority": "MEDIUM",
  "expectedArrival": "2025-01-10T08:00:00Z",
  "targetShipDate": "2025-01-10T14:00:00Z",
  "inboundCarrier": "FedEx",
  "outboundCarrier": "UPS",
  "sortingMethod": "SCAN_SORT"
}
```

#### Get Appointment Details
```bash
GET /api/cross-dock/appointments/{id}
```

#### Update Status
```bash
PATCH /api/cross-dock/appointments/{id}
{
  "action": "updateStatus",
  "status": "SORTING"
}
```

#### Assign Door
```bash
PATCH /api/cross-dock/appointments/{id}
{
  "action": "assignDoor",
  "doorId": "door-05",
  "doorType": "inbound"  # or "outbound"
}
```

#### Get Calendar View
```bash
GET /api/cross-dock/appointments/calendar?startDate=2025-01-10&endDate=2025-01-17
```

#### Get Statistics
```bash
GET /api/cross-dock/appointments/stats?warehouseId=wh-1&startDate=2025-01-10
```

### Matching & Allocation

#### Auto-Match
```bash
POST /api/cross-dock/matching/auto
{
  "appointmentId": "appt-123",
  "strategy": "FIFO"
}
```

#### Get Recommendations
```bash
GET /api/cross-dock/matching/recommendations?appointmentId=appt-123&strategy=FIFO
```

#### List Allocations
```bash
GET /api/cross-dock/allocations?appointmentId=appt-123&status=PICKING
```

#### Create Manual Allocation
```bash
POST /api/cross-dock/allocations
{
  "receiptItemId": "rcpt-item-456",
  "shipmentId": "ship-789",
  "quantity": 50
}
```

#### Update Allocation (Pick)
```bash
PATCH /api/cross-dock/allocations/{id}
{
  "action": "pick",
  "quantityPicked": 10,
  "locationId": "SORT-A-01"
}
```

#### Remove Allocation
```bash
DELETE /api/cross-dock/allocations/{id}
```

### Sorting Tasks

#### List Sorting Tasks
```bash
GET /api/cross-dock/sorting?appointmentId=appt-123&status=IN_PROGRESS
```

#### Create Sorting Task
```bash
POST /api/cross-dock/sorting
{
  "appointmentId": "appt-123",
  "sortingMethod": "SCAN_SORT",
  "sortingAreaId": "area-01",
  "assignedWorkerId": "worker-123",
  "teamSize": 2
}
```

#### Update Progress
```bash
PATCH /api/cross-dock/sorting/{id}
{
  "action": "updateProgress",
  "sortedUnits": 150,
  "unitsPerHour": 120,
  "accuracy": 99.5
}
```

#### Assign Worker
```bash
PATCH /api/cross-dock/sorting/{id}
{
  "action": "assignWorker",
  "workerId": "worker-456"
}
```

## Performance Metrics

### Key Performance Indicators (KPIs)

1. **Dwell Time**: Average time from receipt to shipment
   - Target: < 4 hours
   - Benchmark: 2-6 hours for most operations

2. **Throughput Rate**: Units shipped per day
   - Target: 100+ units per hour per worker
   - Benchmark: Varies by industry (80-150 units/hr)

3. **On-Time Shipping**: % of shipments leaving by target date
   - Target: > 95%
   - Benchmark: 90-98% for high-performing facilities

4. **Sorting Accuracy**: % of items sorted correctly
   - Target: > 99%
   - Benchmark: 98-99.9% with scan validation

5. **Dock Door Utilization**: % of time doors are active
   - Target: 70-85%
   - Benchmark: 60-80% typical

### Monitoring Dashboard

Access real-time metrics at **Dashboard > Cross-Dock**:

- Active appointments by status
- Total throughput (shipped/total units)
- Average dwell time across active operations
- On-time delivery percentage
- Status breakdown (pie chart)
- Type breakdown (bar chart)
- Dwell time warnings and alerts

## Best Practices

### Pre-Planning

1. **Schedule Appointments**: Create appointments 24-48 hours in advance
2. **Match Inbound to Outbound**: Ensure outbound orders exist before inbound arrives
3. **Assign Doors**: Pre-assign dock doors to avoid congestion
4. **Team Sizing**: Calculate workers needed: `(Total Units / Target UPH / Available Hours)`

### During Operations

1. **Scan Everything**: Use barcode scanning for 99%+ accuracy
2. **Monitor Dwell Time**: Check dashboard every 30 minutes
3. **Prioritize Urgent**: Handle URGENT/HIGH priority appointments first
4. **Stage by Route**: Group outbound shipments by carrier/route
5. **Communicate Issues**: Update appointment notes with any problems

### Post-Operation Analysis

1. **Review Metrics**: Analyze dwell time, throughput, accuracy
2. **Identify Bottlenecks**: Where did delays occur?
3. **Worker Performance**: Review units/hour and accuracy per worker
4. **Strategy Tuning**: Adjust matching strategy if needed
5. **Continuous Improvement**: Set weekly improvement goals

## Troubleshooting

### High Dwell Times

**Symptoms**: Items sitting > 4 hours
**Causes**:
- Insufficient sorting workers
- Outbound trucks delayed
- Matching strategy mismatch
- Dock door congestion

**Solutions**:
1. Add more sorting workers
2. Update outbound carrier ETA
3. Try CLOSEST_DUE_DATE strategy
4. Reassign to different door

### Low Throughput

**Symptoms**: < 80 units/hour per worker
**Causes**:
- Manual sorting (no scanning)
- Poor product placement
- Unclear instructions
- System delays

**Solutions**:
1. Enable scan validation
2. Optimize sorting area layout
3. Provide worker training
4. Check API response times

### Matching Failures

**Symptoms**: Many unmatched items
**Causes**:
- SKU mismatches between systems
- No pending outbound orders
- Quantity mismatches
- Expired allocations

**Solutions**:
1. Verify SKU mapping
2. Create outbound shipments first
3. Allow partial allocations
4. Review and recreate stale allocations

### Accuracy Issues

**Symptoms**: Items going to wrong shipments
**Causes**:
- Manual sorting without scans
- Similar SKUs confused
- Worker fatigue
- Poor labeling

**Solutions**:
1. Require scan validation
2. Add visual confirmation
3. Rotate workers every 2 hours
4. Improve item labeling

## Integration Points

### Warehouse Management System (WMS)

Cross-docking integrates with core WMS features:

- **Receiving**: Creates receipt records and inventory items
- **Inventory**: Tracks item locations during cross-dock flow
- **Shipping**: Links to sales orders and shipment creation
- **Dock Scheduling**: Uses dock door appointments
- **Labor Management**: Tracks worker productivity

### Transportation Management System (TMS)

- **Carrier Integration**: Inbound/outbound carrier tracking
- **Load Planning**: LoadSheet integration for truck loading
- **Route Optimization**: Groups shipments by route
- **Proof of Delivery**: Capture delivery confirmations

### Enterprise Resource Planning (ERP)

- **Sales Orders**: Auto-creates cross-dock shipments from orders
- **Purchase Orders**: Links inbound receipts to POs
- **Inventory Sync**: Real-time inventory updates
- **Financial**: Cost allocation for cross-dock operations

## Database Schema

### Core Models

#### CrossDockingAppointment
- `appointmentNumber`: XD-YYYYMMDD-NNN format
- `type`: DIRECT, MERGE, SPLIT, TRANSLOAD, CONSOLIDATION
- `status`: SCHEDULED → RECEIVING → SORTING → STAGED → LOADING → COMPLETED
- `priority`: URGENT, HIGH, MEDIUM, LOW
- `expectedArrival`, `actualArrival`: Timestamps
- `targetShipDate`, `actualShipDate`: Timestamps
- `inboundDoorId`, `outboundDoorIds[]`: Door assignments
- `sortingMethod`: MANUAL, SCAN_SORT, CONVEYOR, VOICE, PUT_WALL
- `maxDwellTimeHours`: Default 4, max 24
- `dwellTimeMinutes`: Calculated upon completion
- Metrics: `totalUnits`, `receivedUnits`, `sortedUnits`, `shippedUnits`

#### CrossDockReceipt
- Links to `CrossDockingAppointment` and `Supplier`
- `receiptNumber`, `carrier`, `referenceNumber`
- `status`: RECEIVING, COMPLETED

#### CrossDockReceiptItem
- Links to `CrossDockReceipt` and `InventoryItem`
- `sku`, `productName`
- Quantities: `quantityReceived`, `quantityAllocated`, `quantityShipped`, `quantityRemaining`
- `lotNumber`, `serialNumbers[]`
- `currentLocationId`: Tracks location during flow

#### CrossDockShipment
- Links to `CrossDockingAppointment`, `Customer`, `SalesOrder`
- `shipmentNumber`, `carrier`, `trackingNumber`
- `outboundDoorId`, `loadSheetId`
- `status`: PLANNED → PICKING → STAGED → LOADING → SHIPPED
- Metrics: `totalUnits`, `packedUnits`

#### CrossDockAllocation
- Links `CrossDockReceiptItem` to `CrossDockShipment`
- Quantities: `quantityAllocated`, `quantityPicked`, `quantityShipped`
- `assignedTo`: Worker ID
- `status`: ALLOCATED → PICKING → PICKED → STAGED → LOADED → SHIPPED

#### CrossDockSorting
- Links to `CrossDockingAppointment` and sorting area
- `sortingMethod`, `assignedWorkerId`, `teamSize`
- Metrics: `totalUnits`, `sortedUnits`, `unitsPerHour`, `accuracy`
- `status`: PENDING → IN_PROGRESS → COMPLETED

#### CrossDockActivity
- Audit log for all appointment activities
- `action`, `description`, `performedBy`, `metadata` (JSON)

#### CrossDockSettings
- Organization-level configuration
- Matching strategy, dwell time defaults, notification preferences

## UI Components

### Dashboard (`/dashboard/cross-dock`)
- Real-time KPI cards
- Active appointments list with progress bars
- Status breakdown charts
- Type breakdown charts
- Auto-refresh every 30 seconds

### Calendar (`/dashboard/cross-dock/calendar`)
- Week view with 7-day grid
- Color-coded by status
- Create appointment dialog
- Filter by warehouse, status, type

### Sorting Station (`/warehouse/sorting-station`)
- Barcode scanning interface
- Real-time progress tracking
- Session statistics (units/hour, accuracy)
- Pending allocations queue
- Visual confirmation and error handling

### Shared Components (`/components/cross-dock/shared.tsx`)
- `AppointmentCard`: Displays appointment with all metrics
- `AllocationList`: Shows allocations with from/to details
- `DwellTimeIndicator`: Visual dwell time with warnings
- `CrossDockStatsGrid`: KPI grid for dashboards

## Migration & Deployment

### Database Migration

```bash
# Generate migration
npx prisma migrate dev --name add_cross_docking

# Apply to production
npx prisma migrate deploy
```

### Seed Data (Optional)

```typescript
// Create default settings
await prisma.crossDockSettings.create({
  data: {
    organizationId: 'org-123',
    enableAutomaticMatching: true,
    matchingStrategy: 'FIFO',
    defaultDwellTimeHours: 4,
    maxDwellTimeHours: 24,
    defaultSortingMethod: 'SCAN_SORT',
    requireScanValidation: true,
    allowPartialAllocations: true,
    targetThroughput: 100,
  },
});
```

### Feature Flags

```typescript
// Enable cross-docking for organization
await prisma.organization.update({
  where: { id: 'org-123' },
  data: {
    enabledFeatures: {
      push: 'CROSS_DOCKING',
    },
  },
});
```

## Support & Resources

### Training Materials
- Video: "Cross-Docking Overview" (15 min)
- Guide: "Sorting Station Quick Start" (2 pages)
- Checklist: "Daily Cross-Dock Operations"

### Technical Support
- Email: support@flowstock.com
- Slack: #cross-docking-help
- Docs: https://docs.flowstock.com/cross-docking

### Advanced Topics
- Custom matching algorithms
- Multi-facility cross-docking
- Carrier integration APIs
- Performance optimization

---

**Last Updated**: January 2025
**Module Version**: 1.0.0
**Minimum WMS Version**: 2.5.0
