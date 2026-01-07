import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ApproveDARSchema = z.object({
  supervisorSignature: z.string(),
});

// POST /api/security/daily-reports/[id]/approve - Approve report
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = ApproveDARSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const report = await prisma.dailyActivityReport.updateMany({
      where: {
        id: params.id,
        organizationId,
        status: "SUBMITTED",
      },
      data: {
        status: "APPROVED",
        supervisorSignature: body.supervisorSignature,
        supervisorSignedAt: new Date(),
        approvedAt: new Date(),
      },
    });

    if (report.count === 0) {
      return NextResponse.json(
        { error: "Report not found or not in submitted state" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error approving daily report:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
