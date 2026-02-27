import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const createBOLSchema = z.object({
  shipmentId: z.string(),
  carrierName: z.string(),
  shipperInfo: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    phone: z.string(),
  }),
  consigneeInfo: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    phone: z.string(),
  }),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().int().positive(),
      weight: z.number().positive(),
      packageType: z.string(),
      class: z.string().optional(),
      nmfc: z.string().optional(),
    }),
  ),
  specialInstructions: z.string().optional(),
  declaredValue: z.number().optional(),
  freightCharges: z.enum(["PREPAID", "COLLECT", "THIRD_PARTY"]),
});

const signBOLSchema = z.object({
  bolId: z.string(),
  signerName: z.string(),
  signerRole: z.enum(["SHIPPER", "CARRIER", "CONSIGNEE"]),
  signatureData: z.string(),
  notes: z.string().optional(),
});

const attachDocumentSchema = z.object({
  bolId: z.string(),
  documentType: z.enum([
    "PACKING_LIST",
    "COMMERCIAL_INVOICE",
    "CERTIFICATE",
    "INSPECTION_REPORT",
    "CUSTOM_FORM",
    "OTHER",
  ]),
  fileName: z.string(),
  fileUrl: z.string(),
  description: z.string().optional(),
});

async function getOrganizationId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizationMemberships: {
        where: { isActive: true },
        include: { organization: true },
        take: 1,
      },
    },
  });
  return user?.organizationMemberships?.[0]?.organizationId ?? null;
}

function generateBOLNumber(): string {
  const year = new Date().getFullYear();
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `BOL-${year}-${suffix}`;
}

