import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateDARSchema = z.object({
  observations: z.string().optional(),
  significantEvents: z.string().optional(),
  handoverNotes: z.string().optional(),
  guardSignature: z.string().optional(),
});

// PATCH /api/security/daily-reports/[id] - Update report
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = UpdateDARSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const updateData: any = { ...body };
    if (body.guardSignature) {
      updateData.guardSignedAt = new Date();
    }

    const report = await prisma.dailyActivityReport.updateMany({
      where: {
        id: params.id,
        organizationId,
      },
      data: updateData,
    });

    if (report.count === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating daily report:", error);
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
