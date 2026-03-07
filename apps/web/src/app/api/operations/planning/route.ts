import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const waves = await prisma.wavePick.findMany({
      where: {
        organizationId,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Mock labor recommendations if none exist
    const recommendations = [
      {
        id: "r1",
        zone: "Zone A",
        action: "ADD_LABOR",
        count: 2,
        reason: "High pick density",
      },
      {
        id: "r2",
        zone: "Packing",
        action: "REDUCE_LABOR",
        count: 1,
        reason: "Idle time > 20%",
      },
    ];

    return NextResponse.json({ waves, recommendations });
  } catch (error) {
    console.error("GET /api/operations/planning error:", error);
    return NextResponse.json(
      { error: "Failed to fetch planning data" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Simulate wave creation
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const body = await request.json();
    // Here we would typically call the wave engine
    // For now, just create a record
    const wave = await prisma.wavePick.create({
      data: {
        organizationId,
        warehouseId: "default", // Should come from context
        waveNumber: `WAVE-${Date.now()}`,
        name: body.name || "Manual Wave",
        waveType: body.type || "SINGLE_ORDER",
        strategy: "FIFO",
        groupingCriteria: {},
        status: "PLANNED",
        progress: 0,
      },
    });
    return NextResponse.json(wave);
  } catch (err) {
    console.error("POST /api/operations/planning error:", err);
    return NextResponse.json(
      { error: "Failed to create wave" },
      { status: 500 },
    );
  }
}
