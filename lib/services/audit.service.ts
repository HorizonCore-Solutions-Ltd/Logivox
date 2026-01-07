/**
 * Audit Management Service
 * Implements ISO 9001:2015, ISO 13485, AS9100 audit requirements
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditSchedule {
  auditType: string;
  requiredFrequency: string; // 'ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY'
  lastAuditDate?: Date;
  nextAuditDate: Date;
  overdue: boolean;
}

export interface AuditMetrics {
  totalAudits: number;
  plannedAudits: number;
  completedAudits: number;
  overdueAudits: number;
  totalFindings: number;
  criticalFindings: number;
  majorFindings: number;
  minorFindings: number;
  openFindings: number;
  closedFindings: number;
  averageFindingsPerAudit: number;
}

export class AuditService {
  /**
   * Create new audit
   */
  static async createAudit(data: {
    organizationId: string;
    type: string;
    scope: string;
    standard?: string;
    auditDate: Date;
    location?: string;
    auditorName: string;
    auditorId?: string;
    auditorOrg?: string;
    auditeeName?: string;
    auditeeId?: string;
    supplierId?: string;
    createdBy: string;
  }) {
    const auditNumber = `AUDIT-${data.type}-${Date.now()}`;

    const audit = await prisma.audit.create({
      data: {
        auditNumber,
        organizationId: data.organizationId,
        type: data.type as any,
        scope: data.scope,
        standard: data.standard,
        auditDate: data.auditDate,
        location: data.location,
        auditorName: data.auditorName,
        auditorId: data.auditorId,
        auditorOrg: data.auditorOrg,
        auditeeName: data.auditeeName,
        auditeeId: data.auditeeId,
        supplierId: data.supplierId,
        status: 'PLANNED',
        createdBy: data.createdBy
      },
      include: {
        supplier: true,
        findings: true
      }
    });

    return audit;
  }

  /**
   * Add audit finding
   */
  static async addFinding(data: {
    auditId: string;
    severity: string;
    clause?: string;
    category?: string;
    description: string;
    evidence?: any;
    requirement?: string;
    responsiblePerson?: string;
    dueDate?: Date;
  }) {
    const audit = await prisma.audit.findUnique({
      where: { id: data.auditId },
      include: { findings: true }
    });

    if (!audit) throw new Error('Audit not found');

    const findingNumber = `${audit.auditNumber}-F${(audit.findings.length + 1).toString().padStart(3, '0')}`;

    const finding = await prisma.auditFinding.create({
      data: {
        auditId: data.auditId,
        findingNumber,
        severity: data.severity as any,
        clause: data.clause,
        category: data.category,
        description: data.description,
        evidence: data.evidence,
        requirement: data.requirement,
        status: 'OPEN',
        responsiblePerson: data.responsiblePerson,
        dueDate: data.dueDate
      }
    });

    return finding;
  }

  /**
   * Link finding to NCR
   */
  static async linkFindingToNCR(findingId: string, ncrId: string) {
    return await prisma.auditFinding.update({
      where: { id: findingId },
      data: { ncrId }
    });
  }

  /**
   * Link finding to CAPA
   */
  static async linkFindingToCAPA(findingId: string, capaId: string) {
    return await prisma.auditFinding.update({
      where: { id: findingId },
      data: { capaId }
    });
  }

  /**
   * Close audit finding
   */
  static async closeFinding(findingId: string, closureNotes: string) {
    return await prisma.auditFinding.update({
      where: { id: findingId },
      data: {
        status: 'CLOSED',
        closedDate: new Date(),
        closureNotes
      }
    });
  }

  /**
   * Update audit status
   */
  static async updateAuditStatus(auditId: string, status: string, summary?: string, recommendations?: string) {
    return await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: status as any,
        summary,
        recommendations
      }
    });
  }

  /**
   * Get audit schedule (overdue audits)
   */
  static async getAuditSchedule(organizationId: string): Promise<AuditSchedule[]> {
    const audits = await prisma.audit.findMany({
      where: { organizationId },
      orderBy: { auditDate: 'desc' }
    });

    // Group by type and calculate next audit dates
    const auditTypes = ['INTERNAL', 'SUPPLIER', 'CUSTOMER', 'REGULATORY', 'CERTIFICATION'];
    const schedule: AuditSchedule[] = [];

    for (const type of auditTypes) {
      const typeAudits = audits.filter(a => a.type === type);
      const lastAudit = typeAudits[0];

      let requiredFrequency = 'ANNUAL';
      let monthsToAdd = 12;

      // Determine frequency based on type
      if (type === 'INTERNAL') {
        requiredFrequency = 'SEMI_ANNUAL';
        monthsToAdd = 6;
      } else if (type === 'SUPPLIER') {
        requiredFrequency = 'ANNUAL';
        monthsToAdd = 12;
      }

      const lastAuditDate = lastAudit?.auditDate;
      const nextAuditDate = lastAuditDate 
        ? new Date(new Date(lastAuditDate).setMonth(new Date(lastAuditDate).getMonth() + monthsToAdd))
        : new Date(); // If no audit yet, due now

      const overdue = nextAuditDate < new Date();

      schedule.push({
        auditType: type,
        requiredFrequency,
        lastAuditDate,
        nextAuditDate,
        overdue
      });
    }

    return schedule;
  }

  /**
   * Get overdue audits
   */
  static async getOverdueAudits(organizationId: string) {
    const schedule = await this.getAuditSchedule(organizationId);
    return schedule.filter(s => s.overdue);
  }

  /**
   * Get audit metrics
   */
  static async getAuditMetrics(organizationId: string, startDate?: Date, endDate?: Date): Promise<AuditMetrics> {
    const where: any = { organizationId };
    
    if (startDate || endDate) {
      where.auditDate = {};
      if (startDate) where.auditDate.gte = startDate;
      if (endDate) where.auditDate.lte = endDate;
    }

    const audits = await prisma.audit.findMany({
      where,
      include: {
        findings: true
      }
    });

    const findings = await prisma.auditFinding.findMany({
      where: {
        audit: where
      }
    });

    const totalAudits = audits.length;
    const plannedAudits = audits.filter(a => a.status === 'PLANNED').length;
    const completedAudits = audits.filter(a => a.status === 'COMPLETED' || a.status === 'CLOSED').length;

    // Check overdue planned audits
    const overdueAudits = audits.filter(a => 
      a.status === 'PLANNED' && a.auditDate < new Date()
    ).length;

    const totalFindings = findings.length;
    const criticalFindings = 0; // No CRITICAL in FindingSeverity enum - only MAJOR, MINOR, OBSERVATION
    const majorFindings = findings.filter(f => f.severity === 'MAJOR').length;
    const minorFindings = findings.filter(f => f.severity === 'MINOR').length;
    const openFindings = findings.filter(f => f.status === 'OPEN').length;
    const closedFindings = findings.filter(f => f.status === 'CLOSED').length;

    const averageFindingsPerAudit = totalAudits > 0 ? totalFindings / totalAudits : 0;

    return {
      totalAudits,
      plannedAudits,
      completedAudits,
      overdueAudits,
      totalFindings,
      criticalFindings,
      majorFindings,
      minorFindings,
      openFindings,
      closedFindings,
      averageFindingsPerAudit: Math.round(averageFindingsPerAudit * 10) / 10
    };
  }

  /**
   * Get audits by supplier
   */
  static async getSupplierAudits(supplierId: string) {
    return await prisma.audit.findMany({
      where: { supplierId },
      include: {
        findings: true,
        supplier: true
      },
      orderBy: {
        auditDate: 'desc'
      }
    });
  }

  /**
   * Get open findings
   */
  static async getOpenFindings(organizationId: string) {
    const audits = await prisma.audit.findMany({
      where: { organizationId },
      include: {
        findings: {
          where: {
            status: 'OPEN'
          }
        }
      }
    });

    return audits.flatMap(audit => 
      audit.findings.map(finding => ({
        ...finding,
        auditNumber: audit.auditNumber,
        auditType: audit.type
      }))
    );
  }

  /**
   * Get overdue findings
   */
  static async getOverdueFindings(organizationId: string) {
    const now = new Date();
    
    const audits = await prisma.audit.findMany({
      where: { organizationId },
      include: {
        findings: {
          where: {
            status: 'OPEN',
            dueDate: {
              lt: now
            }
          }
        }
      }
    });

    return audits.flatMap(audit => 
      audit.findings.map(finding => ({
        ...finding,
        auditNumber: audit.auditNumber,
        auditType: audit.type,
        daysOverdue: Math.floor((now.getTime() - (finding.dueDate?.getTime() || 0)) / (1000 * 60 * 60 * 24))
      }))
    );
  }

  /**
   * Generate audit checklist based on standard
   */
  static getAuditChecklist(standard: string): Array<{
    clause: string;
    requirement: string;
    category: string;
  }> {
    // ISO 9001:2015 checklist
    if (standard === 'ISO 9001:2015') {
      return [
        { clause: '4.1', requirement: 'Understanding the organization and its context', category: 'CONTEXT' },
        { clause: '4.2', requirement: 'Understanding the needs and expectations of interested parties', category: 'CONTEXT' },
        { clause: '4.3', requirement: 'Determining the scope of the quality management system', category: 'CONTEXT' },
        { clause: '4.4', requirement: 'Quality management system and its processes', category: 'CONTEXT' },
        { clause: '5.1', requirement: 'Leadership and commitment', category: 'LEADERSHIP' },
        { clause: '5.2', requirement: 'Quality policy', category: 'LEADERSHIP' },
        { clause: '5.3', requirement: 'Organizational roles, responsibilities and authorities', category: 'LEADERSHIP' },
        { clause: '6.1', requirement: 'Actions to address risks and opportunities', category: 'PLANNING' },
        { clause: '6.2', requirement: 'Quality objectives and planning to achieve them', category: 'PLANNING' },
        { clause: '6.3', requirement: 'Planning of changes', category: 'PLANNING' },
        { clause: '7.1', requirement: 'Resources', category: 'SUPPORT' },
        { clause: '7.2', requirement: 'Competence', category: 'SUPPORT' },
        { clause: '7.3', requirement: 'Awareness', category: 'SUPPORT' },
        { clause: '7.4', requirement: 'Communication', category: 'SUPPORT' },
        { clause: '7.5', requirement: 'Documented information', category: 'SUPPORT' },
        { clause: '8.1', requirement: 'Operational planning and control', category: 'OPERATION' },
        { clause: '8.2', requirement: 'Requirements for products and services', category: 'OPERATION' },
        { clause: '8.3', requirement: 'Design and development', category: 'OPERATION' },
        { clause: '8.4', requirement: 'Control of externally provided processes, products and services', category: 'OPERATION' },
        { clause: '8.5', requirement: 'Production and service provision', category: 'OPERATION' },
        { clause: '8.6', requirement: 'Release of products and services', category: 'OPERATION' },
        { clause: '8.7', requirement: 'Control of nonconforming outputs', category: 'OPERATION' },
        { clause: '9.1', requirement: 'Monitoring, measurement, analysis and evaluation', category: 'PERFORMANCE' },
        { clause: '9.2', requirement: 'Internal audit', category: 'PERFORMANCE' },
        { clause: '9.3', requirement: 'Management review', category: 'PERFORMANCE' },
        { clause: '10.1', requirement: 'General (Improvement)', category: 'IMPROVEMENT' },
        { clause: '10.2', requirement: 'Nonconformity and corrective action', category: 'IMPROVEMENT' },
        { clause: '10.3', requirement: 'Continual improvement', category: 'IMPROVEMENT' }
      ];
    }

    return [];
  }
}

export default AuditService;
