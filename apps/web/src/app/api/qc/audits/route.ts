import { NextResponse } from "next/server";
import AuditService from "@/lib/services/audit.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/qc/audits
 * Get all audits
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") || "org-1";

    const audits = await prisma.audit.findMany({
      where: { organizationId },
      include: {
        findings: true,
      },
      orderBy: { auditDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: audits,
    });
  } catch (error: any) {
    console.error("Get audits error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get audits" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/qc/audits
 * Create new audit
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const audit = await prisma.audit.create({
      data: {
        auditNumber: `AUD-${Date.now()}`,
        organizationId: body.organizationId,
        type: body.type,
        scope: body.scope,
        standard: body.standard,
        auditDate: new Date(body.auditDate),
        location: body.location,
        auditorName: body.auditorName,
        auditorOrg: body.auditorOrg,
        auditeeName: body.auditeeName,
        status: "PLANNED",
        createdBy: body.createdBy,
      },
    });

    return NextResponse.json({
      success: true,
      data: audit,
    });
  } catch (error: any) {
    console.error("Create audit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create audit" },
      { status: 500 },
    );
  }
}
