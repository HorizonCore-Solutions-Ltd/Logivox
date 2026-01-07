import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/qc-inspections/[id] - Get inspection details
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
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
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            description: true,
          },
        },
        inspectedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        grn: {
          select: {
            id: true,
            grnNumber: true,
          },
        },
        salesOrder: {
          select: {
            id: true,
            soNumber: true,
          },
        },
        lot: {
          select: {
            id: true,
            lotNumber: true,
          },
        },
        checkpoints: {
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { sequence: "asc" },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { level: "asc" },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(inspection);
  } catch (error) {
    console.error("Error fetching inspection:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspection" },
      { status: 500 },
    );
  }
}

// PATCH /api/qc-inspections/[id] - Update inspection
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Update inspection
    const inspection = await prisma.qCInspection.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      include: {
        checkpoints: true,
        approvals: true,
      },
    });

    return NextResponse.json(inspection);
  } catch (error) {
    console.error("Error updating inspection:", error);
    return NextResponse.json(
      { error: "Failed to update inspection" },
      { status: 500 },
    );
  }
}
