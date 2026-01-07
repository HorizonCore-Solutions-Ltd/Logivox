/**
 * Training Management Service
 * Handles quality training requirements, records, certifications, and compliance
 * ISO 9001:2015 Clause 7.2 - Competence
 * ISO 13485:2016 Clause 6.2 - Human Resources
 */

import { prisma } from '@/lib/prisma';

export class TrainingService {
  /**
   * Create training requirement
   */
  static async createRequirement(params: {
    organizationId: string;
    trainingCode: string;
    trainingTitle: string;
    description: string;
    trainingCategory: string; // QUALITY, SAFETY, TECHNICAL, REGULATORY, EQUIPMENT, PROCESS
    requiredFor: string[]; // Array of roles/positions
    frequency: string; // ONBOARDING, ANNUAL, BIANNUAL, AS_NEEDED
    duration: number; // Duration in hours
    validityPeriod?: number; // Validity in months
    certificationRequired: boolean;
    providedBy?: string; // INTERNAL, EXTERNAL, VENDOR
    mandatoryReason?: string;
    prerequisiteTrainings?: string[];
    assessmentRequired: boolean;
    passingScore?: number;
    createdBy: string;
  }) {
    const trainingNumber = `TRN-REQ-${Date.now()}`;

    return await prisma.trainingRequirement.create({
      data: {
        trainingNumber,
        organizationId: params.organizationId,
        trainingCode: params.trainingCode,
        trainingTitle: params.trainingTitle,
        description: params.description,
        trainingCategory: params.trainingCategory,
        requiredFor: params.requiredFor,
        frequency: params.frequency,
        duration: params.duration,
        validityPeriod: params.validityPeriod,
        certificationRequired: params.certificationRequired,
        providedBy: params.providedBy || 'INTERNAL',
        mandatoryReason: params.mandatoryReason,
        prerequisiteTrainings: params.prerequisiteTrainings || [],
        assessmentRequired: params.assessmentRequired,
        passingScore: params.passingScore,
        status: 'ACTIVE',
        createdBy: params.createdBy,
      },
    });
  }

  /**
   * Record training completion
   */
  static async recordCompletion(params: {
    organizationId: string;
    requirementId: string;
    employeeId: string;
    employeeName: string;
    trainingDate: Date;
    completionDate: Date;
    trainerId?: string;
    trainerName?: string;
    location: string; // CLASSROOM, ONLINE, ON_SITE, EXTERNAL
    assessmentScore?: number;
    certificationNumber?: string;
    certificationExpiry?: Date;
    attendanceVerified: boolean;
    effectiveness?: string; // EFFECTIVE, NEEDS_IMPROVEMENT, NOT_EFFECTIVE
    notes?: string;
    recordedBy: string;
  }) {
    const recordNumber = `TRN-REC-${Date.now()}`;

    // Get requirement details
    const requirement = await prisma.trainingRequirement.findUnique({
      where: { id: params.requirementId },
    });

    if (!requirement) throw new Error('Training requirement not found');

    // Check if assessment passed if required
    if (requirement.assessmentRequired && params.assessmentScore) {
      const passingScore = requirement.passingScore || 80;
      if (params.assessmentScore < passingScore) {
        throw new Error(`Assessment score ${params.assessmentScore}% is below passing score ${passingScore}%`);
      }
    }

    // Calculate expiry date if validity period exists
    let expiryDate = params.certificationExpiry;
    if (!expiryDate && requirement.validityPeriod) {
      expiryDate = new Date(params.completionDate);
      expiryDate.setMonth(expiryDate.getMonth() + requirement.validityPeriod);
    }

    const record = await prisma.trainingRecord.create({
      data: {
        recordNumber,
        organizationId: params.organizationId,
        requirementId: params.requirementId,
        employeeId: params.employeeId,
        employeeName: params.employeeName,
        trainingDate: params.trainingDate,
        completionDate: params.completionDate,
        trainerId: params.trainerId,
        trainerName: params.trainerName,
        location: params.location,
        status: 'COMPLETED',
        assessmentScore: params.assessmentScore,
        assessmentPassed: params.assessmentScore 
          ? params.assessmentScore >= (requirement.passingScore || 80)
          : true,
        certificationNumber: params.certificationNumber,
        certificationIssued: !!params.certificationNumber,
        certificationExpiry: expiryDate,
        attendanceVerified: params.attendanceVerified,
        effectiveness: params.effectiveness,
        notes: params.notes,
        createdBy: params.recordedBy,
      },
    });

    // Create notification for expiring certifications
    if (expiryDate) {
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 60) {
        await this.createExpiryNotification(record.id, daysUntilExpiry);
      }
    }

