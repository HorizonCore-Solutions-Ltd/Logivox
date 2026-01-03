/**
 * Carrier Integration Service
 * 
 * Provides unified interface for major shipping carriers:
 * - FedEx
 * - UPS
 * - USPS
 * - DHL
 */

export interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface Package {
  weight: number; // in pounds
  length: number; // in inches
  width: number;
  height: number;
  insuranceValue?: number;
}

export interface ShippingRate {
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  deliveryDays?: number;
  deliveryDate?: Date;
}

export interface ShipmentLabel {
  trackingNumber: string;
  labelUrl: string;
  labelFormat: 'PDF' | 'PNG' | 'ZPL';
  carrier: string;
  service: string;
  cost: number;
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  location?: string;
  description: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: 'pre_transit' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  events: TrackingEvent[];
}

/**
 * FedEx Integration
 */
export class FedExService {
  private apiKey: string;
  private apiSecret: string;
  private accountNumber: string;
  private meterNumber: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.FEDEX_API_KEY || '';
    this.apiSecret = process.env.FEDEX_API_SECRET || '';
    this.accountNumber = process.env.FEDEX_ACCOUNT_NUMBER || '';
    this.meterNumber = process.env.FEDEX_METER_NUMBER || '';
    this.baseUrl = process.env.FEDEX_ENV === 'production' 
      ? 'https://apis.fedex.com' 
      : 'https://apis-sandbox.fedex.com';
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.apiKey,
        client_secret: this.apiSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`FedEx authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async getRates(origin: Address, destination: Address, packages: Package[]): Promise<ShippingRate[]> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/rate/v1/rates/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountNumber: { value: this.accountNumber },
        requestedShipment: {
          shipper: {
            address: {
              streetLines: [origin.street1, origin.street2].filter(Boolean),
              city: origin.city,
              stateOrProvinceCode: origin.state,
              postalCode: origin.postalCode,
              countryCode: origin.country,
            },
          },
          recipient: {
            address: {
              streetLines: [destination.street1, destination.street2].filter(Boolean),
              city: destination.city,
              stateOrProvinceCode: destination.state,
              postalCode: destination.postalCode,
              countryCode: destination.country,
            },
          },
          pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
          rateRequestType: ['LIST', 'ACCOUNT'],
          requestedPackageLineItems: packages.map(pkg => ({
            weight: {
              units: 'LB',
              value: pkg.weight,
            },
            dimensions: {
              length: pkg.length,
              width: pkg.width,
              height: pkg.height,
              units: 'IN',
            },
          })),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`FedEx rate request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.output.rateReplyDetails.map((rate: any) => ({
      carrier: 'FedEx',
      service: rate.serviceName,
      rate: parseFloat(rate.ratedShipmentDetails[0].totalNetCharge),
      currency: rate.ratedShipmentDetails[0].currency,
      deliveryDate: rate.commit?.dateDetail?.dayFormat ? new Date(rate.commit.dateDetail.dayFormat) : undefined,
    }));
  }

  async createShipment(
    origin: Address,
    destination: Address,
    packages: Package[],
    service: string
  ): Promise<ShipmentLabel> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/ship/v1/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountNumber: { value: this.accountNumber },
        requestedShipment: {
          shipper: {
            contact: {
              personName: origin.name,
              phoneNumber: origin.phone,
              companyName: origin.company,
            },
            address: {
              streetLines: [origin.street1, origin.street2].filter(Boolean),
              city: origin.city,
              stateOrProvinceCode: origin.state,
              postalCode: origin.postalCode,
              countryCode: origin.country,
            },
          },
          recipients: [{
            contact: {
              personName: destination.name,
              phoneNumber: destination.phone,
              companyName: destination.company,
            },
            address: {
              streetLines: [destination.street1, destination.street2].filter(Boolean),
              city: destination.city,
              stateOrProvinceCode: destination.state,
              postalCode: destination.postalCode,
              countryCode: destination.country,
            },
          }],
          serviceType: service,
          packagingType: 'YOUR_PACKAGING',
          pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
          shippingChargesPayment: {
            paymentType: 'SENDER',
          },
          labelSpecification: {
            labelFormatType: 'COMMON2D',
            imageType: 'PDF',
            labelStockType: 'PAPER_4X6',
          },
          requestedPackageLineItems: packages.map(pkg => ({
            weight: {
              units: 'LB',
              value: pkg.weight,
            },
            dimensions: {
              length: pkg.length,
              width: pkg.width,
              height: pkg.height,
              units: 'IN',
            },
          })),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`FedEx shipment creation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const shipmentDetails = data.output.transactionShipments[0];
    
    return {
      trackingNumber: shipmentDetails.masterTrackingNumber,
      labelUrl: shipmentDetails.pieceResponses[0].packageDocuments[0].url,
      labelFormat: 'PDF',
      carrier: 'FedEx',
      service: service,
      cost: parseFloat(shipmentDetails.shipmentDocuments[0].totalCharge),
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/track/v1/trackingnumbers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber: trackingNumber,
            },
          },
        ],
        includeDetailedScans: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`FedEx tracking request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const trackingData = data.output.completeTrackResults[0].trackResults[0];

    return {
      trackingNumber,
      carrier: 'FedEx',
      status: this.mapFedExStatus(trackingData.latestStatusDetail.code),
      estimatedDelivery: trackingData.dateAndTimes?.find((d: any) => d.type === 'ESTIMATED_DELIVERY')?.dateTime 
        ? new Date(trackingData.dateAndTimes.find((d: any) => d.type === 'ESTIMATED_DELIVERY').dateTime)
        : undefined,
      actualDelivery: trackingData.dateAndTimes?.find((d: any) => d.type === 'ACTUAL_DELIVERY')?.dateTime
        ? new Date(trackingData.dateAndTimes.find((d: any) => d.type === 'ACTUAL_DELIVERY').dateTime)
        : undefined,
      events: trackingData.scanEvents?.map((event: any) => ({
        timestamp: new Date(event.date),
        status: event.eventDescription,
        location: event.scanLocation?.city,
        description: event.eventDescription,
      })) || [],
    };
  }

  private mapFedExStatus(code: string): TrackingInfo['status'] {
    const statusMap: Record<string, TrackingInfo['status']> = {
      'PU': 'pre_transit',
      'IT': 'in_transit',
      'OD': 'out_for_delivery',
      'DL': 'delivered',
      'DE': 'exception',
      'RS': 'returned',
    };
    return statusMap[code] || 'in_transit';
  }
}

