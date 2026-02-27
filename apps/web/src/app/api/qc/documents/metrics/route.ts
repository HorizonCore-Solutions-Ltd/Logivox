import { NextResponse } from "next/server";
import DocumentService from "@/lib/services/document.service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * GET /api/qc/documents/metrics
 * Get document control metrics
 */
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);

    const metrics = await DocumentService.getDocumentMetrics(organizationId);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error("Get document metrics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get metrics" },
      { status: 500 },
    );
  }
}
