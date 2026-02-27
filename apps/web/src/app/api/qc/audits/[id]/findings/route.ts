import { NextResponse } from "next/server";
import AuditService from "@/lib/services/audit.service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * POST /api/qc/audits/[id]/findings
 * Add finding to audit
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;
    const body = await request.json();

    const finding = await AuditService.addFinding({
      auditId: params.id,
      severity: body.severity,
      clause: body.clause,
      category: body.category,
      description: body.description,
      evidence: body.evidence,
      requirement: body.requirement,
      responsiblePerson: body.responsiblePerson,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: finding,
    });
  } catch (error: any) {
    console.error("Add finding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add finding" },
      { status: 500 },
    );
  }
}
