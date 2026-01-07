# Quality Measurements Module

## Overview

The Quality Measurements module tracks parametric quality data with specification limits, process capability analysis (CPK), and statistical process control (SPC). It supports 8 measurement types and provides conformance tracking with visual analytics.

## Key Features

### Measurement Types Supported

1. **DIMENSION**: Length, width, height, diameter, thickness
2. **WEIGHT**: Mass, weight verification
3. **TEMPERATURE**: Process temperatures, storage temps
4. **PRESSURE**: Hydraulic, pneumatic, vacuum
5. **HARDNESS**: Rockwell, Brinell, Shore
6. **VISCOSITY**: Fluid properties
7. **pH**: Chemical measurements
8. **OTHER**: Custom measurements

### Specification Tracking

- Target Value (aim point)
- Specification Minimum (lower limit)
- Specification Maximum (upper limit)
- Measured Value (actual)
- Deviation from Target
- Conformance Status (Pass/Fail/Marginal)

### Process Capability (CPK)

- Automatic CPK calculation
- Process performance index
- 4-level classification:
  - CPK ≥ 2.0: Excellent (World-class)
  - CPK ≥ 1.33: Good
  - CPK ≥ 1.0: Adequate
  - CPK < 1.0: Poor (Improvement required)

### Statistical Process Control

- SPC chart generation
- Control limits calculation
- Trend analysis
- Out-of-control detection

## User Interface

### Measurements Dashboard (`/dashboard/qc/measurements`)

**Statistics Cards:**

- Total Measurements
- Conforming (%)
- Non-Conforming (count)
- Average Conformance Rate

**Measurement Type Breakdown:**

- 8 cards showing counts by type
- Visual distribution

**Data Table:**

- Measurement Number
- Type badge
- Characteristic
- Measured Value + Unit
- Spec Limits (Min/Max)
- Target Value
- Deviation
- CPK badge
- Conformance Status
- Date
- Actions

### Measurement Detail Page (`/dashboard/qc/measurements/[id]`)

**Large Value Display:**

- Measured Value (prominent, 5xl font)
- Unit
- Deviation from target

**Visual Specification Chart:**

- Gradient bar (red-green-red)
- Min marker (red, left)
- Target marker (blue, center)
- Max marker (red, right)
- Actual value marker (purple, position-based)
- Numeric summary below

**CPK Analysis Card:**

- CPK value (4xl font)
- Color-coded (green/blue/yellow/red)
- Performance level
- Interpretation text

**Equipment Tracking:**

- Equipment Used
- Calibration Date
- Measured By
- Measurement Date

## CPK Calculation

### Formula

```
CPK = min(CPK_upper, CPK_lower)

where:
CPK_upper = (USL - μ) / (3σ)
CPK_lower = (μ - LSL) / (3σ)

USL = Upper Specification Limit
LSL = Lower Specification Limit
μ = Process Mean
σ = Process Standard Deviation
```

### Interpretation

| CPK Value   | Rating        | Defect Rate | Meaning             |
| ----------- | ------------- | ----------- | ------------------- |
| ≥ 2.0       | **Excellent** | <0.002 PPM  | World-class process |
| 1.67 - 2.0  | **Very Good** | 0.57 PPM    | Six Sigma capable   |
| 1.33 - 1.67 | **Good**      | 63 PPM      | Industry standard   |
| 1.0 - 1.33  | **Adequate**  | 2,700 PPM   | Needs improvement   |
| < 1.0       | **Poor**      | >2,700 PPM  | Immediate action    |

**Example:**

- Spec: 100 ± 10 (LSL=90, USL=110)
- Target: 100
- Mean (μ): 102
- Std Dev (σ): 2

```
CPK_upper = (110 - 102) / (3 × 2) = 8/6 = 1.33
CPK_lower = (102 - 90) / (3 × 2) = 12/6 = 2.00
CPK = min(1.33, 2.00) = 1.33 (Good)
```

## Workflows

### Recording a Measurement

