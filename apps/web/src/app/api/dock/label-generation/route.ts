import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEPRECATION = {
	error: "Endpoint deprecated",
	message: "Dock label generation has moved to dedicated shipping label services.",
};

export async function GET(_request: NextRequest) {
	return NextResponse.json(DEPRECATION, { status: 410 });
}

export async function POST(_request: NextRequest) {
	return NextResponse.json(DEPRECATION, { status: 410 });
}
