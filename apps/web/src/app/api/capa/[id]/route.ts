import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const capa = await prisma.correctivePreventiveAction.findUnique({
      where: { id: params.id, organizationId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!capa) {
      return NextResponse.json({ error: "CAPA not found" }, { status: 404 });
    }

    return NextResponse.json(capa);
  } catch (error) {
    console.error("GET /api/capa/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch CAPA" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const body = await request.json();
    
    // Basic update logic
    const updated = await prisma.correctivePreventiveAction.update({
      where: { id: params.id, organizationId },
      data: body,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/capa/[id] error:", error);
    return NextResponse.json({ error: "Failed to update CAPA" }, { status: 500 });
  }
}