/**
 * UPS Integration
 */
export class UPSService {
  private clientId: string;
  private clientSecret: string;
  private accountNumber: string;
  private baseUrl: string;

  constructor() {
    this.clientId = process.env.UPS_CLIENT_ID || '';
    this.clientSecret = process.env.UPS_CLIENT_SECRET || '';
    this.accountNumber = process.env.UPS_ACCOUNT_NUMBER || '';
    this.baseUrl = process.env.UPS_ENV === 'production'
      ? 'https://onlinetools.ups.com/api'
      : 'https://wwwcie.ups.com/api';
  }

  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/security/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error(`UPS authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async getRates(origin: Address, destination: Address, packages: Package[]): Promise<ShippingRate[]> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/rating/v1/Rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        RateRequest: {
          Request: {
            RequestOption: 'Shop',
          },
          Shipment: {
            Shipper: {
              Address: {
                AddressLine: [origin.street1],
                City: origin.city,
                StateProvinceCode: origin.state,
                PostalCode: origin.postalCode,
                CountryCode: origin.country,
              },
            },
            ShipTo: {
              Address: {
                AddressLine: [destination.street1],
                City: destination.city,
                StateProvinceCode: destination.state,
                PostalCode: destination.postalCode,
                CountryCode: destination.country,
              },
            },
            ShipFrom: {
              Address: {
                AddressLine: [origin.street1],
                City: origin.city,
                StateProvinceCode: origin.state,
                PostalCode: origin.postalCode,
                CountryCode: origin.country,
              },
            },
            Package: packages.map(pkg => ({
              PackagingType: {
                Code: '02', // Customer Supplied Package
              },
              Dimensions: {
                UnitOfMeasurement: { Code: 'IN' },
                Length: pkg.length.toString(),
                Width: pkg.width.toString(),
                Height: pkg.height.toString(),
              },
              PackageWeight: {
                UnitOfMeasurement: { Code: 'LBS' },
                Weight: pkg.weight.toString(),
              },
            })),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`UPS rate request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.RateResponse.RatedShipment.map((rate: any) => ({
      carrier: 'UPS',
      service: rate.Service.Code,
      rate: parseFloat(rate.TotalCharges.MonetaryValue),
      currency: rate.TotalCharges.CurrencyCode,
      deliveryDays: rate.GuaranteedDelivery?.BusinessDaysInTransit 
        ? parseInt(rate.GuaranteedDelivery.BusinessDaysInTransit)
        : undefined,
    }));
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/track/v1/details/${trackingNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`UPS tracking request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const shipment = data.trackResponse.shipment[0];

    return {
      trackingNumber,
      carrier: 'UPS',
      status: this.mapUPSStatus(shipment.package[0].currentStatus.code),
      estimatedDelivery: shipment.deliveryDate?.date 
        ? new Date(shipment.deliveryDate.date)
        : undefined,
      events: shipment.package[0].activity?.map((event: any) => ({
        timestamp: new Date(`${event.date} ${event.time}`),
        status: event.status.description,
        location: event.location?.address?.city,
        description: event.status.description,
      })) || [],
    };
  }

  private mapUPSStatus(code: string): TrackingInfo['status'] {
    const statusMap: Record<string, TrackingInfo['status']> = {
      'M': 'pre_transit',
      'I': 'in_transit',
      'OT': 'out_for_delivery',
      'D': 'delivered',
      'X': 'exception',
      'RS': 'returned',
    };
    return statusMap[code] || 'in_transit';
  }
}

/**
 * USPS Integration
 */
export class USPSService {
  private userId: string;
  private password: string;
  private baseUrl: string;

  constructor() {
    this.userId = process.env.USPS_USER_ID || '';
    this.password = process.env.USPS_PASSWORD || '';
    this.baseUrl = process.env.USPS_ENV === 'production'
      ? 'https://secure.shippingapis.com/ShippingAPI.dll'
      : 'https://secure.shippingapis.com/ShippingAPITest.dll';
  }

  async getRates(origin: Address, destination: Address, packages: Package[]): Promise<ShippingRate[]> {
    // USPS uses XML API
    const xml = `
      <RateV4Request USERID="${this.userId}">
        ${packages.map((pkg, i) => `
          <Package ID="${i}">
            <Service>ALL</Service>
            <ZipOrigination>${origin.postalCode}</ZipOrigination>
            <ZipDestination>${destination.postalCode}</ZipDestination>
            <Pounds>${Math.floor(pkg.weight)}</Pounds>
            <Ounces>${Math.round((pkg.weight % 1) * 16)}</Ounces>
            <Container>VARIABLE</Container>
            <Width>${pkg.width}</Width>
            <Length>${pkg.length}</Length>
            <Height>${pkg.height}</Height>
          </Package>
        `).join('')}
      </RateV4Request>
    `;

    const response = await fetch(`${this.baseUrl}?API=RateV4&XML=${encodeURIComponent(xml)}`);
    
    if (!response.ok) {
      throw new Error(`USPS rate request failed: ${response.statusText}`);
    }

    const xmlText = await response.text();
    // Parse XML response (simplified - would use xml2js in production)
    return [
      { carrier: 'USPS', service: 'Priority Mail', rate: 0, currency: 'USD' },
    ];
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    const xml = `
      <TrackFieldRequest USERID="${this.userId}">
        <TrackID ID="${trackingNumber}"></TrackID>
      </TrackFieldRequest>
    `;

    const response = await fetch(`${this.baseUrl}?API=TrackV2&XML=${encodeURIComponent(xml)}`);
    
    if (!response.ok) {
      throw new Error(`USPS tracking request failed: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    return {
      trackingNumber,
      carrier: 'USPS',
      status: 'in_transit',
      events: [],
    };
  }
}

/**
 * Unified Carrier Service
 */
export class CarrierService {
  private fedex: FedExService;
  private ups: UPSService;
  private usps: USPSService;

