import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const executeReportSchema = z.object({
  parameters: z.record(z.any()).optional(),
  filters: z.record(z.any()).optional(),
  exportFormat: z.enum(['PDF', 'XLSX', 'CSV']).optional(),
});

// Helper function to generate execution number
async function generateExecutionNumber(organizationId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const lastExecution = await prisma.reportExecution.findFirst({
    where: {
      organizationId,
      executionNumber: {
        startsWith: `EXEC-${dateStr}-`,
      },
    },
    orderBy: { executionNumber: 'desc' },
  });

  let sequence = 1;
  if (lastExecution?.executionNumber) {
    const lastSequence = parseInt(lastExecution.executionNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `EXEC-${dateStr}-${sequence.toString().padStart(4, '0')}`;
}

// Helper function to execute report query
async function executeReportQuery(
  report: any,
  parameters: any = {},
  filters: any = {}
): Promise<any> {
  const { dataSource, reportType, groupBy, sortBy, columns } = report;
  
  // Merge report filters with runtime filters
  const mergedFilters = { ...report.filters, ...filters };
  
  // Simple implementation - in production, this would use a query builder
  // For now, we'll return mock data
  const mockData = {
    data: [
      { id: 1, name: 'Sample Item 1', value: 100, category: 'A' },
      { id: 2, name: 'Sample Item 2', value: 200, category: 'B' },
      { id: 3, name: 'Sample Item 3', value: 300, category: 'A' },
    ],
    count: 3,
    aggregations: reportType === 'SUMMARY' ? {
      total: 600,
      average: 200,
      min: 100,
      max: 300,
    } : undefined,
  };

  return mockData;
}

// POST /api/reports/[id]/execute - Execute report
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Get report
    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = executeReportSchema.parse(body);

    // Generate execution number
    const executionNumber = await generateExecutionNumber(organizationId);

    // Create execution record
    const execution = await prisma.reportExecution.create({
      data: {
        organizationId,
        reportId: report.id,
        executedById: user.id,
        executionNumber,
        status: 'RUNNING',
        parameters: validated.parameters || {},
        filters: validated.filters || {},
        fileFormat: validated.exportFormat || 'PDF',
        startedAt: new Date(),
      },
    });

    try {
      // Execute report query
      const startTime = Date.now();
      const results = await executeReportQuery(
        report,
        validated.parameters,
        validated.filters
      );
      const durationMs = Date.now() - startTime;

      // In production, generate PDF/XLSX/CSV file and upload to storage
      const resultUrl = `/api/reports/${report.id}/executions/${execution.id}/download`;

      // Update execution with results
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          durationMs,
          resultCount: results.count,
          resultData: results,
          resultUrl,
          fileSize: 0, // Would be actual file size in production
        },
      });

      // Update report last run
      await prisma.report.update({
        where: { id: report.id },
        data: {
          lastRunAt: new Date(),
        },
      });

      // Send email/webhook if configured
      if (report.emailRecipients && report.emailRecipients.length > 0) {
        // TODO: Send email
        await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        });
      }

      if (report.webhookUrl) {
        // TODO: Send webhook
        await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            webhookSent: true,
            webhookSentAt: new Date(),
          },
        });
      }

      // Get updated execution
      const completedExecution = await prisma.reportExecution.findUnique({
        where: { id: execution.id },
        include: {
          report: {
            select: {
              id: true,
              name: true,
              code: true,
              reportType: true,
              category: true,
            },
          },
          executedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(completedExecution);
    } catch (error: any) {
      // Update execution with error
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: error.message,
          errorStack: error.stack,
        },
      });

      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error executing report:", error);
    return NextResponse.json(
      { error: "Failed to execute report" },
      { status: 500 }
    );
  }
}
