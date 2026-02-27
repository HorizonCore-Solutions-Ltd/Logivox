import { NextResponse } from "next/server";
import RTVService from "@/lib/services/qc/rtv-service";
import { requireApiAuth } from "@/lib/api-guard";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;
    const rtv = await RTVService.getRTVById(params.id);

    if (!rtv) {
      return NextResponse.json({ error: "RTV not found" }, { status: 404 });
    }

    return NextResponse.json({ rtv });
  } catch (error: any) {
    console.error("Error fetching RTV:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;
    const body = await request.json();
    const { action, userId } = body;

    if (action === "notifyVendor") {
      const result = await RTVService.notifyVendor(params.id, userId);
      return NextResponse.json(result);
    }

    if (action === "approve") {
      const rtv = await RTVService.approveRTV(params.id, userId, body.notes);
      return NextResponse.json({ rtv });
    }

    if (action === "reject") {
      const rtv = await RTVService.rejectRTV(params.id, userId, body.reason);
      return NextResponse.json({ rtv });
    }

    if (action === "ship") {
      const rtv = await RTVService.shipRTV(
        params.id,
        userId,
        body.shippingData,
      );
      return NextResponse.json({ rtv });
    }

    if (action === "recordVendorResponse") {
      const rtv = await RTVService.recordVendorResponse(
        params.id,
        userId,
        body.responseData,
      );
      return NextResponse.json({ rtv });
    }

    if (action === "recordCredit") {
      const rtv = await RTVService.recordCredit(
        params.id,
        userId,
        body.creditData,
      );
      return NextResponse.json({ rtv });
    }

    if (action === "close") {
      const rtv = await RTVService.closeRTV(params.id, userId, body.notes);
      return NextResponse.json({ rtv });
    }

    // Generic update
    const rtv = await RTVService.updateRTV(params.id, body.data, userId);
    return NextResponse.json({ rtv });
  } catch (error: any) {
    console.error("Error updating RTV:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
