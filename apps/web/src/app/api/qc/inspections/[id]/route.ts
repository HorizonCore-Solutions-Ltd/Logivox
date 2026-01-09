import { NextResponse } from "next/server";
import QCInspectionService from "@/lib/services/qc/inspection-service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const inspection = await QCInspectionService.getInspectionById(params.id);

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ inspection });
  } catch (error: any) {
    console.error("Error fetching inspection:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    if (action === "start") {
      const inspection = await QCInspectionService.startInspection(
        params.id,
        userId,
      );
      return NextResponse.json({ inspection });
    }

    if (action === "complete") {
      const inspection = await QCInspectionService.completeInspection(
        params.id,
        userId,
        body.overallNotes,
      );
      return NextResponse.json({ inspection });
    }

    if (action === "addItem") {
      const item = await QCInspectionService.addInspectionItem(
        params.id,
        body.itemData,
      );
      return NextResponse.json({ item });
    }

    if (action === "recordDefect") {
      const defect = await QCInspectionService.recordDefect(
        params.id,
        body.defectData,
      );
      return NextResponse.json({ defect });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating inspection:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