```
1. Navigate to /dashboard/qc/measurements
2. Click "Record Measurement"
3. Select measurement type
4. Enter characteristic name
5. Enter specification limits:
   - Spec Min
   - Target Value
   - Spec Max
   - Unit of measure
6. Enter measured value
7. System calculates:
   - Deviation
   - Conformance status
   - (CPK if enough historical data)
8. Enter metadata:
   - Measured by
   - Equipment used
   - Calibration date
9. Optional: Link to product/lot/inspection
10. Save measurement
11. System auto-checks conformance
12. If non-conforming → Alert generated
```

### SPC Chart Analysis

```
1. Navigate to measurement detail
2. Click "View SPC Chart"
3. System displays:
   - X-bar chart (averages)
   - R chart (ranges)
   - Control limits (±3σ)
   - Specification limits
   - Data points over time
4. Identify patterns:
   - Points outside control limits
   - Runs of 7+ points trending
   - Unusual patterns
5. Take action if out of control
```

### Process Capability Study

```
Prerequisites:
- Minimum 30 measurements
- Process in statistical control
- Normal distribution

Steps:
1. Collect 30+ measurements
2. Calculate mean (μ) and std dev (σ)
3. System calculates CPK
4. Interpret results:
   - CPK ≥ 1.33: Capable
   - CPK < 1.33: Improvement needed
5. Document in capability report
6. Review with engineering
```

## Best Practices

### When to Measure

**100% Inspection:**

- Critical safety dimensions
- Regulatory requirements
- Known process issues
- New products (initial batches)

**Sampling Inspection:**

- Stable processes (CPK > 1.33)
- Non-critical dimensions
- High-volume production
- Cost-effective approach

### Measurement Frequency

| Process Capability | Frequency        |
| ------------------ | ---------------- |
| CPK < 1.0          | Every unit       |
| CPK 1.0 - 1.33     | Every 10th unit  |
| CPK 1.33 - 2.0     | Every 50th unit  |
| CPK ≥ 2.0          | Every 100th unit |

### Setting Specification Limits

**Engineering Specifications:**

- Based on functional requirements
- Customer specifications
- Regulatory requirements

**Process Specifications (Internal):**

- Tighter than engineering specs
- Provide buffer for variation
- Typically 75% of engineering tolerance

**Example:**

- Engineering Spec: 100 ± 10 (90-110)
- Process Spec: 100 ± 7.5 (92.5-107.5)

### Equipment Calibration

**Measurement Uncertainty:**
Must be ≤10% of tolerance

**Example:**

- Tolerance: 0.1 mm
- Measurement uncertainty: ≤0.01 mm
- Calibration frequency: Annual minimum

## SPC Rules (Out of Control)

### Rule 1: Point Beyond Control Limits

One point beyond ±3σ

### Rule 2: Run of 9

9 points in a row on same side of centerline

### Rule 3: Trend of 7

7 consecutive points trending up or down

### Rule 4: Alternating Pattern

14 points alternating up and down

### Rule 5: 2 of 3 Beyond 2σ

2 out of 3 consecutive points beyond ±2σ

### Rule 6: 4 of 5 Beyond 1σ

4 out of 5 consecutive points beyond ±1σ

## Integration

### With Inspections

- Measurements recorded during inspections
- Linked to inspection records
- Auto-populate product/lot info

### With NCR Module

- Non-conforming measurements trigger NCRs
- Automatic NCR creation option
- Measurement data included in NCR

### With CAPA System

- Process capability issues spawn CAPAs
- Improvement actions tracked
- Effectiveness measured via CPK

### With Products

- Measurements by SKU
- Product-specific spec limits
- Historical data per product

## Reporting

### Standard Reports

1. **Daily Conformance Report**: Pass/fail summary
2. **Weekly SPC Analysis**: Control charts
3. **Monthly Capability Report**: CPK by product
4. **Quarterly Trend Analysis**: Long-term patterns

### Metrics

- Overall Conformance Rate
- CPK by Product
- Measurement Type Distribution
- Out-of-Spec Trends

## Compliance

- ISO 9001:2015 Clause 8.5.1
- SPC methodology standard
- Measurement system analysis (MSA)
- Calibration requirements

---

**Last Updated**: January 5, 2026
