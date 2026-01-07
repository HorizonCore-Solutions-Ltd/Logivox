import { NextRequest, NextResponse } from "next/server";
import { NCRService } from "@/lib/services/qc/ncr-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const ncr = await NCRService.getNCRById(params.id);

    if (!ncr) {
      return NextResponse.json({ error: "NCR not found" }, { status: 404 });
    }

    return NextResponse.json(ncr);
  } catch (error: any) {
    console.error("Error fetching NCR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch NCR" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case "completeRCA":
        result = await NCRService.completeRCA({
          ncrId: params.id,
          rootCauseMethod: data.rootCauseMethod || "5 Whys",
          confirmedRootCause: data.confirmedRootCause,
          rcaPerformedBy: data.rcaPerformedBy || "system",
        });
        break;

      case "submitClaim":
        result = await NCRService.submitClaim(params.id);
        break;

      case "updateClaim":
        result = await NCRService.updateClaim({
          ncrId: params.id,
          claimStatus: data.claimStatus,
          claimPaidAmount: data.approvedAmount,
          claimNotes: data.supplierResponse,
        });
        break;

      case "linkCAPA":
        result = await NCRService.linkCAPA(params.id, data.capaId);
        break;

      case "close":
        result = await NCRService.closeNCR({
          ncrId: params.id,
          closedBy: data.closedBy,
          closureNotes: data.closureNotes,
        });
        break;

      default:
        // Update NCR data
        result = await NCRService.updateNCR(params.id, data);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating NCR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update NCR" },
      { status: 500 },
    );
  }
}
