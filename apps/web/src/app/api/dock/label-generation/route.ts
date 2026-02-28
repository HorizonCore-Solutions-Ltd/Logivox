import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

const DEPRECATION = {
  error: "Endpoint deprecated",
  message:
    "Dock label generation has moved to dedicated shipping label services.",
};

export async function GET(_request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  return NextResponse.json(DEPRECATION, { status: 410 });
}

export async function POST(_request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  return NextResponse.json(DEPRECATION, { status: 410 });
}
