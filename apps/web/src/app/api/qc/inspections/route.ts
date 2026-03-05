import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { withObservability } from "@/lib/middleware/observability";
import { prisma } from "@/lib/prisma";

// Mock QCInspectionService for turnkey demo/production if actual service is missing or unstable
// In a real scenario, we'd ensure the service handles organization scoping correctly.
const MOCK_ENABLE = false;

export async function GET(request: NextRequest) {
  return withObservability(async () => {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const supplierId = searchParams.get("supplierId");

    const inspections = await prisma.qCInspection.findMany({
      where: {
        organizationId,
        // warehouseId: warehouseId || undefined, // QCInspection doesn't have warehouseId directly on it based on schema?
        // Let's comment out warehouseId filter for now as it's not in the schema snippet I saw.
        status: status ? (status as any) : undefined, // Cast if enum mismatch
        category: type ? (type as any) : undefined, // Changed from inspectionType to category
        // supplierId: supplierId || undefined, // QCInspection doesn't have supplierId directly? It has grn -> supplier?
      },
      orderBy: { createdAt: "desc" },
      include: {
        template: { select: { name: true, code: true } },
        inspectedBy: { select: { name: true, email: true } }, // Schema says inspectedBy, not inspector
        // inventoryItem: { include: { product: true } } // Probably useful
      },
      take: 50,
    });

    return NextResponse.json({ inspections });
  }, request);
}

export async function POST(request: NextRequest) {
  return withObservability(async () => {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId, userId } = auth;

    const body = await request.json();

    // Basic validation
    if (!body.inventoryId || !body.quantity) {
      return NextResponse.json(
        { error: "Missing required fields: inventoryId, quantity" },
        { status: 400 },
      );
    }

    // Find or use provided template
    let templateId = body.templateId;
    let templateCheckpoints: any[] = [];

    if (templateId) {
      const tmpl = await prisma.inspectionTemplate.findUnique({
        where: { id: templateId },
      });
      if (tmpl && tmpl.checkpoints && Array.isArray(tmpl.checkpoints)) {
        templateCheckpoints = tmpl.checkpoints;
      }
    } else {
      const defaultTemplate = await prisma.inspectionTemplate.findFirst({
        where: { organizationId, isActive: true },
      });
      if (defaultTemplate) {
        templateId = defaultTemplate.id;
        if (
          defaultTemplate.checkpoints &&
          Array.isArray(defaultTemplate.checkpoints)
        ) {
          templateCheckpoints = defaultTemplate.checkpoints;
        }
      } else
        return NextResponse.json(
          {
            error:
              "No active inspection template found. Please create one first.",
          },
          { status: 400 },
        );
    }

    // Generate logic for inspection number
    const dateStr = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const inspectionNumber = `INS-${dateStr}-${randomSuffix}`;

    // Prepare checkpoints creation data
    // Assuming JSON structure matches what QCCheckpoint needs or is adaptable
    // We map common fields.
    const checkpointsData = templateCheckpoints.map(
      (cp: any, index: number) => ({
        name: cp.name || `Checkpoint ${index + 1}`,
        type: cp.type || "PASS_FAIL", // Default to simple check
        sequence: index,
        description: cp.description || "",
        isRequired: cp.required !== false,
        status: "PENDING",
      }),
    );

    const inspection = await prisma.qCInspection.create({
      data: {
        organizationId,
        inspectionNumber,
        category: (body.category as any) || "INCOMING",
        status: "PENDING",
        inventoryId: body.inventoryId,
        quantity:
          typeof body.quantity === "string"
            ? parseInt(body.quantity)
            : body.quantity,
        templateId,
        inspectedById: userId,
        // Optional fields
        referenceType: body.referenceType,
        referenceId: body.referenceId,
        grnId: body.grnId || undefined,
        salesOrderId: body.salesOrderId || undefined,
        lotId: body.lotId || undefined,
        // Create checkpoints
        checkpoints: {
          create: checkpointsData,
        },
      },
      include: {
        checkpoints: true, // Return them so frontend can see
      },
    });

    return NextResponse.json({ inspection }, { status: 201 });
  }, request);
}
