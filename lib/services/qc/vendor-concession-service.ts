/**
 * Vendor Concession Service
 * Manage negotiated concessions and credits from vendors
 * (Alternative resolution to RTVs, chargebacks, or debit memos)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ConcessionType =
  | 'PRICE_DISCOUNT'
  | 'CREDIT_ALLOWANCE'
  | 'FREE_GOODS'
  | 'EXTENDED_TERMS'
  | 'PROMOTIONAL_ALLOWANCE';

export type RelatedIssue = 'RTV' | 'QUALITY_ISSUE' | 'DELIVERY_DELAY' | 'OTHER';

export class VendorConcessionService {
  
  /**
   * Create vendor concession
   */
  async createConcession(params: {
    organizationId: string;
    vendorId: string;
    concessionType: ConcessionType;
    relatedIssue: RelatedIssue;
    rtvId?: string;
    chargebackId?: string;
    debitMemoId?: string;
    originalClaimAmount: number;
    concessionValue: number;
    concessionDescription: string;
    applicableOrders?: number;
    expiresAt?: Date;
    minimumOrderValue?: number;
    termsAndConditions?: string;
    createdBy: string;
  }) {
    
    // Generate concession number
    const concessionNumber = await this.generateConcessionNumber(params.organizationId);
    
    // Create concession
    const concession = await prisma.vendorConcession.create({
      data: {
        concessionNumber,
        organizationId: params.organizationId,
        vendorId: params.vendorId,
        concessionType: params.concessionType,
        relatedIssue: params.relatedIssue,
        rtvId: params.rtvId,
        chargebackId: params.chargebackId,
        debitMemoId: params.debitMemoId,
        originalClaimAmount: params.originalClaimAmount,
        concessionValue: params.concessionValue,
        concessionDescription: params.concessionDescription,
        applicableOrders: params.applicableOrders,
        expiresAt: params.expiresAt,
        minimumOrderValue: params.minimumOrderValue,
        termsAndConditions: params.termsAndConditions,
        remainingValue: params.concessionValue,
        createdBy: params.createdBy,
      },
      include: {
        vendor: true,
      },
    });
    
    return concession;
  }
  
  /**
   * Approve concession
   */
  async approveConcession(params: {
    concessionId: string;
    approvedBy: string;
  }) {
    return await prisma.vendorConcession.update({
      where: { id: params.concessionId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: params.approvedBy,
      },
    });
  }
  
  /**
   * Activate concession (ready for use)
   */
  async activateConcession(concessionId: string) {
    return await prisma.vendorConcession.update({
      where: { id: concessionId },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    });
  }
  
  /**
   * Apply concession to order
   */
  async applyConcession(params: {
    concessionId: string;
    orderId: string;
    appliedAmount: number;
  }) {
    const concession = await prisma.vendorConcession.findUnique({
      where: { id: params.concessionId },
    });
    
    if (!concession) {
      throw new Error('Concession not found');
    }
    
    if (concession.status !== 'ACTIVE') {
      throw new Error('Concession is not active');
    }
    
    if (Number(concession.remainingValue) < params.appliedAmount) {
      throw new Error('Applied amount exceeds remaining concession value');
    }
    
    if (concession.expiresAt && new Date() > concession.expiresAt) {
      throw new Error('Concession has expired');
    }
    
    // Update concession utilization
    const newUtilizationAmount = Number(concession.utilizationAmount) + params.appliedAmount;
    const newRemainingValue = Number(concession.concessionValue) - newUtilizationAmount;
    const newUtilizationCount = concession.utilizationCount + 1;
    
    const updateData: any = {
      utilizationAmount: newUtilizationAmount,
      utilizationCount: newUtilizationCount,
      remainingValue: newRemainingValue,
    };
    
    // Check if fully utilized
    if (newRemainingValue <= 0) {
      updateData.status = 'UTILIZED';
      updateData.fullyUtilizedAt = new Date();
    }
    
    await prisma.vendorConcession.update({
      where: { id: params.concessionId },
      data: updateData,
    });
    
    return {
      success: true,
      remainingValue: newRemainingValue,
      fullyUtilized: newRemainingValue <= 0,
    };
  }
  
  /**
   * Vendor accepts concession terms
   */
  async vendorAcceptance(concessionId: string) {
    return await prisma.vendorConcession.update({
      where: { id: concessionId },
      data: {
        vendorAcceptedAt: new Date(),
      },
    });
  }
  
  /**
   * Cancel concession
   */
  async cancelConcession(params: {
    concessionId: string;
    reason: string;
  }) {
    return await prisma.vendorConcession.update({
      where: { id: params.concessionId },
      data: {
        status: 'CANCELLED',
        notes: params.reason,
      },
    });
  }
  
  /**
   * List concessions
   */
  async listConcessions(params: {
    organizationId: string;
    vendorId?: string;
    status?: string;
    concessionType?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {
      organizationId: params.organizationId,
    };
    
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.status) where.status = params.status;
    if (params.concessionType) where.concessionType = params.concessionType;
    
    const [concessions, total] = await Promise.all([
      prisma.vendorConcession.findMany({
        where,
        include: {
          vendor: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      prisma.vendorConcession.count({ where }),
    ]);
    
    return {
      concessions,
      total,
      hasMore: (params.skip || 0) + concessions.length < total,
    };
  }
  
  /**
   * Get concession details
   */
  async getConcession(concessionId: string) {
    return await prisma.vendorConcession.findUnique({
      where: { id: concessionId },
      include: {
        vendor: true,
      },
    });
  }
  
  /**
   * Get active concessions for vendor
   */
  async getActiveConcessions(params: {
    organizationId: string;
    vendorId: string;
  }) {
    return await prisma.vendorConcession.findMany({
      where: {
        organizationId: params.organizationId,
        vendorId: params.vendorId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  /**
   * Get concession statistics
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
    
    const concessions = await prisma.vendorConcession.findMany({
      where,
      select: {
        concessionValue: true,
        utilizationAmount: true,
        remainingValue: true,
        status: true,
        concessionType: true,
      },
    });
    
    const totalConcessionValue = concessions.reduce((sum: number, c: any) => sum + Number(c.concessionValue), 0);
    const totalUtilizedAmount = concessions.reduce((sum: number, c: any) => sum + Number(c.utilizationAmount), 0);
    const totalRemainingValue = concessions.reduce((sum: number, c: any) => sum + Number(c.remainingValue), 0);
    
    const byType = concessions.reduce((acc: Record<string, number>, c: any) => {
      acc[c.concessionType] = (acc[c.concessionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byStatus = concessions.reduce((acc: Record<string, number>, c: any) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalCount: concessions.length,
      totalConcessionValue,
      totalUtilizedAmount,
      totalRemainingValue,
      utilizationRate: totalConcessionValue > 0 ? (totalUtilizedAmount / totalConcessionValue) * 100 : 0,
      activeCount: concessions.filter((c: any) => c.status === 'ACTIVE').length,
      byType,
      byStatus,
    };
  }
  
  /**
   * Check for expiring concessions
   */
  async getExpiringConcessions(params: {
    organizationId: string;
    daysAhead?: number;
  }) {
    const daysAhead = params.daysAhead || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);
    
    return await prisma.vendorConcession.findMany({
      where: {
        organizationId: params.organizationId,
        status: 'ACTIVE',
        expiresAt: {
          lte: expiryDate,
          gt: new Date(),
        },
      },
      include: {
        vendor: true,
      },
      orderBy: { expiresAt: 'asc' },
    });
  }
  
  // ===== PRIVATE HELPER METHODS =====
  
  private async generateConcessionNumber(organizationId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Count existing concessions this month
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0);
    
    const count = await prisma.vendorConcession.count({
      where: {
        organizationId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
    
    const sequence = String(count + 1).padStart(4, '0');
    return `CON-${year}${month}-${sequence}`;
  }
}

export const vendorConcessionService = new VendorConcessionService();
export default vendorConcessionService;
