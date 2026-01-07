import { NextRequest, NextResponse } from "next/server";
import { qrReturnService } from "@/lib/services/returns/qr-return-service";

/**
 * POST /api/returns/qr-code
 * Generate QR code for label-less return
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rmaId, organizationId } = body;

    if (!rmaId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields: rmaId, organizationId" },
        { status: 400 },
      );
    }

    const qrReturn = await qrReturnService.generateQRCodeReturn({
      rmaId,
      organizationId,
    });

    return NextResponse.json({
      success: true,
      qrReturn,
    });
  } catch (error: any) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate QR code" },
      { status: 500 },
    );
  }
}
