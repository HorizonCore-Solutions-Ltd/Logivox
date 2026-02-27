import { NextResponse } from "next/server";
import DocumentService from "@/lib/services/document.service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * GET /api/qc/documents/due-for-review
 * Get documents due for review
 */
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);

    const documents =
      await DocumentService.getDocumentsDueForReview(organizationId);

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error: any) {
    console.error("Get due documents error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get due documents" },
      { status: 500 },
    );
  }
}
