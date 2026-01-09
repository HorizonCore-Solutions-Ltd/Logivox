import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export interface CreateRTVData {
  organizationId: string;
  defectId: string;
  poId: string;
  supplierId: string;
  warehouseId: string;
  reason: string;
  quantity: number;
  value: number;
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  createdBy: string;
}

export interface UpdateRTVData {
  status?: string;
  vendorRmaNumber?: string;
  vendorNotes?: string;
  carrier?: string;
  trackingNumber?: string;
  shippingCost?: number;
  resolutionType?: string;
  creditAmount?: number;
  creditMemoNumber?: string;
  assignedTo?: string;
  internalNotes?: string;
}

export class RTVService {
  /**
   * Generate next RTV number
   */
  private static async generateRTVNumber(
    organizationId: string,
  ): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    const prefix = `RTV-${year}${month}`;

    const lastRTV = await prisma.rTV.findFirst({
      where: {
        organizationId,
        rtvNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let sequence = 1;
    if (lastRTV) {
      const lastNumber = lastRTV.rtvNumber.split("-").pop();
      sequence = parseInt(lastNumber || "0") + 1;
    }

    return `${prefix}-${String(sequence).padStart(6, "0")}`;
  }

  /**
   * Create RTV from defect
   */
  static async createRTV(data: CreateRTVData) {
    const rtvNumber = await this.generateRTVNumber(data.organizationId);

    // Get defect details
    const defect = await prisma.qCDefect.findUnique({
      where: { id: data.defectId },
      include: {
        inspection: {
          include: {
            supplier: true,
            purchaseOrder: true,
          },
        },
        item: true,
      },
    });

    if (!defect) {
      throw new Error("Defect not found");
    }

    // Create RTV
    const rtv = await prisma.rTV.create({
      data: {
        rtvNumber,
        organizationId: data.organizationId,
        defectId: data.defectId,
        poId: data.poId,
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        reason: data.reason,
        quantity: data.quantity,
        value: data.value,
        priority: data.priority || "MEDIUM",
        status: "PENDING",
        createdBy: data.createdBy,
      },
      include: {
        defect: {
          include: {
            item: true,
            inspection: true,
          },
        },
        supplier: true,
        purchaseOrder: true,
        warehouse: true,
      },
    });

    // Update defect resolution status
    await prisma.qCDefect.update({
      where: { id: data.defectId },
      data: {
        resolutionStatus: "RTV_REQUESTED",
      },
    });

    // Log activity
    await this.logActivity(
      rtv.id,
      "CREATED",
      `RTV ${rtvNumber} created for defect`,
      data.createdBy,
    );

    // Update vendor quality score
    await this.updateVendorQualityOnRTV(
      data.supplierId,
      data.organizationId,
      data.value,
    );

    return rtv;
  }

  /**
   * Notify vendor about RTV
   */
  static async notifyVendor(rtvId: string, userId: string) {
    const rtv = await prisma.rTV.findUnique({
      where: { id: rtvId },
      include: {
        supplier: true,
        defect: {
          include: {
            item: true,
            inspection: true,
          },
        },
        purchaseOrder: true,
      },
    });

    if (!rtv) {
      throw new Error("RTV not found");
    }

    if (!rtv.supplier.email) {
      throw new Error("Supplier email not configured");
    }

    // Send email to vendor
    const emailSent = await this.sendVendorEmail(rtv);

    // Update RTV status
    await prisma.rTV.update({
      where: { id: rtvId },
      data: {
        status: "VENDOR_NOTIFIED",
      },
    });

    // Log activity
    await this.logActivity(
      rtvId,
      "VENDOR_NOTIFIED",
      `Vendor ${rtv.supplier.name} notified via email`,
      userId,
    );

    return { success: emailSent, rtv };
  }

  /**
   * Send vendor email
   */
  private static async sendVendorEmail(rtv: any): Promise<boolean> {
    try {
      // Configure email transport (use environment variables in production)
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const htmlContent = `
        <h2>Return to Vendor Request - ${rtv.rtvNumber}</h2>
        
        <p>Dear ${rtv.supplier.name},</p>
        
        <p>We need to return the following item(s) due to quality issues:</p>
        
        <table border="1" cellpadding="10" style="border-collapse: collapse;">
          <tr>
            <th>Purchase Order</th>
            <td>${rtv.purchaseOrder.poNumber}</td>
          </tr>
          <tr>
            <th>Product</th>
            <td>${rtv.defect.item.productName} (${rtv.defect.item.sku})</td>
          </tr>
          <tr>
            <th>Quantity</th>
            <td>${rtv.quantity}</td>
          </tr>
          <tr>
            <th>Value</th>
            <td>$${rtv.value.toFixed(2)}</td>
          </tr>
          <tr>
            <th>Reason</th>
            <td>${rtv.reason}</td>
          </tr>
          <tr>
            <th>Defect Type</th>
            <td>${rtv.defect.defectType} - ${rtv.defect.defectCategory}</td>
          </tr>
          <tr>
            <th>Description</th>
            <td>${rtv.defect.description}</td>
          </tr>
        </table>
        
        <p><strong>Please provide:</strong></p>
        <ul>
          <li>RMA Number for this return</li>
          <li>Return shipping label (prepaid)</li>
          <li>Expected resolution (credit, replacement, or refusal)</li>
        </ul>
        
        <p>Please respond within 2 business days.</p>
        
        <p>Best regards,<br>Quality Control Team</p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || "qc@yourcompany.com",
        to: rtv.supplier.email,
        subject: `RTV Request - ${rtv.rtvNumber}`,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      console.error("Failed to send vendor email:", error);
      return false;
    }
  }

  /**
   * Approve RTV
   */
  static async approveRTV(rtvId: string, userId: string, notes?: string) {
    const rtv = await prisma.rTV.update({
      where: { id: rtvId },
      data: {
        status: "APPROVED",
      },
    });

    // Update defect status
    await prisma.qCDefect.update({
      where: { id: rtv.defectId },
      data: {
        resolutionStatus: "RTV_APPROVED",
      },
    });

    // Log activity
    await this.logActivity(rtvId, "APPROVED", notes || "RTV approved", userId);

    return rtv;
  }

  /**
   * Reject RTV
   */
  static async rejectRTV(rtvId: string, userId: string, reason: string) {
    const rtv = await prisma.rTV.update({
      where: { id: rtvId },
      data: {
        status: "REJECTED",
        internalNotes: reason,
      },
    });

    // Update defect status
    await prisma.qCDefect.update({
      where: { id: rtv.defectId },
      data: {
        resolutionStatus: "REJECTED",
      },
    });

    // Log activity
    await this.logActivity(rtvId, "REJECTED", reason, userId);

    return rtv;
  }

  /**
   * Ship RTV
   */
  static async shipRTV(
    rtvId: string,
    userId: string,
    shippingData: {
      carrier: string;
      trackingNumber: string;
      shippingCost?: number;
      labelUrl?: string;
    },
  ) {
    const rtv = await prisma.rTV.update({
      where: { id: rtvId },
      data: {
        status: "SHIPPED",
        carrier: shippingData.carrier,
        trackingNumber: shippingData.trackingNumber,
        shippingCost: shippingData.shippingCost,
        labelUrl: shippingData.labelUrl,
        shippedAt: new Date(),
      },
    });

    // Log activity
    await this.logActivity(
      rtvId,
      "SHIPPED",
      `Shipped via ${shippingData.carrier}, tracking: ${shippingData.trackingNumber}`,
      userId,
    );

    return rtv;
  }

  /**
   * Record vendor response
   */
  static async recordVendorResponse(
    rtvId: string,
    userId: string,
    responseData: {
      vendorRmaNumber: string;
      vendorNotes?: string;
      resolutionType: "CREDIT" | "REPLACEMENT" | "REFUSED" | "PARTIAL_CREDIT";
      creditAmount?: number;
    },
  ) {
    const rtv = await prisma.rTV.update({
      where: { id: rtvId },
      data: {
        vendorRmaNumber: responseData.vendorRmaNumber,
        vendorNotes: responseData.vendorNotes,
        vendorResponseDate: new Date(),
        resolutionType: responseData.resolutionType,
        creditAmount: responseData.creditAmount,
      },
    });

    // Log activity
    await this.logActivity(
      rtvId,
      "VENDOR_RESPONSE",
      `Vendor responded with ${responseData.resolutionType}`,
      userId,
    );

    return rtv;
  }

  /**
   * Record credit received
   */
  static async recordCredit(
    rtvId: string,
    userId: string,
    creditData: {
      creditAmount: number;
      creditMemoNumber: string;
    },
  ) {
    const rtv = await prisma.rTV.update({
      where: { id: rtvId },
      data: {
        status: "CREDITED",
        creditAmount: creditData.creditAmount,
        creditMemoNumber: creditData.creditMemoNumber,
        creditedAt: new Date(),
      },
    });

    // Update defect status
    await prisma.qCDefect.update({
      where: { id: rtv.defectId },
      data: {
        resolutionStatus: "CREDITED",
        resolutionDate: new Date(),
      },
    });

    // Log activity
    await this.logActivity(
      rtvId,
      "CREDITED",
      `Credit received: $${creditData.creditAmount} (Memo: ${creditData.creditMemoNumber})`,
      userId,
    );

    return rtv;
  }

  /**
   * Close RTV
   */
  static async closeRTV(rtvId: string, userId: string, notes?: string) {
    const rtv = await prisma.rTV.update({
      where: { id: rtvId },
      data: {
        status: "CLOSED",
      },
    });

    // Log activity
    await this.logActivity(rtvId, "CLOSED", notes || "RTV closed", userId);

    return rtv;
  }

  /**
   * Update RTV
   */
  static async updateRTV(rtvId: string, data: UpdateRTVData, userId: string) {
    const rtv = await prisma.rTV.update({
      where: { id: rtvId },
      data,
    });

    // Log activity
    await this.logActivity(rtvId, "UPDATED", "RTV updated", userId);

    return rtv;
  }

  /**
   * Get RTV by ID
   */
  static async getRTVById(rtvId: string) {
    return await prisma.rTV.findUnique({
      where: { id: rtvId },
      include: {
        defect: {
          include: {
            item: {
              include: {
                product: true,
              },
            },
            inspection: {
              include: {
                inspector: true,
              },
            },
          },
        },
        supplier: true,
        purchaseOrder: true,
        warehouse: true,
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * List RTVs
   */
  static async listRTVs(
    organizationId: string,
    filters: {
      supplierId?: string;
      warehouseId?: string;
      status?: string;
      priority?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const where: any = {
      organizationId,
    };

    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await prisma.rTV.findMany({
      where,
      include: {
        supplier: true,
        warehouse: true,
        defect: {
          include: {
            item: true,
          },
        },
        _count: {
          select: {
            activities: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get RTV statistics
   */
  static async getRTVStats(organizationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rtvs = await prisma.rTV.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    const totalRTVs = rtvs.length;
    const totalValue = rtvs.reduce(
      (sum, rtv) => sum + parseFloat(rtv.value.toString()),
      0,
    );
    const pendingRTVs = rtvs.filter((rtv) => rtv.status === "PENDING").length;
    const shippedRTVs = rtvs.filter((rtv) => rtv.status === "SHIPPED").length;
    const creditedRTVs = rtvs.filter((rtv) => rtv.status === "CREDITED").length;
    const closedRTVs = rtvs.filter((rtv) => rtv.status === "CLOSED").length;

    const totalCredits = rtvs
      .filter((rtv) => rtv.creditAmount)
      .reduce(
        (sum, rtv) => sum + parseFloat(rtv.creditAmount?.toString() || "0"),
        0,
      );

    // Calculate avg resolution time (days)
    const resolvedRTVs = rtvs.filter((rtv) => rtv.creditedAt);
    const avgResolutionDays =
      resolvedRTVs.length > 0
        ? resolvedRTVs.reduce((sum, rtv) => {
            const created = new Date(rtv.createdAt).getTime();
            const credited = new Date(rtv.creditedAt!).getTime();
            return sum + (credited - created) / (1000 * 60 * 60 * 24);
          }, 0) / resolvedRTVs.length
        : 0;

    return {
      totalRTVs,
      totalValue: parseFloat(totalValue.toFixed(2)),
      pendingRTVs,
      shippedRTVs,
      creditedRTVs,
      closedRTVs,
      totalCredits: parseFloat(totalCredits.toFixed(2)),
      avgResolutionDays: parseFloat(avgResolutionDays.toFixed(1)),
    };
  }

  /**
   * Update vendor quality score on RTV
   */
  private static async updateVendorQualityOnRTV(
    supplierId: string,
    organizationId: string,
    rtvValue: number,
  ) {
    const qualityScore = await prisma.vendorQualityScore.findUnique({
      where: {
        organizationId_supplierId: {
          organizationId,
          supplierId,
        },
      },
    });

    if (qualityScore) {
      await prisma.vendorQualityScore.update({
        where: {
          organizationId_supplierId: {
            organizationId,
            supplierId,
          },
        },
        data: {
          totalRtvCount: { increment: 1 },
          totalRtvValue: { increment: rtvValue },
          lastRtvDate: new Date(),
        },
      });
    }
  }

  /**
   * Log activity
   */
  private static async logActivity(
    rtvId: string,
    activityType: string,
    description: string,
    performedBy: string,
  ) {
    await prisma.rTVActivity.create({
      data: {
        rtvId,
        activityType,
        description,
        performedBy,
      },
    });
  }
}

export default RTVService;
