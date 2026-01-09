import { NextRequest, NextResponse } from "next/server";
import { ChangeControlService } from "@/lib/services/qc/change-control.service";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const change = await ChangeControlService.createChangeRequest({
      organizationId: body.organizationId,
      changeType: body.changeType,
      title: body.title,
      description: body.description,
      reasonForChange: body.reasonForChange,
      urgency: body.urgency,
      requestedBy: session.user.email || "",
      department: body.department,
      affectedProducts: body.affectedProducts,
      affectedDocuments: body.affectedDocuments,
      estimatedCost: body.estimatedCost,
      estimatedImplementationTime: body.estimatedImplementationTime,
      customerImpact: body.customerImpact,
      regulatoryImpact: body.regulatoryImpact,
      validationRequired: body.validationRequired,
      attachments: body.attachments,
    });

    return NextResponse.json(change);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId required" },
        { status: 400 },
      );
    }

    const stats = await ChangeControlService.getStatistics({
      organizationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
