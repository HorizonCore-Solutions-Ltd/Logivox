import { NextRequest, NextResponse } from 'next/server';
// import PDFDocument from 'pdfkit'; // Removed - pdfkit not installed
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, startDate, endDate, includeCharts, includeDetails, format } = body;

    // Create report record
    const report = await prisma.qualityReport.create({
      data: {
        reportNumber: `REP-${Date.now()}`,
        organizationId: 'default', // TODO: Get from auth
        reportType: 'CUSTOM',
        reportCategory: type,
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
        // generatedBy removed - not in schema
        createdBy: "SYSTEM",
        metrics: {
          startDate,
          endDate,
          includeCharts,
          includeDetails,
          format,
        },
      },
    });

    // Generate report content based on type
    let reportData: any = {};

    switch (type) {
      case 'NCR_SUMMARY':
        reportData = await generateNCRSummary(startDate, endDate);
        break;
      case 'CAPA_EFFECTIVENESS':
        reportData = await generateCAPAEffectiveness(startDate, endDate);
        break;
      case 'SUPPLIER_SCORECARD':
        reportData = await generateSupplierScorecard(startDate, endDate);
        break;
      case 'INSPECTION_RESULTS':
        reportData = await generateInspectionResults(startDate, endDate);
        break;
      case 'COST_IMPACT':
        reportData = await generateCostImpact(startDate, endDate);
        break;
      default:
        reportData = { message: 'Report type not implemented' };
    }

    // Update report with metrics
    await prisma.qualityReport.update({
      where: { id: report.id },
      data: { metrics: reportData },
    });

    // Generate PDF if requested
    let downloadUrl = '';
    if (format === 'PDF') {
      downloadUrl = await generatePDF(report.id, type, reportData);
    }

    return NextResponse.json({
      id: report.id,
      downloadUrl,
      data: reportData,
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateNCRSummary(startDate: Date, endDate: Date) {
  const ncrs = await prisma.nonConformanceReport.findMany({
    where: {
      reportDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    // capa relation removed - use capaIds array instead
  });

  const summary = {
    totalNCRs: ncrs.length,
    bySeverity: {
      critical: ncrs.filter((n) => n.severity === 'CRITICAL').length,
      major: ncrs.filter((n) => n.severity === 'MAJOR').length,
      minor: ncrs.filter((n) => n.severity === 'MINOR').length,
    },
    byCategory: ncrs.reduce((acc, ncr) => {
      acc[ncr.category] = (acc[ncr.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: ncrs.reduce((acc, ncr) => {
      acc[ncr.status] = (acc[ncr.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    capaRate: (ncrs.filter((n) => n.capaIds.length > 0).length / ncrs.length * 100).toFixed(1),
    totalCostImpact: ncrs.reduce((sum: number, ncr: any) => sum + (ncr.actualCost ? Number(ncr.actualCost) : 0), 0),
  };

  return summary;
}

async function generateCAPAEffectiveness(startDate: Date, endDate: Date) {
  const capas = await prisma.correctivePreventiveAction.findMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
  });

  const summary = {
    totalCAPAs: capas.length,
    completed: capas.filter((c: any) => c.status === 'COMPLETED').length,
    verified: capas.filter((c: any) => c.status === 'VERIFIED').length,
    overdue: capas.filter((c: any) => c.targetCompletionDate < new Date() && c.status !== 'COMPLETED').length,
    avgRPN: capas.length > 0 ? (capas.reduce((sum: number, c: any) => sum + (c.riskPriority || 0), 0) / capas.length).toFixed(1) : '0',
    effectivenessRate: capas.length > 0 ? (capas.filter((c: any) => c.verificationPassed).length / capas.length * 100).toFixed(1) : '0',
  };

  return summary;
}

async function generateSupplierScorecard(startDate: Date, endDate: Date) {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true }
  });

  const scorecards = await Promise.all(
    suppliers.map(async (supplier) => {
      const ncrs = await prisma.nonConformanceReport.findMany({
        where: {
          supplierId: supplier.id,
          reportDate: { gte: startDate, lte: endDate }
        }
      });

      // Get GRNs for this supplier through PO relation
      const supplierGRNs = await prisma.goodsReceiptNote.findMany({
        where: {
          purchaseOrder: {
            supplierId: supplier.id
          },
          receivedDate: { gte: startDate, lte: endDate }
        },
        select: { id: true }
      });

      const inspections = await prisma.qCInspection.findMany({
        where: {
          grnId: { in: supplierGRNs.map(g => g.id) },
          inspectedDate: { gte: startDate, lte: endDate }
        }
      });

      const totalNCRs = ncrs.length;
      const criticalNCRs = ncrs.filter(n => n.severity === 'CRITICAL').length;
      const passedInspections = inspections.filter(i => i.result === 'PASS').length;
      const inspectionPassRate = inspections.length > 0 
        ? (passedInspections / inspections.length * 100).toFixed(1)
        : '100.0';

      let qualityScore = 100;
      qualityScore -= (criticalNCRs * 15);
      qualityScore -= ((totalNCRs - criticalNCRs) * 5);
      qualityScore = Math.max(0, Math.min(100, qualityScore));

      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        totalNCRs,
        criticalNCRs,
        inspectionPassRate,
        qualityScore: Math.round(qualityScore),
        grade: qualityScore >= 90 ? 'A' : qualityScore >= 80 ? 'B' : qualityScore >= 70 ? 'C' : qualityScore >= 60 ? 'D' : 'F'
      };
    })
  );

  return {
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    suppliers: scorecards.sort((a, b) => b.qualityScore - a.qualityScore),
    summary: {
      totalSuppliers: scorecards.length,
      averageScore: Math.round(scorecards.reduce((sum, s) => sum + s.qualityScore, 0) / scorecards.length),
      gradeA: scorecards.filter(s => s.grade === 'A').length,
      gradeB: scorecards.filter(s => s.grade === 'B').length,
      gradeC: scorecards.filter(s => s.grade === 'C').length,
      gradeD: scorecards.filter(s => s.grade === 'D').length,
      gradeF: scorecards.filter(s => s.grade === 'F').length
    }
  };
}

async function generateInspectionResults(startDate: Date, endDate: Date) {
  const inspections = await prisma.qCInspection.findMany({
    where: {
      inspectedDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      grn: {
        include: {
          purchaseOrder: {
            include: {
              supplier: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  const summary = {
    totalInspections: inspections.length,
    accepted: inspections.filter(i => i.result === 'PASS').length,
    rejected: inspections.filter(i => i.result === 'FAIL').length,
    conditional: inspections.filter(i => i.result === 'CONDITIONAL').length,
    acceptanceRate: inspections.length > 0 
      ? ((inspections.filter(i => i.result === 'PASS').length / inspections.length) * 100).toFixed(1)
      : '100.0',
    byType: inspections.reduce((acc: Record<string, number>, insp: any) => {
      acc[insp.category] = (acc[insp.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    topSuppliers: Object.entries(
      inspections.reduce((acc: Record<string, number>, insp: any) => {
        const name = insp.grn?.purchaseOrder?.supplier?.name || 'Unknown';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)
  };

  return summary;
}

async function generateCostImpact(startDate: Date, endDate: Date) {
  const ncrs = await prisma.nonConformanceReport.findMany({
    where: {
      reportDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
  });

  const summary = {
    totalCost: ncrs.reduce((sum: number, ncr: any) => sum + (ncr.actualCost ? Number(ncr.actualCost) : 0), 0),
    byCategory: ncrs.reduce((acc: Record<string, number>, ncr: any) => {
      acc[ncr.category] = (acc[ncr.category] || 0) + (ncr.actualCost ? Number(ncr.actualCost) : 0);
      return acc;
    }, {} as Record<string, number>),
    supplierClaims: ncrs.filter((n: any) => n.claimStatus && n.claimStatus !== 'PENDING').reduce((sum: number, ncr: any) => sum + (ncr.claimAmount ? Number(ncr.claimAmount) : 0), 0),
  };

  return summary;
}

async function generatePDF(reportId: string, type: string, data: any): Promise<string> {
  // TODO: Implement PDF generation with pdfkit
  // For now, return a placeholder URL
  return `/api/reports/${reportId}/download`;
}
