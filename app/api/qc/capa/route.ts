import { NextRequest, NextResponse } from "next/server";
import { CAPAService } from "@/lib/services/qc/capa-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status") as any;
    const capaType = searchParams.get("capaType") as any;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const capas = await CAPAService.listCAPAs(organizationId, {
      status,
      capaType,
    });

    return NextResponse.json(capas);
  } catch (error: any) {
    console.error("Error listing CAPAs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list CAPAs" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const capa = await CAPAService.createCAPA(body);

    return NextResponse.json(capa, { status: 201 });
  } catch (error: any) {
    console.error("Error creating CAPA:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create CAPA" },
      { status: 500 },
    );
  }
}
