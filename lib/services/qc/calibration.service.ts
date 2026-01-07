/**
 * Equipment Calibration Service
 * Calibration Schedule and Records Management
 * ISO/IEC 17025:2017 - General requirements for competence of testing and calibration laboratories
 * ISO 9001:2015 Clause 7.1.5 - Monitoring and measuring resources
 * ISO 13485:2016 Clause 7.6 - Control of monitoring and measuring equipment
 */

import { prisma } from "@/lib/prisma";

export class CalibrationService {
  /**
   * Register equipment for calibration
   */
  static async registerEquipment(params: {
    organizationId: string;
    equipmentId: string;
    equipmentName: string;
    equipmentType: string; // MEASUREMENT, TEST, INSPECTION, MONITORING
    manufacturer: string;
    model: string;
    serialNumber: string;
    calibrationFrequency: number; // Days
    calibrationMethod: string;
    acceptanceCriteria: any;
    criticalEquipment: boolean;
    location: string;
    responsiblePerson: string;
  }) {
    return await prisma.calibrationEquipment.create({
      data: {
        equipmentId: params.equipmentId,
        organizationId: params.organizationId,
        equipmentName: params.equipmentName,
        equipmentType: params.equipmentType,
        manufacturer: params.manufacturer,
        model: params.model,
        serialNumber: params.serialNumber,
        calibrationFrequency: params.calibrationFrequency,
        calibrationMethod: params.calibrationMethod,
        acceptanceCriteria: params.acceptanceCriteria,
        criticalEquipment: params.criticalEquipment,
        location: params.location,
        responsiblePerson: params.responsiblePerson,
        status: "ACTIVE",
        nextCalibrationDue: new Date(
          Date.now() + params.calibrationFrequency * 24 * 60 * 60 * 1000,
        ),
      },
    });
  }

  /**
   * Record calibration
   */
  static async recordCalibration(params: {
    equipmentId: string;
    calibrationDate: Date;
    calibratedBy: string;
    calibrationLab?: string;
    certificateNumber: string;
    standardsUsed: string[];
    measurementResults: any;
    asFoundCondition: string; // IN_TOLERANCE, OUT_OF_TOLERANCE, FAILED
    asLeftCondition: string; // IN_TOLERANCE, ADJUSTED, REPAIRED
    uncertaintyValue?: number;
    uncertaintyUnit?: string;
    environmentalConditions?: {
      temperature?: number;
      humidity?: number;
      pressure?: number;
    };
    calibrationCost?: number;
    nextCalibrationDate: Date;
    notes?: string;
    attachments?: any;
  }) {
    // Record calibration
    const record = await prisma.calibrationRecord.create({
      data: {
        equipmentId: params.equipmentId,
        calibrationDate: params.calibrationDate,
        calibratedBy: params.calibratedBy,
        calibrationLab: params.calibrationLab,
        certificateNumber: params.certificateNumber,
        standardsUsed: params.standardsUsed,
        measurementResults: params.measurementResults,
        asFoundCondition: params.asFoundCondition,
        asLeftCondition: params.asLeftCondition,
        uncertaintyValue: params.uncertaintyValue,
        uncertaintyUnit: params.uncertaintyUnit,
        environmentalConditions: params.environmentalConditions,
        calibrationCost: params.calibrationCost,
        nextCalibrationDate: params.nextCalibrationDate,
        notes: params.notes,
        attachments: params.attachments,
        passed: params.asLeftCondition === "IN_TOLERANCE",
      },
    });

    // Update equipment status
    await prisma.calibrationEquipment.update({
      where: { equipmentId: params.equipmentId },
      data: {
        lastCalibrationDate: params.calibrationDate,
        nextCalibrationDue: params.nextCalibrationDate,
        calibrationStatus:
          params.asLeftCondition === "IN_TOLERANCE"
            ? "CURRENT"
            : "NEEDS_ATTENTION",
        status:
          params.asLeftCondition === "IN_TOLERANCE"
            ? "ACTIVE"
            : "OUT_OF_SERVICE",
      },
    });

    // If out of tolerance, create notification
    if (
      params.asFoundCondition === "OUT_OF_TOLERANCE" ||
      params.asFoundCondition === "FAILED"
    ) {
      await this.createOutOfToleranceAlert({
        equipmentId: params.equipmentId,
        recordId: record.id,
        asFoundCondition: params.asFoundCondition,
      });
    }

    return record;
  }

  /**
   * Get due calibrations
   */
  static async getDueCalibrations(params: {
    organizationId: string;
    daysAhead?: number; // Default 30 days
    criticalOnly?: boolean;
  }) {
    const daysAhead = params.daysAhead || 30;
    const dueDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      organizationId: params.organizationId,
      status: { not: "RETIRED" },
      nextCalibrationDue: { lte: dueDate },
    };

