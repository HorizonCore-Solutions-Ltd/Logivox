# Quality Holds Module

## Overview

The Quality Holds module provides comprehensive quarantine and hold management for inventory that doesn't meet quality standards. It enables multi-level holds (Product, Lot, Location, Vendor, Order) with full quantity tracking, financial impact analysis, and controlled release/rejection workflows.

## Key Features

### Multi-Level Hold Types
- **PRODUCT**: Hold all inventory of specific SKU
- **LOT**: Hold specific lot/batch number
- **LOCATION**: Hold all inventory in warehouse location
- **VENDOR**: Hold all inventory from supplier
- **ORDER**: Hold all inventory from specific PO

### Quantity Tracking
- Quantity On Hold (initial quarantine)
- Quantity Released (approved for use)
- Quantity Rejected (scrapped/returned)
- Remaining Quantity (still under hold)

### Financial Impact
- Estimated Value (total value at risk)
- Released Value (approved inventory value)
- Rejected Value (loss from rejection)
- Real-time financial reporting

### Disposition Workflow
- Multiple disposition options
- Approval requirements
- Documentation tracking
- Audit trail

## User Interface

### Quality Holds Dashboard (`/dashboard/qc/quality-holds`)

**Statistics Cards:**
- Active Holds (current)
- Quantity On Hold (units)
- Total Value At Risk ($)
- Release Rate (%)

**Filters:**
- Status: All, Active, Released, Rejected, Partial
- Hold Type: All types
- Severity: All, Critical, High, Medium, Low
- Date Range
- Search: Hold number, reason, product

**Data Table:**
- Hold Number
- Hold Type badge
- Status badge
- Severity badge
- Reason
- Quantity tracking
- Value at risk
- Actions

### Hold Detail Page (`/dashboard/qc/quality-holds/[id]`)

**4-Metric Overview:**
- On Hold (red)
- Released (green)
- Rejected (gray)
- Remaining (orange)

**Visual Progress:**
- Quantity distribution chart
- Financial impact breakdown
- Disposition status

**Release/Rejection Actions:**
- Release Hold (approve for use)
- Reject Items (scrap/return)
- Partial Release (approve portion)

## Workflows

### Creating a Quality Hold

```
1. Navigate to /dashboard/qc/quality-holds
2. Click "Create Hold"
3. Select Hold Type:
   PRODUCT: Enter SKU
   LOT: Enter lot number
   LOCATION: Select location
   VENDOR: Select supplier
   ORDER: Enter PO number
4. Enter details:
   - Reason for hold
   - Severity level
   - Quantity on hold
   - Estimated value
5. Optional: Link to NCR or Inspection
6. System calculates financial impact
7. Status = ACTIVE
8. Notifications sent
9. Inventory blocked from use
```

### Releasing a Quality Hold

```
Prerequisites:
✅ Disposition decision made
✅ Quality issue resolved
✅ Approval obtained (if required)

Steps:
1. Open hold detail page
2. Click "Release Hold"
3. Enter quantity to release
4. Provide justification
5. System prompts for approval (if high value)
6. On approval:
   - Quantity Released updated
   - Remaining Quantity decreased
   - Status changes to RELEASED or PARTIAL
   - Inventory becomes available
   - Released By and Released At recorded
7. Notifications sent
8. Inventory system updated
```

### Rejecting Inventory

```
1. Open hold detail page
2. Click "Reject Items"
3. Enter quantity to reject
4. Select disposition:
   - SCRAP: Dispose of items
   - RETURN_TO_VENDOR: RTV process
5. Provide rejection reason
6. System updates:
   - Quantity Rejected increased
   - Remaining Quantity decreased
   - Status changes to REJECTED or PARTIAL
7. If RETURN_TO_VENDOR:
   - Auto-creates RTV record
   - Links to supplier claim
8. Rejected By and Rejected At recorded
9. Inventory written off
```

## Best Practices

### When to Create Holds

**Immediate Holds Required:**
- Failed receiving inspection
- Customer complaint received
- Safety issue discovered
- Regulatory non-compliance
- NCR issued

**Proactive Holds:**
- Pending investigation
- Supplier under review
- Process validation in progress
- Regulatory holds

### Severity Classification

**CRITICAL:**
- Safety hazard
- Regulatory violation
- Customer-facing issue
- >$50,000 at risk

**HIGH:**
- Major quality defect
- Specification violation
- $10,000-$50,000 at risk

**MEDIUM:**
- Moderate defect
- Process deviation
- $1,000-$10,000 at risk

**LOW:**
- Minor cosmetic issue
- Documentation concern
- <$1,000 at risk

### Hold Type Selection Guide

| Scenario | Hold Type | Reason |
|----------|-----------|--------|
| Single SKU defective | PRODUCT | Affects all units of that SKU |
| Manufacturing defect in batch | LOT | Specific lot affected |
| Contamination in location | LOCATION | All items in area affected |
| Supplier quality issue | VENDOR | All items from supplier suspect |
| Entire PO failed inspection | ORDER | Whole shipment affected |

## Integration

### With NCR Module
- NCRs automatically create holds
- Hold quantity matches affected quantity
- NCR disposition drives hold decision

### With Inventory System
- Holds block inventory transactions
- Released inventory becomes available
- Rejected inventory written off

### With RTV Process
- RETURN_TO_VENDOR creates RTV
- Tracks return process
- Links to supplier claims

## Compliance

- ISO 9001:2015 Clause 8.7 compliance
- Full audit trail
- Traceability requirements met

---

**Last Updated**: January 5, 2026
