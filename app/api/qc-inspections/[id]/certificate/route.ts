import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/qc-inspections/[id]/certificate - Generate Certificate of Analysis
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inspection = await prisma.qCInspection.findUnique({
      where: { id: params.id },
      include: {
        template: true,
        inventoryItem: true,
        inspectedBy: { select: { name: true, email: true } },
        organization: { select: { name: true, logo: true } },
        checkpoints: { orderBy: { sequence: 'asc' } },
        approvals: {
          include: {
            approver: { select: { name: true } },
          },
          orderBy: { level: 'asc' },
        },
        lot: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 }
      );
    }

    if (inspection.result !== 'PASS' && inspection.result !== 'PASS_WITH_NOTES') {
      return NextResponse.json(
        { error: "Certificate can only be generated for passed inspections" },
        { status: 400 }
      );
    }

    // Generate certificate number
    const certNumber = `COA-${inspection.inspectionNumber}`;

    // In a real application, you would generate a PDF here
    // For now, we'll just create a structured data response
    const certificate = {
      certificateNumber: certNumber,
      issueDate: new Date().toISOString(),
      organization: {
        name: inspection.organization.name,
        logo: inspection.organization.logo,
      },
      inspection: {
        number: inspection.inspectionNumber,
        date: inspection.inspectedDate,
        category: inspection.category,
      },
      product: {
        sku: inspection.inventoryItem.sku,
        name: inspection.inventoryItem.name,
        description: inspection.inventoryItem.description,
        quantity: inspection.quantity,
        sampleSize: inspection.sampleSize,
      },
      lot: inspection.lot ? {
        lotNumber: inspection.lot.lotNumber,
        manufacturingDate: inspection.lot.manufacturingDate,
        expiryDate: inspection.lot.expiryDate,
      } : null,
      results: {
        result: inspection.result,
        qualityScore: inspection.qualityScore,
        passedCheckpoints: inspection.passedCount,
        totalCheckpoints: inspection.checkpoints.length,
        defects: {
          critical: inspection.criticalDefects,
          major: inspection.majorDefects,
          minor: inspection.minorDefects,
        },
      },
      checkpoints: inspection.checkpoints.map((cp) => ({
        name: cp.name,
        type: cp.type,
        expectedValue: cp.expectedValue,
        actualValue: cp.actualValue,
        result: cp.result,
        unit: cp.unit,
      })),
      inspector: {
        name: inspection.inspectedBy?.name,
        date: inspection.inspectedDate,
      },
      approvals: inspection.approvals.map((app) => ({
        level: app.level,
        approver: app.approver?.name,
        date: app.approvedDate,
        decision: app.decision,
      })),
      notes: inspection.notes,
    };

    // Update inspection with certificate info
    await prisma.qCInspection.update({
      where: { id: params.id },
      data: {
        certificateNumber: certNumber,
        // In production, this would be the URL to the generated PDF
        certificateUrl: `/certificates/${certNumber}.pdf`,
      },
    });

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("Error generating certificate:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
