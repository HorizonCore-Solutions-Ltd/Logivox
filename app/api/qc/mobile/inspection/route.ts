import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lotNumber, result, defects, sampleSize, photos, notes, signature } =
      body;

    // Record inspection in database
    const inspection = await prisma.qualityMeasurement.create({
      data: {
        measurementNumber: `MOBILE-${Date.now()}`,
        organizationId: "default", // TODO: Get from auth
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
        measuredBy: "Mobile User", // TODO: Get from auth
        calibrationCurrent: true,
        createdBy: "Mobile User",
        notes: `Sample: ${sampleSize}, Defects: ${defects}\n${notes}`,
        // Store photos and signature in metadata
      },
    });

    // If failed, create NCR
    if (result === "FAIL") {
      await prisma.nonConformanceReport.create({
        data: {
          ncrNumber: `NCR-MOBILE-${Date.now()}`,
          organizationId: "default", // TODO: Get from auth
          title: `Mobile Inspection Failure - ${lotNumber}`,
          description: notes || "Failed mobile inspection",
          discoveredBy: "Mobile User", // TODO: Get from auth
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
          createdBy: "Mobile User",
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
