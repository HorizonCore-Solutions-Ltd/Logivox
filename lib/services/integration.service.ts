/**
 * Integration Service
 *
 * External system integrations and connectors:
 * - ERP system integration
 * - E-commerce platform sync
 * - Shipping carrier APIs
 * - Accounting system sync
 * - CRM integration
 * - Warehouse management systems
 * - Analytics platforms
 * - Custom integrations
 * - Data synchronization
 */

import { prisma } from "@/lib/prisma";
import { IntegrationType } from "@prisma/client";

export interface IntegrationConfig {
  apiEndpoint: string;
  apiKey: string;
  apiSecret?: string;
  webhookUrl?: string;
  syncInterval?: number; //in minutes
  autoSync?: boolean;
  settings?: Record<string, any>;
  [key: string]: any; // Index signature for JSON compatibility
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  errors: string[];
  syncedAt: Date;
}

export class IntegrationService {
  /**
   * Register a new integration
   */
  static async registerIntegration(params: {
    organizationId: string;
    type: IntegrationType;
    name: string;
    config: IntegrationConfig;
  }) {
    const integration = await prisma.integration.create({
      data: {
        organizationId: params.organizationId,
        type: params.type,
        name: params.name,
        config: params.config as any,
        isActive: true,
        lastSyncAt: null,
      },
    });

    return integration;
  }

  /**
   * Update integration configuration
   */
  static async updateIntegration(params: {
    integrationId: string;
    name?: string;
    config?: Partial<IntegrationConfig>;
    isActive?: boolean;
  }) {
    const currentIntegration = await prisma.integration.findUnique({
      where: { id: params.integrationId },
    });

    if (!currentIntegration) {
      throw new Error("Integration not found");
    }

    // Merge configurations
    const currentConfig = currentIntegration.config as IntegrationConfig;
    const updatedConfig = params.config
      ? { ...currentConfig, ...params.config }
      : currentConfig;

    const integration = await prisma.integration.update({
      where: { id: params.integrationId },
      data: {
        ...(params.name && { name: params.name }),
        ...(params.config && { config: updatedConfig as any }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
        updatedAt: new Date(),
      },
    });

    return integration;
  }

  /**
   * Test integration connection
   */
  static async testConnection(params: {
    integrationId: string;
  }): Promise<{ success: boolean; message: string; latency?: number }> {
    const integration = await prisma.integration.findUnique({
      where: { id: params.integrationId },
    });

    if (!integration) {
      return { success: false, message: "Integration not found" };
    }

    const config = integration.config as IntegrationConfig;
    const startTime = Date.now();

    try {
      // Test connection to API endpoint
      const response = await fetch(config.apiEndpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: "Connection successful",
          latency,
        };
      } else {
        return {
          success: false,
          message: `Connection failed: ${response.statusText}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }

  /**
   * Sync inventory to external system (ERP/E-commerce)
   */
  static async syncInventoryToExternal(params: {
    organizationId: string;
    integrationId: string;
    warehouseId?: string;
  }): Promise<SyncResult> {
    const integration = await prisma.integration.findUnique({
      where: { id: params.integrationId },
    });

    if (!integration || !integration.isActive) {
      throw new Error("Integration not found or inactive");
    }

    const config = integration.config as IntegrationConfig;

    const where: any = {
      organizationId: params.organizationId,
      isActive: true,
    };

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
    });

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        // Prepare payload
        const payload = {
          sku: item.sku,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          availableQty: item.availableQty,
          reservedQty: item.reservedQty,
          costPrice: Number(item.costPrice || 0),
          sellingPrice: Number(item.sellingPrice || 0),
          warehouseId: item.warehouseId,
          status: item.status,
        };

        // Send to external system
        const response = await fetch(`${config.apiEndpoint}/inventory/sync`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          processed++;
        } else {
          failed++;
          errors.push(`Failed to sync SKU ${item.sku}: ${response.statusText}`);
        }
      } catch (error: any) {
        failed++;
        errors.push(`Error syncing SKU ${item.sku}: ${error.message}`);
      }
    }

    // Update last sync time
    await prisma.integration.update({
      where: { id: params.integrationId },
      data: {
        lastSyncAt: new Date(),
      },
    });

    return {
      success: failed === 0,
      recordsProcessed: processed,
      recordsFailed: failed,
      errors,
      syncedAt: new Date(),
    };
  }

  /**
   * Import orders from e-commerce platform
   */
  static async importOrdersFromEcommerce(params: {
    organizationId: string;
    integrationId: string;
    since?: Date;
  }): Promise<SyncResult> {
    const integration = await prisma.integration.findUnique({
      where: { id: params.integrationId },
    });

    if (!integration || !integration.isActive) {
      throw new Error("Integration not found or inactive");
    }

    if (integration.type !== IntegrationType.ECOMMERCE) {
      throw new Error("Integration must be of type ECOMMERCE");
    }

    const config = integration.config as IntegrationConfig;

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Fetch orders from e-commerce platform
      const url = new URL(`${config.apiEndpoint}/orders`);
      if (params.since) {
        url.searchParams.append("since", params.since.toISOString());
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data = await response.json();
      const orders = Array.isArray(data) ? data : data.orders || [];

      // Import each order
      for (const order of orders) {
        try {
          // Find or create customer
          let customer = await prisma.customer.findFirst({
            where: {
              organizationId: params.organizationId,
              email: order.customerEmail,
            },
          });

          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                organizationId: params.organizationId,
                code: `CUST-${Date.now()}`,
                name:
                  `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() ||
                  "Unknown",
                email: order.customerEmail,
                phone: order.customer?.phone,
              },
            });
          }

