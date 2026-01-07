import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supplier-portal-secret-key";

function verifyToken(request: Request): any {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.substring(7);
  return jwt.verify(token, JWT_SECRET);
}

/**
 * POST /api/supplier/response
 * Submit 8D response to NCR
 */
export async function POST(request: Request) {
  try {
    const decoded = verifyToken(request);
    const body = await request.json();

    const {
      ncrId,
      eightD,
      rootCause,
      correctiveAction,
      preventiveAction,
      photos,
      signature,
    } = body;

    // Verify NCR belongs to supplier
    const ncr = await prisma.nonConformanceReport.findUnique({
      where: { id: ncrId },
    });

    if (!ncr || ncr.supplierId !== decoded.supplierId) {
      return NextResponse.json(
        { error: "Unauthorized access to NCR" },
        { status: 403 },
      );
    }

    // Create supplier response
    const response = await prisma.supplierResponse.create({
      data: {
        ncrId,
        respondedById: decoded.userId,
        responseDate: new Date(),
        eightD,
        rootCause,
        correctiveAction,
        preventiveAction,
        photos,
        status: "SUBMITTED",
      },
    });

    // Update NCR status
    await prisma.nonConformanceReport.update({
      where: { id: ncrId },
      data: {
        status: "ACTION_PENDING",
      },
    });

    // Send notification to quality team
    await fetch("/api/qc/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "SUPPLIER_RESPONSE_RECEIVED",
        ncrId,
        responseId: response.id,
      }),
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("Supplier response error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit response" },
      { status: error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
