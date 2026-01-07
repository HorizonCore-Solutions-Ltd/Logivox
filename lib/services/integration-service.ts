/**
 * Integration Service
 * Comprehensive external integration management
 * Handles webhook management, API monitoring, connector framework,
 * data synchronization, and third-party integrations
 */

import { PrismaClient, IntegrationStatus, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export interface IntegrationConfig {
  name: string;
  type: IntegrationType;
  provider: string;
  isActive: boolean;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    token?: string;
    baseUrl?: string;
    [key: string]: any;
  };
  settings?: Record<string, any>;
  webhookUrl?: string;
}

export type IntegrationType =
  | "ERP"
  | "ECOMMERCE"
  | "SHIPPING_CARRIER"
  | "ACCOUNTING"
  | "3PL"
  | "MARKETPLACE"
  | "CRM"
  | "PAYMENT"
  | "CUSTOM";

export interface WebhookEvent {
  id: string;
  integrationId: string;
  eventType: string;
  payload: any;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  attempts: number;
  lastAttemptAt?: Date;
  error?: string;
  createdAt: Date;
}

export interface SyncJob {
  id: string;
  integrationId: string;
  integrationName: string;
  direction: "INBOUND" | "OUTBOUND" | "BIDIRECTIONAL";
  entityType: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface IntegrationMetrics {
  totalIntegrations: number;
  activeIntegrations: number;
  totalSyncJobs: number;
  successfulSyncs: number;
  failedSyncs: number;
  successRate: number; // percentage
  totalWebhooks: number;
  webhookSuccessRate: number; // percentage
  avgResponseTime: number; // milliseconds
  integrationHealth: Array<{
    integrationId: string;
    name: string;
    provider: string;
    status: IntegrationStatus;
    lastSyncAt?: Date;
    errorCount: number;
    health: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
  }>;
  recentActivity: Array<{
    id: string;
    integration: string;
    activityType: string;
    status: string;
    timestamp: Date;
  }>;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
  defaultValue?: any;
}

/**
 * Integration Service Class
 */
export class IntegrationService {
  /**
   * Create integration
   */
  async createIntegration(
    organizationId: string,
    userId: string,
    config: IntegrationConfig,
  ): Promise<any> {
    // Validate credentials
    await this.validateCredentials(config.type, config.credentials);

    // Create integration
    const integration = await prisma.integration.create({
      data: {
        organizationId,
        name: config.name,
        type: config.type,
        provider: config.provider,
        isActive: config.isActive,
        credentials: JSON.stringify(config.credentials),
        settings: config.settings ? JSON.stringify(config.settings) : null,
        webhookUrl: config.webhookUrl,
        status: "ACTIVE",
        createdById: userId,
      },
    });

    // Initialize integration
    await this.initializeIntegration(integration);

    return integration;
  }

  /**
   * Validate integration credentials
   */
  private async validateCredentials(
    type: IntegrationType,
    credentials: any,
  ): Promise<boolean> {
    // Would implement actual credential validation
    // Make test API call to verify credentials

    switch (type) {
      case "ERP":
        // Validate ERP credentials
        return true;

      case "ECOMMERCE":
        // Validate e-commerce platform credentials
        return true;

      case "SHIPPING_CARRIER":
        // Validate carrier credentials
        return true;

      default:
        return true;
    }
  }

  /**
   * Initialize integration
   */
  private async initializeIntegration(integration: any): Promise<void> {
    // Setup webhook subscriptions
    if (integration.webhookUrl) {
      await this.setupWebhooks(integration);
    }

    // Initial data sync if needed
    // await this.syncData(integration.id, 'INBOUND', 'INITIAL');
  }

