/**
 * Change Control Service
 * Engineering Change Orders (ECO) / Engineering Change Notices (ECN)
 * ISO 9001:2015 Clause 8.5.6 - Control of Changes
 * ISO 13485:2016 Clause 7.3.9 - Design and Development Changes
 */

import { prisma } from '@/lib/prisma';

export class ChangeControlService {
  /**
   * Create change request
   */
  static async createChangeRequest(params: {
    organizationId: string;
    changeType: string; // DESIGN, PROCESS, SPECIFICATION, DOCUMENT, MATERIAL, SUPPLIER
    title: string;
    description: string;
    reasonForChange: string;
    urgency: string; // LOW, MEDIUM, HIGH, CRITICAL
    requestedBy: string;
    department?: string;
    affectedProducts?: string[];
    affectedDocuments?: string[];
    estimatedCost?: number;
    estimatedImplementationTime?: number; // Days
    customerImpact: boolean;
    regulatoryImpact: boolean;
    validationRequired: boolean;
    attachments?: any;
  }) {
    const changeNumber = `ECO-${Date.now()}`;

    return await prisma.changeControl.create({
      data: {
        changeNumber,
        organizationId: params.organizationId,
        changeType: params.changeType,
        title: params.title,
        description: params.description,
        reasonForChange: params.reasonForChange,
        urgency: params.urgency,
        requestedBy: params.requestedBy,
        requestDate: new Date(),
        department: params.department,
        affectedProducts: params.affectedProducts || [],
        affectedDocuments: params.affectedDocuments || [],
        estimatedCost: params.estimatedCost,
        estimatedImplementationTime: params.estimatedImplementationTime,
        customerImpact: params.customerImpact,
        regulatoryImpact: params.regulatoryImpact,
        validationRequired: params.validationRequired,
        status: 'DRAFT',
        approvalStatus: 'PENDING',
        attachments: params.attachments,
        createdBy: params.requestedBy,
      },
    });
  }

  /**
   * Submit for approval
   */
  static async submitForApproval(params: {
    changeId: string;
    impactAssessment: {
      technicalImpact: string;
      qualityImpact: string;
      costImpact: string;
      scheduleImpact: string;
      riskLevel: string;
    };
    proposedImplementationPlan: string;
    requiredApprovers: string[];
  }) {
    const change = await prisma.changeControl.update({
      where: { id: params.changeId },
      data: {
        status: 'SUBMITTED',
        submittedDate: new Date(),
        impactAssessment: params.impactAssessment,
        proposedImplementationPlan: params.proposedImplementationPlan,
        requiredApprovers: params.requiredApprovers,
      },
    });

    // Create approval tasks for each approver
    for (const approver of params.requiredApprovers) {
      await prisma.changeApproval.create({
        data: {
          changeControlId: params.changeId,
          approverRole: approver,
          approvalLevel: this.getApprovalLevel(approver),
          status: 'PENDING',
          requestedDate: new Date(),
        },
      });
    }

    return change;
  }

  /**
   * Record approval decision
   */
  static async recordApproval(params: {
    approvalId: string;
    approvedBy: string;
    approved: boolean;
    comments?: string;
    conditions?: string[];
  }) {
    const approval = await prisma.changeApproval.update({
      where: { id: params.approvalId },
      data: {
        status: params.approved ? 'APPROVED' : 'REJECTED',
        approvedBy: params.approvedBy,
        approvalDate: new Date(),
        comments: params.comments,
        conditions: params.conditions || [],
      },
      include: {
        changeControl: {
          include: {
            approvals: true,
          },
        },
      },
    });

    // Check if all approvals are complete
    const allApprovals = approval.changeControl.approvals;
    const allApproved = allApprovals.every(a => a.status === 'APPROVED');
    const anyRejected = allApprovals.some(a => a.status === 'REJECTED');

    if (anyRejected) {
      await prisma.changeControl.update({
        where: { id: approval.changeControlId },
        data: {
          status: 'REJECTED',
          approvalStatus: 'REJECTED',
        },
      });
    } else if (allApproved) {
      await prisma.changeControl.update({
        where: { id: approval.changeControlId },
        data: {
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          approvedDate: new Date(),
        },
      });
    }

    return approval;
  }

