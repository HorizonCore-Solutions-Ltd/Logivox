import { NextResponse } from "next/server";
import DocumentService from "@/lib/services/document.service";

/**
 * GET /api/qc/documents/due-for-review
 * Get documents due for review
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") || "org-1";

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