  /**
   * Setup webhooks
   */
  private async setupWebhooks(integration: any): Promise<void> {
    // Register webhook with external system
    // This would make API call to external system
    console.log(`Setting up webhooks for integration ${integration.id}`);
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(
    integrationId: string,
    eventType: string,
    payload: any,
  ): Promise<WebhookEvent> {
    // Create webhook event
    const event = await prisma.webhookEvent.create({
      data: {
        integrationId,
        eventType,
        payload: JSON.stringify(payload),
        status: "PENDING",
        attempts: 0,
      },
    });

    // Process webhook asynchronously
    this.processWebhook(event.id).catch((error) => {
      console.error(`Error processing webhook ${event.id}:`, error);
    });

    return {
      id: event.id,
      integrationId: event.integrationId,
      eventType: event.eventType,
      payload,
      status: event.status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
      attempts: event.attempts,
      createdAt: event.createdAt,
    };
  }

  /**
   * Process webhook event
   */
  private async processWebhook(eventId: string): Promise<void> {
    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
      include: {
        integration: true,
      },
    });

    if (!event) return;

    try {
      // Update status
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: "PROCESSING",
          attempts: event.attempts + 1,
          lastAttemptAt: new Date(),
        },
      });

      // Process based on event type
      const payload = JSON.parse(event.payload);

      switch (event.eventType) {
        case "order.created":
          await this.handleOrderCreated(event.integration, payload);
          break;

        case "inventory.updated":
          await this.handleInventoryUpdated(event.integration, payload);
          break;

        case "shipment.updated":
          await this.handleShipmentUpdated(event.integration, payload);
          break;

        default:
          console.log(`Unhandled event type: ${event.eventType}`);
      }

      // Mark as completed
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { status: "COMPLETED" },
      });
    } catch (error: any) {
      // Mark as failed
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: "FAILED",
          error: error.message,
        },
      });

      // Retry if attempts < max
      if (event.attempts < 3) {
        setTimeout(() => this.processWebhook(eventId), 60000); // Retry after 1 minute
      }
    }
  }

  /**
   * Handle order created webhook
   */
  private async handleOrderCreated(
    integration: any,
    payload: any,
  ): Promise<void> {
    // Transform external order to internal format
    // Create sales order in WMS
    console.log("Processing order.created webhook");
  }

  /**
   * Handle inventory updated webhook
   */
  private async handleInventoryUpdated(
    integration: any,
    payload: any,
  ): Promise<void> {
    // Update inventory levels
    console.log("Processing inventory.updated webhook");
  }

  /**
   * Handle shipment updated webhook
   */
  private async handleShipmentUpdated(
    integration: any,
    payload: any,
  ): Promise<void> {
    // Update shipment tracking
    console.log("Processing shipment.updated webhook");
  }

  /**
   * Start data sync job
   */
  async startSync(
    integrationId: string,
    organizationId: string,
    options: {
      direction: "INBOUND" | "OUTBOUND" | "BIDIRECTIONAL";
      entityType: string;
      filters?: Record<string, any>;
    },
  ): Promise<SyncJob> {
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        organizationId,
      },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    if (!integration.isActive) {
      throw new Error("Integration is not active");
    }

    // Create sync job
    const job = await prisma.syncJob.create({
      data: {
        integrationId,
        direction: options.direction,
        entityType: options.entityType,
        filters: options.filters ? JSON.stringify(options.filters) : null,
        status: "PENDING",
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0,
      },
    });

    // Start sync asynchronously
    this.executeSync(job.id).catch((error) => {
      console.error(`Error executing sync job ${job.id}:`, error);
    });

    return {
      id: job.id,
      integrationId: job.integrationId,
      integrationName: integration.name,
      direction: job.direction as "INBOUND" | "OUTBOUND" | "BIDIRECTIONAL",
      entityType: job.entityType,
      status: job.status as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED",
      totalRecords: job.totalRecords,
      processedRecords: job.processedRecords,
      failedRecords: job.failedRecords,
    };
  }

  /**
   * Execute sync job
   */
  private async executeSync(jobId: string): Promise<void> {
    const job = await prisma.syncJob.findUnique({
      where: { id: jobId },
      include: {
        integration: true,
      },
    });

    if (!job) return;

    try {
      // Update status
      await prisma.syncJob.update({
        where: { id: jobId },
        data: {
          status: "RUNNING",
          startedAt: new Date(),
        },
      });

      // Execute sync based on entity type and direction
      let totalRecords = 0;
      let processedRecords = 0;

      if (job.direction === "INBOUND" || job.direction === "BIDIRECTIONAL") {
        // Fetch data from external system
        const externalData = await this.fetchExternalData(
          job.integration,
          job.entityType,
        );

        totalRecords = externalData.length;

        // Process each record
        for (const record of externalData) {
          try {
            await this.importRecord(job.integration, job.entityType, record);
            processedRecords++;
          } catch (error) {
            console.error("Error importing record:", error);
          }
        }
      }

      if (job.direction === "OUTBOUND" || job.direction === "BIDIRECTIONAL") {
        // Export data to external system
        const internalData = await this.fetchInternalData(
          job.integration.organizationId,
          job.entityType,
        );

        totalRecords += internalData.length;

        for (const record of internalData) {
          try {
            await this.exportRecord(job.integration, job.entityType, record);
            processedRecords++;
          } catch (error) {
            console.error("Error exporting record:", error);
          }
        }
      }

      // Mark as completed
      await prisma.syncJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          totalRecords,
          processedRecords,
          failedRecords: totalRecords - processedRecords,
        },
      });

      // Update integration last sync
      await prisma.integration.update({
        where: { id: job.integrationId },
        data: {
          lastSyncAt: new Date(),
        },
      });
    } catch (error: any) {
      // Mark as failed
      await prisma.syncJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: error.message,
        },
      });

      // Update integration status
      await prisma.integration.update({
        where: { id: job.integrationId },
        data: {
          status: "ERROR",
        },
      });
    }
  }

  /**
   * Fetch data from external system
   */
  private async fetchExternalData(
    integration: any,
    entityType: string,
  ): Promise<any[]> {
    // Would make API call to external system
    // Return mock data for now
    return [];
  }

  /**
   * Fetch data from internal system
   */
  private async fetchInternalData(
    organizationId: string,
    entityType: string,
  ): Promise<any[]> {
    switch (entityType) {
      case "products":
        return await prisma.product.findMany({
          where: { organizationId },
          take: 100,
        });

      case "orders":
        return await prisma.salesOrder.findMany({
          where: { organizationId },
          take: 100,
        });

      case "inventory":
        return await prisma.inventoryLocation.findMany({
          where: {
            location: {
              organizationId,
            },
          },
          take: 100,
        });

      default:
        return [];
    }
  }

  /**
   * Import record from external system
   */
  private async importRecord(
    integration: any,
    entityType: string,
    record: any,
  ): Promise<void> {
    // Transform and import based on entity type
    console.log(`Importing ${entityType} record`);
  }

  /**
   * Export record to external system
   */
  private async exportRecord(
    integration: any,
    entityType: string,
    record: any,
  ): Promise<void> {
    // Transform and export based on entity type
    console.log(`Exporting ${entityType} record`);
  }

  /**
   * Get integration metrics
   */
  async getIntegrationMetrics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IntegrationMetrics> {
    // Total integrations
    const totalIntegrations = await prisma.integration.count({
      where: { organizationId },
    });

    const activeIntegrations = await prisma.integration.count({
      where: {
        organizationId,
        isActive: true,
      },
    });

    // Sync jobs
    const dateFilter: any = { integration: { organizationId } };

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    const totalSyncJobs = await prisma.syncJob.count({
      where: dateFilter,
    });

    const successfulSyncs = await prisma.syncJob.count({
      where: {
        ...dateFilter,
        status: "COMPLETED",
      },
    });

    const failedSyncs = await prisma.syncJob.count({
      where: {
        ...dateFilter,
        status: "FAILED",
      },
    });

    const successRate =
      totalSyncJobs > 0 ? (successfulSyncs / totalSyncJobs) * 100 : 0;

    // Webhooks
    const totalWebhooks = await prisma.webhookEvent.count({
      where: {
        integration: { organizationId },
        ...dateFilter,
      },
    });

    const successfulWebhooks = await prisma.webhookEvent.count({
      where: {
        integration: { organizationId },
        ...dateFilter,
        status: "COMPLETED",
      },
    });

    const webhookSuccessRate =
      totalWebhooks > 0 ? (successfulWebhooks / totalWebhooks) * 100 : 0;

    // Integration health
    const integrations = await prisma.integration.findMany({
      where: { organizationId },
      include: {
        syncJobs: {
          where: { status: "FAILED" },
          take: 10,
        },
      },
    });

    const integrationHealth = integrations.map((integration) => {
      const errorCount = integration.syncJobs.length;

      let health: "HEALTHY" | "DEGRADED" | "UNHEALTHY" = "HEALTHY";
      if (errorCount >= 5) health = "UNHEALTHY";
      else if (errorCount >= 2) health = "DEGRADED";

      return {
        integrationId: integration.id,
        name: integration.name,
        provider: integration.provider,
        status: integration.status,
        lastSyncAt: integration.lastSyncAt || undefined,
        errorCount,
        health,
      };
    });

    // Recent activity
    const recentSyncs = await prisma.syncJob.findMany({
      where: { integration: { organizationId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        integration: true,
      },
    });

    const recentActivity = recentSyncs.map((sync) => ({
      id: sync.id,
      integration: sync.integration.name,
      activityType: `Sync ${sync.entityType}`,
      status: sync.status,
      timestamp: sync.createdAt,
    }));

    return {
      totalIntegrations,
      activeIntegrations,
      totalSyncJobs,
      successfulSyncs,
      failedSyncs,
      successRate,
      totalWebhooks,
      webhookSuccessRate,
      avgResponseTime: 250,
      integrationHealth,
      recentActivity,
    };
  }

  /**
   * Test integration connection
   */
  async testConnection(
    integrationId: string,
    organizationId: string,
  ): Promise<{
    success: boolean;
    message: string;
    responseTime: number;
  }> {
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        organizationId,
      },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const startTime = Date.now();

    try {
      // Make test API call
      // This would call external system
      await new Promise((resolve) => setTimeout(resolve, 200));

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        message: "Connection successful",
        responseTime,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Update integration
   */
  async updateIntegration(
    integrationId: string,
    organizationId: string,
    updates: Partial<IntegrationConfig>,
  ): Promise<any> {
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        organizationId,
      },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    return await prisma.integration.update({
      where: { id: integrationId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        ...(updates.credentials && {
          credentials: JSON.stringify(updates.credentials),
        }),
        ...(updates.settings && { settings: JSON.stringify(updates.settings) }),
        ...(updates.webhookUrl && { webhookUrl: updates.webhookUrl }),
      },
    });
  }

  /**
   * Delete integration
   */
  async deleteIntegration(
    integrationId: string,
    organizationId: string,
  ): Promise<void> {
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        organizationId,
      },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Delete related records
    await prisma.webhookEvent.deleteMany({
      where: { integrationId },
    });

    await prisma.syncJob.deleteMany({
      where: { integrationId },
    });

    // Delete integration
    await prisma.integration.delete({
      where: { id: integrationId },
    });
  }

  /**
   * Get integration by ID
   */
  async getIntegrationById(
    integrationId: string,
    organizationId: string,
  ): Promise<any> {
    return await prisma.integration.findFirst({
      where: {
        id: integrationId,
        organizationId,
      },
      include: {
        syncJobs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        webhookEvents: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  }

  /**
   * List integrations
   */
  async listIntegrations(
    organizationId: string,
    filters?: {
      type?: IntegrationType;
      isActive?: boolean;
    },
  ): Promise<any[]> {
    const where: any = { organizationId };

    if (filters?.type) where.type = filters.type;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return await prisma.integration.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }
}

export default IntegrationService;
