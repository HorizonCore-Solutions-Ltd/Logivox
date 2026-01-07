import { NextRequest, NextResponse } from "next/server";
import { MRBService } from "@/lib/services/qc/mrb.service";
import { getServerSession } from "next-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const mrb = await MRBService.recordDisposition({
      mrbId: params.id,
      disposition: body.disposition,
      dispositionJustification: body.dispositionJustification,
      conditions: body.conditions,
      reworkInstructions: body.reworkInstructions,
      inspectionRequirements: body.inspectionRequirements,
      approvalLevel: body.approvalLevel,
      approvers: body.approvers,
      effectiveDate: new Date(body.effectiveDate),
      expirationDate: body.expirationDate
        ? new Date(body.expirationDate)
        : undefined,
      limitedQuantity: body.limitedQuantity,
      costImpact: body.costImpact,
      scheduleImpact: body.scheduleImpact,
      customerNotificationRequired: body.customerNotificationRequired,
    });

    return NextResponse.json(mrb);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
