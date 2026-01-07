/**
 * Shipping Service
 * Comprehensive Outbound Shipping Management
 *
 * Handles:
 * - Shipment creation & management
 * - Multi-carrier rate shopping
 * - Label generation
 * - Tracking integration
 * - Delivery confirmation
 * - Exception handling
 * - Automated carrier selection
 */

import { prisma } from "@/lib/prisma";
import {
  ShipmentStatus,
  CarrierType,
  SalesOrderStatus,
  Prisma,
} from "@prisma/client";

interface RateQuote {
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
  currency: string;
}

export class ShippingService {
  /**
   * Create a new shipment from Sales Order
   */
  static async createShipment(params: {
    organizationId: string;
    salesOrderId: string;
    packId?: string;
    createdById: string;
    carrierCode?: string;
    carrierService?: string;
    shippingAddress?: {
      recipientName: string;
      recipientPhone?: string;
      recipientEmail?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    weight?: number;
    weightUnit?: string;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    signatureRequired?: boolean;
    saturdayDelivery?: boolean;
    insuranceAmount?: number;
    notes?: string;
  }) {
    // Verify Sales Order exists
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: params.salesOrderId },
      include: {
        customer: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!salesOrder) {
      throw new Error("Sales Order not found");
    }

    if (salesOrder.status !== SalesOrderStatus.PACKED) {
      throw new Error(`Cannot ship order with status: ${salesOrder.status}`);
    }

    // Generate shipment number
    const shipmentCount = await prisma.shipment.count({
      where: { organizationId: params.organizationId },
    });
    const shipmentNumber = `SHIP-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${String(shipmentCount + 1).padStart(4, "0")}`;

    // Use provided address or customer's address
    const shippingAddress = params.shippingAddress || {
      recipientName: salesOrder.customer.name,
      recipientPhone: salesOrder.customer.phone || undefined,
      recipientEmail: salesOrder.customer.email || undefined,
      addressLine1:
        salesOrder.shippingAddress || salesOrder.customer.address || "",
      addressLine2: undefined,
      city: salesOrder.shippingCity || salesOrder.customer.city || "",
      state: salesOrder.shippingState || "",
      postalCode: salesOrder.customer.code || "",
      country:
        salesOrder.shippingCountry || salesOrder.customer.country || "US",
    };

    // Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        organizationId: params.organizationId,
        shipmentNumber,
        salesOrderId: params.salesOrderId,
        packId: params.packId,
        createdById: params.createdById,
        status: ShipmentStatus.PENDING,
        carrierCode: params.carrierCode,
        carrierService: params.carrierService,
        recipientName: shippingAddress.recipientName,
        recipientPhone: shippingAddress.recipientPhone,
        recipientEmail: shippingAddress.recipientEmail,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        weight: params.weight,
        weightUnit: params.weightUnit || "kg",
        dimensions: params.dimensions,
        signatureRequired: params.signatureRequired || false,
        saturdayDelivery: params.saturdayDelivery || false,
        insuranceAmount: params.insuranceAmount,
        notes: params.notes,
      },
      include: {
        salesOrder: {
          include: {
            customer: true,
          },
        },
      },
    });

    return shipment;
  }

  /**
   * Get rate quotes from multiple carriers
   */
  static async getRateQuotes(params: {
    organizationId: string;
    fromAddress: {
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    toAddress: {
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    weight: number;
    weightUnit: string;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    carriers?: CarrierType[];
  }): Promise<RateQuote[]> {
    // Get active carrier configurations
    const carrierConfigs = await prisma.carrierConfig.findMany({
      where: {
        organizationId: params.organizationId,
        isActive: true,
        ...(params.carriers ? { carrierType: { in: params.carriers } } : {}),
      },
    });

    if (carrierConfigs.length === 0) {
      throw new Error("No active carrier configurations found");
    }

    // In production, integrate with actual carrier APIs
    // This is a simplified mock response
    const quotes: RateQuote[] = [];

    for (const config of carrierConfigs) {
      // Mock rates based on carrier type and distance
      const baseRate = this.calculateBaseRate(
        params.fromAddress,
        params.toAddress,
        params.weight,
      );

      if (config.carrierType === CarrierType.UPS) {
        quotes.push(
          {
            carrier: "UPS",
            service: "Ground",
            cost: baseRate * 0.9,
            estimatedDays: 5,
            currency: "USD",
          },
          {
            carrier: "UPS",
            service: "Next Day Air",
            cost: baseRate * 2.5,
            estimatedDays: 1,
            currency: "USD",
          },
        );
      } else if (config.carrierType === CarrierType.FEDEX) {
        quotes.push(
          {
            carrier: "FedEx",
            service: "Ground",
            cost: baseRate * 0.85,
            estimatedDays: 5,
            currency: "USD",
          },
          {
            carrier: "FedEx",
            service: "Priority Overnight",
            cost: baseRate * 2.3,
            estimatedDays: 1,
            currency: "USD",
          },
        );
      } else if (config.carrierType === CarrierType.USPS) {
        quotes.push(
          {
            carrier: "USPS",
            service: "Priority Mail",
            cost: baseRate * 0.7,
            estimatedDays: 3,
            currency: "USD",
          },
          {
            carrier: "USPS",
            service: "Express Mail",
            cost: baseRate * 1.8,
            estimatedDays: 1,
            currency: "USD",
          },
        );
      }
    }

    return quotes.sort((a, b) => a.cost - b.cost);
  }

  /**
   * Select best carrier based on criteria
   */
  static async selectOptimalCarrier(params: {
    organizationId: string;
    shipmentId: string;
    criteria: "COST" | "SPEED" | "RELIABILITY" | "BALANCED";
  }) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: params.shipmentId },
      include: {
        salesOrder: true,
      },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    // Get rate quotes
    const quotes = await this.getRateQuotes({
      organizationId: params.organizationId,
      fromAddress: {
        city: "Warehouse",
        state: "CA",
        postalCode: "90001",
        country: "US",
      },
      toAddress: {
        city: shipment.city || "",
        state: shipment.state || "",
        postalCode: shipment.postalCode || "",
        country: shipment.country || "US",
      },
      weight: Number(shipment.weight) || 5,
      weightUnit: shipment.weightUnit || "kg",
    });

    let selectedQuote: RateQuote;

    switch (params.criteria) {
      case "COST":
        selectedQuote = quotes.reduce((min, q) =>
          q.cost < min.cost ? q : min,
        );
        break;
      case "SPEED":
        selectedQuote = quotes.reduce((min, q) =>
          q.estimatedDays < min.estimatedDays ? q : min,
        );
        break;
      case "RELIABILITY":
        // Prefer established carriers
        selectedQuote =
          quotes.find((q) => q.carrier === "UPS" || q.carrier === "FedEx") ||
          quotes[0];
        break;
      case "BALANCED":
      default:
        // Score based on cost and speed
        selectedQuote = quotes.reduce((best, q) => {
          const score = q.cost / 10 + q.estimatedDays * 2;
          const bestScore = best.cost / 10 + best.estimatedDays * 2;
          return score < bestScore ? q : best;
        });
    }

    // Update shipment with selected carrier
    await prisma.shipment.update({
      where: { id: params.shipmentId },
      data: {
        carrierCode: selectedQuote.carrier,
        carrierService: selectedQuote.service,
        shippingCost: selectedQuote.cost,
        estimatedDelivery: new Date(
          Date.now() + selectedQuote.estimatedDays * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return {
      selected: selectedQuote,
      allQuotes: quotes,
      savings: quotes[quotes.length - 1].cost - selectedQuote.cost,
    };
  }

  /**
   * Generate shipping label
   */
  static async generateLabel(params: {
    shipmentId: string;
    labelFormat?: "PDF" | "PNG" | "ZPL";
  }) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: params.shipmentId },
      include: {
        salesOrder: {
          include: {
            customer: true,
            items: true,
          },
        },
      },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    if (!shipment.carrierCode) {
      throw new Error("Carrier not selected for shipment");
    }

    // In production, integrate with carrier API to generate actual label
    // This is a mock implementation
    const trackingNumber = this.generateTrackingNumber(shipment.carrierCode);
    const labelUrl = `https://labels.example.com/${trackingNumber}.${params.labelFormat?.toLowerCase() || "pdf"}`;

    // Update shipment with label details
    const updatedShipment = await prisma.shipment.update({
      where: { id: params.shipmentId },
      data: {
        trackingNumber,
        labelUrl,
        labelFormat: params.labelFormat || "PDF",
        status: ShipmentStatus.PROCESSING,
        shippedDate: new Date(),
      },
    });

    return {
      shipment: updatedShipment,
      trackingNumber,
      labelUrl,
      labelFormat: params.labelFormat || "PDF",
    };
  }

  /**
   * Mark shipment as shipped
   */
  static async markShipped(params: {
    shipmentId: string;
    shippedDate?: Date;
    trackingNumber?: string;
  }) {
    // Get existing shipment first
    const existingShipment = await prisma.shipment.findUnique({
      where: { id: params.shipmentId },
    });

    const shipment = await prisma.shipment.update({
      where: { id: params.shipmentId },
      data: {
        status: ShipmentStatus.IN_TRANSIT,
        shippedDate: params.shippedDate || new Date(),
        trackingNumber:
          params.trackingNumber || existingShipment?.trackingNumber,
      },
      include: {
        salesOrder: true,
      },
    });

    // Update Sales Order status
    await prisma.salesOrder.update({
      where: { id: shipment.salesOrderId },
      data: {
        status: SalesOrderStatus.SHIPPED,
        shippedDate: shipment.shippedDate,
      },
    });

    return shipment;
  }

  /**
   * Track shipment and update status
   */
  static async updateTracking(params: {
    shipmentId: string;
    trackingEvents?: Array<{
      status: string;
      location: string;
      timestamp: Date;
      description: string;
    }>;
  }) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: params.shipmentId },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    // In production, call carrier API for tracking updates
    // Mock tracking data
    const trackingEvents = params.trackingEvents || [
      {
        status: "Picked Up",
        location: "Origin Facility",
        timestamp: new Date(),
        description: "Package picked up by carrier",
      },
    ];

    const latestEvent = trackingEvents[trackingEvents.length - 1];
    let newStatus = shipment.status;

    // Update status based on latest tracking event
    if (latestEvent.status.includes("Delivered")) {
      newStatus = ShipmentStatus.DELIVERED;
    } else if (latestEvent.status.includes("Out for Delivery")) {
      newStatus = ShipmentStatus.OUT_FOR_DELIVERY;
    } else if (latestEvent.status.includes("Exception")) {
      newStatus = ShipmentStatus.EXCEPTION;
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id: params.shipmentId },
      data: {
        status: newStatus,
        trackingEvents: trackingEvents,
        lastTrackingUpdate: new Date(),
        actualDelivery:
          newStatus === ShipmentStatus.DELIVERED ? new Date() : undefined,
      },
    });

    // If delivered, update sales order
    if (newStatus === ShipmentStatus.DELIVERED) {
      await prisma.salesOrder.update({
        where: { id: shipment.salesOrderId },
        data: {
          status: SalesOrderStatus.DELIVERED,
          deliveredDate: new Date(),
        },
      });
    }

    return updatedShipment;
  }

  /**
   * Handle shipping exception
   */
  static async handleException(params: {
    shipmentId: string;
    exceptionReason: string;
    resolutionAction:
      | "REROUTE"
      | "RETURN_TO_SENDER"
      | "HOLD_FOR_PICKUP"
      | "RESCHEDULE";
    notes?: string;
  }) {
    const shipment = await prisma.shipment.update({
      where: { id: params.shipmentId },
      data: {
        status: ShipmentStatus.EXCEPTION,
        exceptionReason: params.exceptionReason,
        exceptionDate: new Date(),
        notes: params.notes,
        metadata: {
          resolutionAction: params.resolutionAction,
          resolutionDate: new Date(),
        },
      },
    });

    // Create notification/alert for warehouse staff
    // In production, integrate with notification service

    return {
      shipment,
      actionRequired: params.resolutionAction,
      notificationSent: true,
    };
  }

  /**
   * Cancel shipment
   */
  static async cancelShipment(params: { shipmentId: string; reason: string }) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: params.shipmentId },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    if (shipment.status === ShipmentStatus.DELIVERED) {
      throw new Error("Cannot cancel delivered shipment");
    }

    // If label was generated, void it with carrier
    // In production, call carrier API to void label

    const cancelledShipment = await prisma.shipment.update({
      where: { id: params.shipmentId },
      data: {
        status: ShipmentStatus.CANCELLED,
        notes: `Cancelled: ${params.reason}`,
      },
    });

    return {
      shipment: cancelledShipment,
      labelVoided: !!shipment.trackingNumber,
      refundAmount: shipment.shippingCost,
    };
  }

  /**
   * Get shipping dashboard metrics
   */
  static async getShippingMetrics(params: {
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const startDate =
      params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = params.endDate || new Date();

    const where: Prisma.ShipmentWhereInput = {
      organizationId: params.organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Total shipments
    const totalShipments = await prisma.shipment.count({ where });

    // Shipments by status
    const byStatus = await prisma.shipment.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    // Shipments by carrier
    const byCarrier = await prisma.shipment.groupBy({
      by: ["carrierCode"],
      where: {
        ...where,
        carrierCode: { not: null },
      },
      _count: true,
      _avg: {
        shippingCost: true,
      },
    });

    // On-time delivery rate
    const deliveredShipments = await prisma.shipment.findMany({
      where: {
        ...where,
        status: ShipmentStatus.DELIVERED,
        estimatedDelivery: { not: null },
        actualDelivery: { not: null },
      },
      select: {
        estimatedDelivery: true,
        actualDelivery: true,
      },
    });

    const onTimeCount = deliveredShipments.filter(
      (s) =>
        s.actualDelivery &&
        s.estimatedDelivery &&
        s.actualDelivery <= s.estimatedDelivery,
    ).length;

    const onTimeRate =
      deliveredShipments.length > 0
        ? (onTimeCount / deliveredShipments.length) * 100
        : 0;

    // Average shipping cost
    const avgCost = await prisma.shipment.aggregate({
      where: {
        ...where,
        shippingCost: { not: null },
      },
      _avg: {
        shippingCost: true,
      },
    });

    // Exception rate
    const exceptionsCount = await prisma.shipment.count({
      where: {
        ...where,
        status: ShipmentStatus.EXCEPTION,
      },
    });

    // Average transit time
    const transitTimes = deliveredShipments
      .map((s) => {
        if (s.actualDelivery && s.estimatedDelivery) {
          return (
            (s.actualDelivery.getTime() - s.estimatedDelivery.getTime()) /
            (1000 * 60 * 60 * 24)
          );
        }
        return 0;
      })
      .filter((t) => t > 0);

    const avgTransitTime =
      transitTimes.length > 0
        ? transitTimes.reduce((sum, t) => sum + t, 0) / transitTimes.length
        : 0;

    return {
      period: { startDate, endDate },
      totalShipments,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        percentage: (s._count / totalShipments) * 100,
      })),
      byCarrier: byCarrier.map((c) => ({
        carrier: c.carrierCode,
        count: c._count,
        averageCost: c._avg.shippingCost || 0,
      })),
      onTimeDeliveryRate: onTimeRate,
      exceptionRate: (exceptionsCount / totalShipments) * 100,
      averageShippingCost: avgCost._avg.shippingCost || 0,
      averageTransitDays: avgTransitTime,
    };
  }

  /**
   * List shipments with filters
   */
  static async listShipments(params: {
    organizationId: string;
    status?: ShipmentStatus;
    carrierCode?: string;
    startDate?: Date;
    endDate?: Date;
    trackingNumber?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ShipmentWhereInput = {
      organizationId: params.organizationId,
    };

    if (params.status) where.status = params.status;
    if (params.carrierCode) where.carrierCode = params.carrierCode;
    if (params.trackingNumber)
      where.trackingNumber = { contains: params.trackingNumber };

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          salesOrder: {
            include: {
              customer: true,
            },
          },
          pack: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.shipment.count({ where }),
    ]);

    return {
      shipments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get shipment details by tracking number
   */
  static async getByTrackingNumber(trackingNumber: string) {
    return await prisma.shipment.findFirst({
      where: { trackingNumber },
      include: {
        salesOrder: {
          include: {
            customer: true,
            items: {
              include: {
                inventoryItem: true,
              },
            },
          },
        },
        pack: true,
      },
    });
  }

  /**
   * Bulk ship multiple orders
   */
  static async bulkShip(params: {
    organizationId: string;
    shipments: Array<{
      salesOrderId: string;
      carrierCode: string;
      carrierService: string;
    }>;
    createdById: string;
  }) {
    const results = [];

    for (const shipmentData of params.shipments) {
      try {
        const shipment = await this.createShipment({
          organizationId: params.organizationId,
          salesOrderId: shipmentData.salesOrderId,
          carrierCode: shipmentData.carrierCode,
          carrierService: shipmentData.carrierService,
          createdById: params.createdById,
        });

        const label = await this.generateLabel({
          shipmentId: shipment.id,
        });

        await this.markShipped({
          shipmentId: shipment.id,
          trackingNumber: label.trackingNumber,
        });

        results.push({
          salesOrderId: shipmentData.salesOrderId,
          success: true,
          shipmentId: shipment.id,
          trackingNumber: label.trackingNumber,
        });
      } catch (error: any) {
        results.push({
          salesOrderId: shipmentData.salesOrderId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: params.shipments.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Helper: Calculate base shipping rate
   */
  private static calculateBaseRate(
    from: { postalCode: string },
    to: { postalCode: string },
    weight: number,
  ): number {
    // Simplified rate calculation
    // In production, use actual distance calculation and carrier rates
    const baseRate = 10;
    const weightRate = weight * 0.5;
    const distanceFactor = Math.random() * 5 + 1; // Mock distance

    return baseRate + weightRate + distanceFactor;
  }

  /**
   * Helper: Generate mock tracking number
   */
  private static generateTrackingNumber(carrier: string): string {
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    switch (carrier.toUpperCase()) {
      case "UPS":
        return `1Z${timestamp}${random}`;
      case "FEDEX":
        return `${timestamp}${random}`;
      case "USPS":
        return `9400${timestamp}${random}`;
      default:
        return `${carrier.toUpperCase()}${timestamp}${random}`;
    }
  }

  /**
   * Schedule pickup with carrier
   */
  static async schedulePickup(params: {
    organizationId: string;
    carrier: string;
    pickupDate: Date;
    pickupTime: string;
    location: string;
    shipmentIds: string[];
  }) {
    // In production, integrate with carrier API
    // Mock implementation

    const shipments = await prisma.shipment.findMany({
      where: {
        id: { in: params.shipmentIds },
      },
    });

    return {
      pickupScheduled: true,
      confirmationNumber: `PKP-${Date.now()}`,
      pickupDate: params.pickupDate,
      pickupTime: params.pickupTime,
      shipmentCount: shipments.length,
      carrier: params.carrier,
    };
  }
}
