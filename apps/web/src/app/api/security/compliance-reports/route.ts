import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reportGenerationSchema = z.object({
  reportType: z.enum([
    'DAILY_SUMMARY',
    'WEEKLY_SUMMARY',
    'MONTHLY_SUMMARY',
    'VISITOR_LOG',
    'INCIDENT_LOG',
    'ACCESS_LOG',
    'GATE_ACTIVITY',
    'SECURITY_AUDIT',
    'OSHA_REPORT',
    'CUSTOM'
  ]),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  title: z.string().optional(),
  recipientEmails: z.array(z.string().email()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const reportType = searchParams.get('reportType');
    const status = searchParams.get('status');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (reportType) where.reportType = reportType;
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.securityComplianceReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { generatedAt: 'desc' },
      }),
      prisma.securityComplianceReport.count({ where }),
    ]);

    return NextResponse.json({
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching compliance reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reportGenerationSchema.parse(body);

    const periodStart = new Date(validatedData.periodStart);
    const periodEnd = new Date(validatedData.periodEnd);

    // Generate report number
    const lastReport = await prisma.securityComplianceReport.findFirst({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'desc' },
      select: { reportNumber: true },
    });

    const lastNumber = lastReport?.reportNumber 
      ? parseInt(lastReport.reportNumber.replace(/\D/g, '')) 
      : 0;
    const reportNumber = `REP${String(lastNumber + 1).padStart(6, '0')}`;

    // Gather statistics based on report type
    const statistics = await gatherStatistics(
      session.user.organizationId,
      validatedData.reportType,
      periodStart,
      periodEnd
    );

    // Generate findings
    const findings = await generateFindings(
      session.user.organizationId,
      validatedData.reportType,
      periodStart,
      periodEnd
    );

    // Generate summary
    const summary = generateSummary(validatedData.reportType, statistics, findings);

    const title = validatedData.title || 
      `${validatedData.reportType.replace(/_/g, ' ')} - ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}`;

    // Create report
    const report = await prisma.securityComplianceReport.create({
      data: {
        organizationId: session.user.organizationId,
        reportNumber,
        reportType: validatedData.reportType,
        title,
        periodStart,
        periodEnd,
        summary,
        findings,
        statistics,
        status: 'DRAFT',
        recipientEmails: validatedData.recipientEmails,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'CREATE',
        entity: 'COMPLIANCE_REPORT',
        entityId: report.id,
        description: `Generated ${validatedData.reportType} compliance report ${reportNumber}`,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error generating compliance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}

async function gatherStatistics(
  organizationId: string,
  reportType: string,
  periodStart: Date,
  periodEnd: Date
) {
  const stats: any = {};

  // Visitors
  const [totalVisitors, uniqueCompanies, overdueVisitors] = await Promise.all([
    prisma.visitor.count({
      where: {
        organizationId,
        visitDate: { gte: periodStart, lte: periodEnd },
      },
    }),
    prisma.visitor.findMany({
      where: {
        organizationId,
        visitDate: { gte: periodStart, lte: periodEnd },
        company: { not: null },
      },
      select: { company: true },
      distinct: ['company'],
    }),
    prisma.visitor.count({
      where: {
        organizationId,
        visitDate: { gte: periodStart, lte: periodEnd },
        status: 'CHECKED_IN',
        checkInTime: { lt: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // 4+ hours
      },
    }),
  ]);

  stats.visitors = {
    total: totalVisitors,
    uniqueCompanies: uniqueCompanies.length,
    overdue: overdueVisitors,
  };

  // Gate Entries
  const gateEntries = await prisma.gateEntry.groupBy({
    by: ['entryType'],
    where: {
      organizationId,
      entryTime: { gte: periodStart, lte: periodEnd },
    },
    _count: true,
  });

  stats.gateEntries = {
    total: gateEntries.reduce((sum, entry) => sum + entry._count, 0),
    byType: gateEntries.reduce((acc, entry) => {
      acc[entry.entryType] = entry._count;
      return acc;
    }, {} as Record<string, number>),
  };

  // Incidents
  const incidents = await prisma.securityIncident.groupBy({
    by: ['incidentType', 'severity'],
    where: {
      organizationId,
      incidentTime: { gte: periodStart, lte: periodEnd },
    },
    _count: true,
  });

  stats.incidents = {
    total: incidents.reduce((sum, inc) => sum + inc._count, 0),
    byType: incidents.reduce((acc, inc) => {
      if (!acc[inc.incidentType]) acc[inc.incidentType] = 0;
      acc[inc.incidentType] += inc._count;
      return acc;
    }, {} as Record<string, number>),
    bySeverity: incidents.reduce((acc, inc) => {
      if (!acc[inc.severity]) acc[inc.severity] = 0;
      acc[inc.severity] += inc._count;
      return acc;
    }, {} as Record<string, number>),
  };

  return stats;
}

async function generateFindings(
  organizationId: string,
  reportType: string,
  periodStart: Date,
  periodEnd: Date
) {
  const findings: any[] = [];

  // High severity incidents
  const criticalIncidents = await prisma.securityIncident.findMany({
    where: {
      organizationId,
      incidentTime: { gte: periodStart, lte: periodEnd },
      severity: { in: ['HIGH', 'CRITICAL'] },
    },
    select: {
      incidentNumber: true,
      incidentType: true,
      severity: true,
      title: true,
      location: true,
      status: true,
    },
  });

  if (criticalIncidents.length > 0) {
    findings.push({
      type: 'HIGH_SEVERITY_INCIDENTS',
      severity: 'HIGH',
      count: criticalIncidents.length,
      details: criticalIncidents,
      recommendation: 'Review and address root causes of high-severity incidents',
    });
  }

  // Overdue visitors
  const overdueCount = await prisma.visitor.count({
    where: {
      organizationId,
      status: 'CHECKED_IN',
      visitDate: { gte: periodStart, lte: periodEnd },
      checkInTime: { lt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    },
  });

  if (overdueCount > 0) {
    findings.push({
      type: 'OVERDUE_VISITORS',
      severity: 'MEDIUM',
      count: overdueCount,
      recommendation: 'Implement automated visitor checkout reminders',
    });
  }

  return findings;
}

function generateSummary(reportType: string, statistics: any, findings: any[]) {
  let summary = `Security Compliance Report\n\n`;
  
  summary += `Total Visitors: ${statistics.visitors?.total || 0}\n`;
  summary += `Gate Entries: ${statistics.gateEntries?.total || 0}\n`;
  summary += `Security Incidents: ${statistics.incidents?.total || 0}\n\n`;
  
  if (findings.length > 0) {
    summary += `Key Findings: ${findings.length} items require attention\n`;
    findings.forEach((finding, idx) => {
      summary += `${idx + 1}. ${finding.type}: ${finding.count} occurrences\n`;
    });
  } else {
    summary += `No critical findings during this period.\n`;
  }
  
  return summary;
}