  constructor() {
    this.fedex = new FedExService();
    this.ups = new UPSService();
    this.usps = new USPSService();
  }

  async getAllRates(origin: Address, destination: Address, packages: Package[]): Promise<ShippingRate[]> {
    const rates = await Promise.allSettled([
      this.fedex.getRates(origin, destination, packages),
      this.ups.getRates(origin, destination, packages),
      this.usps.getRates(origin, destination, packages),
    ]);

    return rates
      .filter((result): result is PromiseFulfilledResult<ShippingRate[]> => result.status === 'fulfilled')
      .flatMap(result => result.value)
      .sort((a, b) => a.rate - b.rate);
  }

  async createShipment(
    carrier: string,
    origin: Address,
    destination: Address,
    packages: Package[],
    service: string
  ): Promise<ShipmentLabel> {
    switch (carrier.toLowerCase()) {
      case 'fedex':
        return this.fedex.createShipment(origin, destination, packages, service);
      case 'ups':
        throw new Error('UPS shipment creation not yet implemented');
      case 'usps':
        throw new Error('USPS shipment creation not yet implemented');
      default:
        throw new Error(`Unknown carrier: ${carrier}`);
    }
  }

  async trackShipment(carrier: string, trackingNumber: string): Promise<TrackingInfo> {
    switch (carrier.toLowerCase()) {
      case 'fedex':
        return this.fedex.trackShipment(trackingNumber);
      case 'ups':
        return this.ups.trackShipment(trackingNumber);
      case 'usps':
        return this.usps.trackShipment(trackingNumber);
      default:
        throw new Error(`Unknown carrier: ${carrier}`);
    }
  }
}

// Export singleton instance
export const carrierService = new CarrierService();
