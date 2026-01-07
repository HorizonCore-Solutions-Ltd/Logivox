import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VerifyManifestSchema = z.object({
  verifiedBy: z.string(),
  verificationStatus: z.enum(["VERIFIED", "DISCREPANCY"]),
  discrepancyNotes: z.string().optional(),
});

// PATCH /api/security/manifests/[id]/verify - Verify manifest
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
    const body = VerifyManifestSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const manifest = await prisma.truckManifest.updateMany({
      where: {
        id: params.id,
        organizationId,
      },
      data: {
        verificationStatus: body.verificationStatus,
        verifiedBy: body.verifiedBy,
        verifiedAt: new Date(),
        discrepancyNotes: body.discrepancyNotes,
      },
    });

    if (manifest.count === 0) {
      return NextResponse.json(
        { error: "Manifest not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error verifying manifest:", error);
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
