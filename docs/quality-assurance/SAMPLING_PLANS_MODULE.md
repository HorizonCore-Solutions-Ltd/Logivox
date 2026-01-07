# Sampling Plans Module

## Overview

The Sampling Plans module implements ANSI/ASQ Z1.4 (ISO 2859) statistical sampling plans for AQL-based inspections. It provides sample size calculators, inspection level management, and plan tracking with expiration control.

## Key Features

### AQL Implementation

- Follows ANSI/ASQ Z1.4 standard
- Support for General Inspection Levels I, II, III
- Special Inspection Levels S-1, S-2, S-3, S-4
- AQL values: 0.01 to 10.0
- Normal, Tightened, Reduced inspection types

### Sample Size Calculation

- Automatic calculation based on lot size
- Inspection level selection
- AQL value input
- Accept/Reject numbers determined
- Compliant with international standards

### Plan Management

- Active/Inactive status
- Expiration dates
- Usage tracking
- Product category assignment
- Approval workflow

## User Interface

### Sampling Plans Dashboard (`/dashboard/qc/sampling-plans`)

**Statistics Cards:**

- Total Plans
- Active Plans
- Expired Plans
- Average AQL

**Built-in AQL Calculator:**

- Enter lot size
- Select inspection level
- Enter AQL
- Get sample size, accept, reject numbers

**Data Table:**

- Plan Number
- Plan Name
- Status badge
- AQL value
- Sample Size
- Accept/Reject numbers
- Inspection Level
- Expiry Date
- Actions

### Plan Detail Page (`/dashboard/qc/sampling-plans/[id]`)

**Sampling Parameters Display:**

- AQL (blue)
- Sample Size (green)
- Acceptance Number (green)
- Rejection Number (red)

**Live AQL Calculator:**

- Input lot size
- Calculates sample size dynamically
- Shows accept/reject criteria
- Based on plan's AQL and level

**Applied Products:**

- List of SKUs using this plan
- Links to product pages

**Usage Statistics:**

- Times used
- Last used date
- Success rate

## AQL Tables

### General Inspection Levels

**Level II (Most Common):**

| Lot Size      | Sample Size | AQL 0.65 Accept/Reject | AQL 1.0 Accept/Reject | AQL 2.5 Accept/Reject |
| ------------- | ----------- | ---------------------- | --------------------- | --------------------- |
| 2-8           | 2           | 0/1                    | 0/1                   | 0/1                   |
| 9-15          | 3           | 0/1                    | 0/1                   | 0/1                   |
| 16-25         | 5           | 0/1                    | 0/1                   | 1/2                   |
| 26-50         | 8           | 0/1                    | 1/2                   | 1/2                   |
| 51-90         | 13          | 1/2                    | 1/2                   | 2/3                   |
| 91-150        | 20          | 1/2                    | 2/3                   | 3/4                   |
| 151-280       | 32          | 2/3                    | 3/4                   | 5/6                   |
| 281-500       | 50          | 3/4                    | 5/6                   | 7/8                   |
| 501-1,200     | 80          | 5/6                    | 7/8                   | 10/11                 |
| 1,201-3,200   | 125         | 7/8                    | 10/11                 | 14/15                 |
| 3,201-10,000  | 200         | 10/11                  | 14/15                 | 21/22                 |
| 10,001-35,000 | 315         | 14/15                  | 21/22                 | 21/22                 |

## Workflows

### Creating a Sampling Plan

```
1. Navigate to /dashboard/qc/sampling-plans
2. Click "Create Plan"
3. Enter plan details:
   - Plan Name
   - Description
   - Product Category
4. Set inspection parameters:
   - Inspection Level (I, II, III, S-1 to S-4)
   - AQL value (0.01 to 10.0)
   - Inspection Type (Normal/Tightened/Reduced)
5. Use calculator to determine:
   - Sample Size
   - Acceptance Number
   - Rejection Number
6. Set validity:
   - Effective Date
   - Expiry Date (optional)
7. Optional: Assign to products
8. Submit for approval
9. Status = DRAFT until approved
```

### Using a Sampling Plan

```
1. During receiving inspection
2. Select applicable sampling plan
3. Enter actual lot size
4. System calculates sample size
5. Inspector samples required units
6. Inspect each unit
7. Count defects found
8. Compare to accept/reject numbers:
   - Defects ≤ Accept Number: PASS
   - Defects ≥ Reject Number: FAIL
9. Record results
10. System updates plan usage statistics
```

### Switching Inspection Types

**Normal → Tightened:**
When 2 out of 5 consecutive lots fail

**Tightened → Normal:**
When 5 consecutive lots pass

**Normal → Reduced:**
When 10 consecutive lots pass (and additional criteria met)

**Reduced → Normal:**
When 1 lot fails or production irregular

## Best Practices

### AQL Selection Guide

| Product Risk           | Typical AQL  | Use Case                           |
| ---------------------- | ------------ | ---------------------------------- |
| **Critical (Safety)**  | 0.01 - 0.065 | Medical devices, Safety equipment  |
| **Major (Functional)** | 0.10 - 0.65  | Electronics, Precision parts       |
| **Standard**           | 1.0 - 2.5    | General consumer goods             |
| **Minor (Cosmetic)**   | 4.0 - 6.5    | Packaging, Non-critical aesthetics |

### Inspection Level Selection

**Level I:** Less inspection (sample size reduced 40%)

- Stable suppliers
- Low-risk products
- Cost-sensitive situations

**Level II:** Normal inspection (standard)

- Default for most situations
- Balanced risk/cost
- Recommended starting point

**Level III:** More inspection (sample size increased 60%)

- New suppliers
- Critical products
- History of quality issues

**Special Levels (S-1 to S-4):** Very small sample sizes

- Destructive testing
- Expensive testing
- High testing cost

## Integration

### With Inspections

- Plans attached to inspection records
- Automatic sample size calculation
- Pass/fail determination
- Results tracked against plan

### With Products

- Plans assigned to product categories
- SKU-level plan override option
- Default plan by category

### With Suppliers

- Supplier performance affects level
- Poor quality → Tightened inspection
- Good quality → Reduced inspection

## Compliance

- ANSI/ASQ Z1.4 compliant
- ISO 2859 international standard
- MIL-STD-105E heritage
- Statistical validity maintained

---

**Last Updated**: January 5, 2026