function createBOLId(): string {
  return `BOL-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
}

function rebuildBolState(events: any[]) {
  const created = events.find((e) => e.action === "DOCK_BOL_CREATED");
  if (!created) return null;

  const base = created.metadata as any;
  const signatures = events
    .filter((e) => e.action === "DOCK_BOL_SIGNED")
    .map((e) => ({ ...(e.metadata as any), signedAt: e.createdAt }));

  const docs = events
    .filter((e) => e.action === "DOCK_BOL_DOCUMENT_ATTACHED")
    .map((e) => ({ id: e.entityId, ...(e.metadata as any), uploadedAt: e.createdAt }));

  const isVoided = events.some((e) => e.action === "DOCK_BOL_VOIDED");
  const generatedPdf = events.find((e) => e.action === "DOCK_BOL_PDF_GENERATED");

  let status = "DRAFT";
  const hasShipper = signatures.some((s) => s.signerRole === "SHIPPER");
  const hasCarrier = signatures.some((s) => s.signerRole === "CARRIER");
  const hasConsignee = signatures.some((s) => s.signerRole === "CONSIGNEE");

  if (isVoided) status = "VOIDED";
  else if (hasConsignee) status = "DELIVERED";
  else if (hasShipper && hasCarrier) status = "SIGNED";
  else if (hasShipper) status = "PENDING_CARRIER_SIGNATURE";

  const totalWeight = (base.items || []).reduce(
    (sum: number, i: any) => sum + Number(i.weight || 0),
    0,
  );
  const totalPieces = (base.items || []).reduce(
    (sum: number, i: any) => sum + Number(i.quantity || 0),
    0,
  );

  return {
    id: created.entityId,
    bolNumber: base.bolNumber,
    shipmentId: base.shipmentId,
    carrierName: base.carrierName,
    status,
    createdAt: created.createdAt,
    createdBy: base.createdBy,
    shipperInfo: base.shipperInfo,
    consigneeInfo: base.consigneeInfo,
    items: base.items,
    totalWeight,
    totalPieces,
    specialInstructions: base.specialInstructions,
    declaredValue: base.declaredValue,
    freightCharges: base.freightCharges,
    signatures,
    attachedDocuments: docs,
    pdfUrl: generatedPdf ? (generatedPdf.metadata as any)?.pdfUrl : undefined,
  };
}

async function fetchBolEvents(organizationId: string) {
  return prisma.activityLog.findMany({
    where: {
      organizationId,
      entityType: "DockBOL",
      action: {
        in: [
          "DOCK_BOL_CREATED",
          "DOCK_BOL_SIGNED",
          "DOCK_BOL_DOCUMENT_ATTACHED",
          "DOCK_BOL_VOIDED",
          "DOCK_BOL_PDF_GENERATED",
        ],
      },
    },
    orderBy: { createdAt: "asc" },
    take: 5000,
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "create_bol") {
      const data = createBOLSchema.parse(body);
      const bolId = createBOLId();
      const bolNumber = generateBOLNumber();

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_BOL_CREATED",
          entityType: "DockBOL",
          entityId: bolId,
          metadata: {
            bolNumber,
            shipmentId: data.shipmentId,
            carrierName: data.carrierName,
            shipperInfo: data.shipperInfo,
            consigneeInfo: data.consigneeInfo,
            items: data.items,
            specialInstructions: data.specialInstructions,
            declaredValue: data.declaredValue,
            freightCharges: data.freightCharges,
            createdBy: session.user.name || session.user.email || "Unknown",
          },
        },
      });

      return NextResponse.json({
        success: true,
        bolId,
        bolNumber,
        message: "BOL created successfully",
      });
    }

    if (action === "sign_bol") {
      const data = signBOLSchema.parse(body);

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_BOL_SIGNED",
          entityType: "DockBOL",
          entityId: data.bolId,
          metadata: {
            signerName: data.signerName,
            signerRole: data.signerRole,
            signatureUrl: data.signatureData,
            notes: data.notes,
          },
        },
      });

      return NextResponse.json({ success: true, message: "BOL signed successfully" });
    }

    if (action === "attach_document") {
      const data = attachDocumentSchema.parse(body);
      const docId = `DOC-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_BOL_DOCUMENT_ATTACHED",
          entityType: "DockBOL",
          entityId: data.bolId,
          metadata: {
            documentId: docId,
            documentType: data.documentType,
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            description: data.description,
          },
        },
      });

      return NextResponse.json({ success: true, documentId: docId, message: "Document attached successfully" });
    }

    if (action === "void_bol") {
      const { bolId, reason } = body;
      if (!bolId) {
        return NextResponse.json({ error: "bolId required" }, { status: 400 });
      }

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_BOL_VOIDED",
          entityType: "DockBOL",
          entityId: bolId,
          metadata: { reason: reason || "No reason provided" },
        },
      });

      return NextResponse.json({ success: true, message: "BOL voided successfully" });
    }

    if (action === "generate_pdf") {
      const { bolId } = body;
      if (!bolId) {
        return NextResponse.json({ error: "bolId required" }, { status: 400 });
      }

      const pdfUrl = `/bols/${bolId}.pdf`;
      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_BOL_PDF_GENERATED",
          entityType: "DockBOL",
          entityId: bolId,
          metadata: { pdfUrl },
        },
      });

      return NextResponse.json({ success: true, pdfUrl, message: "PDF generated successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in BOL API:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const events = await fetchBolEvents(organizationId);

    const bolIds = [...new Set(events.map((e) => e.entityId).filter(Boolean))] as string[];
    const bols = bolIds
      .map((id) => rebuildBolState(events.filter((e) => e.entityId === id)))
      .filter(Boolean);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const bolId = searchParams.get("bolId");

    if (action === "bol") {
      if (!bolId) {
        return NextResponse.json({ error: "BOL ID required" }, { status: 400 });
      }
      const bol = bols.find((b: any) => b.id === bolId);
      if (!bol) {
        return NextResponse.json({ error: "BOL not found" }, { status: 404 });
      }
      return NextResponse.json({ bol });
    }

    if (action === "recent_bols") {
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const recent = [...(bols as any[])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return NextResponse.json({ bols: recent.slice(0, limit) });
    }

    if (action === "pending_signatures") {
      const pending = (bols as any[]).filter(
        (b) => b.status === "DRAFT" || b.status === "PENDING_CARRIER_SIGNATURE",
      );
      return NextResponse.json({ bols: pending, count: pending.length });
    }

    if (action === "bol_metrics") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalBOLs = (bols as any[]).length;
      const bolsToday = (bols as any[]).filter((b) => new Date(b.createdAt) >= today).length;
      const pendingSignatures = (bols as any[]).filter(
        (b) => b.status === "DRAFT" || b.status === "PENDING_CARRIER_SIGNATURE",
      ).length;
      const completedBOLs = (bols as any[]).filter(
        (b) => b.status === "SIGNED" || b.status === "DELIVERED",
      ).length;

      const avgProcessingTime = 0;
      const complianceRate =
        completedBOLs > 0
          ? ((bols as any[]).filter((b) => b.attachedDocuments?.length > 0).length /
              completedBOLs) *
            100
          : 0;

      const carrierMap: Record<string, number> = {};
      for (const bol of bols as any[]) {
        carrierMap[bol.carrierName] = (carrierMap[bol.carrierName] || 0) + 1;
      }

      const bolsByCarrier = Object.entries(carrierMap).map(([carrier, count]) => ({
        carrier,
        count,
        percentage: totalBOLs > 0 ? (count / totalBOLs) * 100 : 0,
      }));

      const docMap: Record<string, number> = {};
      for (const bol of bols as any[]) {
        for (const doc of bol.attachedDocuments || []) {
          docMap[doc.documentType] = (docMap[doc.documentType] || 0) + 1;
        }
      }

      const documentTypes = Object.entries(docMap).map(([type, count]) => ({ type, count }));

      return NextResponse.json({
        metrics: {
          totalBOLs,
          bolsToday,
          pendingSignatures,
          completedBOLs,
          avgProcessingTime,
          complianceRate,
          bolsByCarrier,
          documentTypes,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in BOL API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
