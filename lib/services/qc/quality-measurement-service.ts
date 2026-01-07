/**
 * Quality Measurement Service
 * Parametric measurement tracking with SPC
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type MeasurementType = 'DIMENSIONAL' | 'WEIGHT' | 'TEMPERATURE' | 'PRESSURE' | 'PH' | 'HARDNESS' | 'THICKNESS' | 'VISCOSITY';

export class QualityMeasurementService {
  
  /**
   * Generate next measurement number
   */
  private static async generateMeasurementNumber(organizationId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const lastMeasurement = await prisma.qualityMeasurement.findFirst({
      where: {
        organizationId,
        measurementNumber: {
          startsWith: `QM-${year}${month}`,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let sequence = 1;
    if (lastMeasurement) {
      const lastSequence = parseInt(lastMeasurement.measurementNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `QM-${year}${month}-${String(sequence).padStart(5, '0')}`;
  }

  /**
   * Record measurement
   */
  static async recordMeasurement(params: {
    organizationId: string;
    measurementNumber?: string;
    referenceType: string;
    referenceId: string;
    referenceName?: string;
    batchLotNumber?: string;
    measurementType: MeasurementType;
    measurementName: string;
    measurementValue: number;
    unitOfMeasure: string;
    lowerSpecLimit?: number;
    upperSpecLimit?: number;
    nominalValue?: number;
    lowerControlLimit?: number;
    upperControlLimit?: number;
    isConforming?: boolean;
    deviation?: number;
    deviationPercentage?: number;
    cpk?: number;
    ppk?: number;
    measurementDate: Date;
    measuredBy: string;
    measurementEquipment?: string;
    calibrationDate?: Date;
    notes?: string;
  }) {
    
    const measurementNumber = params.measurementNumber || 
      await this.generateMeasurementNumber(params.organizationId);
    
    // Calculate conformance
    let isConforming = true;
    let deviation = 0;
    let deviationPercentage = 0;
    
    if (params.lowerSpecLimit !== undefined && params.measurementValue < params.lowerSpecLimit) {
      isConforming = false;
      deviation = params.measurementValue - params.lowerSpecLimit;
    } else if (params.upperSpecLimit !== undefined && params.measurementValue > params.upperSpecLimit) {
      isConforming = false;
      deviation = params.measurementValue - params.upperSpecLimit;
    }
    
    if (params.nominalValue && params.nominalValue !== 0) {
      deviationPercentage = ((params.measurementValue - params.nominalValue) / params.nominalValue) * 100;
    }

    const measurement = await prisma.qualityMeasurement.create({
      data: {
        measurementNumber,
        organizationId: params.organizationId,
        // referenceType removed - not in QualityMeasurement schema
        // Use inspectionId or ncrId instead
        productSku: params.referenceId, // Map referenceId to productSku
        productName: params.referenceName || 'Unknown',
        lotNumber: params.batchLotNumber,
        measurementType: params.measurementType,
        parameterName: params.measurementName,
        measuredValue: params.measurementValue,
        unitOfMeasure: params.unitOfMeasure,
        lowerSpecLimit: params.lowerSpecLimit,
        upperSpecLimit: params.upperSpecLimit,
        nominalValue: params.nominalValue,
        lowerControlLimit: params.lowerControlLimit,
        upperControlLimit: params.upperControlLimit,
        withinSpec: isConforming,
        withinControl: true, // Default to true, SPC will update
        conformanceStatus: isConforming ? "CONFORMING" : "NON_CONFORMING",
        deviation,
        deviationPercentage,
        cpk: params.cpk,
        ppk: params.ppk,
        measurementDate: params.measurementDate,
        measuredBy: params.measuredBy,
        createdBy: params.measuredBy, // Use measuredBy as createdBy
        calibrationCurrent: true, // Default to true
        notes: params.notes,
      },
    });

    return measurement;
  }

  /**
   * Calculate CPK (Process Capability Index)
   * CPK = min((USL - mean) / (3 * sigma), (mean - LSL) / (3 * sigma))
   */
  static async calculateCPK(params: {
    organizationId: string;
    referenceType: string;
    referenceId: string;
    measurementName: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ cpk: number; mean: number; sigma: number; cpu: number; cpl: number } | null> {
    
    const where: any = {
      organizationId: params.organizationId,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      measurementName: params.measurementName,
    };
    
    if (params.startDate) {
      where.measurementDate = { gte: params.startDate };
    }
    if (params.endDate) {
      where.measurementDate = { ...where.measurementDate, lte: params.endDate };
    }

    const measurements = await prisma.qualityMeasurement.findMany({
      where,
      orderBy: { measurementDate: 'asc' },
    });

    if (measurements.length < 2) return null;

    // Get spec limits from first measurement
    const firstMeasurement = measurements[0];
    const lsl = firstMeasurement.lowerSpecLimit;
    const usl = firstMeasurement.upperSpecLimit;
    
    if (lsl === null && usl === null) return null;

    // Calculate mean
    const values = measurements.map(m => parseFloat(m.measuredValue.toString()));
    const mean = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;

    // Calculate standard deviation (sigma)
    const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    const sigma = Math.sqrt(variance);

    if (sigma === 0) return null;

    // Calculate CPU and CPL
    const lslNum = lsl !== null ? parseFloat(lsl.toString()) : null;
    const uslNum = usl !== null ? parseFloat(usl.toString()) : null;
    const cpu = uslNum !== null ? (uslNum - mean) / (3 * sigma) : Infinity;
    const cpl = lslNum !== null ? (mean - lslNum) / (3 * sigma) : Infinity;

    // CPK is the minimum of CPU and CPL
    const cpk = Math.min(cpu, cpl);

    return { cpk, mean, sigma, cpu, cpl };
  }

  /**
   * Calculate PPK (Process Performance Index)
   * Similar to CPK but uses overall standard deviation
   */
  static async calculatePPK(params: {
    organizationId: string;
    referenceType: string;
    referenceId: string;
    measurementName: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ ppk: number; mean: number; sigma: number; ppu: number; ppl: number } | null> {
    
    // For simplicity, using same calculation as CPK
    // In production, PPK should use long-term sigma
    const result = await this.calculateCPK(params);
    
    if (!result) return null;
    
    return {
      ppk: result.cpk,
      mean: result.mean,
      sigma: result.sigma,
      ppu: result.cpu,
      ppl: result.cpl,
    };
  }

  /**
   * Get SPC control chart data
   */
  static async getSPCData(params: {
    organizationId: string;
    referenceType: string;
    referenceId: string;
    measurementName: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    
    const where: any = {
      organizationId: params.organizationId,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      measurementName: params.measurementName,
    };
    
    if (params.startDate) {
      where.measurementDate = { gte: params.startDate };
    }
    if (params.endDate) {
      where.measurementDate = { ...where.measurementDate, lte: params.endDate };
    }

    const measurements = await prisma.qualityMeasurement.findMany({
      where,
      orderBy: { measurementDate: 'asc' },
      take: params.limit,
    });

    if (measurements.length === 0) return null;

    // Calculate control limits if not set
    const values = measurements.map(m => parseFloat(m.measuredValue.toString()));
    const mean = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const sigma = Math.sqrt(variance);

    const lcl = parseFloat((measurements[0].lowerControlLimit ?? (mean - 3 * sigma)).toString());
    const ucl = parseFloat((measurements[0].upperControlLimit ?? (mean + 3 * sigma)).toString());
    const centerLine = mean;

    // Identify out-of-control points
    const outOfControlPoints = measurements.filter(m => {
      const val = parseFloat(m.measuredValue.toString());
      return val < lcl || val > ucl;
    });

    return {
      measurements: measurements.map(m => ({
        id: m.id,
        date: m.measurementDate,
        value: m.measuredValue,
        isConforming: m.withinSpec,
      })),
      controlLimits: {
        lcl,
        ucl,
        centerLine,
      },
      specLimits: {
        lsl: measurements[0].lowerSpecLimit,
        usl: measurements[0].upperSpecLimit,
        nominal: measurements[0].nominalValue,
      },
      statistics: {
        mean,
        sigma,
        count: measurements.length,
        conformingCount: measurements.filter(m => m.withinSpec).length,
        outOfControlCount: outOfControlPoints.length,
      },
    };
  }

  /**
   * Detect trends in measurements
   */
  static detectTrends(values: number[]): {
    hasUpwardTrend: boolean;
    hasDownwardTrend: boolean;
    consecutiveIncreases: number;
    consecutiveDecreases: number;
  } {
    if (values.length < 2) {
      return {
        hasUpwardTrend: false,
        hasDownwardTrend: false,
        consecutiveIncreases: 0,
        consecutiveDecreases: 0,
      };
    }

    let maxIncreases = 0;
    let maxDecreases = 0;
    let currentIncreases = 0;
    let currentDecreases = 0;

    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) {
        currentIncreases++;
        currentDecreases = 0;
        maxIncreases = Math.max(maxIncreases, currentIncreases);
      } else if (values[i] < values[i - 1]) {
        currentDecreases++;
        currentIncreases = 0;
        maxDecreases = Math.max(maxDecreases, currentDecreases);
      } else {
        currentIncreases = 0;
        currentDecreases = 0;
      }
    }

    // Trend is significant if 7+ consecutive increases/decreases
    return {
      hasUpwardTrend: maxIncreases >= 7,
      hasDownwardTrend: maxDecreases >= 7,
      consecutiveIncreases: maxIncreases,
      consecutiveDecreases: maxDecreases,
    };
  }

  /**
   * Get measurement statistics
   */
  static async getMeasurementStats(
    organizationId: string,
    filters: {
      referenceType?: string;
      referenceId?: string;
      measurementType?: MeasurementType;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const where: any = { organizationId };
    
    if (filters.referenceType) where.referenceType = filters.referenceType;
    if (filters.referenceId) where.referenceId = filters.referenceId;
    if (filters.measurementType) where.measurementType = filters.measurementType;
    if (filters.startDate || filters.endDate) {
      where.measurementDate = {};
      if (filters.startDate) where.measurementDate.gte = filters.startDate;
      if (filters.endDate) where.measurementDate.lte = filters.endDate;
    }

    const measurements = await prisma.qualityMeasurement.findMany({
      where,
    });

    const total = measurements.length;
    const conforming = measurements.filter(m => m.withinSpec).length;
    const nonConforming = total - conforming;
    const conformanceRate = total > 0 ? (conforming / total) * 100 : 0;

    // Group by measurement type
    const byType = measurements.reduce((acc, m) => {
      const type = m.measurementType;
      if (!acc[type]) {
        acc[type] = { count: 0, conforming: 0 };
      }
      acc[type].count++;
      if (m.withinSpec) acc[type].conforming++;
      return acc;
    }, {} as Record<string, { count: number; conforming: number }>);

    return {
      total,
      conforming,
      nonConforming,
      conformanceRate,
      byType,
    };
  }

  /**
   * List measurements with filters
   */
  static async listMeasurements(
    organizationId: string,
    filters: {
      referenceType?: string;
      referenceId?: string;
      measurementType?: MeasurementType;
      measurementName?: string;
      isConforming?: boolean;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ) {
    const where: any = { organizationId };
    
    if (filters.referenceType) where.sourceType = filters.referenceType;
    if (filters.referenceId) where.inspectionId = filters.referenceId;
    if (filters.measurementType) where.measurementType = filters.measurementType;
    if (filters.measurementName) where.parameterName = filters.measurementName;
    if (filters.isConforming !== undefined) where.withinSpec = filters.isConforming;
    if (filters.startDate || filters.endDate) {
      where.measurementDate = {};
      if (filters.startDate) where.measurementDate.gte = filters.startDate;
      if (filters.endDate) where.measurementDate.lte = filters.endDate;
    }

    return await prisma.qualityMeasurement.findMany({
      where,
      orderBy: { measurementDate: 'desc' },
      take: filters.limit,
    });
  }
}