  /**
   * Implement change
   */
  static async implementChange(params: {
    changeId: string;
    implementationDate: Date;
    implementedBy: string;
    actualCost?: number;
    actualDuration?: number;
    verificationResults?: string;
    deviationsFromPlan?: string;
    lessonsLearned?: string;
  }) {
    const change = await prisma.changeControl.findUnique({
      where: { id: params.changeId },
    });

    if (change?.status !== 'APPROVED') {
      throw new Error('Change must be approved before implementation');
    }

    return await prisma.changeControl.update({
      where: { id: params.changeId },
      data: {
        status: 'IMPLEMENTED',
        implementationDate: params.implementationDate,
        implementedBy: params.implementedBy,
        actualCost: params.actualCost,
        actualDuration: params.actualDuration,
        verificationResults: params.verificationResults,
        deviationsFromPlan: params.deviationsFromPlan,
        lessonsLearned: params.lessonsLearned,
      },
    });
  }

  /**
   * Close change with effectiveness review
   */
  static async closeChange(params: {
    changeId: string;
    effectivenessReview: string;
    objectivesMet: boolean;
    reviewedBy: string;
    closureNotes?: string;
  }) {
    return await prisma.changeControl.update({
      where: { id: params.changeId },
      data: {
        status: 'CLOSED',
        closedDate: new Date(),
        effectivenessReview: params.effectivenessReview,
        objectivesMet: params.objectivesMet,
        reviewedBy: params.reviewedBy,
        closureNotes: params.closureNotes,
      },
    });
  }

  /**
   * Get change statistics
   */
  static async getStatistics(params: {
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const whereClause: any = {
      organizationId: params.organizationId,
    };

    if (params.startDate) {
      whereClause.requestDate = {
        gte: params.startDate,
        ...(params.endDate && { lte: params.endDate }),
      };
    }

    const changes = await prisma.changeControl.findMany({
      where: whereClause,
      include: {
        approvals: true,
      },
    });

    const byType: any = {};
    const byStatus: any = {};
    
    changes.forEach(change => {
      byType[change.changeType] = (byType[change.changeType] || 0) + 1;
      byStatus[change.status] = (byStatus[change.status] || 0) + 1;
    });

    const approved = changes.filter(c => c.status === 'APPROVED' || c.status === 'IMPLEMENTED' || c.status === 'CLOSED');
    const rejected = changes.filter(c => c.status === 'REJECTED');

    // Calculate approval cycle time
    const approvalTimes = approved
      .filter(c => c.approvedDate && c.submittedDate)
      .map(c => {
        const days = Math.floor(
          (new Date(c.approvedDate!).getTime() - new Date(c.submittedDate!).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        return days;
      });

    const avgApprovalTime = approvalTimes.length > 0
      ? approvalTimes.reduce((sum, t) => sum + t, 0) / approvalTimes.length
      : 0;

    // Calculate implementation time
    const implementationTimes = changes
      .filter(c => c.implementationDate && c.approvedDate)
      .map(c => {
        const days = Math.floor(
          (new Date(c.implementationDate!).getTime() - new Date(c.approvedDate!).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        return days;
      });

    const avgImplementationTime = implementationTimes.length > 0
      ? implementationTimes.reduce((sum, t) => sum + t, 0) / implementationTimes.length
      : 0;

    return {
      summary: {
        total: changes.length,
        approved: approved.length,
        rejected: rejected.length,
        pending: changes.filter(c => c.status === 'SUBMITTED' || c.status === 'DRAFT').length,
        implemented: changes.filter(c => c.status === 'IMPLEMENTED').length,
        closed: changes.filter(c => c.status === 'CLOSED').length,
        approvalRate: (approved.length / changes.length) * 100 || 0,
      },
      byType,
      byStatus,
      timing: {
        averageApprovalTime: Math.round(avgApprovalTime),
        averageImplementationTime: Math.round(avgImplementationTime),
      },
      impact: {
        withCustomerImpact: changes.filter(c => c.customerImpact).length,
        withRegulatoryImpact: changes.filter(c => c.regulatoryImpact).length,
        requiresValidation: changes.filter(c => c.validationRequired).length,
      },
      effectiveness: {
        objectivesMet: changes.filter(c => c.objectivesMet).length,
        objectivesNotMet: changes.filter(c => c.objectivesMet === false).length,
      },
    };
  }

  /**
   * Helper: Get approval level by role
   */
  private static getApprovalLevel(role: string): number {
    const levels: any = {
      'QUALITY_MANAGER': 1,
      'ENGINEERING_MANAGER': 1,
      'OPERATIONS_MANAGER': 2,
      'REGULATORY_AFFAIRS': 2,
      'GENERAL_MANAGER': 3,
    };
    return levels[role] || 1;
  }
}
