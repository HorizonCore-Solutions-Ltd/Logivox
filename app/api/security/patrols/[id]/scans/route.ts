import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ScanCheckpointSchema = z.object({
  checkpointId: z.string(),
  guardId: z.string(),
  scanMethod: z.enum(["QR_CODE", "NFC", "GPS", "MANUAL"]),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
  issueReported: z.boolean().optional(),
  issueDescription: z.string().optional(),
});

// POST /api/security/patrols/[id]/scan - Scan checkpoint
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
    const body = ScanCheckpointSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    // Get patrol execution
    const execution = await prisma.patrolExecution.findFirst({
      where: {
        id: params.id,
        organizationId,
        status: "IN_PROGRESS",
      },
    });

    if (!execution) {
      return NextResponse.json(
        { error: "Patrol execution not found or not active" },
        { status: 404 },
      );
    }

    // Get checkpoint details
    const checkpoint = await prisma.patrolCheckpoint.findFirst({
      where: {
        id: body.checkpointId,
        organizationId,
        routeId: execution.routeId,
      },
    });

    if (!checkpoint) {
      return NextResponse.json(
        { error: "Checkpoint not found" },
        { status: 404 },
      );
    }

    // Validate GPS location if checkpoint requires it
    if (
      checkpoint.checkpointType === "GPS" &&
      checkpoint.gpsLat &&
      checkpoint.gpsLng
    ) {
      if (!body.gpsLat || !body.gpsLng) {
        return NextResponse.json(
          { error: "GPS location required for this checkpoint" },
          { status: 400 },
        );
      }

      // Calculate distance
      const R = 6371000; // meters
      const φ1 = (checkpoint.gpsLat * Math.PI) / 180;
      const φ2 = (body.gpsLat * Math.PI) / 180;
      const Δφ = ((body.gpsLat - checkpoint.gpsLat) * Math.PI) / 180;
      const Δλ = ((body.gpsLng - checkpoint.gpsLng) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      const allowedRadius = checkpoint.gpsRadius || 50;
      if (distance > allowedRadius) {
        return NextResponse.json(
          {
            error: "Too far from checkpoint",
            distance: Math.round(distance),
            allowedRadius,
          },
          { status: 400 },
        );
      }
    }

    // Check if checkpoint already scanned
    const existingScan = await prisma.checkpointScan.findFirst({
      where: {
        checkpointId: body.checkpointId,
        executionId: params.id,
      },
    });

    if (existingScan) {
      return NextResponse.json(
        { error: "Checkpoint already scanned" },
        { status: 400 },
      );
    }

    // Create scan
    const scan = await prisma.checkpointScan.create({
      data: {
        organizationId,
        checkpointId: body.checkpointId,
        executionId: params.id,
        guardId: body.guardId,
        scanMethod: body.scanMethod,
        gpsLat: body.gpsLat,
        gpsLng: body.gpsLng,
        photoUrl: body.photoUrl,
        notes: body.notes,
        issueReported: body.issueReported || false,
        issueDescription: body.issueDescription,
      },
    });

    // Update patrol execution progress
    const scannedCount = await prisma.checkpointScan.count({
      where: { executionId: params.id },
    });

    const completionRate = (scannedCount / execution.totalCheckpoints) * 100;

    await prisma.patrolExecution.update({
      where: { id: params.id },
      data: {
        scannedCheckpoints: scannedCount,
        completionRate,
      },
    });

    return NextResponse.json({
      scan,
      progress: {
        scanned: scannedCount,
        total: execution.totalCheckpoints,
        completionRate: Math.round(completionRate),
      },
    });
  } catch (error: any) {
    console.error("Error scanning checkpoint:", error);
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
