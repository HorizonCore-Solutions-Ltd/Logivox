import { prisma } from "@/lib/prisma";
import type { UserRole, OrganizationRole } from "@prisma/client";

/**
 * Validates if the user has one of the required portal roles.
 */
export async function validatePortalAccess(userId: string, requiredRole: UserRole): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  return user?.role === requiredRole;
}

/**
 * Supplier Portal Logic
 */
export const SupplierPortal = {
  getASNs: async (supplierOrgId: string) => {
    // In a real implementation, we would link User -> Supplier Organization -> ASNs
    // For now, assuming direct organization link
    return prisma.goodsReceiptNote.findMany({
       where: { organizationId: supplierOrgId }, // Placeholder logic
       orderBy: { createdAt: "desc" }
    });
  },

  createASN: async (supplierOrgId: string, userId: string, data: { 
      poId: string, 
      warehouseId: string,
      items: Array<{ inventoryItemId: string, orderedQuantity: number, receivedQuantity: number, lot?: string, expiry?: Date }>
  }) => {
      // Find PO first to validate
      const po = await prisma.purchaseOrder.findUnique({
          where: { id: data.poId },
          include: { items: true }
      });
      
      if (!po || po.organizationId !== supplierOrgId) {
          throw new Error("Purchase Order not found or unauthorized");
      }

      // Generate GRN Number
      const grnNumber = `ASN-${po.poNumber}-${Date.now().toString().slice(-6)}`;

      // Create Goods Receipt Note (ASN)
      const grn = await prisma.goodsReceiptNote.create({
          data: {
              organizationId: supplierOrgId,
              purchaseOrderId: data.poId,
              warehouseId: data.warehouseId,
              grnNumber: grnNumber,
              status: "PENDING", // Acts as ASN Submitted
              receivedById: userId, // The supplier user
              receivedDate: new Date(),
              totalReceived: 0, // Not physically received yet
              items: {
                  create: data.items.map(item => {
                      // Attempt to match PO line for cost and linkage
                      // Assuming PO Items have inventoryItemId
                      const poLine = po.items.find(p => p.inventoryItemId === item.inventoryItemId);
                      return {
                          inventoryItemId: item.inventoryItemId,
                          purchaseOrderItemId: poLine?.id, // Link to PO Line
                          orderedQuantity: item.orderedQuantity,
                          receivedQuantity: item.receivedQuantity, 
                          acceptedQuantity: 0,
                          rejectedQuantity: 0,
                          unitCost: poLine?.unitPrice || 0,
                          expiryDate: item.expiry,
                          batchNumber: item.lot
                      };
                  })
              }
          }
      });
      
      return { success: true, grnId: grn.id, grnNumber };
  }
};

/**
 * Carrier Portal Logic
 */
export const CarrierPortal = {
  getAvailableSlots: async (warehouseId: string, date: Date) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23,59,59,999);

      return prisma.dockAppointment.findMany({
          where: { 
              warehouseId,
              scheduledStart: { gte: startOfDay, lte: endOfDay },
              status: { not: "CANCELLED" } 
          }
      });
  },

  bookAppointment: async (carrierUserId: string, data: { 
      warehouseId: string, 
      dockId: string, 
      startTime: Date, 
      durationMinutes: number,
      loadRef: string 
  }) => {
      // Calculate End Time
      const endTime = new Date(data.startTime.getTime() + data.durationMinutes * 60000);
      
      // Check collision
      const existing = await prisma.dockAppointment.findFirst({
          where: {
              warehouseId: data.warehouseId,
              yardLocationId: data.dockId,
              scheduledStart: { lt: endTime },
              scheduledEnd: { gt: data.startTime },
              status: { not: "CANCELLED" }
          }
      });

      if (existing) {
          throw new Error("Slot already booked");
      }

      const user = await prisma.user.findUnique({ where: { id: carrierUserId }, include: { organizationMemberships: true }});
      const orgId = user?.organizationMemberships[0]?.organizationId || "";

      return prisma.dockAppointment.create({
          data: {
              organizationId: orgId, // Carrier Org
              warehouseId: data.warehouseId,
              yardLocationId: data.dockId, // Mapped to Link
              appointmentNumber: `APT-${Date.now()}`,
              appointmentType: "INBOUND",
              scheduledDate: data.startTime,
              scheduledStart: data.startTime,
              scheduledEnd: endTime,
              duration: data.durationMinutes,
              status: "SCHEDULED",
              referenceNumber: data.loadRef,
              carrierName: "Portal User" // Or fetch actual
          }
      });
  }
};

/**
 * Customer Portal Logic
 */
export const CustomerPortal = {
   getOrders: async (customerOrgId: string) => {
       return prisma.order.findMany({
           where: { customer: { id: customerOrgId } }, 
           take: 20,
           orderBy: { createdAt: "desc" }
       });
   }
};
