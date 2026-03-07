import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, AuthContext } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import {
  AlertCategory,
  NotificationAlertType,
  AlertSeverity,
  NotificationAlertStatus,
} from "@prisma/client";

// Get quality incidents for the dashboard
export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request);
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const incidents = await prisma.alert.findMany({
      where: {
        organizationId,
        category: "QUALITY",
        status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
      },
      take: limit,
      orderBy: { triggeredAt: "desc" },
      include: {
        resolvedBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error("Failed to fetch quality incidents", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Create a new quality incident/alert
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request);
  if ("error" in auth) return auth.error;
  const { session, organizationId } = auth as AuthContext;

  try {
    const body = await request.json();
    const {
      type, // "Safety", "Labeling", "Damage", "Driver"
      description,
      severity, // "HIGH", "MEDIUM", "LOW"
      loadSheetId,
      location, // "Dock 4", "Trailer 123"
      contextData, // Additional metadata
    } = body;

    // Generate a simple unique ID for display
    const incidentNumber = `INC-${Date.now().toString().slice(-6)}`;

    // Create the alert
    const alert = await prisma.alert.create({
      data: {
        organizationId,
        alertNumber: incidentNumber,
        category: "QUALITY",
        alertType: "EVENT",
        severity: (severity as AlertSeverity) || "MEDIUM",
        title: `${type} Incident Reported`,
        message: description,
        status: "ACTIVE",
        relatedEntityType: loadSheetId ? "LOAD_SHEET" : undefined,
        relatedEntityId: loadSheetId,
        triggeredAt: new Date(),
        data: {
          reportedBy: session?.user?.id,
          location,
          context: contextData,
          incidentType: type,
        },
      },
    });

    // If loadSheetId is present, try to log an event on the load sheet too
    if (loadSheetId) {
      try {
        await prisma.loadSheetEvent.create({
          data: {
            organizationId,
            loadSheetId,
            eventType: "MODIFIED",
            userId: session?.user?.id,
            notes: `Quality Incident Reported: ${type} - ${description}`,
            eventData: { alertId: alert.id },
          },
        });
      } catch (eventError) {
        console.warn("Could not create LoadSheetEvent", eventError);
      }
    }

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    console.error("Failed to create quality incident", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
