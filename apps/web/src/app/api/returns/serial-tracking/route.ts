import { NextRequest, NextResponse } from "next/server";
import { serialTrackingService } from "@/lib/services/returns/serial-tracking-service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * POST /api/returns/serial-tracking/validate
 * Validate serial number on return
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await request.json();
    const { rmaId, serialNumber, sku, organizationId } = body;

    if (!rmaId || !serialNumber || !sku || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const validation = await serialTrackingService.validateReturnSerial({
      rmaId,
      serialNumber,
      sku,
      organizationId,
    });

    return NextResponse.json({
      success: true,
      validation,
    });
  } catch (error: any) {
    console.error("Serial validation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate serial number" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/returns/serial-tracking/[serialNumber]
 * Get serial number lifecycle
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const serialNumber = searchParams.get("serialNumber");

    if (!serialNumber || !organizationId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const lifecycle = await serialTrackingService.getSerialLifecycle({
      serialNumber,
      organizationId,
    });

    return NextResponse.json({
      success: true,
      lifecycle,
    });
  } catch (error: any) {
    console.error("Get lifecycle error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get serial lifecycle" },
      { status: 500 },
    );
  }
}
