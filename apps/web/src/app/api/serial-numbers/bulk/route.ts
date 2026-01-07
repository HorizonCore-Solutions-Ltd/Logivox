import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/serial-numbers/bulk
 *
 * Bulk operations for serial numbers (create, update, delete)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { operation, serialNumbers, productId } = body;

    if (!operation || !serialNumbers || !Array.isArray(serialNumbers)) {
      return NextResponse.json(
        { error: "Operation and serialNumbers array are required" },
        { status: 400 },
      );
    }

    const results = [];

    for (const serialNumber of serialNumbers) {
      const trimmedSN = serialNumber.trim();
      if (!trimmedSN) continue;

      try {
        if (operation === "CREATE") {
          // Check if already exists
          const existing = await prisma.serialNumber.findUnique({
            where: { serialNumber: trimmedSN },
          });

          if (existing) {
            results.push({
              serialNumber: trimmedSN,
              status: "DUPLICATE",
              message: "Serial number already exists",
            });
            continue;
          }

          // Create new serial number
          await prisma.serialNumber.create({
            data: {
              serialNumber: trimmedSN,
              productId: productId,
              organizationId: session.user.organizationId,
              status: "AVAILABLE",
            },
          });

          results.push({
            serialNumber: trimmedSN,
            status: "SUCCESS",
            message: "Serial number created",
          });
        } else if (operation === "UPDATE") {
          // Update existing serial number
          const existing = await prisma.serialNumber.findUnique({
            where: { serialNumber: trimmedSN },
          });

          if (!existing) {
            results.push({
              serialNumber: trimmedSN,
              status: "ERROR",
              message: "Serial number not found",
            });
            continue;
          }

          await prisma.serialNumber.update({
            where: { serialNumber: trimmedSN },
            data: {
              updatedAt: new Date(),
            },
          });

          results.push({
            serialNumber: trimmedSN,
            status: "SUCCESS",
            message: "Serial number updated",
          });
        } else if (operation === "DELETE") {
          // Check if serial number is in use
          const existing = await prisma.serialNumber.findUnique({
            where: { serialNumber: trimmedSN },
            include: {
              orderLineItem: true,
            },
          });

          if (!existing) {
            results.push({
              serialNumber: trimmedSN,
              status: "ERROR",
              message: "Serial number not found",
            });
            continue;
          }

          if (existing.orderLineItem) {
            results.push({
              serialNumber: trimmedSN,
              status: "ERROR",
              message: "Cannot delete: serial number is assigned to an order",
            });
            continue;
          }

          await prisma.serialNumber.delete({
            where: { serialNumber: trimmedSN },
          });

          results.push({
            serialNumber: trimmedSN,
            status: "SUCCESS",
            message: "Serial number deleted",
          });
        }
      } catch (error: any) {
        results.push({
          serialNumber: trimmedSN,
          status: "ERROR",
          message: error.message || "Operation failed",
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: `SERIAL_NUMBERS_BULK_${operation}`,
        entityType: "SerialNumber",
        userId: session.user.id,
        organizationId: session.user.organizationId,
        metadata: {
          operation,
          total: serialNumbers.length,
          success: results.filter((r) => r.status === "SUCCESS").length,
          errors: results.filter((r) => r.status === "ERROR").length,
          duplicates: results.filter((r) => r.status === "DUPLICATE").length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        success: results.filter((r) => r.status === "SUCCESS").length,
        errors: results.filter((r) => r.status === "ERROR").length,
        duplicates: results.filter((r) => r.status === "DUPLICATE").length,
      },
    });
  } catch (error: any) {
    console.error("Error in bulk serial number operation:", error);
    return NextResponse.json(
      {
        error: "Failed to process serial numbers",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
