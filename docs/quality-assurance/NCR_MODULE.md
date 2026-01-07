# Non-Conformance Report (NCR) Module

## Overview

The Non-Conformance Report (NCR) module provides comprehensive tracking and management of quality issues discovered throughout the supply chain. NCRs document deviations from specifications, customer complaints, and quality failures, providing a structured approach to problem resolution and continuous improvement.

## Table of Contents

1. [Key Features](#key-features)
2. [User Interface](#user-interface)
3. [Workflows](#workflows)
4. [Data Fields](#data-fields)
5. [Integration](#integration)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

## Key Features

### Issue Tracking

- **Unique NCR Numbers**: Auto-generated sequential numbering (NCR-YYYYMMDD-001)
- **Categorization**: 6 predefined categories for classification
- **Severity Levels**: Critical, Major, Minor classifications
- **Status Tracking**: Open → Investigating → Resolved → Closed

### Root Cause Analysis

- **5 Whys Methodology**: Structured root cause identification
- **Corrective Actions**: Document immediate fixes
- **Preventive Actions**: Plan long-term solutions
- **Effectiveness Tracking**: Verify action effectiveness

### Financial Recovery

- **Supplier Claims**: Track chargebacks and debit memos
- **Cost Impact**: Calculate financial losses
- **Recovery Status**: Monitor claim approval and payment
- **Claim Timeline**: Track submission to payment

### Disposition Management

- **Multiple Options**: Use-as-is, Rework, Scrap, Return to Vendor, Downgrade
- **Quantity Tracking**: Monitor affected units
- **Approval Workflow**: Multi-level disposition approval
- **Documentation**: Maintain complete disposition records

## User Interface

### NCR Dashboard (`/dashboard/qc/ncr`)

**Statistics Cards:**

- Total NCRs (all time)
- Open Issues (current active)
- Supplier Claims (pending/approved)
- Average Resolution Time (days)

**Filters:**

- Status: All, Open, Investigating, Resolved, Closed
- Severity: All, Critical, Major, Minor
- Category: All categories
- Claim Status: All, Pending, Approved, Rejected
- Date Range: Custom date filtering
- Search: NCR number, description, supplier

**Data Table Columns:**

1. NCR Number (clickable)
2. Description
3. Category Badge
4. Severity Badge
5. Status Badge
6. Supplier Name
7. Detected Date
8. Affected Quantity
9. Cost Impact
10. Claim Status Badge (if applicable)
11. Actions (View, Edit, Delete)

### NCR Detail Page (`/dashboard/qc/ncr/[id]`)

**Header Section:**

- NCR Number and Description
- Status, Severity, Category badges
- Edit and Delete buttons

**Impact Analysis:**

- Affected Quantity (numeric)
- Cost Impact ($)
- Disposition Method
- Financial impact visualization

**Root Cause & Actions:**

- Root Cause Analysis (text)
- Corrective Action (text)
- Preventive Action (text)
- Action effectiveness tracking

**Supplier Claim Section:**

- Claim Amount ($)
- Claim Status
- Submission Date
- Approval/Payment tracking

**Related Information:**

- Supplier (name, code)
- Product (name, SKU)
- Inspection Reference
- Timeline (created, detected, closed)

**Quick Actions:**

- Create CAPA
- Print Report
- Email NCR
- Export PDF

## Workflows

### Creating an NCR

```
1. Navigate to /dashboard/qc/ncr
2. Click "Create NCR" button
3. Fill required fields:
   - Description (what went wrong)
   - Category (type of issue)
   - Severity (impact level)
   - Detected Date
   - Detected By (user)
   - Affected Quantity
   - Supplier (if applicable)
   - Product (if applicable)
4. Optional fields:
   - Cost Impact
   - Inspection Reference
5. Click "Create NCR"
6. System generates NCR number
7. Status = OPEN
```

### Investigating an NCR

```
1. Open NCR detail page
2. Click "Edit" button
3. Update Status to "INVESTIGATING"
4. Document root cause:
   - Ask "Why?" 5 times
   - Identify true root cause
   - Document findings
5. Add immediate corrective action
6. Save changes
7. Notify stakeholders
```

### Resolving an NCR

```
1. Complete root cause analysis
2. Implement corrective action
3. Document preventive action
4. Make disposition decision:
   - USE_AS_IS: Accept with justification
   - REWORK: Fix the defect
   - SCRAP: Dispose of items
   - RETURN_TO_VENDOR: RTV process
   - DOWNGRADE: Reduce grade/price
5. Update Status to "RESOLVED"
6. Set resolution date
7. Notify management
```

### Closing an NCR

```
1. Verify corrective action effectiveness
2. Confirm preventive action implemented
3. Review disposition completion
4. Process supplier claim (if applicable)
5. Update Status to "CLOSED"
6. Set closed date and closer name
7. Archive for records
```

### Supplier Claim Workflow

```
1. Calculate claim amount
2. Set claim status = PENDING
3. Prepare claim documentation
4. Submit to supplier
5. Update claim status = SUBMITTED
6. Track supplier response
7. Status options:
   - APPROVED: Proceed to payment
   - REJECTED: Document reason
   - PARTIAL: Negotiate amount
8. Receive payment
9. Update claim status = PAID
```

## Data Fields

### Required Fields

| Field            | Type     | Description                                                            |
| ---------------- | -------- | ---------------------------------------------------------------------- |
| ncrNumber        | String   | Auto-generated (NCR-YYYYMMDD-NNN)                                      |
| description      | String   | Detailed issue description                                             |
| category         | Enum     | MATERIAL_DEFECT, PACKAGING, LABELING, DOCUMENTATION, PROCESS, SHIPPING |
| severity         | Enum     | CRITICAL, MAJOR, MINOR                                                 |
| status           | Enum     | OPEN, INVESTIGATING, RESOLVED, CLOSED                                  |
| detectedAt       | DateTime | When issue was discovered                                              |
| detectedBy       | String   | User who found issue                                                   |
| affectedQuantity | Int      | Number of units affected                                               |

### Optional Fields

| Field             | Type     | Description                |
| ----------------- | -------- | -------------------------- |
| costImpact        | Decimal  | Financial loss amount      |
| rootCause         | String   | Root cause analysis        |
| correctiveAction  | String   | Immediate fix              |
| preventiveAction  | String   | Long-term prevention       |
| dispositionMethod | Enum     | Final decision on material |
| closedAt          | DateTime | When NCR was closed        |
| closedBy          | String   | Who closed it              |
| supplierId        | String   | Related supplier           |
| productId         | String   | Related product            |
| inspectionId      | String   | Related inspection         |

### Supplier Claim Fields

| Field                    | Type     | Description                                  |
| ------------------------ | -------- | -------------------------------------------- |
| supplierClaimAmount      | Decimal  | Claim value                                  |
| supplierClaimStatus      | Enum     | PENDING, SUBMITTED, APPROVED, REJECTED, PAID |
| supplierClaimSubmittedAt | DateTime | Submission date                              |

## Integration

### With Inspections

- Failed inspections auto-create NCRs
- NCR links back to inspection record
- Inspection data pre-populates NCR

### With Quality Holds

- NCRs can trigger quality holds
- Hold quantity matches affected quantity
- NCR resolution releases hold

### With CAPA System

- NCRs spawn CAPA records
- CAPA tracks action implementation
- CAPA effectiveness validates NCR closure

### With Supplier Management

- NCR count impacts supplier score
- Claims generate debit memos
- Performance trends track improvements

### With RTV Process

- RETURN_TO_VENDOR disposition triggers RTV
- RTV links to NCR for traceability
- Cost recovery tracked in both systems

## Best Practices

### When to Create an NCR

✅ **DO create NCRs for:**

- Receiving inspection failures
- Customer complaints
- Specification deviations
- Process failures
- Documentation errors
- Regulatory non-compliance

❌ **DON'T create NCRs for:**

- Minor cosmetic issues (unless critical)
- Normal process variation within specs
- User errors (unless systemic)
- One-time incidents without impact

### Writing Good Descriptions

**Poor Example:**

> "Product is bad"

**Good Example:**

> "Received 500 units of Widget-A (SKU: W-123) from Acme Corp on 1/5/2026. Visual inspection revealed 45 units (9%) with cracked housings measuring 2-3mm. Lot #20260105-A. Rejected per sampling plan SP-001."

**Key Elements:**

- What: Specific defect description
- When: Date discovered
- Where: Location/process
- Who: Supplier/product
- How Many: Quantity affected
- Evidence: Measurements, photos

### Severity Classification Guide

**CRITICAL:**

- Safety hazard
- Regulatory non-compliance
- Customer shipment blocked
- Production shutdown
- > $10,000 impact

**MAJOR:**

- Functional defect
- Specification violation
- Significant rework required
- Customer dissatisfaction
- $1,000-$10,000 impact

**MINOR:**

- Cosmetic defect
- Documentation error
- Process deviation (no impact)
- Minimal rework
- <$1,000 impact

### Root Cause Analysis

**5 Whys Example:**

**Problem:** Widgets arrived with cracks

1. **Why are there cracks?**  
   → The packaging is insufficient

2. **Why is the packaging insufficient?**  
   → The foam inserts are too thin

3. **Why are the foam inserts too thin?**  
   → Supplier changed foam supplier to save cost

4. **Why did they change without notifying us?**  
   → No approval process for packaging changes

5. **Why is there no approval process?**  
   → Contract didn't specify packaging approval requirement

**Root Cause:** Inadequate contract specifications for packaging change control

**Corrective Action:** Update current contract with packaging approval clause

**Preventive Action:** Revise standard supplier contract template to include packaging change control requirements

### Disposition Decision Matrix

| Severity | Within Spec? | Functional? | Disposition                           |
| -------- | ------------ | ----------- | ------------------------------------- |
| MINOR    | Yes          | Yes         | USE_AS_IS                             |
| MINOR    | No           | Yes         | USE_AS_IS (with engineering approval) |
| MINOR    | Yes          | No          | REWORK                                |
| MAJOR    | No           | Yes         | REWORK or DOWNGRADE                   |
| MAJOR    | No           | No          | SCRAP or RETURN_TO_VENDOR             |
| CRITICAL | No           | No          | SCRAP or RETURN_TO_VENDOR             |

### Supplier Claim Guidelines

**When to File Claims:**

- Supplier responsible for defect
- Cost impact >$500
- Contractual quality standards violated
- Documented evidence available

**Claim Amount Calculation:**

```
Base Cost = (Unit Price × Affected Quantity)
Inspection Cost = (Inspector Hours × Hourly Rate)
Sorting Cost = (Sort Hours × Hourly Rate)
Rework Cost = (Rework Hours × Hourly Rate)
Freight Cost = (Return Shipping)

Total Claim = Base Cost + Inspection + Sorting + Rework + Freight
```

**Required Documentation:**

- NCR with photos
- Inspection report
- Packing slip/invoice
- Measurement data
- Cost breakdown

## Examples

### Example 1: Packaging Damage

```yaml
NCR Number: NCR-20260105-001
Description: 150 units of Power Supply PS-500W received with crushed boxes.
  External damage visible on 30% of cartons. Internal inspection
  shows 12 units with bent mounting brackets.
Category: PACKAGING
Severity: MAJOR
Affected Quantity: 150
Cost Impact: $2,250 (150 × $15)
Detected By: John Smith, Receiving Inspector
Detected At: 2026-01-05 09:30 AM

Root Cause: Supplier used incorrect pallet stacking (4 layers instead of 3 max).
  Bottom layer compressed under weight.

Corrective Action:
  - Sorted all 150 units
  - 138 units passed detailed inspection - use as-is
  - 12 units failed - return to vendor

Preventive Action:
  - Updated supplier packing instructions to specify max 3 layers
  - Added pallet height check to receiving SOP
  - Will audit supplier packing on next visit

Disposition: RETURN_TO_VENDOR (12 units), USE_AS_IS (138 units)

Supplier Claim:
  - Amount: $2,250
  - Status: APPROVED
  - Debit memo issued: DB-20260110-015
```

### Example 2: Material Defect

```yaml
NCR Number: NCR-20260105-002
Description: 50 units of Aluminum Bracket AB-200 with surface pitting discovered
  during final assembly. Pits range 0.5-1.2mm deep, scattered across
  surface. Does not meet surface finish spec (Ra 0.8).
Category: MATERIAL_DEFECT
Severity: MINOR
Affected Quantity: 50
Cost Impact: $375 (50 × $7.50)
Detected By: Maria Garcia, Assembly Line 3
Detected At: 2026-01-05 14:15 PM

Root Cause: Supplier's anodizing bath contaminated with iron particles.
  Discovered during CAPA investigation (CAPA-20260107-001).

Corrective Action:
  - Engineering approved USE_AS_IS (pits in non-critical area)
  - Cosmetic defect only, no functional impact
  - Customer approved waiver for this lot

Preventive Action:
  - Supplier implemented filtration system for anodizing bath
  - Added surface finish check to receiving inspection
  - Monthly supplier process audits

Disposition: USE_AS_IS (with engineering and customer approval)

Supplier Claim: $0 (waived - first-time issue, corrective action acceptable)
```

### Example 3: Critical Safety Issue

```yaml
NCR Number: NCR-20260105-003
Description: 25 units of Safety Valve SV-100 failed pressure test during
  QC inspection. Valves opened at 145 PSI instead of specified
  150 ±5 PSI. Calibration certificate shows test at 140 PSI.
Category: MATERIAL_DEFECT
Severity: CRITICAL
Affected Quantity: 25
Cost Impact: $12,500 (25 × $500)
Detected By: Robert Johnson, QC Inspector
Detected At: 2026-01-05 10:00 AM

Root Cause: Supplier's calibration equipment out of tolerance. Last external
  calibration was 18 months ago (requirement is annual).

Corrective Action:
  - ALL 25 units SCRAPPED immediately
  - Recalled previous shipment (200 units) for re-testing
  - Suspended supplier until recalibration complete

Preventive Action:
  - Supplier recalibrated all test equipment
  - Implemented monthly calibration verification
  - Added calibration cert review to receiving inspection
  - Contract updated with quarterly calibration audits

Disposition: SCRAP (safety-critical component)

Supplier Claim:
  - Amount: $112,500 (25 units + 200 recalled units + testing costs)
  - Status: APPROVED
  - Payment received: 2026-01-25
```

## Reporting

### NCR Metrics

**Key Performance Indicators:**

- NCR Rate: NCRs per 1,000 receipts
- Resolution Time: Average days to close
- Cost of Quality: Total cost impact per month
- Repeat Issues: % of recurring NCRs
- Supplier Performance: NCRs per supplier

**Standard Reports:**

1. **Daily NCR Summary**: Open issues requiring attention
2. **Weekly NCR Status**: Progress on active investigations
3. **Monthly Quality Report**: Trends and analysis
4. **Supplier Scorecard**: NCR impact by supplier
5. **Category Analysis**: Most common issue types

## Compliance

### ISO 9001:2015 Alignment

- **Clause 8.7**: Control of Nonconforming Outputs
- **Clause 10.2**: Nonconformity and Corrective Action
- Records maintained for audit trail

### FDA Requirements

- Electronic signatures supported
- Audit trail for all changes
- Secure record retention

## Troubleshooting

### Common Issues

**Q: Can't find an NCR**  
A: Check filters - status may be set to "Open" only. Clear all filters to see all NCRs.

**Q: Supplier claim not showing**  
A: Claim fields are optional. Edit NCR and add claim amount/status to enable tracking.

**Q: Can't change status to CLOSED**  
A: Verify root cause, corrective action, and disposition are documented. All required for closure.

**Q: Cost impact not calculating**  
A: Cost impact is manual entry. Calculate offline and enter total amount.

---

**Last Updated**: January 5, 2026  
**Module Version**: 1.0.0
