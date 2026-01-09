/**
 * Customer Complaints Service
 * External Customer Complaint Management System
 * ISO 9001:2015 Clause 9.1.2 - Customer Satisfaction
 * ISO 9001:2015 Clause 10.2 - Nonconformity and Corrective Action
 * ISO 13485:2016 Clause 8.2.2 - Complaint Handling
 * FDA 21 CFR Part 820.198 - Complaint Files
 */

import { prisma } from "@/lib/prisma";

export class CustomerComplaintService {
  /**
   * Register new complaint
   */
  static async registerComplaint(params: {
    organizationId: string;
    customerId: string;
    customerName: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone?: string;
    complaintDate: Date;
    receivedVia: string; // EMAIL, PHONE, WEBSITE, IN_PERSON, LETTER
    productId?: string;
    productName?: string;
    lotNumber?: string;
    serialNumber?: string;
    quantityAffected?: number;
    complaintDescription: string;
    severity: string; // MINOR, MODERATE, MAJOR, CRITICAL
    category: string; // QUALITY, DELIVERY, SERVICE, DOCUMENTATION, PACKAGING, OTHER
    reportedBy: string;
    attachments?: any;
  }) {
    const complaintNumber = `CC-${Date.now()}`;

    // Determine if reportable to authorities
    const isReportable = await this.assessReportability({
      severity: params.severity,
      category: params.category,
      description: params.complaintDescription,
    });

    return await prisma.customerComplaint.create({
      data: {
        complaintNumber,
        organizationId: params.organizationId,
        customerId: params.customerId,
        customerName: params.customerName,
        contactPerson: params.contactPerson,
        contactEmail: params.contactEmail,
        contactPhone: params.contactPhone,
        complaintDate: params.complaintDate,
        receivedDate: new Date(),
        receivedVia: params.receivedVia,
        productId: params.productId,
        productName: params.productName,
        lotNumber: params.lotNumber,
        serialNumber: params.serialNumber,
        quantityAffected: params.quantityAffected,
        complaintDescription: params.complaintDescription,
        severity: params.severity,
        category: params.category,
        status: "OPEN",
        isReportable,
        reportedBy: params.reportedBy,
        attachments: params.attachments,
        acknowledgementSent: false,
      },
    });
  }

  /**
   * Send acknowledgement to customer
   */
  static async sendAcknowledgement(params: {
    complaintId: string;
    acknowledgedBy: string;
    responseText: string;
    expectedResolutionDate?: Date;
  }) {
    const complaint = await prisma.customerComplaint.update({
      where: { id: params.complaintId },
      data: {
        acknowledgementSent: true,
        acknowledgementDate: new Date(),
        acknowledgedBy: params.acknowledgedBy,
        initialResponse: params.responseText,
        expectedResolutionDate: params.expectedResolutionDate,
      },
    });

    // Log communication
    await this.logCommunication({
      complaintId: params.complaintId,
      communicationType: "ACKNOWLEDGEMENT",
      content: params.responseText,
      sentBy: params.acknowledgedBy,
    });

    return complaint;
  }

  /**
   * Conduct investigation
   */
  static async conductInvestigation(params: {
    complaintId: string;
    investigatorId: string;
    investigationFindings: string;
    rootCause?: string;
    contributingFactors?: string[];
    evidenceCollected?: any;
    immediateActions?: string;
    requiresCAPA: boolean;
    capaId?: string;
    productReturnRequired: boolean;
    isValidComplaint: boolean;
  }) {
    const complaint = await prisma.customerComplaint.update({
      where: { id: params.complaintId },
      data: {
        status: "INVESTIGATION",
        investigatorId: params.investigatorId,
        investigationStartDate: new Date(),
        investigationFindings: params.investigationFindings,
        rootCause: params.rootCause,
        contributingFactors: params.contributingFactors || [],
        evidenceCollected: params.evidenceCollected,
        immediateActions: params.immediateActions,
        requiresCAPA: params.requiresCAPA,
        capaId: params.capaId,
        productReturnRequired: params.productReturnRequired,
        isValidComplaint: params.isValidComplaint,
      },
    });

    // If CAPA required, link to CAPA system
    if (params.requiresCAPA && params.capaId) {
      await this.linkToCAPA({
        complaintId: params.complaintId,
        capaId: params.capaId,
      });
    }

    return complaint;
  }

  /**
   * Provide resolution to customer
   */
  static async provideResolution(params: {
    complaintId: string;
    resolutionDescription: string;
    resolutionType: string; // REPLACEMENT, REFUND, CREDIT, REPAIR, APOLOGY, NO_ACTION
    compensationAmount?: number;
    resolutionDate: Date;
    resolvedBy: string;
    customerNotified: boolean;
    preventiveActions?: string;
  }) {
    const complaint = await prisma.customerComplaint.update({
      where: { id: params.complaintId },
      data: {
        status: "RESOLVED",
        resolutionDescription: params.resolutionDescription,
        resolutionType: params.resolutionType,
        compensationAmount: params.compensationAmount,
        resolutionDate: params.resolutionDate,
        resolvedBy: params.resolvedBy,
        customerNotified: params.customerNotified,
        preventiveActions: params.preventiveActions,
      },
    });

    // Log resolution communication
    if (params.customerNotified) {
      await this.logCommunication({
        complaintId: params.complaintId,
        communicationType: "RESOLUTION",
        content: params.resolutionDescription,
        sentBy: params.resolvedBy,
      });
    }

    return complaint;
  }

