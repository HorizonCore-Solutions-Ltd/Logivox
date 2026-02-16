import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schemas
const checkInSchema = z.object({
  appointmentId: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  driverLicense: z.string(),
  driverPhone: z.string(),
  tractorNumber: z.string(),
  trailerNumber: z.string(),
  carrierName: z.string(),
  carrierDOT: z.string().optional(),
  sealNumber: z.string().optional(),
  notes: z.string().optional(),
});

const checkOutSchema = z.object({
  checkInId: z.string(),
  completedDocuments: z.array(z.string()),
  sealVerified: z.boolean(),
  trailerSecured: z.boolean(),
  paperworkComplete: z.boolean(),
  notes: z.string().optional(),
});

const detentionSchema = z.object({
  checkInId: z.string(),
  reason: z.enum([
    "LOADING_DELAY",
    "DOCK_UNAVAILABLE",
    "MISSING_PAPERWORK",
    "EQUIPMENT_ISSUE",
    "OTHER",
  ]),
  expectedDuration: z.number().int().positive(),
});

// Mock database
interface CarrierCheckIn {
  id: string;
  appointmentId: string;
  shipmentId: string;
  dockId: string;
  driverId: string;
  driverName: string;
  driverLicense: string;
  driverPhone: string;
  tractorNumber: string;
  trailerNumber: string;
  carrierName: string;
  carrierDOT?: string;
  sealNumber?: string;
  checkInTime: Date;
  scheduledTime: Date;
  checkOutTime?: Date;
  status: string;
  detentionMinutes: number;
  detentionReason?: string;
  notes?: string;
}

