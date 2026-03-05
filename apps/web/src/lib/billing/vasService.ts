// Value-Added Services (VAS) Management
// Handles creation, execution, and billing of VAS tasks.

import { prisma } from "@/lib/prisma";
import { BillingEngine, EventType } from "./billingEngine";
import type { VASStatus } from "@prisma/client";

export const VASService = {
  
  /**
   * Order a VAS (e.g., Kitting, Relabeling)
   */
  createRequest: async (
      organizationId: string, 
      clientId: string,
      serviceCode: string, // References RateCard (e.g. "KITTING-STD")
      details: {
          targetType: "InventoryItem" | "Order" | "Shipment",
          targetId: string,
          quantity: number,
          description?: string
      }
  ) => {
      // 1. Validate Service Exists in Rate Card?
      // For now, allow generic creating
      
      const request = await prisma.vASRequest.create({
          data: {
              organizationId,
              clientId,
              serviceCode,
              serviceName: serviceCode, // Could fetch friendly name
              description: details.description,
              targetType: details.targetType,
              targetId: details.targetId,
              quantity: details.quantity,
              status: "PENDING"
          }
      });

      return request;
  },

  /**
   * Complete a VAS task -> Triggers Billing
   */
  completeRequest: async (requestId: string, workerId?: string, evidenceUrl?: string) => {
      const request = await prisma.vASRequest.findUnique({
          where: { id: requestId },
          include: { client: true } // Need client to bill
      });

      if (!request || request.status === "COMPLETED") {
          throw new Error("Invalid VAS Request or already completed");
      }

      // 1. Update Status
      const updatedDiff = {
          status: "COMPLETED",
          completedAt: new Date(),
          assignedToId: workerId,
          evidencePhotos: evidenceUrl ? [evidenceUrl] : undefined, // Simplified array push
      };

      // 2. Trigger Billing
      if (request.billable && request.client) {
          try {
              const txn = await BillingEngine.recordEvent(
                  request.organizationId,
                  request.clientId!, 
                  "VALUE_ADDED_SERVICE",
                  request.quantity,
                  { type: "VASRequest", id: request.id, number: request.serviceCode },
                  request.description || `VAS Execution: ${request.serviceCode}`
              );

              // Link to Request
              // updatedDiff.billingTransactionId = txn.id;
          } catch (e) {
              console.error("Failed to bill VAS completion:", e);
              // Don't fail the operational completion just because billing failed?
              // Or maybe do fail? For now, log error.
          }
      }

      // 3. Save Update (Correcting Enum string type expectation)
      return prisma.vASRequest.update({
          where: { id: requestId },
          data: {
              status: "COMPLETED",
              completedAt: new Date(),
              assignedToId: workerId,
              // evidencePhotos logic needs to be robust for array
          }
      });
  },

  /**
   * Cancel a request
   */
  cancelRequest: async (requestId: string) => {
      return prisma.vASRequest.update({
          where: { id: requestId },
          data: { status: "CANCELLED" }
      });
  }
};
