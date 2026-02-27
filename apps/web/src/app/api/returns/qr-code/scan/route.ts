import { NextRequest, NextResponse } from "next/server";
import { qrReturnService } from "@/lib/services/returns/qr-return-service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * POST /api/returns/qr-code/scan
 * Scan QR code and generate shipping label (carrier integration)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await request.json();
    const { qrCode, scannedLocation, scannedBy } = body;

    if (!qrCode) {
      return NextResponse.json(
        { error: "Missing required field: qrCode" },
        { status: 400 },
      );
    }

    const result = await qrReturnService.scanQRCode({
      qrCode,
      scannedLocation,
      scannedBy,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("QR scan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to scan QR code" },
      { status: 500 },
    );
  }
}