    return record;
  }

  /**
   * Get employee training matrix
   */
  static async getEmployeeMatrix(params: {
    organizationId: string;
    employeeId?: string;
    role?: string;
    includeExpired?: boolean;
  }) {
    const requirements = await prisma.trainingRequirement.findMany({
      where: {
        organizationId: params.organizationId,
        status: 'ACTIVE',
        ...(params.role && { requiredFor: { has: params.role } }),
      },
      orderBy: { trainingTitle: 'asc' },
    });

    const whereClause: any = {
      organizationId: params.organizationId,
    };

    if (params.employeeId) {
      whereClause.employeeId = params.employeeId;
    }

    const records = await prisma.trainingRecord.findMany({
      where: whereClause,
      orderBy: { completionDate: 'desc' },
    });

    // Build matrix
    const matrix: any[] = [];

    if (params.employeeId) {
      // Single employee matrix
      for (const req of requirements) {
        const employeeRecords = records.filter(r => r.requirementId === req.id);
        const latestRecord = employeeRecords[0];

        const isExpired = latestRecord?.certificationExpiry 
          ? new Date(latestRecord.certificationExpiry) < new Date()
          : false;

        const dueDate = this.calculateDueDate(latestRecord, req);
        const isOverdue = dueDate ? new Date(dueDate) < new Date() : false;

        matrix.push({
          requirement: req,
          latestRecord,
          allRecords: employeeRecords,
          status: !latestRecord 
            ? 'NOT_COMPLETED'
            : isExpired 
            ? 'EXPIRED' 
            : isOverdue 
            ? 'OVERDUE'
            : 'CURRENT',
          dueDate,
          completionCount: employeeRecords.length,
        });
      }
    } else {
      // All employees summary
      const employees = [...new Set(records.map(r => r.employeeId))];
      
      for (const empId of employees) {
        const empRecords = records.filter(r => r.employeeId === empId);
        const empName = empRecords[0]?.employeeName || empId;

        const trainingStatus = requirements.map(req => {
          const reqRecords = empRecords.filter(r => r.requirementId === req.id);
          const latest = reqRecords[0];

          const isExpired = latest?.certificationExpiry 
            ? new Date(latest.certificationExpiry) < new Date()
            : false;

          return {
            requirementId: req.id,
            trainingTitle: req.trainingTitle,
            status: !latest ? 'NOT_COMPLETED' : isExpired ? 'EXPIRED' : 'CURRENT',
            lastCompleted: latest?.completionDate,
            expiry: latest?.certificationExpiry,
          };
        });

        const notCompleted = trainingStatus.filter(t => t.status === 'NOT_COMPLETED').length;
        const expired = trainingStatus.filter(t => t.status === 'EXPIRED').length;

        matrix.push({
          employeeId: empId,
          employeeName: empName,
          trainings: trainingStatus,
          completionRate: ((requirements.length - notCompleted) / requirements.length) * 100,
          notCompletedCount: notCompleted,
          expiredCount: expired,
        });
      }
    }

    return matrix;
  }

  /**
   * Get expiring certifications
   */
  static async getExpiringCertifications(params: {
    organizationId: string;
    daysAhead?: number;
  }) {
    const daysAhead = params.daysAhead || 60;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    const records = await prisma.trainingRecord.findMany({
      where: {
        organizationId: params.organizationId,
        certificationExpiry: {
          gte: new Date(),
          lte: expiryDate,
        },
        status: 'COMPLETED',
      },
      include: {
        requirement: true,
      },
      orderBy: { certificationExpiry: 'asc' },
    });

    return records.map(record => {
      const daysUntilExpiry = Math.floor(
        (new Date(record.certificationExpiry!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...record,
        daysUntilExpiry,
        urgency: daysUntilExpiry <= 30 ? 'HIGH' : daysUntilExpiry <= 60 ? 'MEDIUM' : 'LOW',
      };
    });
  }

  /**
   * Get training compliance report
   */
  static async getComplianceReport(params: {
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const requirements = await prisma.trainingRequirement.findMany({
      where: {
        organizationId: params.organizationId,
        status: 'ACTIVE',
      },
    });

    const records = await prisma.trainingRecord.findMany({
      where: {
        organizationId: params.organizationId,
        ...(params.startDate && {
          completionDate: {
            gte: params.startDate,
            ...(params.endDate && { lte: params.endDate }),
          },
        }),
      },
    });

    // Calculate compliance metrics
    const totalRequirements = requirements.length;
    const totalRecords = records.length;
    const uniqueEmployees = new Set(records.map(r => r.employeeId)).size;

    const byCategory: any = {};
    requirements.forEach(req => {
      if (!byCategory[req.trainingCategory]) {
        byCategory[req.trainingCategory] = {
          requirements: 0,
          completions: 0,
          employees: new Set(),
        };
      }
      byCategory[req.trainingCategory].requirements++;

      const reqRecords = records.filter(r => r.requirementId === req.id);
      byCategory[req.trainingCategory].completions += reqRecords.length;
      reqRecords.forEach(r => byCategory[req.trainingCategory].employees.add(r.employeeId));
    });

    const categoryStats = Object.entries(byCategory).map(([category, stats]: [string, any]) => ({
      category,
      requirements: stats.requirements,
      completions: stats.completions,
      employeesTrained: stats.employees.size,
      averageCompletionsPerRequirement: stats.completions / stats.requirements,
    }));

    const assessmentStats = {
      total: records.filter(r => r.assessmentScore !== null).length,
      passed: records.filter(r => r.assessmentPassed).length,
      failed: records.filter(r => r.assessmentScore !== null && !r.assessmentPassed).length,
      averageScore: records.filter(r => r.assessmentScore !== null)
        .reduce((sum, r) => sum + (r.assessmentScore || 0), 0) / 
        records.filter(r => r.assessmentScore !== null).length || 0,
    };

    const expiringCount = await prisma.trainingRecord.count({
      where: {
        organizationId: params.organizationId,
        certificationExpiry: {
          gte: new Date(),
          lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      summary: {
        totalRequirements,
        totalCompletions: totalRecords,
        uniqueEmployeesTrained: uniqueEmployees,
        averageCompletionsPerEmployee: totalRecords / uniqueEmployees || 0,
      },
      byCategory: categoryStats,
      assessments: assessmentStats,
      certifications: {
        issued: records.filter(r => r.certificationIssued).length,
        active: records.filter(r => 
          r.certificationExpiry && new Date(r.certificationExpiry) > new Date()
        ).length,
        expiringSoon: expiringCount,
      },
      effectiveness: {
        effective: records.filter(r => r.effectiveness === 'EFFECTIVE').length,
        needsImprovement: records.filter(r => r.effectiveness === 'NEEDS_IMPROVEMENT').length,
        notEffective: records.filter(r => r.effectiveness === 'NOT_EFFECTIVE').length,
      },
    };
  }

  /**
   * Schedule recurring training
   */
  static async scheduleTraining(params: {
    organizationId: string;
    requirementId: string;
    scheduledDate: Date;
    trainer?: string;
    location: string;
    maxAttendees?: number;
    notes?: string;
    createdBy: string;
  }) {
    const scheduleNumber = `TRN-SCH-${Date.now()}`;

    return await prisma.trainingSchedule.create({
      data: {
        scheduleNumber,
        organizationId: params.organizationId,
        requirementId: params.requirementId,
        scheduledDate: params.scheduledDate,
        trainer: params.trainer,
        location: params.location,
        maxAttendees: params.maxAttendees,
        currentAttendees: 0,
        status: 'SCHEDULED',
        notes: params.notes,
        createdBy: params.createdBy,
      },
    });
  }

  /**
   * Helper: Calculate due date for next training
   */
  private static calculateDueDate(
    latestRecord: any,
    requirement: any
  ): Date | null {
    if (!latestRecord) return new Date(); // Due now if never completed

    if (requirement.frequency === 'ONBOARDING') return null; // One-time only
    if (requirement.frequency === 'AS_NEEDED') return null; // No fixed schedule

    const lastCompletion = new Date(latestRecord.completionDate);
    const dueDate = new Date(lastCompletion);

    switch (requirement.frequency) {
      case 'ANNUAL':
        dueDate.setFullYear(dueDate.getFullYear() + 1);
        break;
      case 'BIANNUAL':
        dueDate.setMonth(dueDate.getMonth() + 6);
        break;
      case 'QUARTERLY':
        dueDate.setMonth(dueDate.getMonth() + 3);
        break;
      case 'MONTHLY':
        dueDate.setMonth(dueDate.getMonth() + 1);
        break;
    }

    return dueDate;
  }

  /**
   * Helper: Create expiry notification
   */
  private static async createExpiryNotification(recordId: string, daysUntilExpiry: number) {
    // This would integrate with your notification system
    console.log(`Training certification expiring in ${daysUntilExpiry} days for record ${recordId}`);
  }
}
