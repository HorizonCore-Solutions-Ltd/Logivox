import { NextRequest, NextResponse } from "next/server";
import debitMemoService from "@/lib/services/qc/debit-memo-service";

/**
 * GET /api/qc/debit-memos
 * List debit memos
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");
    const vendorId = searchParams.get("vendorId");
    const status = searchParams.get("status");
    const reason = searchParams.get("reason");
    const skip = searchParams.get("skip");
    const take = searchParams.get("take");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 },
      );
    }

    const result = await debitMemoService.listDebitMemos({
      organizationId,
      vendorId: vendorId || undefined,
      status: status || undefined,
      reason: reason || undefined,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error listing debit memos:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/qc/debit-memos
 * Create debit memo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const debitMemo = await debitMemoService.createDebitMemo({
      organizationId: body.organizationId,
      vendorId: body.vendorId,
      reason: body.reason,
      reasonDescription: body.reasonDescription,
      purchaseOrderId: body.purchaseOrderId,
      grnId: body.grnId,
      rtvId: body.rtvId,
      calculationMethod: body.calculationMethod,
      calculationDetails: body.calculationDetails,
      offsetFromPayment: body.offsetFromPayment,
      notes: body.notes,
      createdBy: body.createdBy || "system",
    });

    return NextResponse.json(debitMemo, { status: 201 });
  } catch (error: any) {
    console.error("Error creating debit memo:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