interface Document {
  id: string;
  checkInId: string;
  documentType: string;
  status: string;
  uploadedAt?: Date;
  fileUrl?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

interface DetentionEvent {
  id: string;
  checkInId: string;
  reason: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  cost: number;
  status: string;
}

interface CarrierMetrics {
  totalCheckIns: number;
  activeDrivers: number;
  avgCheckInTime: number;
  avgCheckOutTime: number;
  avgDetentionTime: number;
  onTimePercentage: number;
  totalDetentionCost: number;
  carrierPerformance: Array<{
    carrierId: string;
    carrierName: string;
    totalVisits: number;
    avgDetentionTime: number;
    onTimePercentage: number;
    rating: number;
  }>;
  detentionReasons: Array<{
    reason: string;
    count: number;
    totalMinutes: number;
    avgMinutes: number;
  }>;
}

// Mock data
const checkIns: CarrierCheckIn[] = [
  {
    id: "CHK-001",
    appointmentId: "APT-001",
    shipmentId: "SHIP-2401-001",
    dockId: "DOCK-01",
    driverId: "DRV-101",
    driverName: "John Smith",
    driverLicense: "CDL-12345",
    driverPhone: "555-0101",
    tractorNumber: "TRC-789",
    trailerNumber: "TRL-456",
    carrierName: "Swift Transport",
    carrierDOT: "DOT-123456",
    sealNumber: "SEAL-9876",
    checkInTime: new Date("2024-01-08T08:15:00"),
    scheduledTime: new Date("2024-01-08T08:00:00"),
    status: "LOADING",
    detentionMinutes: 0,
  },
  {
    id: "CHK-002",
    appointmentId: "APT-002",
    shipmentId: "SHIP-2401-002",
    dockId: "DOCK-03",
    driverId: "DRV-102",
    driverName: "Maria Garcia",
    driverLicense: "CDL-67890",
    driverPhone: "555-0202",
    tractorNumber: "TRC-321",
    trailerNumber: "TRL-654",
    carrierName: "XPO Logistics",
    carrierDOT: "DOT-654321",
    checkInTime: new Date("2024-01-08T06:30:00"),
    scheduledTime: new Date("2024-01-08T07:00:00"),
    checkOutTime: new Date("2024-01-08T08:45:00"),
    status: "CHECKED_OUT",
    detentionMinutes: 45,
    detentionReason: "LOADING_DELAY",
  },
  {
    id: "CHK-003",
    appointmentId: "APT-003",
    shipmentId: "SHIP-2401-003",
    dockId: "DOCK-05",
    driverId: "DRV-103",
    driverName: "David Chen",
    driverLicense: "CDL-11223",
    driverPhone: "555-0303",
    tractorNumber: "TRC-555",
    trailerNumber: "TRL-888",
    carrierName: "J.B. Hunt",
    carrierDOT: "DOT-789012",
    sealNumber: "SEAL-5432",
    checkInTime: new Date("2024-01-08T09:00:00"),
    scheduledTime: new Date("2024-01-08T09:00:00"),
    status: "WAITING",
    detentionMinutes: 0,
    notes: "Waiting for dock assignment",
  },
];

const documents: Document[] = [
  {
    id: "DOC-001",
    checkInId: "CHK-001",
    documentType: "BOL",
    status: "VERIFIED",
    uploadedAt: new Date("2024-01-08T08:20:00"),
    verifiedBy: "Supervisor 1",
    verifiedAt: new Date("2024-01-08T08:22:00"),
  },
  {
    id: "DOC-002",
    checkInId: "CHK-001",
    documentType: "SHIPPING_MANIFEST",
    status: "PENDING",
    uploadedAt: new Date("2024-01-08T08:20:00"),
  },
  {
    id: "DOC-003",
    checkInId: "CHK-002",
    documentType: "BOL",
    status: "VERIFIED",
    uploadedAt: new Date("2024-01-08T06:35:00"),
    verifiedBy: "Supervisor 2",
    verifiedAt: new Date("2024-01-08T06:40:00"),
  },
];

const detentionEvents: DetentionEvent[] = [
  {
    id: "DET-001",
    checkInId: "CHK-002",
    reason: "LOADING_DELAY",
    startTime: new Date("2024-01-08T07:30:00"),
    endTime: new Date("2024-01-08T08:15:00"),
    duration: 45,
    cost: 75,
    status: "COMPLETED",
  },
];

// Detention cost calculation: $100/hour after 2 hour free time
const calculateDetentionCost = (minutes: number): number => {
  const freeTimeMinutes = 120; // 2 hours free time
  if (minutes <= freeTimeMinutes) return 0;
  const billableMinutes = minutes - freeTimeMinutes;
  return (billableMinutes / 60) * 100;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "check_in": {
        const data = checkInSchema.parse(body);

        const newCheckIn: CarrierCheckIn = {
          id: `CHK-${String(checkIns.length + 1).padStart(3, "0")}`,
          appointmentId: data.appointmentId,
          shipmentId: `SHIP-${data.appointmentId}`, // Would lookup from appointment
          dockId: "DOCK-TBD", // Would be assigned
          driverId: data.driverId,
          driverName: data.driverName,
          driverLicense: data.driverLicense,
          driverPhone: data.driverPhone,
          tractorNumber: data.tractorNumber,
          trailerNumber: data.trailerNumber,
          carrierName: data.carrierName,
          carrierDOT: data.carrierDOT,
          sealNumber: data.sealNumber,
          checkInTime: new Date(),
          scheduledTime: new Date(), // Would come from appointment
          status: "CHECKED_IN",
          detentionMinutes: 0,
          notes: data.notes,
        };

        checkIns.push(newCheckIn);

        // Create required documents
        const requiredDocs = ["BOL", "SHIPPING_MANIFEST", "INSPECTION_REPORT"];
        requiredDocs.forEach((docType) => {
          documents.push({
            id: `DOC-${String(documents.length + 1).padStart(3, "0")}`,
            checkInId: newCheckIn.id,
            documentType: docType,
            status: "PENDING",
          });
        });

        return NextResponse.json({
          success: true,
          checkIn: newCheckIn,
          message: "Driver checked in successfully",
        });
      }

      case "check_out": {
        const data = checkOutSchema.parse(body);

        const checkIn = checkIns.find((c) => c.id === data.checkInId);
        if (!checkIn) {
          return NextResponse.json(
            { error: "Check-in not found" },
            { status: 404 },
          );
        }

        // Calculate total time and detention
        checkIn.checkOutTime = new Date();
        const totalMinutes =
          (checkIn.checkOutTime.getTime() - checkIn.checkInTime.getTime()) /
          1000 /
          60;
        const scheduledMinutes = 120; // 2 hours standard

        if (totalMinutes > scheduledMinutes) {
          checkIn.detentionMinutes = Math.round(
            totalMinutes - scheduledMinutes,
          );
        }

        // Validate checkout requirements
        const allDocsComplete = data.completedDocuments.length >= 3;
        const canCheckout =
          data.sealVerified &&
          data.trailerSecured &&
          data.paperworkComplete &&
          allDocsComplete;

        if (!canCheckout) {
          return NextResponse.json(
            {
              success: false,
              error: "Checkout requirements not met",
              missing: {
                sealVerified: !data.sealVerified,
                trailerSecured: !data.trailerSecured,
                paperworkComplete: !data.paperworkComplete,
                documentsComplete: !allDocsComplete,
              },
            },
            { status: 400 },
          );
        }

        checkIn.status = "CHECKED_OUT";

        const detentionCost = calculateDetentionCost(checkIn.detentionMinutes);

        return NextResponse.json({
          success: true,
          checkIn: checkIn,
          detentionMinutes: checkIn.detentionMinutes,
          detentionCost: detentionCost,
          message: "Driver checked out successfully",
        });
      }

      case "start_detention": {
        const data = detentionSchema.parse(body);

        const checkIn = checkIns.find((c) => c.id === data.checkInId);
        if (!checkIn) {
          return NextResponse.json(
            { error: "Check-in not found" },
            { status: 404 },
          );
        }

        const detentionEvent: DetentionEvent = {
          id: `DET-${String(detentionEvents.length + 1).padStart(3, "0")}`,
          checkInId: data.checkInId,
          reason: data.reason,
          startTime: new Date(),
          duration: 0,
          cost: 0,
          status: "ACTIVE",
        };

        detentionEvents.push(detentionEvent);
        checkIn.detentionReason = data.reason;

        // Send notification to carrier
        console.log("DETENTION STARTED - Notifying carrier:", {
          carrier: checkIn.carrierName,
          driver: checkIn.driverName,
          reason: data.reason,
        });

        return NextResponse.json({
          success: true,
          detentionEvent: detentionEvent,
          message: "Detention tracking started",
        });
      }

      case "end_detention": {
        const { detentionId } = body;

        const detention = detentionEvents.find((d) => d.id === detentionId);
        if (!detention) {
          return NextResponse.json(
            { error: "Detention event not found" },
            { status: 404 },
          );
        }

        detention.endTime = new Date();
        detention.duration = Math.round(
          (detention.endTime.getTime() - detention.startTime.getTime()) /
            1000 /
            60,
        );
        detention.cost = calculateDetentionCost(detention.duration);
        detention.status = "COMPLETED";

        const checkIn = checkIns.find((c) => c.id === detention.checkInId);
        if (checkIn) {
          checkIn.detentionMinutes = detention.duration;
        }

        return NextResponse.json({
          success: true,
          detention: detention,
          message: "Detention tracking ended",
        });
      }

      case "update_document": {
        const { documentId, status, fileUrl } = body;

        const document = documents.find((d) => d.id === documentId);
        if (!document) {
          return NextResponse.json(
            { error: "Document not found" },
            { status: 404 },
          );
        }

        document.status = status;
        if (fileUrl) document.fileUrl = fileUrl;
        if (status === "VERIFIED") {
          document.verifiedBy = session.user.name || "Unknown";
          document.verifiedAt = new Date();
        }

        return NextResponse.json({
          success: true,
          document: document,
          message: "Document updated",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in carrier management API:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const checkInId = searchParams.get("checkInId");

    switch (action) {
      case "check_in": {
        if (!checkInId) {
          return NextResponse.json(
            { error: "Check-in ID required" },
            { status: 400 },
          );
        }

        const checkIn = checkIns.find((c) => c.id === checkInId);
        if (!checkIn) {
          return NextResponse.json(
            { error: "Check-in not found" },
            { status: 404 },
          );
        }

        const checkInDocuments = documents.filter(
          (d) => d.checkInId === checkInId,
        );
        const checkInDetention = detentionEvents.filter(
          (d) => d.checkInId === checkInId,
        );

        // Calculate current detention if still checked in
        let currentDetention = 0;
        if (checkIn.status !== "CHECKED_OUT") {
          const now = new Date();
          const totalMinutes =
            (now.getTime() - checkIn.checkInTime.getTime()) / 1000 / 60;
          const scheduledMinutes = 120;
          if (totalMinutes > scheduledMinutes) {
            currentDetention = Math.round(totalMinutes - scheduledMinutes);
          }
        }

        return NextResponse.json({
          checkIn,
          documents: checkInDocuments,
          detention: checkInDetention,
          currentDetention,
          detentionCost: calculateDetentionCost(
            currentDetention || checkIn.detentionMinutes,
          ),
        });
      }

      case "active_check_ins": {
        const activeCheckIns = checkIns.filter(
          (c) => c.status !== "CHECKED_OUT",
        );

        // Calculate current detention for each
        const enrichedCheckIns = activeCheckIns.map((checkIn) => {
          const now = new Date();
          const totalMinutes =
            (now.getTime() - checkIn.checkInTime.getTime()) / 1000 / 60;
          const scheduledMinutes = 120;
          const currentDetention =
            totalMinutes > scheduledMinutes
              ? Math.round(totalMinutes - scheduledMinutes)
              : 0;

          return {
            ...checkIn,
            currentDetention,
            detentionCost: calculateDetentionCost(currentDetention),
          };
        });

        return NextResponse.json({
          checkIns: enrichedCheckIns,
        });
      }

      case "detention_report": {
        const allDetention = detentionEvents;

        // Group by reason
        const byReason = allDetention.reduce(
          (acc, d) => {
            if (!acc[d.reason]) {
              acc[d.reason] = {
                reason: d.reason,
                count: 0,
                totalMinutes: 0,
                avgMinutes: 0,
              };
            }
            acc[d.reason].count++;
            acc[d.reason].totalMinutes += d.duration;
            return acc;
          },
          {} as Record<string, any>,
        );

        const detentionReasons = Object.values(byReason).map((item: any) => ({
          ...item,
          avgMinutes: Math.round(item.totalMinutes / item.count),
        }));

        const totalDetentionCost = allDetention.reduce(
          (sum, d) => sum + d.cost,
          0,
        );

        return NextResponse.json({
          totalEvents: allDetention.length,
          totalCost: totalDetentionCost,
          detentionReasons,
          events: allDetention,
        });
      }

      case "carrier_metrics": {
        const completedCheckIns = checkIns.filter((c) => c.checkOutTime);

        const totalCheckIns = completedCheckIns.length;
        const activeDrivers = checkIns.filter(
          (c) => c.status !== "CHECKED_OUT",
        ).length;

        // Average check-in/out times
        const checkInDelays = completedCheckIns.map((c) => {
          const scheduled = new Date(c.scheduledTime).getTime();
          const actual = new Date(c.checkInTime).getTime();
          return (actual - scheduled) / 1000 / 60;
        });

        const avgCheckInTime =
          checkInDelays.length > 0
            ? checkInDelays.reduce((a, b) => a + b, 0) / checkInDelays.length
            : 0;

        const totalTimes = completedCheckIns.map((c) => {
          const start = new Date(c.checkInTime).getTime();
          const end = new Date(c.checkOutTime!).getTime();
          return (end - start) / 1000 / 60;
        });

        const avgCheckOutTime =
          totalTimes.length > 0
            ? totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length
            : 0;

        const avgDetentionTime =
          completedCheckIns.length > 0
            ? completedCheckIns.reduce(
                (sum, c) => sum + c.detentionMinutes,
                0,
              ) / completedCheckIns.length
            : 0;

        // On-time percentage (within 15 minutes of scheduled)
        const onTimeCheckIns = completedCheckIns.filter((c) => {
          const scheduled = new Date(c.scheduledTime).getTime();
          const actual = new Date(c.checkInTime).getTime();
          const diff = Math.abs(actual - scheduled) / 1000 / 60;
          return diff <= 15;
        });

        const onTimePercentage =
          totalCheckIns > 0 ? (onTimeCheckIns.length / totalCheckIns) * 100 : 0;

        // Total detention cost
        const totalDetentionCost = completedCheckIns.reduce(
          (sum, c) => sum + calculateDetentionCost(c.detentionMinutes),
          0,
        );

        // Carrier performance
        const carrierStats = checkIns.reduce(
          (acc, c) => {
            if (!acc[c.carrierName]) {
              acc[c.carrierName] = {
                carrierId: c.carrierDOT || c.carrierName,
                carrierName: c.carrierName,
                visits: [],
              };
            }
            if (c.checkOutTime) {
              acc[c.carrierName].visits.push(c);
            }
            return acc;
          },
          {} as Record<string, any>,
        );

        const carrierPerformance = Object.values(carrierStats)
          .map((carrier: any) => {
            const totalVisits = carrier.visits.length;
            const avgDetention =
              totalVisits > 0
                ? carrier.visits.reduce(
                    (sum: number, v: CarrierCheckIn) =>
                      sum + v.detentionMinutes,
                    0,
                  ) / totalVisits
                : 0;

            const onTimeVisits = carrier.visits.filter((v: CarrierCheckIn) => {
              const scheduled = new Date(v.scheduledTime).getTime();
              const actual = new Date(v.checkInTime).getTime();
              const diff = Math.abs(actual - scheduled) / 1000 / 60;
              return diff <= 15;
            });

            const onTimePct =
              totalVisits > 0 ? (onTimeVisits.length / totalVisits) * 100 : 0;

            // Rating based on on-time performance and low detention
            const rating = Math.min(
              5,
              Math.max(1, onTimePct / 20 + (120 - avgDetention) / 24),
            );

            return {
              carrierId: carrier.carrierId,
              carrierName: carrier.carrierName,
              totalVisits,
              avgDetentionTime: Math.round(avgDetention),
              onTimePercentage: onTimePct,
              rating: Math.round(rating * 10) / 10,
            };
          })
          .sort((a, b) => b.rating - a.rating);

        // Detention reasons
        const detentionReasons = detentionEvents.reduce(
          (acc, d) => {
            if (!acc[d.reason]) {
              acc[d.reason] = {
                reason: d.reason,
                count: 0,
                totalMinutes: 0,
                avgMinutes: 0,
              };
            }
            acc[d.reason].count++;
            acc[d.reason].totalMinutes += d.duration;
            return acc;
          },
          {} as Record<string, any>,
        );

        const detentionReasonsList = Object.values(detentionReasons).map(
          (item: any) => ({
            ...item,
            avgMinutes: Math.round(item.totalMinutes / item.count),
          }),
        );

        const metrics: CarrierMetrics = {
          totalCheckIns,
          activeDrivers,
          avgCheckInTime,
          avgCheckOutTime,
          avgDetentionTime,
          onTimePercentage,
          totalDetentionCost,
          carrierPerformance,
          detentionReasons: detentionReasonsList,
        };

        return NextResponse.json({ metrics });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in carrier management API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
