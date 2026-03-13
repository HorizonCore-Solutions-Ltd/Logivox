export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for quality check
const qcSchema = z.object({
  overallStatus: z.enum(["PASS", "FAIL", "PARTIAL"]),
  qcNotes: z.string().optional(),
  items: z.array(
    z.object({
      itemId: z.string(),
      qcStatus: z.enum(["PASS", "FAIL"]),
      acceptedQuantity: z.number().int().min(0),
      rejectedQuantity: z.number().int().min(0),
      hasDefects: z.boolean().default(false),
      defectDescription: z.string().optional(),
      qcNotes: z.string().optional(),
    }),
  ),
});

// POST /api/grn/[id]/quality-check - Perform quality check
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizations[0]?.id;
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = qcSchema.parse(body);

    // Check if GRN exists
    const grn = await prisma.goodsReceiptNote.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        items: true,
      },
    });

    if (!grn) {
      return NextResponse.json({ error: "GRN not found" }, { status: 404 });
    }

    // Only allow QC if GRN is in PENDING or QUALITY_CHECK status
    if (!["PENDING", "QUALITY_CHECK"].includes(grn.status)) {
      return NextResponse.json(
        { error: "GRN must be in PENDING or QUALITY_CHECK status for QC" },
        { status: 400 },
      );
    }

    // Update GRN and items with QC results
    const updatedGRN = await prisma.$transaction(async (tx: any) => {
      // Update each item
      for (const item of validatedData.items) {
        await tx.gRNItem.update({
          where: { id: item.itemId },
          data: {
            qcStatus: item.qcStatus,
            acceptedQuantity: item.acceptedQuantity,
            rejectedQuantity: item.rejectedQuantity,
            hasDefects: item.hasDefects,
            defectDescription: item.defectDescription,
            qcNotes: item.qcNotes,
          },
        });
      }

      // Determine final status based on QC results
      let finalStatus: string;
      if (validatedData.overallStatus === "PASS") {
        finalStatus = "APPROVED";
      } else if (validatedData.overallStatus === "FAIL") {
        finalStatus = "REJECTED";
      } else {
        finalStatus = "QUALITY_CHECK"; // Partial - needs review
      }

      // Update GRN with QC info
      const updatedGRN = await tx.goodsReceiptNote.update({
        where: { id: params.id },
        data: {
          status: finalStatus,
          qcStatus: validatedData.overallStatus,
          qcNotes: validatedData.qcNotes,
          qcById: session.user.id,
          qcDate: new Date(),
        },
        include: {
          items: {
            include: {
              inventoryItem: {
                select: {
                  sku: true,
                  name: true,
                },
              },
            },
          },
          purchaseOrder: {
            select: {
              poNumber: true,
            },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "QUALITY_CHECK",
          entityType: "GRN",
          entityId: updatedGRN.id,
          metadata: {
            grnNumber: updatedGRN.grnNumber,
            qcStatus: validatedData.overallStatus,
            itemsChecked: validatedData.items.length,
          },
        },
      });

      return updatedGRN;
    });

    return NextResponse.json({
      grn: updatedGRN,
      message: "Quality check completed successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error performing quality check:", error);
    return NextResponse.json(
      { error: "Failed to perform quality check" },
      { status: 500 },
    );
  }
}
