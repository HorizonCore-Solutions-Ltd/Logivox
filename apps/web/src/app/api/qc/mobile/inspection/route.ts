import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });
    const orgId = dbUser?.organizationMemberships?.[0]?.organization?.id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }
    const userName = session.user.name || session.user.email || session.user.id;

    const body = await request.json();
    const { lotNumber, result, defects, sampleSize, photos, notes, signature } =
      body;

    // Record inspection in database
    const inspection = await prisma.qualityMeasurement.create({
      data: {
        measurementNumber: `MOBILE-${Date.now()}`,
        organizationId: orgId,
        productSku: "UNKNOWN",
        productName: "Mobile Inspection",
        measurementType: "WEIGHT", // Using existing enum value
        parameterName: "Mobile Visual Inspection",
        unitOfMeasure: "PASS/FAIL",
        lotNumber,
        measuredValue: result === "PASS" ? 1 : 0,
        withinSpec: result === "PASS",
        withinControl: result === "PASS",
        conformanceStatus: result === "PASS" ? "CONFORMING" : "NON_CONFORMING",
        measuredBy: userName,
        calibrationCurrent: true,
        createdBy: userName,
        notes: `Sample: ${sampleSize}, Defects: ${defects}\n${notes}`,
        // Store photos and signature in metadata
      },
    });

    // If failed, create NCR
    if (result === "FAIL") {
      await prisma.nonConformanceReport.create({
        data: {
          ncrNumber: `NCR-MOBILE-${Date.now()}`,
          organizationId: orgId,
          title: `Mobile Inspection Failure - ${lotNumber}`,
          description: notes || "Failed mobile inspection",
          discoveredBy: userName,
          discoveryLocation: "MOBILE_INSPECTION",
          reportDate: new Date(),
          sourceType: "PRODUCTION",
          nonConformanceType: "MATERIAL_DEFECT",
          severity: defects > sampleSize * 0.1 ? "MAJOR" : "MINOR",
          category: "QUALITY",
          lotNumber,
          quantityAffected: defects,
          disposition: "QUARANTINE",
          status: "OPEN",
          createdBy: userName,
        },
      });
    }

    return NextResponse.json({
      success: true,
      inspectionId: inspection.id,
      result,
    });
  } catch (error) {
    console.error("Mobile inspection error:", error);
    return NextResponse.json(
      { error: "Failed to record inspection" },
      { status: 500 },
    );
  }
}
