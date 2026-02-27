import { NextResponse } from "next/server";
import DocumentService from "@/lib/services/document.service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * POST /api/qc/documents/[id]/approve
 * Approve document
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

    const document = await DocumentService.approveDocument(
      params.id,
      body.approvedBy || "system",
    );

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    console.error("Approve document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve document" },
      { status: 500 },
    );
  }
}
