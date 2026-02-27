export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const executeReportSchema = z.object({
  parameters: z.record(z.any()).optional(),
  filters: z.record(z.any()).optional(),
  exportFormat: z.enum(["PDF", "XLSX", "CSV"]).optional(),
});

// Helper function to generate execution number
async function generateExecutionNumber(
  organizationId: string,
): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  const lastExecution = await prisma.reportExecution.findFirst({
    where: {
      organizationId,
      executionNumber: {
        startsWith: `EXEC-${dateStr}-`,
      },
    },
    orderBy: { executionNumber: "desc" },
  });

  let sequence = 1;
  if (lastExecution?.executionNumber) {
    const lastSequence = parseInt(lastExecution.executionNumber.split("-")[2]);
    sequence = lastSequence + 1;
  }

  return `EXEC-${dateStr}-${sequence.toString().padStart(4, "0")}`;
}

// Helper function to execute report query against real data
async function executeReportQuery(
  report: any,
  parameters: any = {},
  filters: any = {},
): Promise<any> {
  const { dataSource, reportType, columns } = report;

  // Merge stored filters with runtime filters
  const mergedFilters = { ...report.filters, ...filters };
  const orgId = report.organizationId;
  const takeLimit = parameters.limit ?? 1000;

  // Map common dataSource strings to real Prisma queries
  const src = (dataSource as string).toLowerCase();

  if (src.includes("inventory") || src === "inventory_items") {
    const rows = await prisma.inventoryItem.findMany({
      where: {
        organizationId: orgId,
        ...(mergedFilters.status ? { status: mergedFilters.status } : {}),
        ...(mergedFilters.warehouseId ? { warehouseId: mergedFilters.warehouseId } : {}),
      },
      take: takeLimit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, sku: true, name: true, category: true,
        availableQty: true, reservedQty: true, totalQty: true,
        unitCost: true, status: true, createdAt: true,
      },
    });
    return {
      data: rows,
      count: rows.length,
      aggregations: reportType === "SUMMARY" ? {
        total: rows.length,
        totalQty: rows.reduce((s: number, r: any) => s + (r.totalQty || 0), 0),
      } : undefined,
    };
  }

  if (src.includes("order") || src === "sales_orders") {
    const rows = await prisma.salesOrder.findMany({
      where: {
        organizationId: orgId,
        ...(mergedFilters.status ? { status: mergedFilters.status } : {}),
      },
      take: takeLimit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, soNumber: true, status: true, orderDate: true,
        customerId: true, warehouseId: true, createdAt: true,
      },
    });
    return { data: rows, count: rows.length };
  }

  if (src.includes("grn") || src.includes("receipt") || src.includes("receiving")) {
    const rows = await prisma.goodsReceiptNote.findMany({
      where: {
        organizationId: orgId,
        ...(mergedFilters.status ? { status: mergedFilters.status } : {}),
      },
      take: takeLimit,
      orderBy: { receivedDate: "desc" },
      select: {
        id: true, grnNumber: true, status: true, receivedDate: true,
        putAwayCompleted: true, hasDiscrepancy: true, createdAt: true,
      },
    });
    return { data: rows, count: rows.length };
  }

  if (src.includes("employee") || src.includes("labor")) {
    const rows = await prisma.employee.findMany({
      where: {
        organizationId: orgId,
        ...(mergedFilters.status ? { status: mergedFilters.status } : {}),
      },
      take: takeLimit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, employeeNumber: true, firstName: true, lastName: true,
        department: true, position: true, status: true, hireDate: true,
      },
    });
    return { data: rows, count: rows.length };
  }

  if (src.includes("purchase") || src.includes("po")) {
    const rows = await prisma.purchaseOrder.findMany({
      where: {
        organizationId: orgId,
        ...(mergedFilters.status ? { status: mergedFilters.status } : {}),
      },
      take: takeLimit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, poNumber: true, status: true, orderDate: true,
        totalAmount: true, currency: true, supplierId: true,
      },
    });
    return { data: rows, count: rows.length };
  }

  // Unknown dataSource — return empty result set with a note
  console.warn(`[reports] Unknown dataSource: ${dataSource} — returning empty result`);
  return { data: [], count: 0, note: `No query handler registered for dataSource: ${dataSource}` };
}

// POST /api/reports/[id]/execute - Execute report
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
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
        { status: 404 },
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
        status: "RUNNING",
        parameters: validated.parameters || {},
        filters: validated.filters || {},
        fileFormat: validated.exportFormat || "PDF",
        startedAt: new Date(),
      },
    });

    try {
      // Execute report query
      const startTime = Date.now();
      const results = await executeReportQuery(
        report,
        validated.parameters,
        validated.filters,
      );
      const durationMs = Date.now() - startTime;

      // In production, generate PDF/XLSX/CSV file and upload to storage
      const resultUrl = `/api/reports/${report.id}/executions/${execution.id}/download`;

      // Update execution with results
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
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
        // Send report via email
        const emailRecipients = Array.isArray(report.emailRecipients)
          ? report.emailRecipients
          : [report.emailRecipients];

        for (const recipient of emailRecipients) {
          await sendEmail({
            to: recipient,
            subject: `Report: ${report.name}`,
            html: `
              <h2>${report.name}</h2>
              <p>${report.description || ""}</p>
              <p><strong>Report executed at:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Row count:</strong> ${result.rowCount}</p>
              <p>View the full report in the dashboard.</p>
            `,
          });
        }

        await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        });
      }

      if (report.webhookUrl) {
        // Send webhook with retry logic
        const webhookResult = await sendWebhook(report.webhookUrl, {
          event: "report.executed",
          data: {
            reportId: report.id,
            reportName: report.name,
            executionId: execution.id,
            rowCount: result.rowCount,
            executedAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
          organizationId: report.organizationId,
        });

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
          status: "FAILED",
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
        { status: 400 },
      );
    }
    console.error("Error executing report:", error);
    return NextResponse.json(
      { error: "Failed to execute report" },
      { status: 500 },
    );
  }
}
