/**
 * Multi-Carrier Return Label Generation Service
 * Supports ShipStation, EasyPost, ShipEngine, and custom integrations
 */

import { z } from "zod";

export type LabelCarrier =
  | "UPS"
  | "FedEx"
  | "USPS"
  | "DHL"
  | "CanadaPost"
  | "Custom";
export type LabelFormat = "PDF" | "PNG" | "ZPL" | "EPL";
export type LabelSize = "4x6" | "4x8" | "A4" | "Letter";

export interface ReturnLabelRequest {
  rmaId: string;
  rmaNumber: string;

  // Carrier
  carrier: LabelCarrier;
  serviceLevel?: string; // 'Ground', 'Priority', '2Day', 'Overnight'

  // Label Type
  type: "PREPAID" | "CUSTOMER_PAID" | "COLLECT";

  // Addresses
  shipFrom: {
    name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };

  shipTo: {
    name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };

  // Package Details
  package: {
    weight: number; // lbs or kg
    weightUnit: "lb" | "kg";
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: "in" | "cm";
  };

  // Options
  options?: {
    insurance?: {
      enabled: boolean;
      amount: number;
      currency: string;
    };
    signature?: boolean;
    saturdayDelivery?: boolean;
    tracking?: boolean;
    notifications?: {
      email?: string;
      sms?: string;
    };
  };

  // Format
  format?: LabelFormat;
  size?: LabelSize;

  // Custom Instructions
  instructions?: string;
  referenceNumber?: string;
}

export interface ReturnLabel {
  id: string;
  rmaId: string;
  rmaNumber: string;

  // Carrier Info
  carrier: LabelCarrier;
  serviceLevel: string;
  trackingNumber: string;

  // Label Data
  labelUrl: string;
  labelData?: string; // base64 encoded label
  format: LabelFormat;

  // QR Code (for easy scanning)
  qrCodeUrl?: string;
  qrCodeData?: string;

  // Tracking
  trackingUrl?: string;

  // Cost
  cost?: {
    amount: number;
    currency: string;
    billedTo: "MERCHANT" | "CUSTOMER";
  };

  // Metadata
  createdAt: Date;
  expiresAt?: Date;
  voidedAt?: Date;

  // Raw Response
  providerResponse?: any;
}

export interface TrackingUpdate {
  trackingNumber: string;
  status: string;
  statusDetail: string;
  location?: string;
  timestamp: Date;

  // Delivery Info
  delivered?: boolean;
  deliveredAt?: Date;
  signedBy?: string;

  // Events
  events: {
    timestamp: Date;
    status: string;
    location: string;
    description: string;
  }[];
}

/**
 * Abstract Label Service - implement for each provider
 */
export abstract class LabelService {
  abstract generateLabel(request: ReturnLabelRequest): Promise<ReturnLabel>;
  abstract voidLabel(labelId: string): Promise<void>;
  abstract trackShipment(trackingNumber: string): Promise<TrackingUpdate>;
  abstract validateAddress(
    address: any,
  ): Promise<{ valid: boolean; suggestions?: any[] }>;
  abstract getRates(request: Omit<ReturnLabelRequest, "type">): Promise<Rate[]>;
}

export interface Rate {
  carrier: LabelCarrier;
  serviceLevel: string;
  deliveryDays?: number;
  amount: number;
  currency: string;

  // Features
  tracking: boolean;
  insurance: boolean;
  signature: boolean;
}

/**
 * ShipStation Label Service
 */
