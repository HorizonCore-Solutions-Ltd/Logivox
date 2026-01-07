/**
 * Document Control Service
 * Implements ISO 9001:2015 Clause 7.5 (Documented Information)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DocumentMetrics {
  totalDocuments: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  dueForReview: number;
  obsolete: number;
  pendingApproval: number;
  trainingCompliance: {
    total: number;
    completed: number;
    pending: number;
    percentage: number;
  };
}

export class DocumentService {
  /**
   * Create new document
   */
  static async createDocument(data: {
    organizationId: string;
    title: string;
    type: string;
    description?: string;
    filePath: string;
    fileSize?: number;
    fileType?: string;
    owner: string;
    department?: string;
    trainingRequired?: boolean;
    createdBy: string;
  }) {
    const docNumber = `DOC-${data.type}-${Date.now()}`;

    const document = await prisma.document.create({
      data: {
        docNumber,
        organizationId: data.organizationId,
        title: data.title,
        type: data.type as any,
        description: data.description,
        filePath: data.filePath,
        fileSize: data.fileSize,
        fileType: data.fileType,
        owner: data.owner,
        department: data.department,
        status: 'DRAFT',
        trainingRequired: data.trainingRequired || false,
        createdBy: data.createdBy,
        version: '1.0'
      }
    });

    return document;
  }

  /**
   * Create new revision
   */
  static async createRevision(
    documentId: string,
    newVersion: string,
    changes: string,
    reason: string,
    changedBy: string,
    newFilePath: string
  ) {
    // Create revision record
    const revision = await prisma.documentRevision.create({
      data: {
        documentId,
        version: newVersion,
        changes,
        reason,
        changedBy,
        changeDate: new Date()
      }
    });

    // Update document
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        version: newVersion,
        filePath: newFilePath,
        status: 'DRAFT' // New revision goes to draft
      }
    });

    return { revision, document };
  }

  /**
   * Submit document for approval
   */
  static async submitForApproval(documentId: string) {
    return await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'PENDING_APPROVAL'
      }
    });
  }

  /**
   * Approve document
   */
  static async approveDocument(documentId: string, approvedBy: string) {
    const now = new Date();
    const nextReviewDate = new Date(now);
    nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1); // Review annually

    return await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedDate: now,
        effectiveDate: now,
        nextReviewDate
      }
    });
  }

  /**
   * Make document effective
   */
  static async makeEffective(documentId: string) {
    return await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'EFFECTIVE'
      }
    });
  }

  /**
   * Mark document as obsolete
   */
  static async makeObsolete(documentId: string, reason?: string) {
    return await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'OBSOLETE',
        obsoleteDate: new Date(),
        notes: reason
      }
    });
  }

  /**
   * Record training acknowledgment
   */
  static async recordTraining(data: {
    documentId: string;
    userId: string;
    userName: string;
    signature?: string;
    passed?: boolean;
    notes?: string;
  }) {
    return await prisma.trainingAcknowledgment.create({
      data: {
        documentId: data.documentId,
        userId: data.userId,
        userName: data.userName,
        trainedDate: new Date(),
        signature: data.signature,
        passed: data.passed !== undefined ? data.passed : true,
        notes: data.notes
      }
    });
  }

  /**
   * Get documents due for review
   */
  static async getDocumentsDueForReview(organizationId: string) {
    const now = new Date();

    return await prisma.document.findMany({
      where: {
        organizationId,
        nextReviewDate: {
          lte: now
        },
        status: {
          in: ['APPROVED', 'EFFECTIVE']
        }
      },
      orderBy: {
        nextReviewDate: 'asc'
      }
    });
  }

  /**
   * Get documents pending approval
   */
  static async getDocumentsPendingApproval(organizationId: string) {
    return await prisma.document.findMany({
      where: {
        organizationId,
        status: 'PENDING_APPROVAL'
      },
      include: {
        revisions: {
          orderBy: {
            changeDate: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'asc'
      }
    });
  }

  /**
   * Get document with full history
   */
  static async getDocumentWithHistory(documentId: string) {
    return await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        revisions: {
          orderBy: {
            changeDate: 'desc'
          }
        },
        trainingRecords: {
          orderBy: {
            trainedDate: 'desc'
          }
        }
      }
    });
  }

  /**
   * Get training compliance for document
   */
  static async getTrainingCompliance(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        trainingRecords: true
      }
    });

    if (!document || !document.trainingRequired) {
      return {
        required: false,
        totalUsers: 0,
        trained: 0,
        pending: 0,
        percentage: 100
      };
    }

    // Get all users who should be trained (simplified)
    const totalUsers = 50; // In real implementation, query users by department/role
    const trained = document.trainingRecords.filter(t => t.passed).length;
    const pending = Math.max(0, totalUsers - trained);
    const percentage = (trained / totalUsers) * 100;

    return {
      required: true,
      totalUsers,
      trained,
      pending,
      percentage: Math.round(percentage)
    };
  }

  /**
   * Get document metrics
   */
  static async getDocumentMetrics(organizationId: string): Promise<DocumentMetrics> {
    const documents = await prisma.document.findMany({
      where: { organizationId },
      include: {
        trainingRecords: true
      }
    });

    // Count by type
    const byType: Record<string, number> = {};
    documents.forEach(doc => {
      byType[doc.type] = (byType[doc.type] || 0) + 1;
    });

    // Count by status
    const byStatus: Record<string, number> = {};
    documents.forEach(doc => {
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
    });

    // Due for review
    const now = new Date();
    const dueForReview = documents.filter(d => 
      d.nextReviewDate && d.nextReviewDate <= now && 
      (d.status === 'APPROVED' || d.status === 'EFFECTIVE')
    ).length;

    // Obsolete
    const obsolete = documents.filter(d => d.status === 'OBSOLETE').length;

    // Pending approval
    const pendingApproval = documents.filter(d => d.status === 'PENDING_APPROVAL').length;

    // Training compliance (for documents requiring training)
    const trainingRequired = documents.filter(d => d.trainingRequired);
    const totalTrainingRecords = trainingRequired.reduce((sum, doc) => 
      sum + doc.trainingRecords.length, 0
    );
    const expectedTrainingRecords = trainingRequired.length * 50; // Assuming 50 users
    const trainingPercentage = expectedTrainingRecords > 0 
      ? (totalTrainingRecords / expectedTrainingRecords) * 100 
      : 100;

    return {
      totalDocuments: documents.length,
      byType,
      byStatus,
      dueForReview,
      obsolete,
      pendingApproval,
      trainingCompliance: {
        total: trainingRequired.length,
        completed: totalTrainingRecords,
        pending: Math.max(0, expectedTrainingRecords - totalTrainingRecords),
        percentage: Math.round(trainingPercentage)
      }
    };
  }

  /**
   * Search documents
   */
  static async searchDocuments(
    organizationId: string,
    query: string,
    type?: string,
    status?: string
  ) {
    const where: any = {
      organizationId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { docNumber: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (type) where.type = type;
    if (status) where.status = status;

    return await prisma.document.findMany({
      where,
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Link document to NCR
   */
  static async linkToNCR(documentId: string, ncrId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) throw new Error('Document not found');

    const linkedNCRIds = [...document.linkedNCRIds, ncrId];

    return await prisma.document.update({
      where: { id: documentId },
      data: { linkedNCRIds }
    });
  }

  /**
   * Link document to CAPA
   */
  static async linkToCAPA(documentId: string, capaId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) throw new Error('Document not found');

    const linkedCAPAIds = [...document.linkedCAPAIds, capaId];

    return await prisma.document.update({
      where: { id: documentId },
      data: { linkedCAPAIds }
    });
  }

  /**
   * Link document to Risk
   */
  static async linkToRisk(documentId: string, riskId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) throw new Error('Document not found');

    const linkedRiskIds = [...document.linkedRiskIds, riskId];

    return await prisma.document.update({
      where: { id: documentId },
      data: { linkedRiskIds }
    });
  }
}

export default DocumentService;
