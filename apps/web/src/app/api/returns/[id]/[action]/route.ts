import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT /api/returns/[id]/approve|receive|complete
export async function PUT(
  _request: Request,
  { params }: { params: { id: string; action: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, action } = params;

    const rma = await prisma.rMA.findUnique({ where: { id } });
    if (!rma) {
      return NextResponse.json({ error: "RMA not found" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "approve":
        if (!["PENDING"].includes(rma.status)) {
          return NextResponse.json({ error: "RMA must be PENDING to approve" }, { status: 400 });
        }
        updateData = { status: "APPROVED", approvedDate: new Date() };
        break;

      case "receive":
        if (!["APPROVED", "IN_TRANSIT"].includes(rma.status)) {
          return NextResponse.json({ error: "RMA must be APPROVED or IN_TRANSIT to receive" }, { status: 400 });
        }
        updateData = { status: "RECEIVED", receivedDate: new Date() };
        break;

      case "complete":
        if (!["RECEIVED", "INSPECTING"].includes(rma.status)) {
          return NextResponse.json({ error: "RMA must be RECEIVED or INSPECTING to complete" }, { status: 400 });
        }
        updateData = { status: "COMPLETED", completedDate: new Date() };
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const updated = await prisma.rMA.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { name: true } },
        returnReason: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, rma: updated });
  } catch (error) {
    console.error(`PUT /api/returns/${params.id}/${params.action} error:`, error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