export class ShipStationLabelService extends LabelService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = "https://ssapi.shipstation.com";

  constructor(apiKey: string, apiSecret: string) {
    super();
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async generateLabel(request: ReturnLabelRequest): Promise<ReturnLabel> {
    const shipmentData = {
      carrierCode: this.mapCarrier(request.carrier),
      serviceCode: request.serviceLevel || "usps_priority_mail",
      packageCode: "package",
      confirmation: request.options?.signature ? "signature" : "none",
      shipDate: new Date().toISOString().split("T")[0],
      weight: {
        value: request.package.weight,
        units: request.package.weightUnit === "lb" ? "pounds" : "kilograms",
      },
      dimensions: request.package.length
        ? {
            length: request.package.length,
            width: request.package.width,
            height: request.package.height,
            units: request.package.dimensionUnit || "inches",
          }
        : undefined,
      shipFrom: this.formatAddress(request.shipFrom),
      shipTo: this.formatAddress(request.shipTo),
      testLabel: process.env.NODE_ENV === "development",
    };

    const response = await fetch(`${this.baseUrl}/shipments/createlabel`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(shipmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ShipStation error: ${error.message}`);
    }

    const data = await response.json();

    return {
      id: data.shipmentId,
      rmaId: request.rmaId,
      rmaNumber: request.rmaNumber,
      carrier: request.carrier,
      serviceLevel: request.serviceLevel || data.serviceCode,
      trackingNumber: data.trackingNumber,
      labelUrl: data.labelData, // ShipStation returns base64
      labelData: data.labelData,
      format: "PDF",
      trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${data.trackingNumber}`,
      cost: data.shipmentCost
        ? {
            amount: parseFloat(data.shipmentCost),
            currency: "USD",
            billedTo: "MERCHANT",
          }
        : undefined,
      createdAt: new Date(),
      providerResponse: data,
    };
  }

  async voidLabel(labelId: string): Promise<void> {
    await fetch(`${this.baseUrl}/shipments/voidlabel`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ shipmentId: labelId }),
    });
  }

  async trackShipment(trackingNumber: string): Promise<TrackingUpdate> {
    const response = await fetch(
      `${this.baseUrl}/shipments?trackingNumber=${trackingNumber}`,
      { headers: this.getHeaders() },
    );

    const data = await response.json();
    const shipment = data.shipments[0];

    return {
      trackingNumber,
      status: shipment.shipmentStatus,
      statusDetail: shipment.shipmentStatus,
      timestamp: new Date(),
      events: [],
    };
  }

  async validateAddress(
    address: any,
  ): Promise<{ valid: boolean; suggestions?: any[] }> {
    // ShipStation doesn't have address validation, use a third-party service
    return { valid: true };
  }

  async getRates(request: Omit<ReturnLabelRequest, "type">): Promise<Rate[]> {
    // ShipStation rates API
    return [];
  }

  private getHeaders() {
    const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString(
      "base64",
    );
    return {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    };
  }

  private mapCarrier(carrier: LabelCarrier): string {
    const mapping: Record<LabelCarrier, string> = {
      UPS: "ups",
      FedEx: "fedex",
      USPS: "stamps_com",
      DHL: "dhl_express",
      CanadaPost: "canada_post",
      Custom: "other",
    };
    return mapping[carrier] || "stamps_com";
  }

  private formatAddress(addr: any) {
    return {
      name: addr.name,
      company: addr.company || "",
      street1: addr.address1,
      street2: addr.address2 || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      phone: addr.phone || "",
    };
  }
}

/**
 * EasyPost Label Service
 */