    if (params.criticalOnly) {
      whereClause.criticalEquipment = true;
    }

    const equipment = await prisma.calibrationEquipment.findMany({
      where: whereClause,
      include: {
        calibrationRecords: {
          orderBy: { calibrationDate: "desc" },
          take: 1,
        },
      },
      orderBy: { nextCalibrationDue: "asc" },
    });

    return equipment.map((eq) => {
      const daysUntilDue = Math.floor(
        (new Date(eq.nextCalibrationDue).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        ...eq,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
        urgency: this.calculateUrgency(daysUntilDue, eq.criticalEquipment),
      };
    });
  }

  /**
   * Get calibration history
   */
  static async getCalibrationHistory(params: {
    equipmentId: string;
    limit?: number;
  }) {
    return await prisma.calibrationRecord.findMany({
      where: { equipmentId: params.equipmentId },
      orderBy: { calibrationDate: "desc" },
      take: params.limit || 50,
    });
  }

  /**
   * Get compliance report
   */
  static async getComplianceReport(params: { organizationId: string }) {
    const allEquipment = await prisma.calibrationEquipment.findMany({
      where: {
        organizationId: params.organizationId,
        status: { not: "RETIRED" },
      },
      include: {
        calibrationRecords: {
          orderBy: { calibrationDate: "desc" },
          take: 1,
        },
      },
    });

    const now = Date.now();
    const current = allEquipment.filter(
      (eq) => new Date(eq.nextCalibrationDue).getTime() > now,
    );
    const overdue = allEquipment.filter(
      (eq) => new Date(eq.nextCalibrationDue).getTime() <= now,
    );
    const critical = allEquipment.filter((eq) => eq.criticalEquipment);

    const outOfTolerance = await prisma.calibrationRecord.count({
      where: {
        equipment: { organizationId: params.organizationId },
        asFoundCondition: { in: ["OUT_OF_TOLERANCE", "FAILED"] },
        calibrationDate: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
        },
      },
    });

    const totalRecords = await prisma.calibrationRecord.count({
      where: {
        equipment: { organizationId: params.organizationId },
        calibrationDate: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      summary: {
        totalEquipment: allEquipment.length,
        currentCalibration: current.length,
        overdueCalibration: overdue.length,
        criticalEquipment: critical.length,
        criticalOverdue: critical.filter(
          (eq) => new Date(eq.nextCalibrationDue).getTime() <= now,
        ).length,
        complianceRate: (current.length / allEquipment.length) * 100 || 0,
      },
      qualityMetrics: {
        outOfToleranceRate: (outOfTolerance / totalRecords) * 100 || 0,
        totalCalibrationsLastYear: totalRecords,
        outOfToleranceCount: outOfTolerance,
      },
      byType: this.groupByType(allEquipment),
      upcoming: await this.getDueCalibrations({
        organizationId: params.organizationId,
        daysAhead: 30,
      }),
    };
  }

  /**
   * Create out of tolerance alert
   */
  private static async createOutOfToleranceAlert(params: {
    equipmentId: string;
    recordId: string;
    asFoundCondition: string;
  }) {
    const equipment = await prisma.calibrationEquipment.findUnique({
      where: { equipmentId: params.equipmentId },
    });

    if (!equipment) return;

    // This would integrate with your notification system
    // For now, we'll create a placeholder alert
    return {
      type: "OUT_OF_TOLERANCE_ALERT",
      equipmentId: params.equipmentId,
      equipmentName: equipment.equipmentName,
      condition: params.asFoundCondition,
      severity: equipment.criticalEquipment ? "CRITICAL" : "HIGH",
      message: `Equipment ${equipment.equipmentName} found ${params.asFoundCondition}. Immediate investigation required.`,
      actionRequired:
        "Investigate impact on products manufactured since last calibration",
    };
  }

  /**
   * Helper: Calculate urgency
   */
  private static calculateUrgency(
    daysUntilDue: number,
    isCritical: boolean,
  ): string {
    if (daysUntilDue < 0) return "OVERDUE";
    if (daysUntilDue <= 7) return isCritical ? "CRITICAL" : "HIGH";
    if (daysUntilDue <= 14) return "MEDIUM";
    return "LOW";
  }

  /**
   * Helper: Group equipment by type
   */
  private static groupByType(equipment: any[]): any {
    const grouped: any = {};
    equipment.forEach((eq) => {
      if (!grouped[eq.equipmentType]) {
        grouped[eq.equipmentType] = {
          total: 0,
          current: 0,
          overdue: 0,
        };
      }
      grouped[eq.equipmentType].total++;
      if (new Date(eq.nextCalibrationDue).getTime() > Date.now()) {
        grouped[eq.equipmentType].current++;
      } else {
        grouped[eq.equipmentType].overdue++;
      }
    });
    return grouped;
  }
}
