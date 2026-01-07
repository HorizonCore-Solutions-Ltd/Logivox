/**
 * Sampling Plan Service
 * AQL-based sampling plans per ANSI/ASQ Z1.4 standard
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type InspectionLevel = "S1" | "S2" | "S3" | "S4" | "I" | "II" | "III";
export type SamplingType = "SINGLE" | "DOUBLE" | "MULTIPLE" | "SEQUENTIAL";

// ANSI/ASQ Z1.4 Sample Size Code Letters
const SAMPLE_SIZE_CODES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "Q",
  "R",
];

// Sample size table for code letters (simplified)
const SAMPLE_SIZE_TABLE: Record<string, number> = {
  A: 2,
  B: 3,
  C: 5,
  D: 8,
  E: 13,
  F: 20,
  G: 32,
  H: 50,
  J: 80,
  K: 125,
  L: 200,
  M: 315,
  N: 500,
  P: 800,
  Q: 1250,
  R: 2000,
};

export class SamplingPlanService {
  /**
   * Generate next plan number
   */
  private static async generatePlanNumber(
    organizationId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();

    const lastPlan = await prisma.samplingPlan.findFirst({
      where: {
        organizationId,
        planNumber: {
          startsWith: `SP-${year}`,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let sequence = 1;
    if (lastPlan) {
      const lastSequence = parseInt(
        lastPlan.planNumber.split("-").pop() || "0",
      );
      sequence = lastSequence + 1;
    }

    return `SP-${year}-${String(sequence).padStart(4, "0")}`;
  }

  /**
   * Determine sample size code based on lot size and inspection level
   */
  static determineSampleSizeCode(
    lotSize: number,
    inspectionLevel: InspectionLevel,
  ): string {
    // ANSI/ASQ Z1.4 Table I - Sample Size Code Letters
    if (lotSize <= 2) return "A";
    if (lotSize <= 8)
      return inspectionLevel === "I"
        ? "A"
        : inspectionLevel === "II"
          ? "A"
          : "B";
    if (lotSize <= 15)
      return inspectionLevel === "I"
        ? "A"
        : inspectionLevel === "II"
          ? "B"
          : "C";
    if (lotSize <= 25)
      return inspectionLevel === "I"
        ? "B"
        : inspectionLevel === "II"
          ? "C"
          : "D";
    if (lotSize <= 50)
      return inspectionLevel === "I"
        ? "C"
        : inspectionLevel === "II"
          ? "D"
          : "E";
    if (lotSize <= 90)
      return inspectionLevel === "I"
        ? "C"
        : inspectionLevel === "II"
          ? "E"
          : "F";
    if (lotSize <= 150)
      return inspectionLevel === "I"
        ? "D"
        : inspectionLevel === "II"
          ? "F"
          : "G";
    if (lotSize <= 280)
      return inspectionLevel === "I"
        ? "E"
        : inspectionLevel === "II"
          ? "G"
          : "H";
    if (lotSize <= 500)
      return inspectionLevel === "I"
        ? "F"
        : inspectionLevel === "II"
          ? "H"
          : "J";
    if (lotSize <= 1200)
      return inspectionLevel === "I"
        ? "G"
        : inspectionLevel === "II"
          ? "J"
          : "K";
    if (lotSize <= 3200)
      return inspectionLevel === "I"
        ? "H"
        : inspectionLevel === "II"
          ? "K"
          : "L";
    if (lotSize <= 10000)
      return inspectionLevel === "I"
        ? "J"
        : inspectionLevel === "II"
          ? "L"
          : "M";
    if (lotSize <= 35000)
      return inspectionLevel === "I"
        ? "K"
        : inspectionLevel === "II"
          ? "M"
          : "N";
    if (lotSize <= 150000)
      return inspectionLevel === "I"
        ? "L"
        : inspectionLevel === "II"
          ? "N"
          : "P";
    if (lotSize <= 500000)
      return inspectionLevel === "I"
        ? "M"
        : inspectionLevel === "II"
          ? "P"
          : "Q";
    return inspectionLevel === "I" ? "N" : inspectionLevel === "II" ? "Q" : "R";
  }

  /**
   * Calculate sample size from code letter
   */
  static calculateSampleSize(sampleSizeCode: string): number {
    return SAMPLE_SIZE_TABLE[sampleSizeCode] || 0;
  }

  /**
   * Determine accept/reject numbers based on AQL and sample size
   */
  static determineAcceptRejectNumbers(
    sampleSize: number,
    aql: number,
  ): { acceptNumber: number; rejectNumber: number } {
    // Simplified AQL table (normally would use full ANSI Z1.4 tables)
    // This is a basic implementation - production should use complete tables

    if (aql <= 0.01) return { acceptNumber: 0, rejectNumber: 1 };
    if (aql <= 0.065) return { acceptNumber: 0, rejectNumber: 1 };
    if (aql <= 0.1) return { acceptNumber: 0, rejectNumber: 1 };
    if (aql <= 0.15) return { acceptNumber: 0, rejectNumber: 1 };
    if (aql <= 0.25) {
      if (sampleSize <= 32) return { acceptNumber: 0, rejectNumber: 1 };
      return { acceptNumber: 1, rejectNumber: 2 };
    }
    if (aql <= 0.4) {
      if (sampleSize <= 32) return { acceptNumber: 0, rejectNumber: 1 };
      if (sampleSize <= 80) return { acceptNumber: 1, rejectNumber: 2 };
      return { acceptNumber: 2, rejectNumber: 3 };
    }
    if (aql <= 0.65) {
      if (sampleSize <= 20) return { acceptNumber: 0, rejectNumber: 1 };
      if (sampleSize <= 50) return { acceptNumber: 1, rejectNumber: 2 };
      if (sampleSize <= 125) return { acceptNumber: 2, rejectNumber: 3 };
      return { acceptNumber: 3, rejectNumber: 4 };
    }
    if (aql <= 1.0) {
      if (sampleSize <= 13) return { acceptNumber: 0, rejectNumber: 1 };
      if (sampleSize <= 32) return { acceptNumber: 1, rejectNumber: 2 };
      if (sampleSize <= 80) return { acceptNumber: 2, rejectNumber: 3 };
      if (sampleSize <= 200) return { acceptNumber: 3, rejectNumber: 4 };
      return { acceptNumber: 5, rejectNumber: 6 };
    }
    if (aql <= 1.5) {
      if (sampleSize <= 13) return { acceptNumber: 0, rejectNumber: 1 };
      if (sampleSize <= 20) return { acceptNumber: 1, rejectNumber: 2 };
      if (sampleSize <= 50) return { acceptNumber: 2, rejectNumber: 3 };
      if (sampleSize <= 125) return { acceptNumber: 3, rejectNumber: 4 };
      if (sampleSize <= 315) return { acceptNumber: 5, rejectNumber: 6 };
      return { acceptNumber: 7, rejectNumber: 8 };
    }
    if (aql <= 2.5) {
      if (sampleSize <= 8) return { acceptNumber: 0, rejectNumber: 1 };
      if (sampleSize <= 13) return { acceptNumber: 1, rejectNumber: 2 };
      if (sampleSize <= 32) return { acceptNumber: 2, rejectNumber: 3 };
      if (sampleSize <= 80) return { acceptNumber: 3, rejectNumber: 4 };
      if (sampleSize <= 200) return { acceptNumber: 5, rejectNumber: 6 };
      if (sampleSize <= 500) return { acceptNumber: 7, rejectNumber: 8 };
      return { acceptNumber: 10, rejectNumber: 11 };
    }
    if (aql <= 4.0) {
      if (sampleSize <= 5) return { acceptNumber: 0, rejectNumber: 1 };
      if (sampleSize <= 8) return { acceptNumber: 1, rejectNumber: 2 };
      if (sampleSize <= 20) return { acceptNumber: 2, rejectNumber: 3 };
      if (sampleSize <= 50) return { acceptNumber: 3, rejectNumber: 4 };
      if (sampleSize <= 125) return { acceptNumber: 5, rejectNumber: 6 };
      if (sampleSize <= 315) return { acceptNumber: 7, rejectNumber: 8 };
      if (sampleSize <= 800) return { acceptNumber: 10, rejectNumber: 11 };
      return { acceptNumber: 14, rejectNumber: 15 };
    }

    // Default for higher AQL values
    return {
      acceptNumber: Math.floor(sampleSize * (aql / 100)),
      rejectNumber: Math.floor(sampleSize * (aql / 100)) + 1,
    };
  }

  /**
   * Create sampling plan
   */
  static async createPlan(params: {
    organizationId: string;
    planName: string;
    planDescription?: string;
    targetType: string;
    targetId?: string;
    targetName?: string;
    inspectionType: string;
    standard?: string;
    inspectionLevel: InspectionLevel;
    aqlCritical?: number;
    aqlMajor?: number;
    aqlMinor?: number;
    samplingType: SamplingType;
    usePercentage?: boolean;
    samplePercentage?: number;
    minimumSampleSize?: number;
    maximumSampleSize?: number;
    planType: string;
    measurementRequired?: boolean;
    measurementSpecs?: any;
    inspectionFrequency?: string;
    frequencyValue?: number;
    effectiveDate: Date;
    expirationDate?: Date;
    createdBy: string;
  }) {
    const planNumber = await this.generatePlanNumber(params.organizationId);

    const plan = await prisma.samplingPlan.create({
      data: {
        planNumber,
        organizationId: params.organizationId,
        planName: params.planName,
        planDescription: params.planDescription,
        targetType: params.targetType,
        targetId: params.targetId,
        targetName: params.targetName,
        inspectionType: params.inspectionType,
        standard: params.standard || "ANSI_Z1_4",
        inspectionLevel: params.inspectionLevel,
        aqlCritical: params.aqlCritical,
        aqlMajor: params.aqlMajor,
        aqlMinor: params.aqlMinor,
        samplingType: params.samplingType,
        usePercentage: params.usePercentage || false,
        samplePercentage: params.samplePercentage,
        minimumSampleSize: params.minimumSampleSize,
        maximumSampleSize: params.maximumSampleSize,
        planType: params.planType,
        measurementRequired: params.measurementRequired || false,
        measurementSpecs: params.measurementSpecs,
        inspectionFrequency: params.inspectionFrequency,
        frequencyValue: params.frequencyValue,
        effectiveDate: params.effectiveDate,
        expirationDate: params.expirationDate,
        createdBy: params.createdBy,
      },
    });

    return plan;
  }

  /**
   * Calculate sample size for a lot
   */
  static calculateSampleSizeForLot(params: {
    lotSize: number;
    inspectionLevel: InspectionLevel;
    usePercentage?: boolean;
    samplePercentage?: number;
    minimumSampleSize?: number;
    maximumSampleSize?: number;
  }): number {
    if (params.usePercentage && params.samplePercentage) {
      let size = Math.ceil(params.lotSize * (params.samplePercentage / 100));

      if (params.minimumSampleSize && size < params.minimumSampleSize) {
        size = params.minimumSampleSize;
      }
      if (params.maximumSampleSize && size > params.maximumSampleSize) {
        size = params.maximumSampleSize;
      }

      return size;
    }

    // Use AQL table
    const code = this.determineSampleSizeCode(
      params.lotSize,
      params.inspectionLevel,
    );
    let size = this.calculateSampleSize(code);

    if (params.minimumSampleSize && size < params.minimumSampleSize) {
      size = params.minimumSampleSize;
    }
    if (params.maximumSampleSize && size > params.maximumSampleSize) {
      size = params.maximumSampleSize;
    }

    return size;
  }

  /**
   * Update plan usage
   */
  static async recordUsage(planId: string) {
    const plan = await prisma.samplingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new Error("Plan not found");

    return await prisma.samplingPlan.update({
      where: { id: planId },
      data: {
        timesUsed: plan.timesUsed + 1,
        lastUsedDate: new Date(),
      },
    });
  }

  /**
   * Supersede plan
   */
  static async supersedePlan(oldPlanId: string, newPlanId: string) {
    return await prisma.samplingPlan.update({
      where: { id: oldPlanId },
      data: {
        status: "SUPERSEDED",
        supersededBy: newPlanId,
      },
    });
  }

  /**
   * Get plan by ID
   */
  static async getPlanById(planId: string) {
    return await prisma.samplingPlan.findUnique({
      where: { id: planId },
    });
  }

  /**
   * List plans with filters
   */
  static async listPlans(
    organizationId: string,
    filters: {
      status?: string;
      targetType?: string;
      targetId?: string;
      inspectionType?: string;
    } = {},
  ) {
    const where: any = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.targetId) where.targetId = filters.targetId;
    if (filters.inspectionType) where.inspectionType = filters.inspectionType;

    return await prisma.samplingPlan.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find applicable plan
   */
  static async findApplicablePlan(params: {
    organizationId: string;
    targetType: string;
    targetId?: string;
    inspectionType: string;
  }) {
    // Try to find specific plan first
    let plan = await prisma.samplingPlan.findFirst({
      where: {
        organizationId: params.organizationId,
        targetType: params.targetType,
        targetId: params.targetId,
        inspectionType: params.inspectionType,
        status: "ACTIVE",
        effectiveDate: { lte: new Date() },
        OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
    });

    // If no specific plan, try universal plan
    if (!plan) {
      plan = await prisma.samplingPlan.findFirst({
        where: {
          organizationId: params.organizationId,
          targetType: "UNIVERSAL",
          inspectionType: params.inspectionType,
          status: "ACTIVE",
          effectiveDate: { lte: new Date() },
          OR: [
            { expirationDate: null },
            { expirationDate: { gte: new Date() } },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return plan;
  }
}