export class EasyPostLabelService extends LabelService {
  private apiKey: string;
  private baseUrl = "https://api.easypost.com/v2";

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async generateLabel(request: ReturnLabelRequest): Promise<ReturnLabel> {
    // Create addresses
    const toAddress = await this.createAddress(request.shipTo);
    const fromAddress = await this.createAddress(request.shipFrom);

    // Create parcel
    const parcel = await this.createParcel(request.package);

    // Create shipment
    const shipmentData = {
      to_address: toAddress.id,
      from_address: fromAddress.id,
      parcel: parcel.id,
      carrier: this.mapCarrier(request.carrier),
      service: request.serviceLevel,
      is_return: true,
      reference: request.rmaNumber,
    };

    const shipmentResponse = await fetch(`${this.baseUrl}/shipments`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ shipment: shipmentData }),
    });

    const shipment = await shipmentResponse.json();

    // Buy cheapest rate or specified service
    const rate = request.serviceLevel
      ? shipment.rates.find((r: any) => r.service === request.serviceLevel)
      : shipment.rates[0];

    const buyResponse = await fetch(
      `${this.baseUrl}/shipments/${shipment.id}/buy`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ rate: { id: rate.id } }),
      },
    );

    const purchased = await buyResponse.json();

    return {
      id: purchased.id,
      rmaId: request.rmaId,
      rmaNumber: request.rmaNumber,
      carrier: request.carrier,
      serviceLevel: rate.service,
      trackingNumber: purchased.tracking_code,
      labelUrl: purchased.postage_label.label_url,
      format: "PDF",
      trackingUrl: purchased.tracker?.public_url,
      cost: {
        amount: parseFloat(rate.rate),
        currency: rate.currency,
        billedTo: "MERCHANT",
      },
      createdAt: new Date(purchased.created_at),
      providerResponse: purchased,
    };
  }

  async voidLabel(labelId: string): Promise<void> {
    await fetch(`${this.baseUrl}/shipments/${labelId}/refund`, {
      method: "POST",
      headers: this.getHeaders(),
    });
  }

  async trackShipment(trackingNumber: string): Promise<TrackingUpdate> {
    const response = await fetch(
      `${this.baseUrl}/trackers?tracking_code=${trackingNumber}`,
      { headers: this.getHeaders() },
    );

    const data = await response.json();
    const tracker = data.tracker;

    return {
      trackingNumber,
      status: tracker.status,
      statusDetail: tracker.status_detail,
      timestamp: new Date(tracker.updated_at),
      delivered: tracker.status === "delivered",
      deliveredAt:
        tracker.status === "delivered"
          ? new Date(tracker.est_delivery_date)
          : undefined,
      events: tracker.tracking_details.map((detail: any) => ({
        timestamp: new Date(detail.datetime),
        status: detail.status,
        location: `${detail.tracking_location.city}, ${detail.tracking_location.state}`,
        description: detail.message,
      })),
    };
  }

  async validateAddress(
    address: any,
  ): Promise<{ valid: boolean; suggestions?: any[] }> {
    const response = await fetch(`${this.baseUrl}/addresses`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        address: {
          street1: address.address1,
          street2: address.address2,
          city: address.city,
          state: address.state,
          zip: address.postalCode,
          country: address.country,
        },
        verify: ["delivery"],
      }),
    });

    const data = await response.json();
    return {
      valid: !data.verifications?.delivery?.errors?.length,
      suggestions: data.verifications?.delivery?.success ? [data] : [],
    };
  }

  async getRates(request: Omit<ReturnLabelRequest, "type">): Promise<Rate[]> {
    // Similar to generateLabel but don't buy
    return [];
  }

  private async createAddress(addr: any) {
    const response = await fetch(`${this.baseUrl}/addresses`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        address: {
          name: addr.name,
          company: addr.company,
          street1: addr.address1,
          street2: addr.address2,
          city: addr.city,
          state: addr.state,
          zip: addr.postalCode,
          country: addr.country,
          phone: addr.phone,
          email: addr.email,
        },
      }),
    });

    return await response.json();
  }

  private async createParcel(pkg: any) {
    const response = await fetch(`${this.baseUrl}/parcels`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        parcel: {
          weight: pkg.weight,
          length: pkg.length,
          width: pkg.width,
          height: pkg.height,
        },
      }),
    });

    return await response.json();
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private mapCarrier(carrier: LabelCarrier): string {
    return carrier.toUpperCase();
  }
}

/**
 * QR Code Generator for Easy Returns
 */
export class QRCodeService {
  static async generate(data: string): Promise<{ url: string; data: string }> {
    // Use QR code generation library or API
    const qrData = Buffer.from(data).toString("base64");
    return {
      url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`,
      data: qrData,
    };
  }

  static generateReturnQR(
    rmaNumber: string,
    trackingNumber?: string,
  ): Promise<{ url: string; data: string }> {
    const data = JSON.stringify({
      type: "RETURN",
      rma: rmaNumber,
      tracking: trackingNumber,
      timestamp: new Date().toISOString(),
    });

    return this.generate(data);
  }
}

/**
 * Factory to get the appropriate label service
 */
export class LabelServiceFactory {
  static create(provider: string, config: any): LabelService {
    switch (provider.toLowerCase()) {
      case "shipstation":
        return new ShipStationLabelService(config.apiKey, config.apiSecret);

      case "easypost":
        return new EasyPostLabelService(config.apiKey);

      case "shipengine":
        // Implement ShipEngine service
        throw new Error("ShipEngine not yet implemented");

      default:
        throw new Error(`Unknown label provider: ${provider}`);
    }
  }
}
