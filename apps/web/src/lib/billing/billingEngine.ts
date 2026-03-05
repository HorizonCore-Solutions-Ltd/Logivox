// Billing Engine
// Core module for calculating charges and generating billing transactions.

import { prisma } from "@/lib/prisma";
import type { 
    BillingRateCard, 
    BillingTransactionType, 
    Organization 
} from "@prisma/client";

export enum EventType {
  STORAGE = "STORAGE",
  HANDLING_IN = "INBOUND_HANDLING",
  HANDLING_OUT = "OUTBOUND_HANDLING",
  VAS = "VALUE_ADDED_SERVICE",
  LABOR = "LABOR",
  SUPPLIER = "SUPPLIER_CHARGEBACK"
}

interface RateStructure {
    perUnit: number;
    perItem: number;
    perPallet: number;
    perHour: number;
    minimum: number;
    currency: string;
}

export const BillingEngine = {
  
  /**
   * Main entry point to record a billable event.
   */
  recordEvent: async (
    organizationId: string,
    clientId: string,
    eventType: BillingTransactionType,
    quantity: number,
    reference: { type: string, id: string, number?: string },
    description?: string,
    overrideRate?: number
  ) => {
    // 1. Find Active Rate Card
    const rateCard = await prisma.billingRateCard.findFirst({
        where: {
            organizationId,
            clientId,
            isActive: true,
            effectiveFrom: { lte: new Date() },
            OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: new Date() } }
            ]
        },
        orderBy: { effectiveFrom: 'desc' }
    });

    if (!rateCard) {
        console.warn(`[Billing] No active rate card found for client ${clientId}`);
        // Depending on policy, we might still record with 0 cost, or throw error.
        // For MVP, recording with 0 cost but flagged as unbilled.
        return null; 
    }

    // 2. Calculate Cost
    const rate = overrideRate ?? BillingEngine.getRate(rateCard, eventType, description);
    const amount = rate * quantity;

    if (amount <= 0 && rate <= 0) {
        return null; // No charge associated
    }

    // 3. Create Transaction
    return prisma.billingTransaction.create({
        data: {
            organizationId,
            clientId,
            transactionNumber: `TXN-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            transactionDate: new Date(),
            transactionType: eventType,
            serviceCode: eventType.toString(),
            serviceName: description || eventType.toString(),
            description: `Charge for ${quantity} units of ${eventType}`,
            quantity,
            unit: "UNIT", // Should be more dynamic
            unitRate: rate,
            amount: amount,
            referenceType: reference.type,
            referenceId: reference.id,
            referenceNumber: reference.number,
            billingStatus: "PENDING"
        }
    });
  },

  /**
   * Helper to parse JSON rates from the Rate Card.
   */
  getRate: (card: BillingRateCard, type: BillingTransactionType, subType?: string): number => {
      // Logic to parse JSON fields: storageRates, handlingRates, vasRates
      // This is a simplified version.
      
      let rates: any = {};
      
      switch (type) {
          case "STORAGE":
              rates = card.storageRates || {};
              break;
          case "INBOUND_HANDLING":
          case "OUTBOUND_HANDLING":
              rates = card.handlingRates || {};
              break;
          case "VALUE_ADDED_SERVICE":
              rates = card.valueAddedServices || {};
              break;
          default:
              rates = {};
      }

      // If specific sub-service is defined (e.g. "KITTING" inside VAS)
      if (subType && rates[subType]) {
          return Number(rates[subType]) || 0;
      }
      
      // Default fallback key "standard" or similar
      return Number(rates.standard) || Number(rates.default) || 0;
  },

  /**
   * AUTOMATION: Nightly Storage Calculation
   * Iterates through inventory and applies storage charges.
   */
  runDailyStorageBilling: async (organizationId: string) => {
      // 1. Get all clients
      const clients = await prisma.client.findMany({ 
          where: { organizationId, status: "ACTIVE" } 
      });

      for (const client of clients) {
          // 2. Aggregate Inventory
          // Assuming we have a way to count pallets/CBM per client
          // Select count of inventory items or sum of volume
          const inventoryStats = await prisma.inventoryItem.aggregate({
              where: { 
                  organizationId,
                  // implied linkage to client via product owner?
                  // For now assuming organizationId IS the tenant context
              }, 
              _count: { id: true },
              _sum: { quantity: true } // Simplified
          });

          // 3. Record Event
          await BillingEngine.recordEvent(
              organizationId,
              client.id,
              "STORAGE",
              inventoryStats._count.id || 0,
              { type: "DailyJob", id: `DAILY-${new Date().toISOString().split('T')[0]}` },
              "Daily Pallet Storage"
          );
      }
  }
};
