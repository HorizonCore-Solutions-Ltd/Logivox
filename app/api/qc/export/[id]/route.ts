import { NextRequest, NextResponse } from 'next/server';
// import PDFDocument from 'pdfkit'; // TODO: Install pdfkit package
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'ncr';

    let data: any;
    let title: string;

    // Fetch data based on type
    switch (type) {
      case 'ncr':
        data = await prisma.nonConformanceReport.findUnique({
          where: { id },
        });
        title = `NCR-${data?.ncrNumber || id}`;
        break;
      case 'capa':
        data = await prisma.correctivePreventiveAction.findUnique({
          where: { id },
        });
        title = `CAPA-${data?.capaNumber || id}`;
        break;
      case 'hold':
        data = await prisma.qualityHold.findUnique({
          where: { id },
        });
        title = `HOLD-${data?.holdNumber || id}`;
        break;
      case 'report':
        data = await prisma.qualityReport.findUnique({
          where: { id },
        });
        title = `REPORT-${data?.reportNumber || id}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Return JSON export (PDF generation requires pdfkit installation)
    const exportData = {
      type,
      title,
      data,
      exportedAt: new Date().toISOString(),
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="${title}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

// TODO: Implement PDF generation when pdfkit is installed
// async function generatePDF(type: string, data: any, title: string): Promise<Buffer> { ... }
