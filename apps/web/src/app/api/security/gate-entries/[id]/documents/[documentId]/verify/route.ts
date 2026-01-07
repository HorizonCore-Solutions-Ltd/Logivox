import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const verifySchema = z.object({
  verified: z.boolean(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; documentId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: gateEntryId, documentId } = params;

    // Verify gate entry exists and belongs to organization
    const gateEntry = await prisma.gateEntry.findFirst({
      where: {
        id: gateEntryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!gateEntry) {
      return NextResponse.json(
        { error: "Gate entry not found" },
        { status: 404 },
      );
    }

    // Verify document exists
    const document = await prisma.gateDocument.findFirst({
      where: {
        id: documentId,
        gateEntryId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const data = verifySchema.parse(body);

    // Update document verification
    const updated = await prisma.gateDocument.update({
      where: { id: documentId },
      data: {
        verified: data.verified,
        verifiedBy: data.verified ? session.user.id : null,
        verifiedAt: data.verified ? new Date() : null,
        notes: data.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error verifying document:", error);
    return NextResponse.json(
      { error: "Failed to verify document" },
      { status: 500 },
    );
  }
}
