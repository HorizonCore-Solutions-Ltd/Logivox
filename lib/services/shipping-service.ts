/**
 * Shipping Service
 * Comprehensive outbound shipping management
 * Handles carrier rate shopping, label generation, tracking,
 * multi-carrier integration, and shipping analytics
 */

import { PrismaClient, ShipmentStatus, CarrierType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateShipmentRequest {
  salesOrderId: string;
  packId?: string;
  carrierCode?: string;
  carrierService?: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  weight?: number;
  weightUnit?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  insuranceAmount?: number;
  signatureRequired?: boolean;
  saturdayDelivery?: boolean;
  notes?: string;
}

export interface RateShoppingRequest {
  originAddress: {
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  destinationAddress: {
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  packages: Array<{
    weight: number;
    weightUnit: string;
    length: number;
    width: number;
    height: number;
    dimensionUnit: string;
    insuranceValue?: number;
  }>;
  serviceOptions?: {
    signatureRequired?: boolean;
    saturdayDelivery?: boolean;
  };
}

export interface ShippingRate {
  carrier: string;
  carrierCode: string;
  service: string;
  serviceCode: string;
  rate: number;
  currency: string;
  estimatedDays: number;
  estimatedDelivery: Date;
  guaranteedDelivery: boolean;
  includesInsurance: boolean;
  maxInsuranceValue?: number;
  tracking: boolean;
  features: string[];
  metadata?: any;
}

export interface ShipmentLabel {
  shipmentId: string;
  trackingNumber: string;
  labelUrl: string;
  labelFormat: string; // PDF, PNG, ZPL
  labelData?: Buffer;
  qrCodeUrl?: string;
  trackingUrl?: string;
  carrier: string;
  service: string;
  cost: number;
  currency: string;
  estimatedDelivery: Date;
}

export interface TrackingInfo {
  shipmentId: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  statusDescription: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  events: Array<{
    timestamp: Date;
    status: string;
    location: string;
    description: string;
    exceptionType?: string;
  }>;
  delivered: boolean;
  deliveryProof?: {
    signedBy?: string;
    signatureImage?: string;
    photoUrl?: string;
    timestamp: Date;
  };
}

export interface ShippingMetrics {
  totalShipments: number;
  totalCost: number;
  averageCost: number;
  onTimeDeliveryRate: number; // percentage
  deliveryAccuracy: number; // percentage
  exceptionRate: number; // percentage
  carrierPerformance: Array<{
    carrier: string;
    totalShipments: number;
    totalCost: number;
    averageCost: number;
    onTimeRate: number;
    exceptionRate: number;
    avgDeliveryDays: number;
  }>;
  popularServices: Array<{
    carrier: string;
    service: string;
    count: number;
    totalCost: number;
  }>;
  recentShipments: Array<{
    id: string;
    shipmentNumber: string;
    trackingNumber: string;
    status: ShipmentStatus;
    carrier: string;
    shippedDate?: Date;
    estimatedDelivery?: Date;
  }>;
}

/**
 * Shipping Service Class
 */
export class ShippingService {
  /**
   * Generate unique shipment number
   */
  private async generateShipmentNumber(organizationId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const lastShipment = await prisma.shipment.findFirst({
      where: {
        organizationId,
        shipmentNumber: {
          startsWith: `SHIP-${dateStr}`,
        },
      },
      orderBy: {
        shipmentNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastShipment) {
      const lastSequence = parseInt(lastShipment.shipmentNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `SHIP-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Get carrier rates (rate shopping)
   */
  async getRates(
    organizationId: string,
    request: RateShoppingRequest
  ): Promise<ShippingRate[]> {
    // Get active carrier configs
    const carriers = await prisma.carrierConfig.findMany({
      where: {
        organizationId,
        isActive: true,
      },
    });

    const rates: ShippingRate[] = [];

    for (const carrier of carriers) {
      try {
        const carrierRates = await this.fetchCarrierRates(carrier, request);
        rates.push(...carrierRates);
      } catch (error) {
        console.error(`Error fetching rates from ${carrier.carrierName}:`, error);
        // Continue with other carriers
      }
    }

    // Sort by price (cheapest first)
    rates.sort((a, b) => a.rate - b.rate);

    return rates;
  }

  /**
   * Fetch rates from specific carrier
   */
  private async fetchCarrierRates(
    carrier: any,
    request: RateShoppingRequest
  ): Promise<ShippingRate[]> {
    // This would integrate with actual carrier APIs
    // For now, return mock data based on carrier type

    const baseRates: Record<string, Array<{ service: string; rate: number; days: number }>> = {
      UPS: [
        { service: 'UPS Ground', rate: 15.99, days: 5 },
        { service: 'UPS 3 Day Select', rate: 25.99, days: 3 },
        { service: 'UPS 2nd Day Air', rate: 35.99, days: 2 },
        { service: 'UPS Next Day Air', rate: 55.99, days: 1 },
      ],
      FEDEX: [
        { service: 'FedEx Ground', rate: 14.99, days: 5 },
        { service: 'FedEx Express Saver', rate: 24.99, days: 3 },
        { service: 'FedEx 2Day', rate: 34.99, days: 2 },
        { service: 'FedEx Priority Overnight', rate: 54.99, days: 1 },
      ],
      USPS: [
        { service: 'USPS Priority Mail', rate: 12.99, days: 3 },
        { service: 'USPS Priority Mail Express', rate: 32.99, days: 1 },
      ],
      DHL: [
        { service: 'DHL Ground', rate: 16.99, days: 5 },
        { service: 'DHL Express', rate: 45.99, days: 2 },
      ],
    };

    const carrierRates = baseRates[carrier.carrierType] || [];
    const today = new Date();

    return carrierRates.map((rate) => {
      const estimatedDelivery = new Date(today);
      estimatedDelivery.setDate(estimatedDelivery.getDate() + rate.days);

      return {
        carrier: carrier.carrierName,
        carrierCode: carrier.carrierType,
        service: rate.service,
        serviceCode: rate.service.replace(/\s+/g, '_').toUpperCase(),
        rate: rate.rate,
        currency: 'USD',
        estimatedDays: rate.days,
        estimatedDelivery,
        guaranteedDelivery: rate.days <= 2,
        includesInsurance: false,
        tracking: true,
        features: ['Tracking', 'Proof of Delivery'],
      };
    });
  }

  /**
   * Select best carrier automatically
   */
  async selectBestCarrier(
    organizationId: string,
    request: RateShoppingRequest,
    criteria: {
      priority: 'COST' | 'SPEED' | 'RELIABILITY';
      maxCost?: number;
      maxDays?: number;
    }
  ): Promise<ShippingRate> {
    const rates = await this.getRates(organizationId, request);

    if (rates.length === 0) {
      throw new Error('No carrier rates available');
    }

    // Filter by constraints
    let filteredRates = rates;

    if (criteria.maxCost) {
      filteredRates = filteredRates.filter((r) => r.rate <= criteria.maxCost!);
    }

    if (criteria.maxDays) {
      filteredRates = filteredRates.filter((r) => r.estimatedDays <= criteria.maxDays!);
    }

    if (filteredRates.length === 0) {
      throw new Error('No rates match the specified criteria');
    }

    // Select based on priority
    switch (criteria.priority) {
      case 'COST':
        // Already sorted by cost
        return filteredRates[0];

      case 'SPEED':
        filteredRates.sort((a, b) => a.estimatedDays - b.estimatedDays);
        return filteredRates[0];

      case 'RELIABILITY':
        // Would factor in carrier performance metrics
        // For now, prefer known reliable carriers
        const reliableCarriers = ['FedEx', 'UPS'];
        const reliableRate = filteredRates.find((r) =>
          reliableCarriers.includes(r.carrier)
        );
        return reliableRate || filteredRates[0];

      default:
        return filteredRates[0];
    }
  }

  /**
   * Create shipment
   */
  async createShipment(
    organizationId: string,
    userId: string,
    request: CreateShipmentRequest
  ): Promise<any> {
    // Validate sales order
    const salesOrder = await prisma.salesOrder.findFirst({
      where: {
        id: request.salesOrderId,
        organizationId,
      },
      include: {
        items: true,
      },
    });

    if (!salesOrder) {
      throw new Error('Sales order not found');
    }

    if (salesOrder.status !== 'PACKED' && salesOrder.status !== 'PICKED') {
      throw new Error('Sales order must be picked/packed before shipping');
    }

    // Generate shipment number
    const shipmentNumber = await this.generateShipmentNumber(organizationId);

    // Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        organizationId,
        shipmentNumber,
        salesOrderId: request.salesOrderId,
        packId: request.packId,
        status: 'PENDING',
        carrierCode: request.carrierCode,
        carrierName: request.carrierCode, // Would map from code to name
        carrierService: request.carrierService,
        recipientName: request.recipientName,
        recipientPhone: request.recipientPhone,
        recipientEmail: request.recipientEmail,
        addressLine1: request.addressLine1,
        addressLine2: request.addressLine2,
        city: request.city,
        state: request.state,
        postalCode: request.postalCode,
        country: request.country,
        weight: request.weight,
        weightUnit: request.weightUnit || 'kg',
        dimensions: request.dimensions ? JSON.stringify(request.dimensions) : null,
        insuranceAmount: request.insuranceAmount,
        signatureRequired: request.signatureRequired || false,
        saturdayDelivery: request.saturdayDelivery || false,
        notes: request.notes,
        createdById: userId,
      },
      include: {
        salesOrder: true,
      },
    });

    return shipment;
  }

  /**
   * Generate shipping label
   */
  async generateLabel(
    shipmentId: string,
    organizationId: string,
    options?: {
      format?: 'PDF' | 'PNG' | 'ZPL';
      includeQRCode?: boolean;
    }
  ): Promise<ShipmentLabel> {
    const shipment = await prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        organizationId,
      },
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    // Generate tracking number
    const trackingNumber = this.generateTrackingNumber(shipment.carrierCode!);

    // Generate label URL (would integrate with carrier API)
    const labelUrl = `https://labels.logivox.com/${shipmentId}`;
    const trackingUrl = `https://track.logivox.com/${trackingNumber}`;

    // Update shipment
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        trackingNumber,
        trackingUrl,
        labelUrl,
        labelFormat: options?.format || 'PDF',
        status: 'LABEL_CREATED',
      },
    });

    return {
      shipmentId: shipment.id,
      trackingNumber,
      labelUrl,
      labelFormat: options?.format || 'PDF',
      trackingUrl,
      carrier: shipment.carrierCode!,
      service: shipment.carrierService!,
      cost: shipment.shippingCost?.toNumber() || 0,
      currency: shipment.currency,
      estimatedDelivery: shipment.estimatedDelivery || new Date(),
    };
  }

  /**
   * Generate tracking number
   */
  private generateTrackingNumber(carrier: string): string {
    const prefix = carrier.substring(0, 2).toUpperCase();
    const random = Math.random().toString(36).substring(2, 15).toUpperCase();
    return `${prefix}${random}`;
  }

  /**
   * Mark shipment as shipped
   */
  async markAsShipped(
    shipmentId: string,
    organizationId: string,
    userId: string
  ): Promise<any> {
    const shipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'SHIPPED',
        shippedDate: new Date(),
      },
      include: {
        salesOrder: true,
      },
    });

    // Update sales order status
    await prisma.salesOrder.update({
      where: { id: shipment.salesOrderId },
      data: {
        status: 'SHIPPED',
        trackingNumber: shipment.trackingNumber,
      },
    });

    return shipment;
  }

  /**
   * Track shipment
   */
  async trackShipment(
    shipmentId: string,
    organizationId: string
  ): Promise<TrackingInfo> {
    const shipment = await prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        organizationId,
      },
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    if (!shipment.trackingNumber) {
      throw new Error('No tracking number available');
    }

    // Would integrate with carrier tracking API
    // For now, return mock tracking data
    const events = this.generateMockTrackingEvents(shipment);

    const delivered = shipment.status === 'DELIVERED';

    return {
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrierCode!,
      status: shipment.status,
      statusDescription: this.getStatusDescription(shipment.status),
      currentLocation: events[events.length - 1]?.location,
      estimatedDelivery: shipment.estimatedDelivery || undefined,
      actualDelivery: shipment.actualDelivery || undefined,
      events,
      delivered,
      deliveryProof: delivered
        ? {
            signedBy: 'John Doe',
            timestamp: shipment.actualDelivery || new Date(),
          }
        : undefined,
    };
  }

  /**
   * Generate mock tracking events
   */
  private generateMockTrackingEvents(shipment: any): TrackingInfo['events'] {
    const events: TrackingInfo['events'] = [];
    const now = new Date();

    if (shipment.shippedDate) {
      events.push({
        timestamp: shipment.shippedDate,
        status: 'SHIPPED',
        location: `${shipment.city}, ${shipment.state}`,
        description: 'Package picked up by carrier',
      });
    }

    if (shipment.status === 'IN_TRANSIT' || shipment.status === 'DELIVERED') {
      const transitDate = new Date(shipment.shippedDate || now);
      transitDate.setHours(transitDate.getHours() + 12);

      events.push({
        timestamp: transitDate,
        status: 'IN_TRANSIT',
        location: 'Distribution Center',
        description: 'Package in transit',
      });
    }

    if (shipment.status === 'DELIVERED') {
      events.push({
        timestamp: shipment.actualDelivery || now,
        status: 'DELIVERED',
        location: `${shipment.city}, ${shipment.state}`,
        description: 'Package delivered',
      });
    }

    return events;
  }

  /**
   * Get status description
   */
  private getStatusDescription(status: ShipmentStatus): string {
    const descriptions: Record<ShipmentStatus, string> = {
      PENDING: 'Shipment created, awaiting label',
      LABEL_CREATED: 'Label generated, ready to ship',
      PICKED_UP: 'Package picked up by carrier',
      IN_TRANSIT: 'Package in transit',
      OUT_FOR_DELIVERY: 'Package out for delivery',
      DELIVERED: 'Package delivered',
      RETURNED: 'Package returned to sender',
      EXCEPTION: 'Delivery exception',
      CANCELLED: 'Shipment cancelled',
      SHIPPED: 'Package shipped',
    };

    return descriptions[status] || 'Unknown status';
  }

  /**
   * Update tracking from carrier
   */
  async updateTrackingFromCarrier(
    shipmentId: string,
    organizationId: string
  ): Promise<void> {
    const shipment = await prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        organizationId,
      },
    });

    if (!shipment || !shipment.trackingNumber) {
      return;
    }

    // Would call carrier API to get latest tracking
    // For now, simulate update
    const trackingInfo = await this.trackShipment(shipmentId, organizationId);

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        trackingEvents: JSON.stringify(trackingInfo.events),
        lastTrackingUpdate: new Date(),
      },
    });
  }

  /**
   * Handle delivery exception
   */
  async handleException(
    shipmentId: string,
    organizationId: string,
    exceptionDetails: {
      reason: string;
      description: string;
      resolutionAction?: string;
    }
  ): Promise<any> {
    const shipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'EXCEPTION',
        exceptionReason: exceptionDetails.reason,
        exceptionDate: new Date(),
        notes: exceptionDetails.description,
      },
      include: {
        salesOrder: {
          include: {
            customer: true,
          },
        },
      },
    });

    // Would trigger notification to customer service
    // Would create case/ticket for resolution

    return shipment;
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(
    shipmentId: string,
    organizationId: string,
    reason: string
  ): Promise<any> {
    const shipment = await prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        organizationId,
      },
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    if (shipment.status === 'DELIVERED') {
      throw new Error('Cannot cancel delivered shipment');
    }

    // Would void label with carrier if already created
    if (shipment.trackingNumber) {
      // Void label API call would go here
    }

    return await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'CANCELLED',
        notes: `Cancelled: ${reason}`,
      },
    });
  }

  /**
   * Get shipping metrics
   */
  async getShippingMetrics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ShippingMetrics> {
    const dateFilter: any = { organizationId };

    if (startDate || endDate) {
      dateFilter.shippedDate = {};
      if (startDate) dateFilter.shippedDate.gte = startDate;
      if (endDate) dateFilter.shippedDate.lte = endDate;
    }

    // Total shipments
    const totalShipments = await prisma.shipment.count({
      where: dateFilter,
    });

    // Total cost
    const shipments = await prisma.shipment.findMany({
      where: dateFilter,
      select: {
        shippingCost: true,
        carrierCode: true,
        carrierService: true,
        estimatedDelivery: true,
        actualDelivery: true,
        status: true,
      },
    });

    const totalCost = shipments.reduce(
      (sum, s) => sum + (s.shippingCost?.toNumber() || 0),
      0
    );
    const averageCost = totalShipments > 0 ? totalCost / totalShipments : 0;

    // On-time delivery rate
    const deliveredShipments = shipments.filter((s) => s.status === 'DELIVERED');
    const onTimeDeliveries = deliveredShipments.filter((s) => {
      if (!s.actualDelivery || !s.estimatedDelivery) return false;
      return s.actualDelivery <= s.estimatedDelivery;
    });
    const onTimeDeliveryRate =
      deliveredShipments.length > 0
        ? (onTimeDeliveries.length / deliveredShipments.length) * 100
        : 0;

    // Exception rate
    const exceptions = shipments.filter((s) => s.status === 'EXCEPTION');
    const exceptionRate = totalShipments > 0 ? (exceptions.length / totalShipments) * 100 : 0;

    // Carrier performance
    const carrierGroups = shipments.reduce((acc: any, s) => {
      const carrier = s.carrierCode || 'UNKNOWN';
      if (!acc[carrier]) {
        acc[carrier] = [];
      }
      acc[carrier].push(s);
      return acc;
    }, {});

    const carrierPerformance = Object.entries(carrierGroups).map(([carrier, ships]: [string, any]) => {
      const carrierTotal = ships.reduce((sum: number, s: any) => sum + (s.shippingCost?.toNumber() || 0), 0);
      const carrierDelivered = ships.filter((s: any) => s.status === 'DELIVERED');
      const carrierOnTime = carrierDelivered.filter((s: any) => {
        if (!s.actualDelivery || !s.estimatedDelivery) return false;
        return s.actualDelivery <= s.estimatedDelivery;
      });
      const carrierExceptions = ships.filter((s: any) => s.status === 'EXCEPTION');

      return {
        carrier,
        totalShipments: ships.length,
        totalCost: carrierTotal,
        averageCost: ships.length > 0 ? carrierTotal / ships.length : 0,
        onTimeRate: carrierDelivered.length > 0 ? (carrierOnTime.length / carrierDelivered.length) * 100 : 0,
        exceptionRate: ships.length > 0 ? (carrierExceptions.length / ships.length) * 100 : 0,
        avgDeliveryDays: 3, // Placeholder
      };
    });

    // Recent shipments
    const recentShipments = await prisma.shipment.findMany({
      where: dateFilter,
      select: {
        id: true,
        shipmentNumber: true,
        trackingNumber: true,
        status: true,
        carrierCode: true,
        shippedDate: true,
        estimatedDelivery: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalShipments,
      totalCost,
      averageCost,
      onTimeDeliveryRate,
      deliveryAccuracy: 98, // Placeholder
      exceptionRate,
      carrierPerformance,
      popularServices: [], // Would aggregate from data
      recentShipments: recentShipments.map((s) => ({
        ...s,
        carrier: s.carrierCode || '',
      })),
    };
  }

  /**
   * Get shipment by ID
   */
  async getShipmentById(shipmentId: string, organizationId: string): Promise<any> {
    return await prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        organizationId,
      },
      include: {
        salesOrder: {
          include: {
            customer: true,
            items: true,
          },
        },
        pack: true,
        createdBy: true,
      },
    });
  }

  /**
   * List shipments with filters
   */
  async listShipments(
    organizationId: string,
    filters: {
      status?: ShipmentStatus;
      carrierCode?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ shipments: any[]; total: number; page: number; pages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.carrierCode) where.carrierCode = filters.carrierCode;

    if (filters.startDate || filters.endDate) {
      where.shippedDate = {};
      if (filters.startDate) where.shippedDate.gte = filters.startDate;
      if (filters.endDate) where.shippedDate.lte = filters.endDate;
    }

    if (filters.search) {
      where.OR = [
        { shipmentNumber: { contains: filters.search, mode: 'insensitive' } },
        { trackingNumber: { contains: filters.search, mode: 'insensitive' } },
        {
          salesOrder: {
            soNumber: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [total, shipments] = await Promise.all([
      prisma.shipment.count({ where }),
      prisma.shipment.findMany({
        where,
        include: {
          salesOrder: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      shipments,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}

export default ShippingService;
