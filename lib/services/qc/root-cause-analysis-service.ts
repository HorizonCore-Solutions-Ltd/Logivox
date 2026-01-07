/**
 * Root Cause Analysis Service
 * Systematic investigation of quality failures with 5 Whys methodology
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type IssueType = 'QUALITY_DEFECT' | 'DELIVERY_DELAY' | 'COMPLIANCE_VIOLATION' | 'PROCESS_FAILURE';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RootCauseCategory = 'SUPPLIER_PROCESS' | 'MATERIAL_DEFECT' | 'TRANSPORTATION' | 'COMMUNICATION' | 'DESIGN' | 'OTHER';

export interface FiveWhysAnalysis {
  problem: string;
  why1: { question: string; answer: string };
  why2: { question: string; answer: string };
  why3: { question: string; answer: string };
  why4: { question: string; answer: string };
  why5: { question: string; answer: string };
  rootCause: string;
}

export class RootCauseAnalysisService {
  
  /**
   * Create RCA
   */
  async createRCA(params: {
    organizationId: string;
    vendorId?: string;
    issueTitle: string;
    issueDescription: string;
    issueType: IssueType;
    severity: Severity;
    affectedProducts: { sku: string; name: string; quantity: number }[];
    affectedOrders: string[];
    relatedRTVs?: string[];
    quantityAffected: number;
    financialImpact: number;
    customerImpact?: string;
    responsibleParty: string;
    targetCompletionDate: Date;
    createdBy: string;
  }) {
    
    const rcaNumber = await this.generateRCANumber(params.organizationId);
    
    const rca = await prisma.rootCauseAnalysis.create({
      data: {
        rcaNumber,
        organizationId: params.organizationId,
        vendorId: params.vendorId,
        issueTitle: params.issueTitle,
        issueDescription: params.issueDescription,
        issueType: params.issueType,
        severity: params.severity,
        affectedProducts: params.affectedProducts as any,
        affectedOrders: params.affectedOrders as any,
        relatedRTVs: params.relatedRTVs || [],
        quantityAffected: params.quantityAffected,
        financialImpact: params.financialImpact,
        customerImpact: params.customerImpact,
        fiveWhys: {} as any,
        rootCause: '',
        rootCauseCategory: 'OTHER',
        immediateActions: [] as any,
        correctiveActions: [] as any,
        preventiveActions: [] as any,
        responsibleParty: params.responsibleParty,
        targetCompletionDate: params.targetCompletionDate,
        createdBy: params.createdBy,
      },
      include: {
        vendor: true,
      },
    });
    
    return rca;
  }
  
  /**
   * Add 5 Whys analysis
   */
  async addFiveWhys(params: {
    rcaId: string;
    fiveWhys: FiveWhysAnalysis;
  }) {
    return await prisma.rootCauseAnalysis.update({
      where: { id: params.rcaId },
      data: {
        fiveWhys: params.fiveWhys as any,
        rootCause: params.fiveWhys.rootCause,
      },
    });
  }
  
  /**
   * Set root cause category
   */
  async setRootCauseCategory(params: {
    rcaId: string;
    category: RootCauseCategory;
  }) {
    return await prisma.rootCauseAnalysis.update({
      where: { id: params.rcaId },
      data: {
        rootCauseCategory: params.category,
      },
    });
  }
  
  /**
   * Add immediate actions
   */
  async addImmediateActions(params: {
    rcaId: string;
    actions: { action: string; implementedBy: string; implementedAt: Date }[];
  }) {
    return await prisma.rootCauseAnalysis.update({
      where: { id: params.rcaId },
      data: {
        immediateActions: params.actions as any,
      },
    });
  }
  
  /**
   * Add corrective actions
   */
  async addCorrectiveActions(params: {
    rcaId: string;
    actions: {
      action: string;
      responsible: string;
      dueDate: Date;
      status: string;
      completedAt?: Date;
    }[];
  }) {
    return await prisma.rootCauseAnalysis.update({
      where: { id: params.rcaId },
      data: {
        correctiveActions: params.actions as any,
      },
    });
  }
  
  /**
   * Add preventive actions
   */
  async addPreventiveActions(params: {
    rcaId: string;
    actions: {
      action: string;
      responsible: string;
      dueDate: Date;
      status: string;
      completedAt?: Date;
    }[];
  }) {
    return await prisma.rootCauseAnalysis.update({
      where: { id: params.rcaId },
      data: {
        preventiveActions: params.actions as any,
        status: 'ACTIONS_IMPLEMENTED',
      },
    });
  }
  
  /**
   * Verify effectiveness
   */
  async verifyEffectiveness(params: {
    rcaId: string;
    verificationMethod: string;
    passed: boolean;
    effectivenessScore: number;
    notes?: string;
  }) {
    const updateData: any = {
      verificationRequired: true,
      verificationMethod: params.verificationMethod,
      verificationDate: new Date(),
      verificationPassed: params.passed,
      effectivenessScore: params.effectivenessScore,
    };
    
    if (params.passed && params.effectivenessScore >= 80) {
      updateData.status = 'VERIFIED';
    }
    
    if (params.notes) {
      updateData.notes = params.notes;
    }
    
    return await prisma.rootCauseAnalysis.update({
      where: { id: params.rcaId },
      data: updateData,
    });
  }
  
  /**
   * Close RCA
   */
  async closeRCA(params: {
    rcaId: string;
    closureNotes?: string;
  }) {
    return await prisma.rootCauseAnalysis.update({
      where: { id: params.rcaId },
      data: {
        status: 'CLOSED',
        updatedAt: new Date(),
        notes: params.closureNotes,
      },
    });
  }
  
  /**
   * List RCAs
   */
  async listRCAs(params: {
    organizationId: string;
    vendorId?: string;
    status?: string;
    severity?: Severity;
    issueType?: IssueType;
    skip?: number;
    take?: number;
  }) {
    const where: any = {
      organizationId: params.organizationId,
    };
    
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.status) where.status = params.status;
    if (params.severity) where.severity = params.severity;
    if (params.issueType) where.issueType = params.issueType;
    
    const [rcas, total] = await Promise.all([
      prisma.rootCauseAnalysis.findMany({
        where,
        include: {
          vendor: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      prisma.rootCauseAnalysis.count({ where }),
    ]);
    
    return {
      rcas,
      total,
      hasMore: (params.skip || 0) + rcas.length < total,
    };
  }
  
  /**
   * Get RCA statistics
   */
  async getStatistics(params: {
    organizationId: string;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      organizationId: params.organizationId,
    };
    
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }
    
    const rcas = await prisma.rootCauseAnalysis.findMany({
      where,
      select: {
        financialImpact: true,
        quantityAffected: true,
        severity: true,
        issueType: true,
        rootCauseCategory: true,
        status: true,
        verificationPassed: true,
        effectivenessScore: true,
      },
    });
    
    const totalFinancialImpact = rcas.reduce((sum: number, r: any) => sum + Number(r.financialImpact), 0);
    const totalQuantityAffected = rcas.reduce((sum: number, r: any) => sum + r.quantityAffected, 0);
    
    const bySeverity = rcas.reduce((acc: Record<string, number>, r: any) => {
      acc[r.severity] = (acc[r.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byIssueType = rcas.reduce((acc: Record<string, number>, r: any) => {
      acc[r.issueType] = (acc[r.issueType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byRootCause = rcas.reduce((acc: Record<string, number>, r: any) => {
      acc[r.rootCauseCategory] = (acc[r.rootCauseCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const avgEffectiveness = rcas.filter((r: any) => r.effectivenessScore !== null).length > 0
      ? rcas.reduce((sum: number, r: any) => sum + (r.effectivenessScore || 0), 0) / rcas.filter((r: any) => r.effectivenessScore !== null).length
      : 0;
    
    return {
      totalCount: rcas.length,
      totalFinancialImpact,
      totalQuantityAffected,
      openCount: rcas.filter((r: any) => r.status === 'IN_PROGRESS').length,
      closedCount: rcas.filter((r: any) => r.status === 'CLOSED').length,
      verificationPassRate: rcas.filter((r: any) => r.verificationPassed).length / Math.max(rcas.filter((r: any) => r.verificationPassed !== null).length, 1) * 100,
      avgEffectiveness: Math.round(avgEffectiveness),
      bySeverity,
      byIssueType,
      byRootCause,
    };
  }
  
  // ===== PRIVATE HELPER METHODS =====
  
  private async generateRCANumber(organizationId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const count = await prisma.rootCauseAnalysis.count({
      where: { organizationId },
    });
    
    const sequence = String(count + 1).padStart(4, '0');
    return `RCA-${year}${month}-${sequence}`;
  }
}

export const rootCauseAnalysisService = new RootCauseAnalysisService();
export default rootCauseAnalysisService;