          // Create sales order
          await prisma.salesOrder.create({
            data: {
              organizationId: params.organizationId,
              soNumber: order.orderNumber || `SO-EC-${Date.now()}`,
              customerId: customer.id,
              status: "DRAFT",
              orderDate: new Date(order.orderDate || Date.now()),
              requestedDate: order.requestedDate
                ? new Date(order.requestedDate)
                : null,
              shippingAddress: order.shipping?.address,
              shippingCity: order.shipping?.city,
              shippingState: order.shipping?.state,
              shippingZip: order.shipping?.zip,
              shippingCountry: order.shipping?.country,
              subtotal: order.subtotal || 0,
              taxAmount: order.tax || 0,
              shippingCost: order.shippingCost || 0,
              discount: order.discount || 0,
              total: order.total || 0,
              currency: order.currency || "USD",
              paymentStatus: order.paymentStatus || "UNPAID",
              createdById: "", // System import
              items: {
                create: (order.items || []).map((item: any) => ({
                  inventoryItemId: item.inventoryItemId || "",
                  quantity: item.quantity || 1,
                  unitPrice: item.unitPrice || 0,
                  discount: item.discount || 0,
                  tax: item.tax || 0,
                  lineTotal: item.lineTotal || 0,
                })),
              },
            },
          });

