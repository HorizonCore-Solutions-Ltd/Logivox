import { NextRequest, NextResponse } from "next/server";
import { CustomerComplaintService } from "@/lib/services/qc/customer-complaint.service";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const complaint = await CustomerComplaintService.registerComplaint({
      organizationId: body.organizationId,
      customerId: body.customerId,
      customerName: body.customerName,
      contactPerson: body.contactPerson,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      complaintDate: new Date(body.complaintDate),
      receivedVia: body.receivedVia,
      productId: body.productId,
      productName: body.productName,
      lotNumber: body.lotNumber,
      serialNumber: body.serialNumber,
      quantityAffected: body.quantityAffected,
      complaintDescription: body.complaintDescription,
      severity: body.severity,
      category: body.category,
      reportedBy: session.user.email || "",
      attachments: body.attachments,
    });

    return NextResponse.json(complaint);
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

    const stats = await CustomerComplaintService.getStatistics({
      organizationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
