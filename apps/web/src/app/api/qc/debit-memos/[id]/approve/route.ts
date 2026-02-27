import { NextRequest, NextResponse } from "next/server";
import debitMemoService from "@/lib/services/qc/debit-memo-service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * POST /api/qc/debit-memos/[id]/approve
 * Approve debit memo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;
    const body = await request.json();

    const debitMemo = await debitMemoService.approveDebitMemo({
      debitMemoId: params.id,
      approvedBy: body.approvedBy,
    });

    return NextResponse.json(debitMemo);
  } catch (error: any) {
    console.error("Error approving debit memo:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