          processed++;
        } catch (error: any) {
          failed++;
          errors.push(
            `Failed to import order ${order.orderNumber}: ${error.message}`,
          );
        }
      }
    } catch (error: any) {
      errors.push(`Sync failed: ${error.message}`);
    }

    // Update last sync time
    await prisma.integration.update({
      where: { id: params.integrationId },
      data: {
        lastSyncAt: new Date(),
      },
    });

    return {
      success: failed === 0,
      recordsProcessed: processed,
      recordsFailed: failed,
      errors,
      syncedAt: new Date(),
    };
  }

  /**
   * Export shipment data to shipping carrier
   */
  static async exportShipmentToCarrier(params: {
    shipmentId: string;
    integrationId: string;
  }): Promise<{ success: boolean; trackingNumber?: string; error?: string }> {
    const [shipment, integration] = await Promise.all([
      prisma.shipment.findUnique({
        where: { id: params.shipmentId },
      }),
      prisma.integration.findUnique({
        where: { id: params.integrationId },
      }),
    ]);

    if (!shipment) {
      return { success: false, error: "Shipment not found" };
    }

    if (!integration || !integration.isActive) {
      return { success: false, error: "Integration not found or inactive" };
    }

    if (integration.type !== IntegrationType.SHIPPING) {
      return { success: false, error: "Integration must be of type SHIPPING" };
    }

    const config = integration.config as IntegrationConfig;

    try {
      // Prepare carrier API payload
      const payload = {
        reference: shipment.shipmentNumber,
        serviceType: shipment.carrierService,
        weight: Number(shipment.weight || 0),
        recipient: {
          name: shipment.recipientName,
          phone: shipment.recipientPhone,
          email: shipment.recipientEmail,
        },
        destination: {
          address1: shipment.addressLine1,
          address2: shipment.addressLine2,
          city: shipment.city,
          state: shipment.state,
          zip: shipment.postalCode,
          country: shipment.country,
        },
      };

      // Send to carrier API
      const response = await fetch(`${config.apiEndpoint}/shipments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const trackingNumber = data.trackingNumber || data.tracking_number;

        // Update shipment with tracking number
        await prisma.shipment.update({
          where: { id: params.shipmentId },
          data: {
            trackingNumber,
            status: "SHIPPED",
            shippedDate: new Date(),
          },
        });

        return { success: true, trackingNumber };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `Carrier API error: ${response.statusText} - ${errorText}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to export shipment: ${error.message}`,
      };
    }
  }

  /**
   * Sync customers to CRM
   */
  static async syncCustomersToCRM(params: {
    organizationId: string;
    integrationId: string;
  }): Promise<SyncResult> {
    const integration = await prisma.integration.findUnique({
      where: { id: params.integrationId },
    });

    if (!integration || !integration.isActive) {
      throw new Error("Integration not found or inactive");
    }

    if (integration.type !== IntegrationType.CRM) {
      throw new Error("Integration must be of type CRM");
    }

    const config = integration.config as IntegrationConfig;

    const customers = await prisma.customer.findMany({
      where: {
        organizationId: params.organizationId,
        isActive: true,
      },
    });

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const customer of customers) {
      try {
        const payload = {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          country: customer.country,
        };

        const response = await fetch(`${config.apiEndpoint}/contacts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          processed++;
        } else {
          failed++;
          errors.push(
            `Failed to sync customer ${customer.email}: ${response.statusText}`,
          );
        }
      } catch (error: any) {
        failed++;
        errors.push(
          `Error syncing customer ${customer.email}: ${error.message}`,
        );
      }
    }

    await prisma.integration.update({
      where: { id: params.integrationId },
      data: { lastSyncAt: new Date() },
    });

    return {
      success: failed === 0,
      recordsProcessed: processed,
      recordsFailed: failed,
      errors,
      syncedAt: new Date(),
    };
  }

  /**
   * Get integration status and configuration
   */
  static async getIntegrationStatus(params: { integrationId: string }) {
    const integration = await prisma.integration.findUnique({
      where: { id: params.integrationId },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    return {
      integration: {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        isActive: integration.isActive,
        lastSyncAt: integration.lastSyncAt,
        createdAt: integration.createdAt,
      },
      config: integration.config,
    };
  }

  /**
   * Get all integrations for organization
   */
  static async getIntegrations(params: {
    organizationId: string;
    type?: IntegrationType;
  }) {
    const where: any = {
      organizationId: params.organizationId,
    };

    if (params.type) {
      where.type = params.type;
    }

    const integrations = await prisma.integration.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return integrations.map((integration) => ({
      id: integration.id,
      type: integration.type,
      name: integration.name,
      isActive: integration.isActive,
      lastSyncAt: integration.lastSyncAt,
      createdAt: integration.createdAt,
    }));
  }

  /**
   * Deactivate integration
   */
  static async deactivateIntegration(params: { integrationId: string }) {
    const integration = await prisma.integration.update({
      where: { id: params.integrationId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return integration;
  }

  /**
   * Delete integration
   */
  static async deleteIntegration(params: { integrationId: string }) {
    await prisma.integration.delete({
      where: { id: params.integrationId },
    });

    return { success: true };
  }
}
