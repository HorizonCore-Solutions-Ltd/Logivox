/**
 * Statistical Process Control (SPC) Service
 * Implements control chart calculations and Western Electric Rules
 * Standards: AIAG SPC-2, ISO 7870-2
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SPCDataPoint {
  id: string;
  value: number;
  timestamp: Date;
  sampleNumber: number;
}

export interface ControlLimits {
  centerLine: number; // X̄ (mean)
  ucl: number; // Upper Control Limit
  lcl: number; // Lower Control Limit
  sigma: number; // Standard deviation
}

export interface SPCCalculations {
  dataPoints: SPCDataPoint[];
  controlLimits: ControlLimits;
  cpk: number;
  ppk: number;
  outOfControlPoints: string[];
  westernElectricViolations: WesternElectricViolation[];
  inControl: boolean;
}

export interface WesternElectricViolation {
  rule: number;
  description: string;
  pointIds: string[];
  severity: "WARNING" | "CRITICAL";
}

export class SPCService {
  /**
   * Calculate control limits for X-bar chart
   */
  static calculateControlLimits(values: number[]): ControlLimits {
    const n = values.length;
    if (n < 2) throw new Error("Need at least 2 data points for SPC");

    // Calculate mean (X̄)
    const mean = values.reduce((sum, val) => sum + val, 0) / n;

    // Calculate standard deviation (σ)
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const sigma = Math.sqrt(variance);

    // Control limits at ±3σ (99.73% of data)
    const ucl = mean + 3 * sigma;
    const lcl = mean - 3 * sigma;

    return {
      centerLine: mean,
      ucl,
      lcl,
      sigma,
    };
  }

  /**
   * Calculate CPK (Process Capability Index)
   * CPK measures how centered and controlled the process is
   */
  static calculateCPK(values: number[], lsl: number, usl: number): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const sigma = this.calculateControlLimits(values).sigma;

    const cpkUpper = (usl - mean) / (3 * sigma);
    const cpkLower = (mean - lsl) / (3 * sigma);

    return Math.min(cpkUpper, cpkLower);
  }

  /**
   * Calculate PPK (Process Performance Index)
   * PPK measures overall process performance
   */
  static calculatePPK(values: number[], lsl: number, usl: number): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    // For PPK, use population standard deviation
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const sigma = Math.sqrt(variance);

    const ppkUpper = (usl - mean) / (3 * sigma);
    const ppkLower = (mean - lsl) / (3 * sigma);

    return Math.min(ppkUpper, ppkLower);
  }

  /**
   * Apply Western Electric Rules (8 rules for detecting out-of-control conditions)
   */
  static applyWesternElectricRules(
    dataPoints: SPCDataPoint[],
    controlLimits: ControlLimits,
  ): WesternElectricViolation[] {
    const violations: WesternElectricViolation[] = [];
    const { centerLine, ucl, lcl, sigma } = controlLimits;

    // Calculate zone boundaries
    const zoneA_upper = centerLine + 2 * sigma;
    const zoneA_lower = centerLine - 2 * sigma;
    const zoneB_upper = centerLine + sigma;
    const zoneB_lower = centerLine - sigma;

    for (let i = 0; i < dataPoints.length; i++) {
      const point = dataPoints[i];

      // Rule 1: One point beyond 3σ (outside control limits)
      if (point.value > ucl || point.value < lcl) {
        violations.push({
          rule: 1,
          description: "Point beyond control limits (±3σ)",
          pointIds: [point.id],
          severity: "CRITICAL",
        });
      }

      // Rule 2: Nine consecutive points on same side of center line
      if (i >= 8) {
        const last9 = dataPoints.slice(i - 8, i + 1);
        const allAbove = last9.every((p) => p.value > centerLine);
        const allBelow = last9.every((p) => p.value < centerLine);

        if (allAbove || allBelow) {
          violations.push({
            rule: 2,
            description: "9 consecutive points on same side of center line",
            pointIds: last9.map((p) => p.id),
            severity: "WARNING",
          });
        }
      }

      // Rule 3: Six consecutive points steadily increasing or decreasing
      if (i >= 5) {
        const last6 = dataPoints.slice(i - 5, i + 1);
        const steadilyIncreasing = last6.every(
          (p, idx) => idx === 0 || p.value > last6[idx - 1].value,
        );
        const steadilyDecreasing = last6.every(
          (p, idx) => idx === 0 || p.value < last6[idx - 1].value,
        );

        if (steadilyIncreasing || steadilyDecreasing) {
          violations.push({
            rule: 3,
            description: "6 consecutive points steadily trending",
            pointIds: last6.map((p) => p.id),
            severity: "WARNING",
          });
        }
      }

      // Rule 4: Fourteen consecutive points alternating up and down
      if (i >= 13) {
        const last14 = dataPoints.slice(i - 13, i + 1);
        let alternating = true;
        for (let j = 1; j < last14.length - 1; j++) {
          const prev = last14[j - 1].value;
          const curr = last14[j].value;
          const next = last14[j + 1].value;
          if (!((curr > prev && curr > next) || (curr < prev && curr < next))) {
            alternating = false;
            break;
          }
        }

        if (alternating) {
          violations.push({
            rule: 4,
            description: "14 consecutive points alternating up/down",
            pointIds: last14.map((p) => p.id),
            severity: "WARNING",
          });
        }
      }

      // Rule 5: Two out of three consecutive points in Zone A (beyond 2σ)
      if (i >= 2) {
        const last3 = dataPoints.slice(i - 2, i + 1);
        const inZoneA = last3.filter(
          (p) => p.value > zoneA_upper || p.value < zoneA_lower,
        );

        if (inZoneA.length >= 2) {
          violations.push({
            rule: 5,
            description: "2 out of 3 points in Zone A (beyond 2σ)",
            pointIds: inZoneA.map((p) => p.id),
            severity: "WARNING",
          });
        }
      }

      // Rule 6: Four out of five consecutive points in Zone B or beyond (beyond 1σ)
      if (i >= 4) {
        const last5 = dataPoints.slice(i - 4, i + 1);
        const beyondZoneB = last5.filter(
          (p) => p.value > zoneB_upper || p.value < zoneB_lower,
        );

        if (beyondZoneB.length >= 4) {
          violations.push({
            rule: 6,
            description: "4 out of 5 points beyond 1σ",
            pointIds: beyondZoneB.map((p) => p.id),
            severity: "WARNING",
          });
        }
      }

      // Rule 7: Fifteen consecutive points within 1σ of center line (too good)
      if (i >= 14) {
        const last15 = dataPoints.slice(i - 14, i + 1);
        const allWithin1Sigma = last15.every(
          (p) => p.value > zoneB_lower && p.value < zoneB_upper,
        );

        if (allWithin1Sigma) {
          violations.push({
            rule: 7,
            description:
              "15 consecutive points within 1σ (process may be manipulated)",
            pointIds: last15.map((p) => p.id),
            severity: "WARNING",
          });
        }
      }

      // Rule 8: Eight consecutive points beyond 1σ on either side (bi-modal)
      if (i >= 7) {
        const last8 = dataPoints.slice(i - 7, i + 1);
        const allBeyond1Sigma = last8.every(
          (p) => p.value > zoneB_upper || p.value < zoneB_lower,
        );

        if (allBeyond1Sigma) {
          violations.push({
            rule: 8,
            description:
              "8 consecutive points beyond 1σ (bi-modal distribution)",
            pointIds: last8.map((p) => p.id),
            severity: "CRITICAL",
          });
        }
      }
    }

    return violations;
  }

  /**
   * Get SPC calculations for a specific measurement type
   */
  static async getSPCData(
    measurementType: string,
    productId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SPCCalculations> {
    // Fetch measurements from database
    const measurements = await prisma.qualityMeasurement.findMany({
      where: {
        measurementType,
        // productId not in schema - removed
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (measurements.length < 2) {
      throw new Error("Need at least 2 measurements for SPC analysis");
    }

    // Transform to data points
    const dataPoints: SPCDataPoint[] = measurements.map((m, idx) => ({
      id: m.id,
      value: parseFloat(m.measuredValue.toString()),
      timestamp: m.createdAt,
      sampleNumber: idx + 1,
    }));

    const values = dataPoints.map((p) => p.value);

    // Calculate control limits
    const controlLimits = this.calculateControlLimits(values);

    // Find out-of-control points
    const outOfControlPoints = dataPoints
      .filter((p) => p.value > controlLimits.ucl || p.value < controlLimits.lcl)
      .map((p) => p.id);

    // Apply Western Electric Rules
    const westernElectricViolations = this.applyWesternElectricRules(
      dataPoints,
      controlLimits,
    );

    // Calculate process capability (using first measurement's spec limits)
    const firstMeasurement = measurements[0];
    const cpk =
      firstMeasurement.lowerSpecLimit && firstMeasurement.upperSpecLimit
        ? this.calculateCPK(
            values,
            parseFloat(firstMeasurement.lowerSpecLimit.toString()),
            parseFloat(firstMeasurement.upperSpecLimit.toString()),
          )
        : 0;

    const ppk =
      firstMeasurement.lowerSpecLimit && firstMeasurement.upperSpecLimit
        ? this.calculatePPK(
            values,
            parseFloat(firstMeasurement.lowerSpecLimit.toString()),
            parseFloat(firstMeasurement.upperSpecLimit.toString()),
          )
        : 0;

    // Determine if process is in control
    const inControl =
      outOfControlPoints.length === 0 &&
      westernElectricViolations.filter((v) => v.severity === "CRITICAL")
        .length === 0;

    return {
      dataPoints,
      controlLimits,
      cpk,
      ppk,
      outOfControlPoints,
      westernElectricViolations,
      inControl,
    };
  }

  /**
   * Auto-trigger NCR when process goes out of control
   */
  static async checkAndCreateNCR(
    spcData: SPCCalculations,
    measurementType: string,
  ): Promise<string | null> {
    if (spcData.inControl) return null;

    // Get the latest out-of-control point
    const latestOutOfControl = spcData.dataPoints.find((p) =>
      spcData.outOfControlPoints.includes(p.id),
    );

    if (!latestOutOfControl) return null;

    // Get measurement details
    const measurement = await prisma.qualityMeasurement.findUnique({
      where: { id: latestOutOfControl.id },
    });

    if (!measurement) return null;

    // Create NCR
    const ncr = await prisma.nonConformanceReport.create({
      data: {
        ncrNumber: `NCR-SPC-${Date.now()}`,
        title: `SPC Out of Control: ${measurementType}`,
        description: `Process went out of control for ${measurementType}. Value: ${latestOutOfControl.value}, UCL: ${spcData.controlLimits.ucl}, LCL: ${spcData.controlLimits.lcl}`,
        severity: spcData.westernElectricViolations.some(
          (v) => v.severity === "CRITICAL",
        )
          ? "CRITICAL"
          : "MAJOR",
        status: "OPEN",
        // detectionMethod removed - not in NCR schema
        productSku: measurement.productSku,
        lotNumber: measurement.lotNumber,
        quantityAffected: measurement.sampleSize || 1,
        suspectedRootCause: `Western Electric Rules violated: ${spcData.westernElectricViolations.map((v) => `Rule ${v.rule}`).join(", ")}`,
        discoveredBy: "SYSTEM",
        reportDate: new Date(),
        organizationId: measurement.organizationId,
        sourceType: "PRODUCTION",
        category: "QUALITY",
        disposition: "QUARANTINE",
        nonConformanceType: "DIMENSIONAL",
        discoveryLocation: "PRODUCTION_LINE",
        createdBy: "SYSTEM",
      },
    });

    // Send notification
    await fetch("/api/qc/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "NCR_CREATED",
        ncrId: ncr.id,
        severity: ncr.severity,
      }),
    }).catch(console.error);

    return ncr.id;
  }

  /**
   * Calculate moving range for individuals chart
   */
  static calculateMovingRange(values: number[]): number[] {
    const ranges: number[] = [];
    for (let i = 1; i < values.length; i++) {
      ranges.push(Math.abs(values[i] - values[i - 1]));
    }
    return ranges;
  }

  /**
   * Calculate moving range control limits (for I-MR chart)
   */
  static calculateMRControlLimits(ranges: number[]): ControlLimits {
    const mR = ranges.reduce((sum, r) => sum + r, 0) / ranges.length;

    // Constants for moving range charts (n=2)
    const D3 = 0; // LCL constant
    const D4 = 3.267; // UCL constant

    return {
      centerLine: mR,
      ucl: D4 * mR,
      lcl: D3 * mR,
      sigma: mR / 1.128, // d2 constant for n=2
    };
  }
}

export default SPCService;
