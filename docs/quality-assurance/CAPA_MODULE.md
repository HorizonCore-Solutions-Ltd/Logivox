# CAPA System (Corrective and Preventive Action)

## Overview

The CAPA (Corrective and Preventive Action) system provides a structured approach to identifying, investigating, and resolving quality issues while preventing recurrence. Built on FMEA (Failure Mode and Effects Analysis) methodology with Risk Priority Number (RPN) calculation, it ensures systematic problem-solving and continuous improvement.

## Table of Contents

1. [Key Features](#key-features)
2. [RPN Calculation](#rpn-calculation)
3. [User Interface](#user-interface)
4. [Workflows](#workflows)
5. [Data Fields](#data-fields)
6. [Integration](#integration)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

## Key Features

### Risk-Based Prioritization

- **RPN Calculation**: Severity × Occurrence × Detection (1-1000 scale)
- **Automatic Risk Classification**: High (≥200), Medium (100-199), Low (<100)
- **Priority-Based Workflow**: Critical issues get immediate attention
- **Risk Trend Tracking**: Monitor risk reduction over time

### Action Management

- **Dual-Purpose**: Corrective (fix problems) and Preventive (avoid problems)
- **Multi-Step Actions**: Immediate, Corrective, Preventive
- **Owner Assignment**: Clear accountability
- **Target Dates**: Time-bound commitments
- **Completion Tracking**: Progress monitoring

### Effectiveness Verification

- **Verification Planning**: Define how to measure success
- **Verification Methods**: Inspection, Audit, Data Analysis, etc.
- **Result Documentation**: Record actual effectiveness
- **Re-CAPA if Ineffective**: Loop back if solution fails

### Workflow Control

- **5 Status Stages**: Open → In Progress → Pending Verification → Verified → Closed
- **State Transitions**: Controlled progression through workflow
- **Overdue Alerts**: Email notifications for missed dates
- **Approval Requirements**: Management review for closure

## RPN Calculation

### Formula

```
RPN = Severity × Occurrence × Detection
```

### Rating Scales (1-10)

#### Severity (S)

How serious is the effect on the customer/process?

| Rating | Description                 | Examples                                              |
| ------ | --------------------------- | ----------------------------------------------------- |
| 10     | Hazardous - without warning | Safety hazard, regulatory violation                   |
| 9      | Hazardous - with warning    | Safety hazard with warning label                      |
| 8      | Very High                   | Product inoperable, loss of primary function          |
| 7      | High                        | Product operable but reduced performance              |
| 6      | Moderate                    | Product operable with some inconvenience              |
| 5      | Low                         | Fit/finish defect noticed by most customers           |
| 4      | Very Low                    | Fit/finish defect noticed by some customers           |
| 3      | Minor                       | Fit/finish defect noticed by discriminating customers |
| 2      | Very Minor                  | Fit/finish defect noticed by very few customers       |
| 1      | None                        | No effect                                             |

#### Occurrence (O)

How frequently does the problem occur?

| Rating | Description       | Probability            | Examples            |
| ------ | ----------------- | ---------------------- | ------------------- |
| 10     | Very High         | ≥1 in 2 (50%)          | Chronic failures    |
| 9      | Very High         | 1 in 3 (33%)           | Frequent failures   |
| 8      | High              | 1 in 8 (12.5%)         | Regular failures    |
| 7      | High              | 1 in 20 (5%)           | Repeated failures   |
| 6      | Moderate          | 1 in 80 (1.25%)        | Moderate failures   |
| 5      | Moderate          | 1 in 400 (0.25%)       | Occasional failures |
| 4      | Low               | 1 in 2,000 (0.05%)     | Few failures        |
| 3      | Low               | 1 in 15,000 (0.007%)   | Isolated failures   |
| 2      | Remote            | 1 in 150,000 (0.0007%) | Rare failures       |
| 1      | Nearly Impossible | <1 in 1,500,000        | Failure unlikely    |

#### Detection (D)

How likely are we to detect the problem before it reaches the customer?

| Rating | Description       | Detection Probability | Examples                            |
| ------ | ----------------- | --------------------- | ----------------------------------- |
| 10     | Almost Impossible | 0-5%                  | No inspection                       |
| 9      | Very Remote       | 6-15%                 | Random visual checks                |
| 8      | Remote            | 16-25%                | Periodic sampling                   |
| 7      | Very Low          | 26-35%                | Basic SPC                           |
| 6      | Low               | 36-45%                | Manual inspection                   |
| 5      | Moderate          | 46-55%                | 100% manual inspection              |
| 4      | Moderately High   | 56-75%                | Automated inspection (some escapes) |
| 3      | High              | 76-85%                | Error-proofing                      |
| 2      | Very High         | 86-95%                | Error-proofing + verification       |
| 1      | Almost Certain    | 96-100%               | Defect cannot be made               |

### RPN Interpretation

| RPN Range | Risk Level      | Action Required           | Timeline    |
| --------- | --------------- | ------------------------- | ----------- |
| 200-1000  | **High Risk**   | Immediate action required | 24-48 hours |
| 100-199   | **Medium Risk** | Action plan within 1 week | 5-7 days    |
| 1-99      | **Low Risk**    | Monitor, plan improvement | 30 days     |

### Example Calculation

**Problem**: Shipping labels printed with wrong addresses

**Ratings:**

- Severity: 8 (Customer receives wrong product)
- Occurrence: 5 (Happens 0.25% of the time = 1 in 400 shipments)
- Detection: 7 (Our current QC catches it 30% of the time)

**RPN = 8 × 5 × 7 = 280** → **High Risk**

**Actions:**

1. **Reduce Severity**: Can't reduce - wrong delivery is always serious
2. **Reduce Occurrence**: Implement barcode scanning (5 → 2)
3. **Reduce Detection**: Add automated address verification (7 → 3)

**New RPN = 8 × 2 × 3 = 48** → **Low Risk** ✅

## User Interface

### CAPA Dashboard (`/dashboard/qc/capa`)

**Statistics Cards:**

- Total CAPAs (all time)
- Average RPN (current open)
- Overdue Count (past target date)
- Avg Completion Time (days)

**Filters:**

- Status: All, Open, In Progress, Pending Verification, Verified, Closed
- Type: All, Corrective, Preventive, Both
- Priority: All, Critical, High, Medium, Low
- Show Overdue Only: Toggle
- Date Range: Custom date filtering
- Search: CAPA number, title, description

**Data Table Columns:**

1. CAPA Number (clickable)
2. Title
3. Type Badge
4. Status Badge
5. Priority Badge
6. RPN Score with Risk Badge
7. Assigned To
8. Target Date (red if overdue)
9. Created Date
10. Actions (View, Edit, Delete)

### CAPA Detail Page (`/dashboard/qc/capa/[id]`)

**Header Section:**

- CAPA Number and Title
- Status, Type, Priority, RPN badges
- Overdue indicator (if applicable)
- Edit and Delete buttons

**Completion Progress:**

- Visual progress bar
- Percentage complete (based on fields filled)
- 5 checkpoints: Root Cause, Immediate Action, Corrective Action, Preventive Action, Verification

**RPN Analysis:**

- Individual ratings display:
  - Severity (1-10)
  - Occurrence (1-10)
  - Detection (1-10)
- Total RPN calculation
- Risk level badge (High/Medium/Low)
- Visual risk indicator

**Analysis & Actions:**

- Root Cause Analysis (with checkmark if complete)
- Immediate Action (temporary fix)
- Corrective Action (fix the problem)
- Preventive Action (prevent recurrence)
- Each with completion indicator

**Effectiveness Verification:**

- Verification Method
- Verification Plan
- Verification Result (Effective/Ineffective)
- Verified By and Date

**Sidebar Information:**

- Assignment details
- Target Date (highlighted if overdue)
- Completion Date
- Verification Date
- Related NCR link
- Timeline (created, updated)

**Quick Actions:**

- Start Working (Open → In Progress)
- Submit for Verification (In Progress → Pending Verification)
- Print Report
- Email CAPA

## Workflows

### Creating a CAPA

```
1. Navigate to /dashboard/qc/capa
2. Click "Create CAPA" button
3. Fill required fields:
   - Title (brief description)
   - Description (detailed explanation)
   - Type (CORRECTIVE, PREVENTIVE, or BOTH)
   - Priority (CRITICAL, HIGH, MEDIUM, LOW)
   - Assigned To (owner)
   - Target Date (completion deadline)
4. Set RPN ratings:
   - Severity (1-10)
   - Occurrence (1-10)
   - Detection (1-10)
   - System calculates RPN automatically
5. Optional: Link to NCR
6. Click "Create CAPA"
7. System generates CAPA number
8. Status = OPEN
9. Email notification sent to assignee
```

### Working on a CAPA

```
Status: OPEN → IN_PROGRESS

1. Open CAPA detail page
2. Click "Start Working" button
3. Status updates to IN_PROGRESS
4. Document root cause analysis:
   - Use 5 Whys method
   - Identify true root cause
   - Document findings in "Root Cause" field
5. Define immediate action:
   - Temporary fix to contain problem
   - Document in "Immediate Action" field
6. Define corrective action:
   - Permanent fix for this occurrence
   - Document in "Corrective Action" field
7. Define preventive action:
   - Changes to prevent recurrence
   - Systemic improvements
   - Document in "Preventive Action" field
8. Implement all actions
9. Save progress regularly
```

### Submitting for Verification

```
Status: IN_PROGRESS → PENDING_VERIFICATION

Prerequisites:
✅ Root cause documented
✅ Corrective action completed
✅ Preventive action implemented
✅ All actions tested

Steps:
1. Verify all required fields complete
2. Click "Submit for Verification"
3. System prompts for verification plan:
   - How will effectiveness be measured?
   - What data will be collected?
   - How long to monitor?
4. Document verification method:
   - INSPECTION: Physical checking
   - AUDIT: Process review
   - DATA_ANALYSIS: Statistical review
   - CUSTOMER_FEEDBACK: External validation
   - OTHER: Custom method
5. Set verification period (e.g., "Monitor for 30 days")
6. Status updates to PENDING_VERIFICATION
7. Email sent to QC Manager for review
```

### Verifying Effectiveness

```
Status: PENDING_VERIFICATION → VERIFIED

Performed by: QC Manager or Quality Engineer

1. Review CAPA actions taken
2. Collect effectiveness data:
   - Check for problem recurrence
   - Review KPIs
   - Analyze trend data
   - Gather customer feedback
3. Make determination:
   - EFFECTIVE: Problem solved, no recurrence
   - INEFFECTIVE: Problem continues or returns
4. If EFFECTIVE:
   - Document results in "Verification Result"
   - Set "Verified By" and "Verified Date"
   - Status updates to VERIFIED
   - Email notification sent
5. If INEFFECTIVE:
   - Status returns to IN_PROGRESS
   - Assignee revises actions
   - Process repeats
```

### Closing a CAPA

```
Status: VERIFIED → CLOSED

Prerequisites:
✅ Actions verified effective
✅ Verification period complete
✅ Documentation complete
✅ Management approval

Steps:
1. Final management review
2. Confirm no recurrence
3. Verify all documentation complete
4. Update Status to CLOSED
5. Set Completed Date
6. Archive for records
7. Update related NCR (if linked)
8. Close-out email sent
```

## Data Fields

### Required Fields

| Field       | Type     | Description                                               |
| ----------- | -------- | --------------------------------------------------------- |
| capaNumber  | String   | Auto-generated (CAPA-YYYYMMDD-NNN)                        |
| title       | String   | Brief description (50 chars)                              |
| description | String   | Detailed explanation                                      |
| type        | Enum     | CORRECTIVE, PREVENTIVE, BOTH                              |
| status      | Enum     | OPEN, IN_PROGRESS, PENDING_VERIFICATION, VERIFIED, CLOSED |
| priority    | Enum     | CRITICAL, HIGH, MEDIUM, LOW                               |
| severity    | Int      | RPN factor (1-10)                                         |
| occurrence  | Int      | RPN factor (1-10)                                         |
| detection   | Int      | RPN factor (1-10)                                         |
| rpn         | Int      | Calculated: S × O × D                                     |
| targetDate  | DateTime | Completion deadline                                       |

### Action Fields

| Field            | Type   | Description           |
| ---------------- | ------ | --------------------- |
| rootCause        | String | Root cause analysis   |
| immediateAction  | String | Temporary containment |
| correctiveAction | String | Permanent fix         |
| preventiveAction | String | Recurrence prevention |

### Assignment Fields

| Field         | Type     | Description       |
| ------------- | -------- | ----------------- |
| assignedTo    | String   | Owner responsible |
| completedDate | DateTime | When finished     |

### Verification Fields

| Field                     | Type     | Description            |
| ------------------------- | -------- | ---------------------- |
| effectivenessVerification | String   | Verification plan      |
| verificationMethod        | Enum     | How to verify          |
| verificationResult        | Enum     | EFFECTIVE, INEFFECTIVE |
| verifiedBy                | String   | Who verified           |
| verifiedDate              | DateTime | When verified          |

### Relations

| Field | Type   | Description            |
| ----- | ------ | ---------------------- |
| ncrId | String | Related NCR (optional) |

## Integration

### With NCR Module

- NCRs spawn CAPAs automatically
- CAPA number linked in NCR
- NCR can't close until CAPA verified
- Root cause flows from NCR to CAPA

### With Quality Holds

- CAPA may trigger hold release
- Hold disposition depends on CAPA
- CAPA effectiveness affects hold policy

### With Supplier Management

- Supplier-related CAPAs affect scorecard
- Preventive actions may include supplier audits
- CAPA results shared with suppliers

### With Training System

- Preventive actions may require training
- Training completion tracked in CAPA
- Process changes trigger training updates

## Best Practices

### When to Create a CAPA

✅ **DO create CAPAs for:**

- Any NCR (corrective action)
- Process improvement opportunities (preventive)
- Audit findings
- Customer complaints
- Recurring issues
- High-cost quality events
- Near-misses (preventive)

❌ **DON'T create CAPAs for:**

- One-time random events with no pattern
- Issues already being addressed
- Minor issues with no recurrence risk
- Issues outside your control (without supplier engagement)

### Effective Root Cause Analysis

**Poor Root Cause:**

> "Operator made a mistake"

**Better Root Cause:**

> "Operator skipped verification step because procedure was unclear and workstation lacked verification checklist. Training emphasized speed over accuracy. No poka-yoke in place to prevent skip."

**Key Questions:**

1. Why did it happen? (Immediate cause)
2. Why was that allowed to happen? (System cause)
3. Why wasn't it prevented? (Control gap)
4. Why wasn't it detected? (Detection gap)
5. Why did the system allow this? (Root cause)

### Writing Actionable CAPAs

**SMART Criteria:**

- **S**pecific: Clear, detailed action
- **M**easurable: Can verify completion
- **A**chievable: Realistic with available resources
- **R**elevant: Addresses root cause
- **T**ime-bound: Has clear deadline

**Poor Corrective Action:**

> "Train operators better"

**Good Corrective Action:**

> "Conduct 2-hour hands-on training session for all 15 operators on verification procedure by 1/15/2026. Update SOP with photos and checklist. Install laminated quick-reference guide at each workstation. Verify understanding with practical test (passing score 90%)."

### Priority Assignment Guide

**CRITICAL:**

- Safety hazard
- Regulatory violation
- Customer shipment at risk
- RPN ≥ 300
- Target: 24-48 hours

**HIGH:**

- Major quality impact
- Significant cost
- RPN 200-299
- Target: 1 week

**MEDIUM:**

- Moderate quality impact
- Process improvement
- RPN 100-199
- Target: 2-4 weeks

**LOW:**

- Minor improvement
- Preventive action
- RPN < 100
- Target: 30-60 days

### Verification Methods Guide

| Method                | When to Use            | Duration   | Example                           |
| --------------------- | ---------------------- | ---------- | --------------------------------- |
| **Inspection**        | Physical changes       | 1-2 weeks  | New fixtures, equipment changes   |
| **Audit**             | Process changes        | 2-4 weeks  | Procedure updates, training       |
| **Data Analysis**     | Statistical validation | 4-8 weeks  | Defect rate reduction, SPC trends |
| **Customer Feedback** | External impact        | 8-12 weeks | Return rate, complaints           |
| **Combination**       | Complex changes        | 3-6 months | Major system changes              |

## Examples

### Example 1: Corrective CAPA (from NCR)

```yaml
CAPA Number: CAPA-20260105-001
Title: Incorrect Shipping Labels - Barcode Implementation
Type: CORRECTIVE
Priority: HIGH
Status: VERIFIED

RPN Analysis:
- Severity: 8 (Wrong product shipped to customer)
- Occurrence: 5 (1 in 400 shipments = 0.25%)
- Detection: 7 (Current QC catches 30%)
- RPN: 280 (HIGH RISK)

Target RPN: 48 (LOW RISK)

Linked NCR: NCR-20260105-012

Root Cause Analysis:
"Current process relies on operators manually typing order numbers into
label printer. No verification step. System allows printing without order
number validation. Operators under time pressure prioritize speed over
accuracy. Training emphasized productivity metrics, not accuracy."

Immediate Action:
"Implemented 100% QC verification of shipping labels before packages leave
dock. Added verification station with scanner. Assigned dedicated QC person
for label checks. Effective immediately (1/5/2026)."

Corrective Action:
"1. Purchased and installed 10 barcode scanners at packing stations ($1,500)
2. Updated shipping software to require barcode scan of order before label print
3. System now validates order number against open orders database
4. Label won't print without valid order scan
5. Implementation: 1/12/2026
6. Training completed: 1/14/2026 (all 25 shipping staff)"

Preventive Action:
"1. Updated SOP: Scan order → System validates → Print label → Scan label → System verifies match
2. Added error-proofing: System beeps + red light if mismatch
3. Installed andon lights at each station for visual management
4. Modified KPIs: Removed 'packages per hour', added 'accuracy rate'
5. Monthly shipping accuracy audits added to calendar
6. Results posted on quality board"

Verification Method: DATA_ANALYSIS
Verification Plan: "Monitor shipping accuracy for 30 days. Target: <0.01% error rate (1 in 10,000). Review customer complaints for wrong-item shipments."

Verification Results:
"Monitoring period: 1/15/2026 - 2/15/2026
- Total shipments: 15,420
- Labeling errors: 0
- Error rate: 0%
- Customer complaints (wrong item): 0
- Operator feedback: Positive, scanners faster than typing
- New RPN: 8 × 1 × 2 = 16 (LOW RISK)

VERIFIED EFFECTIVE ✅"

Completed: 2/15/2026
Verified By: Jane Wilson, QC Manager
Verified Date: 2/15/2026
```

### Example 2: Preventive CAPA

```yaml
CAPA Number: CAPA-20260106-002
Title: Forklift Maintenance - Prevent Inventory Damage
Type: PREVENTIVE
Priority: MEDIUM
Status: PENDING_VERIFICATION

RPN Analysis:
- Severity: 6 (Product damage, not safety issue)
- Occurrence: 4 (Few incidents per year)
- Detection: 5 (Damage usually noticed quickly)
- RPN: 120 (MEDIUM RISK)

Root Cause Analysis (Proactive):
"During annual forklift inspection, noticed 2 of 8 forklifts showing early
signs of hydraulic degradation. While not currently failing, this could lead
to dropped pallets and product damage. Maintenance is reactive, not preventive.
No predictive maintenance program exists."

Immediate Action:
"Completed full hydraulic system inspection on all 8 forklifts.
Replaced worn components on 2 units. All units passed safety check."

Corrective Action (N/A - Preventive):
"Not applicable - no failure has occurred yet"

Preventive Action:
"1. Implemented predictive maintenance program:
   - Monthly visual inspections (operators)
   - Quarterly detailed inspections (maintenance)
   - Annual certified inspections (external)
2. Created inspection checklist and digital tracking system
3. Scheduled PM in CMMS (Computerized Maintenance Management System)
4. Set up automatic work order generation
5. Trained 12 forklift operators on daily pre-use checks (1/10/2026)
6. Trained 3 maintenance techs on inspection procedures (1/11/2026)
7. Budget approved for hydraulic component spare parts stock
8. Implementation complete: 1/15/2026"

Verification Method: INSPECTION + DATA_ANALYSIS
Verification Plan: "Monitor for 90 days:
- Track forklift-related product damage incidents
- Review inspection completion rate
- Analyze hydraulic system metrics
- Target: Zero forklift-related damage incidents"

Currently Monitoring (Started: 1/15/2026, Ends: 4/15/2026)
```

### Example 3: Both (Corrective + Preventive)

```yaml
CAPA Number: CAPA-20260107-003
Title: Supplier Change Control Process Implementation
Type: BOTH
Priority: CRITICAL
Status: IN_PROGRESS

RPN Analysis:
- Severity: 9 (Safety-critical component)
- Occurrence: 6 (Has happened before)
- Detection: 8 (Hard to catch at receiving)
- RPN: 432 (HIGH RISK)

Linked NCR: NCR-20260105-003 (Safety valve calibration issue)

Root Cause Analysis:
"Supplier changed calibration equipment without notification. Our contract
lacked clause requiring approval for process changes. No change control
system exists. Suppliers routinely make changes without informing us.
Receiving inspection doesn't verify process certifications."

Immediate Action:
"1. Suspended supplier pending corrective action (1/5/2026)
2. Recalled and re-tested all safety valves from this supplier (200 units)
3. Conducted emergency supplier audit (1/7/2026)
4. Supplier recalibrated equipment and provided certificates
5. Implemented 100% receiving inspection for safety-critical parts
6. Supplier re-approved (1/12/2026)"

Corrective Action:
"1. Updated contract with supplier to include Change Control clause:
   - Requires 30-day advance notice for any process changes
   - Flowstock approval required before implementing changes
   - Annual process audit requirement
   - Contract amendment signed 1/10/2026
2. Implemented enhanced receiving inspection for safety-critical items:
   - Verify calibration certificates
   - Check revision levels
   - Sample testing required
3. Added supplier to quarterly audit schedule"

Preventive Action (Systemic):
"1. Developing formal Supplier Change Control Process:
   - Supplier Change Request Form (SCR)
   - Risk assessment for proposed changes
   - Approval workflow (Engineering, QC, Procurement)
   - Documentation requirements
   - Implementation verification
2. Updating ALL supplier contracts (42 active suppliers):
   - Change control clause
   - Process change approval requirements
   - Audit rights
   - Target completion: 2/28/2026
3. Creating Approved Supplier List (ASL) system:
   - Process capabilities documented
   - Approved processes tracked
   - Deviations flagged automatically
4. Implementing supplier portal:
   - Suppliers submit change requests online
   - Automated routing for approval
   - Email alerts for pending reviews
5. Training:
   - Procurement team: Supplier management (1/20/2026)
   - Engineering: Change assessment (1/25/2026)
   - QC: Inspection procedures (1/30/2026)"

Verification Method: AUDIT + DATA_ANALYSIS
Verification Plan: "6-month monitoring period:
- Audit all 42 supplier contracts by 2/28/2026
- Track change requests received and processed
- Monitor NCR rate related to supplier changes
- Quarterly supplier audits
- Target: Zero unapproved supplier changes"

Assigned To: Sarah Chen, Supply Chain Director
Target Date: 2/28/2026 (systemic changes)
Current Status: 65% Complete
- Contract updates: 28 of 42 complete
- Portal development: In testing
- Training: Scheduled
```

## Reporting

### CAPA Metrics

**Key Performance Indicators:**

- Open CAPA Count
- Average RPN
- Overdue CAPA Count
- Average Time to Close
- Effectiveness Rate
- Repeat Issues (%)

**Standard Reports:**

1. **Daily CAPA Dashboard**: Overdue actions requiring attention
2. **Weekly Status Report**: Progress on in-process CAPAs
3. **Monthly Effectiveness Report**: Verification results and trends
4. **Quarterly Management Review**: Strategic improvement summary
5. **Annual CAPA Analysis**: Year-over-year trends and ROI

## Compliance

### ISO 9001:2015 Alignment

- **Clause 10.2**: Nonconformity and Corrective Action
- Systematic approach required
- Effectiveness verification mandatory

### FDA Requirements

- **21 CFR 820.100**: Corrective and Preventive Action
- CAPA system required for medical device manufacturers
- Documentation and verification essential

---

**Last Updated**: January 5, 2026  
**Module Version**: 1.0.0
