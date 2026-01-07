import axios from "axios";

/**
 * DHL Shipping Integration
 * Supports: DHL Express, DHL eCommerce, DHL Freight
 */

export interface DHLShipmentRequest {
  accountNumber: string;
  apiKey: string;
  apiSecret: string;

  // Shipper info
  shipperName: string;
  shipperCompany?: string;
  shipperAddress1: string;
  shipperAddress2?: string;
  shipperCity: string;
  shipperState: string;
  shipperPostalCode: string;
  shipperCountry: string;
  shipperPhone: string;
  shipperEmail?: string;

  // Recipient info
  recipientName: string;
  recipientCompany?: string;
  recipientAddress1: string;
  recipientAddress2?: string;
  recipientCity: string;
  recipientState: string;
  recipientPostalCode: string;
  recipientCountry: string;
  recipientPhone: string;
  recipientEmail?: string;

  // Package info
  packages: Array<{
    weight: number; // in kg
    length: number; // in cm
    width: number;
    height: number;
    description?: string;
  }>;

  // Service options
  serviceType:
    | "EXPRESS"
    | "EXPRESS_WORLDWIDE"
    | "EXPRESS_12"
    | "EXPRESS_9"
    | "FREIGHT";
  insuranceAmount?: number;
  signatureRequired?: boolean;
  saturdayDelivery?: boolean;
  declaredValue?: number;

  // Customs (for international)
  customsInfo?: {
    contents: "MERCHANDISE" | "DOCUMENTS" | "GIFT" | "SAMPLE";
    items: Array<{
      description: string;
      quantity: number;
      value: number;
      weight: number;
      originCountry: string;
      hsCode?: string;
    }>;
  };
}

export interface DHLShipmentResponse {
  success: boolean;
  trackingNumber?: string;
  labelUrl?: string;
  estimatedDelivery?: string;
  totalCost?: number;
  error?: string;
}

export interface DHLTrackingResponse {
  trackingNumber: string;
  status: string;
  statusDescription: string;
  estimatedDelivery?: string;
  events: Array<{
    timestamp: string;
    location: string;
    description: string;
    statusCode: string;
  }>;
}

export class DHLService {
  private baseUrl: string;
  private testMode: boolean;

  constructor(testMode: boolean = false) {
    this.testMode = testMode;
    this.baseUrl = testMode
      ? "https://api-sandbox.dhl.com"
      : "https://api.dhl.com";
  }

