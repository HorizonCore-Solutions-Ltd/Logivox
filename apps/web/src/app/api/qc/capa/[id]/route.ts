import { NextRequest, NextResponse } from "next/server";
import { CAPAService } from "@/lib/services/qc/capa-service";
import { requireApiAuth } from "@/lib/api-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;
    const capa = await CAPAService.getCAPIById(params.id);

    if (!capa) {
      return NextResponse.json({ error: "CAPA not found" }, { status: 404 });
    }

    return NextResponse.json(capa);
  } catch (error: any) {
    console.error("Error fetching CAPA:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch CAPA" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;
    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case "updateStatus":
        result = await CAPAService.updateStatus(params.id, data.status);
        break;

      case "completeContainment":
        result = await CAPAService.completeContainment(params.id);
        break;

      case "completeCorrectiveActions":
        result = await CAPAService.completeCorrectiveActions(params.id);
        break;

      case "completePreventiveActions":
        result = await CAPAService.completePreventiveActions(params.id);
        break;

      case "verify":
        result = await CAPAService.verifyCAPI({
          capaId: params.id,
          verificationPerformedBy: data.verifiedBy,
          verificationPassed: true,
          effectivenessScore: data.effectivenessScore,
          effectivenessNotes: data.verificationNotes,
        });
        break;

      case "managementReview":
        result = await CAPAService.managementReview({
          capaId: params.id,
          managementReviewedBy: data.reviewedBy,
          managementApproval: data.approved ? "APPROVED" : "REJECTED",
          managementComments: data.reviewNotes,
        });
        break;

      case "close":
        result = await CAPAService.closeCAPI({
          capaId: params.id,
          closedBy: data.closedBy,
          closureApprovedBy: data.approvedBy,
        });
        break;

      case "completeTraining":
        result = await CAPAService.completeTraining(params.id);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating CAPA:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update CAPA" },
      { status: 500 },
    );
  }
}
