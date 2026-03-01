import { prisma } from "@/lib/prisma";
import { NCRService } from "./ncr-service";
import { QualityHoldService } from "./quality-hold-service";

export interface CreateInspectionData {
  organizationId: string;
  warehouseId: string;
  poId: string;
  supplierId: string;
  inspectorId: string;
  grnId?: string;
  inspectionType: "FULL" | "SAMPLE" | "VISUAL" | "FUNCTIONAL";
  totalUnits: number;
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  scheduledAt?: Date;
}

export interface InspectionItemData {
  productId: string;
  sku: string;
  productName: string;
  expectedQty: number;
  inspectedQty: number;
  result: "PASS" | "FAIL" | "CONDITIONAL";
  checklistData: any;
  notes?: string;
  photoUrls?: string[];
}

export interface DefectData {
  itemId: string;
  defectType: "CRITICAL" | "MAJOR" | "MINOR";
  defectCategory: string;
  description: string;
  quantityAffected: number;
  estimatedCost?: number;
  photoUrls?: string[];
  videoUrls?: string[];
}

export class QCInspectionService {
  /**
   * Generate next inspection number
   */
  private static async generateInspectionNumber(
    organizationId: string,
  ): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    const prefix = `QCI-${year}${month}`;

    const lastInspection = await prisma.qCReceivingInspection.findFirst({
      where: {
        organizationId,
        inspectionNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let sequence = 1;
    if (lastInspection) {
      const lastNumber = lastInspection.inspectionNumber.split("-").pop();
      sequence = parseInt(lastNumber || "0") + 1;
    }

    return `${prefix}-${String(sequence).padStart(6, "0")}`;
  }

  /**
   * Calculate sample size based on total units and inspection type
   */
  private static calculateSampleSize(
    totalUnits: number,
    inspectionType: string,
    samplePercent: number = 10,
  ): number {
    if (inspectionType === "FULL") {
      return totalUnits;
    }

    if (inspectionType === "SAMPLE") {
      // Standard AQL sampling
      if (totalUnits <= 50) return Math.min(totalUnits, 8);
      if (totalUnits <= 150) return Math.min(totalUnits, 13);
      if (totalUnits <= 500) return Math.min(totalUnits, 32);
      if (totalUnits <= 1200) return Math.min(totalUnits, 50);
      if (totalUnits <= 3200) return Math.min(totalUnits, 80);
      if (totalUnits <= 10000) return Math.min(totalUnits, 125);
      return Math.min(totalUnits, 200);
    }

    // Visual inspection - smaller sample
    return Math.ceil(totalUnits * 0.05);
  }

  /**
   * Create new QC inspection
   */
  static async createInspection(data: CreateInspectionData) {
    const inspectionNumber = await this.generateInspectionNumber(
      data.organizationId,
    );

    // Calculate sample size
    let sampleSize: number | null = null;
    if (data.inspectionType === "SAMPLE") {
      sampleSize = this.calculateSampleSize(
        data.totalUnits,
        data.inspectionType,
      );
    }

    const inspection = await prisma.qCReceivingInspection.create({
      data: {
        inspectionNumber,
        organizationId: data.organizationId,
        warehouseId: data.warehouseId,
        poId: data.poId,
        supplierId: data.supplierId,
        inspectorId: data.inspectorId,
        grnId: data.grnId,
        inspectionType: data.inspectionType,
        sampleSize,
        totalUnits: data.totalUnits,
        inspectedUnits: 0,
        priority: data.priority || "MEDIUM",
        scheduledAt: data.scheduledAt,
        status: "PENDING",
      },
      include: {
        purchaseOrder: true,
        supplier: true,
        inspector: true,
        warehouse: true,
      },
    });

    // Log activity
    await this.logActivity(
      inspection.id,
      "CREATED",
      `Inspection ${inspectionNumber} created`,
      data.inspectorId,
    );

    return inspection;
  }

  /**
   * Start inspection
   */
  static async startInspection(inspectionId: string, userId: string) {
    const inspection = await prisma.qCReceivingInspection.update({
      where: { id: inspectionId },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    await this.logActivity(
      inspectionId,
      "STARTED",
      "Inspection started",
      userId,
    );

    return inspection;
  }

  /**
   * Add inspection item
   */
  static async addInspectionItem(
    inspectionId: string,
    data: InspectionItemData,
  ) {
    const inspection = await prisma.qCReceivingInspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) {
      throw new Error("Inspection not found");
    }

    const item = await prisma.qCInspectionItem.create({
      data: {
        inspectionId,
        productId: data.productId,
        sku: data.sku,
        productName: data.productName,
        expectedQty: data.expectedQty,
        inspectedQty: data.inspectedQty,
        passedQty: data.result === "PASS" ? data.inspectedQty : 0,
        failedQty: data.result === "FAIL" ? data.inspectedQty : 0,
        result: data.result,
        checklistData: data.checklistData,
        notes: data.notes,
        photoUrls: data.photoUrls || [],
        inspectedAt: new Date(),
      },
    });

    // Update inspection totals
    await this.updateInspectionTotals(inspectionId);

    return item;
  }

  /**
   * Record defect
   */
  static async recordDefect(inspectionId: string, data: DefectData) {
    const inspection = await prisma.qCReceivingInspection.findUnique({
      where: { id: inspectionId },
      include: { items: true },
    });

    if (!inspection) {
      throw new Error("Inspection not found");
    }

    const item = inspection.items.find((i) => i.id === data.itemId);
    if (!item) {
      throw new Error("Inspection item not found");
    }

    const defect = await prisma.qCDefect.create({
      data: {
        inspectionId,
        itemId: data.itemId,
        organizationId: inspection.organizationId,
        defectType: data.defectType,
        defectCategory: data.defectCategory,
        description: data.description,
        quantityAffected: data.quantityAffected,
        estimatedCost: data.estimatedCost,
        photoUrls: data.photoUrls || [],
        videoUrls: data.videoUrls || [],
        resolutionStatus: "PENDING",
      },
    });

    // Update vendor quality score
    await this.updateVendorQualityScore(
      inspection.supplierId,
      inspection.organizationId,
    );

    // Log activity
    await this.logActivity(
      inspectionId,
      "DEFECT_RECORDED",
      `${data.defectType} defect recorded: ${data.description}`,
      inspection.inspectorId,
    );

    return defect;
  }

  /**
   * Complete inspection
   */
  static async completeInspection(
    inspectionId: string,
    userId: string,
    overallNotes?: string,
  ) {
    const inspection = await prisma.qCReceivingInspection.findUnique({
      where: { id: inspectionId },
      include: {
        items: true,
        defects: true,
      },
    });

    if (!inspection) {
      throw new Error("Inspection not found");
    }

    // Determine overall result
    const hasFailedItems = inspection.items.some(
      (item) => item.result === "FAIL",
    );
    const hasCriticalDefects = inspection.defects.some(
      (defect) => defect.defectType === "CRITICAL",
    );

    let result: "PASS" | "FAIL" | "CONDITIONAL" = "PASS";
    if (hasCriticalDefects) {
      result = "FAIL";
    } else if (hasFailedItems || inspection.defects.length > 0) {
      result = "CONDITIONAL";
    }

    const updatedInspection = await prisma.qCReceivingInspection.update({
      where: { id: inspectionId },
      data: {
        status: "COMPLETED",
        result,
        completedAt: new Date(),
        overallNotes,
      },
      include: {
        items: true,
        defects: true,
        purchaseOrder: true,
        supplier: true,
      },
    });

    // Update vendor quality score
    await this.updateVendorQualityScore(
      inspection.supplierId,
      inspection.organizationId,
    );

    // Log activity
    await this.logActivity(
      inspectionId,
      "COMPLETED",
      `Inspection completed with result: ${result}`,
      userId,
    );

    // Auto-create NCR and QualityHold when inspection FAILS (best-effort)
    if (result === "FAIL") {
      try {
        const failedItems = updatedInspection.items.filter(
          (i: any) => i.result === "FAIL",
        );
        const totalFailed = failedItems.reduce(
          (sum: number, i: any) => sum + (i.failedQty || 0),
          Math.max(inspection.failedUnits, 1),
        );
        const firstItem = failedItems[0] as any;

        const ncr = await NCRService.createNCR({
          organizationId: inspection.organizationId,
          title: `QC Inspection Failure: ${(updatedInspection as any).supplier?.name ?? "Supplier"} — ${updatedInspection.inspectionNumber}`,
          description: `QC receiving inspection ${updatedInspection.inspectionNumber} failed with ${updatedInspection.defects.length} defect(s) and ${totalFailed} failed unit(s). Immediate quarantine and corrective action required.`,
          discoveredBy: userId,
          discoveryLocation: "QC Receiving Inspection",
          sourceType: "RECEIVING",
          sourceId: updatedInspection.id,
          supplierId: inspection.supplierId,
          supplierName: (updatedInspection as any).supplier?.name ?? undefined,
          poNumber:
            (updatedInspection as any).purchaseOrder?.poNumber ?? undefined,
          productSku: firstItem?.sku ?? undefined,
          productDescription: firstItem?.productName ?? undefined,
          quantityAffected: totalFailed,
          nonConformanceType: "INCOMING_QUALITY",
          severity: "HIGH",
          category: "QC_INSPECTION",
          disposition: "QUARANTINE",
          capaRequired: true,
          priority: "HIGH",
          createdBy: userId,
        });

        await QualityHoldService.createHold({
          organizationId: inspection.organizationId,
          holdType: "PRODUCT",
          holdLevel: "INSPECTION",
          productSku: firstItem?.sku ?? undefined,
          productName: firstItem?.productName ?? undefined,
          vendorId: inspection.supplierId,
          quantityOnHold: totalFailed,
          holdReason: "QC_INSPECTION_FAILURE",
          holdDescription: `Failed QC inspection ${updatedInspection.inspectionNumber}. NCR: ${ncr.ncrNumber}`,
          severity: "HIGH",
          initiatedBy: userId,
          sourceType: "QC_INSPECTION",
          sourceId: updatedInspection.id,
          ncrId: ncr.id,
          investigationRequired: true,
          priority: "HIGH",
          createdBy: userId,
        });
      } catch (e) {
        console.error(
          "Auto NCR/QualityHold creation failed for inspection",
          inspectionId,
          e,
        );
      }
    }

    return updatedInspection;
  }

  /**
   * Update inspection totals
   */
  private static async updateInspectionTotals(inspectionId: string) {
    const items = await prisma.qCInspectionItem.findMany({
      where: { inspectionId },
    });

    const inspectedUnits = items.reduce(
      (sum, item) => sum + item.inspectedQty,
      0,
    );
    const passedUnits = items.reduce((sum, item) => sum + item.passedQty, 0);
    const failedUnits = items.reduce((sum, item) => sum + item.failedQty, 0);

    await prisma.qCReceivingInspection.update({
      where: { id: inspectionId },
      data: {
        inspectedUnits,
        passedUnits,
        failedUnits,
      },
    });
  }

  /**
   * Update vendor quality score
   */
  private static async updateVendorQualityScore(
    supplierId: string,
    organizationId: string,
  ) {
    // Get all inspections for this vendor
    const inspections = await prisma.qCReceivingInspection.findMany({
      where: {
        supplierId,
        organizationId,
        status: "COMPLETED",
      },
      include: {
        defects: true,
      },
    });

    const totalUnits = inspections.reduce(
      (sum, insp) => sum + insp.totalUnits,
      0,
    );
    const totalDefects = inspections.reduce((sum, insp) => {
      return (
        sum +
        insp.defects.reduce(
          (defectSum, defect) => defectSum + defect.quantityAffected,
          0,
        )
      );
    }, 0);

    const defectRate = totalUnits > 0 ? (totalDefects / totalUnits) * 100 : 0;

    // Calculate quality score (0-100)
    let qualityScore = 100;
    if (defectRate > 5) qualityScore = 40;
    else if (defectRate > 2) qualityScore = 60;
    else if (defectRate > 1) qualityScore = 75;
    else if (defectRate > 0.5) qualityScore = 85;
    else if (defectRate > 0.1) qualityScore = 95;

    // Upsert vendor quality score
    await prisma.vendorQualityScore.upsert({
      where: {
        organizationId_supplierId: {
          organizationId,
          supplierId,
        },
      },
      create: {
        organizationId,
        supplierId,
        totalUnitsReceived: totalUnits,
        totalDefectiveUnits: totalDefects,
        lifetimeDefectRate: defectRate,
        qualityScore,
        overallScore: qualityScore,
      },
      update: {
        totalUnitsReceived: totalUnits,
        totalDefectiveUnits: totalDefects,
        lifetimeDefectRate: defectRate,
        qualityScore,
        overallScore: qualityScore,
        lastInspectionDate: new Date(),
      },
    });
  }

  /**
   * Log activity
   */
  private static async logActivity(
    inspectionId: string,
    activityType: string,
    description: string,
    performedBy: string,
  ) {
    await prisma.qCInspectionActivity.create({
      data: {
        inspectionId,
        activityType,
        description,
        performedBy,
      },
    });
  }

  /**
   * Get inspection by ID
   */
  static async getInspectionById(inspectionId: string) {
    return await prisma.qCReceivingInspection.findUnique({
      where: { id: inspectionId },
      include: {
        items: {
          include: {
            defects: true,
            product: true,
          },
        },
        defects: true,
        activities: {
          orderBy: { createdAt: "desc" },
        },
        purchaseOrder: true,
        supplier: true,
        inspector: true,
        warehouse: true,
      },
    });
  }

  /**
   * List inspections
   */
  static async listInspections(
    organizationId: string,
    filters: {
      warehouseId?: string;
      supplierId?: string;
      status?: string;
      result?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const where: any = {
      organizationId,
    };

    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.status) where.status = filters.status;
    if (filters.result) where.result = filters.result;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await prisma.qCReceivingInspection.findMany({
      where,
      include: {
        supplier: true,
        inspector: true,
        warehouse: true,
        _count: {
          select: {
            items: true,
            defects: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get inspection statistics
   */
  static async getInspectionStats(organizationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const inspections = await prisma.qCReceivingInspection.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
        },
        status: "COMPLETED",
      },
      include: {
        defects: true,
      },
    });

    const totalInspections = inspections.length;
    const totalUnits = inspections.reduce(
      (sum, insp) => sum + insp.totalUnits,
      0,
    );
    const totalDefects = inspections.reduce(
      (sum, insp) => insp.defects.length + sum,
      0,
    );
    const passedInspections = inspections.filter(
      (insp) => insp.result === "PASS",
    ).length;
    const failedInspections = inspections.filter(
      (insp) => insp.result === "FAIL",
    ).length;

    const avgDefectRate =
      totalUnits > 0 ? (totalDefects / totalUnits) * 100 : 0;
    const passRate =
      totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

    return {
      totalInspections,
      totalUnits,
      totalDefects,
      passedInspections,
      failedInspections,
      avgDefectRate: parseFloat(avgDefectRate.toFixed(4)),
      passRate: parseFloat(passRate.toFixed(2)),
    };
  }
}

export default QCInspectionService;