  /**
   * Create a shipment
   */
  async createShipment(
    request: DHLShipmentRequest,
  ): Promise<DHLShipmentResponse> {
    try {
      const auth = Buffer.from(
        `${request.apiKey}:${request.apiSecret}`,
      ).toString("base64");

      const shipmentData = {
        plannedShippingDateAndTime: new Date().toISOString(),
        pickup: {
          isRequested: false,
        },
        productCode: this.getProductCode(request.serviceType),
        localProductCode: this.getProductCode(request.serviceType),
        accounts: [
          {
            typeCode: "shipper",
            number: request.accountNumber,
          },
        ],
        customerDetails: {
          shipperDetails: {
            postalAddress: {
              postalCode: request.shipperPostalCode,
              cityName: request.shipperCity,
              countryCode: request.shipperCountry,
              addressLine1: request.shipperAddress1,
              addressLine2: request.shipperAddress2,
              countyName: request.shipperState,
            },
            contactInformation: {
              email: request.shipperEmail,
              phone: request.shipperPhone,
              companyName: request.shipperCompany || request.shipperName,
              fullName: request.shipperName,
            },
          },
          receiverDetails: {
            postalAddress: {
              postalCode: request.recipientPostalCode,
              cityName: request.recipientCity,
              countryCode: request.recipientCountry,
              addressLine1: request.recipientAddress1,
              addressLine2: request.recipientAddress2,
              countyName: request.recipientState,
            },
            contactInformation: {
              email: request.recipientEmail,
              phone: request.recipientPhone,
              companyName: request.recipientCompany || request.recipientName,
              fullName: request.recipientName,
            },
          },
        },
        content: {
          packages: request.packages.map((pkg, index) => ({
            typeCode: "2BP", // Box
            weight: pkg.weight,
            dimensions: {
              length: pkg.length,
              width: pkg.width,
              height: pkg.height,
            },
            customerReferences: [
              {
                value: `Package ${index + 1}`,
                typeCode: "CU",
              },
            ],
            description: pkg.description || "Goods",
          })),
          isCustomsDeclarable: request.customsInfo ? true : false,
          declaredValue: request.declaredValue,
          declaredValueCurrency: "USD",
          exportDeclaration: request.customsInfo
            ? {
                lineItems: request.customsInfo.items.map((item) => ({
                  number: 1,
                  description: item.description,
                  price: item.value,
                  quantity: {
                    value: item.quantity,
                    unitOfMeasurement: "PCS",
                  },
                  commodityCodes: item.hsCode
                    ? [
                        {
                          typeCode: "outbound",
                          value: item.hsCode,
                        },
                      ]
                    : undefined,
                  weight: {
                    netValue: item.weight,
                    grossValue: item.weight,
                  },
                  manufacturerCountry: item.originCountry,
                })),
                invoice: {
                  number: `INV-${Date.now()}`,
                  date: new Date().toISOString().split("T")[0],
                },
              }
            : undefined,
          incoterm: "DAP",
          unitOfMeasurement: "metric",
        },
        valueAddedServices: this.buildValueAddedServices(request),
      };

      const response = await axios.post(
        `${this.baseUrl}/shipments`,
        shipmentData,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        trackingNumber: response.data.shipmentTrackingNumber,
        labelUrl: response.data.documents?.[0]?.url,
        estimatedDelivery:
          response.data.estimatedDeliveryDate?.deliveryDateTime,
        totalCost: response.data.shipmentCharges?.[0]?.priceCurrency,
      };
    } catch (error: any) {
      console.error(
        "DHL shipment creation error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Track a shipment
   */
  async trackShipment(
    trackingNumber: string,
    apiKey: string,
    apiSecret: string,
  ): Promise<DHLTrackingResponse | null> {
    try {
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

      const response = await axios.get(`${this.baseUrl}/track/shipments`, {
        params: {
          trackingNumber,
        },
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      const shipment = response.data.shipments?.[0];
      if (!shipment) return null;

      return {
        trackingNumber: shipment.id,
        status: shipment.status.statusCode,
        statusDescription: shipment.status.description,
        estimatedDelivery: shipment.estimatedTimeOfDelivery,
        events:
          shipment.events?.map((event: any) => ({
            timestamp: event.timestamp,
            location:
              `${event.location?.address?.addressLocality || ""}, ${event.location?.address?.countryCode || ""}`.trim(),
            description: event.description,
            statusCode: event.statusCode,
          })) || [],
      };
    } catch (error: any) {
      console.error(
        "DHL tracking error:",
        error.response?.data || error.message,
      );
      return null;
    }
  }

  /**
   * Get shipping rates
   */
  async getRates(
    request: Partial<DHLShipmentRequest>,
  ): Promise<Array<{ service: string; cost: number; deliveryDays: number }>> {
    try {
      const auth = Buffer.from(
        `${request.apiKey}:${request.apiSecret}`,
      ).toString("base64");

      const rateRequest = {
        customerDetails: {
          shipperDetails: {
            postalCode: request.shipperPostalCode,
            cityName: request.shipperCity,
            countryCode: request.shipperCountry,
          },
          receiverDetails: {
            postalCode: request.recipientPostalCode,
            cityName: request.recipientCity,
            countryCode: request.recipientCountry,
          },
        },
        accounts: [
          {
            typeCode: "shipper",
            number: request.accountNumber,
          },
        ],
        plannedShippingDateAndTime: new Date().toISOString(),
        unitOfMeasurement: "metric",
        isCustomsDeclarable: request.customsInfo ? true : false,
        packages: request.packages?.map((pkg) => ({
          typeCode: "2BP",
          weight: pkg.weight,
          dimensions: {
            length: pkg.length,
            width: pkg.width,
            height: pkg.height,
          },
        })),
      };

      const response = await axios.post(`${this.baseUrl}/rates`, rateRequest, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return (
        response.data.products?.map((product: any) => ({
          service: product.productName,
          cost: parseFloat(product.totalPrice?.[0]?.price || 0),
          deliveryDays:
            product.deliveryCapabilities?.deliveryTypeCode === "QDDC"
              ? 1
              : parseInt(
                  product.deliveryCapabilities?.estimatedDeliveryDateAndTime,
                ) || 3,
        })) || []
      );
    } catch (error: any) {
      console.error("DHL rates error:", error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(
    trackingNumber: string,
    apiKey: string,
    apiSecret: string,
  ): Promise<boolean> {
    try {
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

      await axios.delete(`${this.baseUrl}/shipments/${trackingNumber}`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      return true;
    } catch (error: any) {
      console.error("DHL cancel error:", error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get delivery proof
   */
  async getDeliveryProof(
    trackingNumber: string,
    apiKey: string,
    apiSecret: string,
  ): Promise<string | null> {
    try {
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

      const response = await axios.get(
        `${this.baseUrl}/shipments/${trackingNumber}/proof-of-delivery`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        },
      );

      return response.data.documents?.[0]?.url || null;
    } catch (error: any) {
      console.error(
        "DHL proof of delivery error:",
        error.response?.data || error.message,
      );
      return null;
    }
  }

  /**
   * Map service type to DHL product code
   */
  private getProductCode(serviceType: string): string {
    const productCodes: Record<string, string> = {
      EXPRESS: "P",
      EXPRESS_WORLDWIDE: "U",
      EXPRESS_12: "T",
      EXPRESS_9: "Y",
      FREIGHT: "H",
    };
    return productCodes[serviceType] || "P";
  }

  /**
   * Build value-added services array
   */
  private buildValueAddedServices(request: DHLShipmentRequest): Array<any> {
    const services = [];

    if (request.insuranceAmount) {
      services.push({
        serviceCode: "II",
        value: request.insuranceAmount,
        currency: "USD",
      });
    }

    if (request.signatureRequired) {
      services.push({
        serviceCode: "SM",
      });
    }

    if (request.saturdayDelivery) {
      services.push({
        serviceCode: "AA",
      });
    }

    return services;
  }
}

export default DHLService;
