/**
 * @deprecated  This route has been consolidated into /api/qc/inspections (Q-19).
 * All requests are permanently redirected to the canonical endpoint.
 */
import { NextRequest, NextResponse } from "next/server";

const CANONICAL = "/api/qc/inspections";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  return NextResponse.redirect(
    new URL(`${CANONICAL}${qs ? `?${qs}` : ""}`, request.url),
    { status: 308 },
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.redirect(new URL(CANONICAL, request.url), {
    status: 308,
  });
}

export async function PUT(request: NextRequest) {
  return NextResponse.redirect(new URL(CANONICAL, request.url), {
    status: 308,
  });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.redirect(new URL(CANONICAL, request.url), {
    status: 308,
  });
}