  /**
   * Close complaint with customer satisfaction survey
   */
  static async closeComplaint(params: {
    complaintId: string;
    closedBy: string;
    customerSatisfied?: boolean;
    customerFeedback?: string;
    closureNotes?: string;
  }) {
    return await prisma.customerComplaint.update({
      where: { id: params.complaintId },
      data: {
        status: "CLOSED",
        closedDate: new Date(),
        closedBy: params.closedBy,
        customerSatisfied: params.customerSatisfied,
        customerFeedback: params.customerFeedback,
        closureNotes: params.closureNotes,
      },
    });
  }

  /**
   * Log customer communication
   */
  static async logCommunication(params: {
    complaintId: string;
    communicationType: string; // ACKNOWLEDGEMENT, UPDATE, RESOLUTION, FOLLOW_UP
    content: string;
    sentBy: string;
    sentDate?: Date;
  }) {
    return await prisma.complaintCommunication.create({
      data: {
        complaintId: params.complaintId,
        communicationType: params.communicationType,
        content: params.content,
        sentBy: params.sentBy,
        sentDate: params.sentDate || new Date(),
      },
    });
  }

  /**
   * Get complaint statistics
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
      whereClause.receivedDate = {
        gte: params.startDate,
        ...(params.endDate && { lte: params.endDate }),
      };
    }

    const complaints = await prisma.customerComplaint.findMany({
      where: whereClause,
    });

    const byCategory: any = {};
    const bySeverity: any = {};
    const byStatus: any = {};

    complaints.forEach((complaint) => {
      byCategory[complaint.category] =
        (byCategory[complaint.category] || 0) + 1;
      bySeverity[complaint.severity] =
        (bySeverity[complaint.severity] || 0) + 1;
      byStatus[complaint.status] = (byStatus[complaint.status] || 0) + 1;
    });

    // Calculate response times
    const responseTimes = complaints
      .filter((c) => c.acknowledgementDate)
      .map((c) => {
        const hours = Math.floor(
          (new Date(c.acknowledgementDate!).getTime() -
            new Date(c.receivedDate).getTime()) /
            (1000 * 60 * 60),
        );
        return hours;
      });

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

    // Calculate resolution times
    const resolutionTimes = complaints
      .filter((c) => c.resolutionDate)
      .map((c) => {
        const days = Math.floor(
          (new Date(c.resolutionDate!).getTime() -
            new Date(c.receivedDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return days;
      });

    const avgResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, t) => sum + t, 0) /
          resolutionTimes.length
        : 0;

    const resolved = complaints.filter(
      (c) => c.status === "RESOLVED" || c.status === "CLOSED",
    );
    const satisfied = complaints.filter((c) => c.customerSatisfied === true);

    return {
      summary: {
        total: complaints.length,
        open: complaints.filter((c) => c.status === "OPEN").length,
        investigation: complaints.filter((c) => c.status === "INVESTIGATION")
          .length,
        resolved: resolved.length,
        closed: complaints.filter((c) => c.status === "CLOSED").length,
        validComplaints: complaints.filter((c) => c.isValidComplaint).length,
        reportable: complaints.filter((c) => c.isReportable).length,
      },
      byCategory,
      bySeverity,
      byStatus,
      timing: {
        averageResponseTimeHours: Math.round(avgResponseTime),
        averageResolutionTimeDays: Math.round(avgResolutionTime),
      },
      quality: {
        capaRequired: complaints.filter((c) => c.requiresCAPA).length,
        productReturns: complaints.filter((c) => c.productReturnRequired)
          .length,
        customerSatisfactionRate:
          (satisfied.length / resolved.length) * 100 || 0,
      },
      topProducts: this.getTopComplaintProducts(complaints),
      topCustomers: this.getTopComplaintCustomers(complaints),
    };
  }

  /**
   * Helper: Assess if complaint is reportable to regulatory authorities
   */
  private static async assessReportability(params: {
    severity: string;
    category: string;
    description: string;
  }): Promise<boolean> {
    // Simplified logic - in reality this would be more complex
    // and might involve regulatory rules engine

    // Critical severity always reportable
    if (params.severity === "CRITICAL") return true;

    // Major quality issues may be reportable
    if (params.severity === "MAJOR" && params.category === "QUALITY") {
      // Check for safety keywords
      const safetyKeywords = [
        "injury",
        "harm",
        "safety",
        "death",
        "hospitalization",
      ];
      const hasKeyword = safetyKeywords.some((keyword) =>
        params.description.toLowerCase().includes(keyword),
      );
      return hasKeyword;
    }

    return false;
  }

  /**
   * Helper: Link complaint to CAPA
   */
  private static async linkToCAPA(params: {
    complaintId: string;
    capaId: string;
  }) {
    // This would update CAPA record to reference the complaint
    // Implementation depends on your CAPA service structure
    return {
      complaintId: params.complaintId,
      capaId: params.capaId,
      linked: true,
    };
  }

  /**
   * Helper: Get top complaint products
   */
  private static getTopComplaintProducts(complaints: any[]): any[] {
    const productCounts: any = {};

    complaints.forEach((c) => {
      if (c.productName) {
        if (!productCounts[c.productName]) {
          productCounts[c.productName] = { name: c.productName, count: 0 };
        }
        productCounts[c.productName].count++;
      }
    });

    return Object.values(productCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Helper: Get top complaint customers
   */
  private static getTopComplaintCustomers(complaints: any[]): any[] {
    const customerCounts: any = {};

    complaints.forEach((c) => {
      if (!customerCounts[c.customerName]) {
        customerCounts[c.customerName] = { name: c.customerName, count: 0 };
      }
      customerCounts[c.customerName].count++;
    });

    return Object.values(customerCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
  }
}
