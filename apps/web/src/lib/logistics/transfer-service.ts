// Service for Advanced Inter-Organization Orchestration & Global Inventory Mesh
// Handles Cross-Branch Transfers, Inter-Company Billing, and Rectification

import { prisma } from "@/lib/prisma";
import { InvoiceService } from "@/lib/billing/invoiceService";

export const CognitiveTransferOrchestrator = {
  /**
   * Finds the nearest stock location globally across all branches (Hub-and-Spoke Mesh).
   * If the main DC is out, it checks other branches.
   */
  findGlobalStock: async (
    sku: string,
    requestedQuantity: number,
    excludeOrgId: string,
  ) => {
    // Find all organizations/branches with this SKU in stock
    const stockAcrossNetwork = await prisma.inventoryItem.findMany({
      where: {
        sku: sku,
        quantity: { gte: requestedQuantity },
        organizationId: { not: excludeOrgId }, // Don't check ourselves
      },
      include: {
        organization: true,
        location: true,
      },
      orderBy: {
        quantity: "desc", // Prioritize highest stock first
      },
    });

    if (stockAcrossNetwork.length === 0) return null;

    // Simple logic: Pick the first one (highest stock).
    // Advanced logic would be: Nearest Geo-Location (using metadata lat/long).
    return stockAcrossNetwork[0];
  },

  /**
   * Executes a "Pass-Through" Inter-Organization Transfer.
   * Moves stock from Branch A -> Requesting Branch B.
   * Handles: Inventory decrements, In-Transit creation, and Financial Clearing.
   */
  requestInterBranchTransfer: async (
    sourceOrgId: string,
    targetOrgId: string,
    sku: string,
    quantity: number,
    requesterId: string,
    boxId: string, // Unique Box/Container ID for physical tracking
    originalOrderId: string, // The client order that triggered this transfer
  ) => {
    // 1. Verify Source Stock
    const sourceItem = await prisma.inventoryItem.findFirst({
      where: {
        organizationId: sourceOrgId,
        sku: sku,
        quantity: { gte: quantity },
      },
    });

    if (!sourceItem) throw new Error("Source branch out of stock.");

    // 2. Reduce Source Stock & Create Outbound Transfer Record
    await prisma.inventoryItem.update({
      where: { id: sourceItem.id },
      data: { quantity: { decrement: quantity } },
    });

    const outboundTransfer = await prisma.warehouseTransfer.create({
      data: {
        organizationId: sourceOrgId,
        transferNumber: `TRF-${Date.now()}-OUT`,
        type: "INTER_ORG_OUT",
        status: "IN_PROGRESS",
        fromLocationId: sourceItem.locationId,
        toLocationId: sourceItem.locationId, // Virtual logic for now
        inventoryId: sourceItem.id,
        quantity: quantity,
        destinationOrgId: targetOrgId,
        requestedById: requesterId,
        billingStatus: "PENDING",
        metadata: {
          boxId: boxId,
          originalOrderId: originalOrderId,
          requesterId: requesterId,
        },
      },
    });

    // 3. Create Inbound Transfer Record for Target Org (Virtual "In-Transit")
    // We'd ideally create a temporary item or "In-Transit" location in Target Org
    // For simplicity, we create the Transfer record to track the incoming goods.
    const inboundTransfer = await prisma.warehouseTransfer.create({
      data: {
        organizationId: targetOrgId,
        transferNumber: `TRF-${Date.now()}-IN`,
        type: "INTER_ORG_IN",
        status: "PENDING",
        fromLocationId: sourceItem.locationId, // Just for ref
        toLocationId: sourceItem.locationId, // Pending assignment
        inventoryId: sourceItem.id, // Ref ID
        quantity: quantity,
        parentTransferId: outboundTransfer.id,
        requestedById: requesterId,
        metadata: {
          sourceOrgName: "Branch A (Simulated)",
          boxId: boxId,
          originalOrderId: originalOrderId,
          receiverId: "PENDING_SCAN", // Will be updated on final scan
        },
      },
    });

    // 4. Trigger Financial Clearing (Inter-Company Invoice)
    // Auto-generate invoice from Source Org to Target Org
    await InvoiceService.generateInvoices(sourceOrgId, targetOrgId);

    return {
      success: true,
      outboundId: outboundTransfer.id,
      inboundId: inboundTransfer.id,
      message: "Inter-branch transfer initiated with financial clearing.",
    };
  },

  /**
   * "Pass-Through" Verification at DC (Cross-Dock Logic)
   * When Branch A ships via DC to Branch B, the DC scans the pallet.
   * System detects it's a pass-through and AUTO-CONFIRMS receipt & AUTO-DISPATCHES to outbound.
   * No putaway, no admin approval needed.
   */
  processDidPassThroughDc: async (transferId: string, dcOrgId: string) => {
    // 1. Find the Transfer
    const transfer = await prisma.warehouseTransfer.findUnique({
      where: { id: transferId },
      include: { inventoryItem: true },
    });

    if (!transfer) throw new Error("Transfer not found");

    // 2. Verify it's an Inter-Org transfer meant for another destination
    if (transfer.type !== "INTER_ORG_OUT" || !transfer.destinationOrgId) {
      throw new Error("Not a valid pass-through transfer.");
    }

    // 3. Auto-Route to Outbound Lane (Virtual Move)
    // We log that it touched the DC, but immediately set status to "IN_TRANSIT_TO_FINAL"
    // This signifies it left the DC and is on the final leg truck.

    await prisma.warehouseTransfer.update({
      where: { id: transferId },
      data: {
        status: "IN_PROGRESS", // Remains in progress until final dest
        metadata: {
          ...((transfer.metadata as object) || {}),
          dcPassThroughTime: new Date(),
          dcHandler: "AUTO_SCAN_SYSTEM",
        },
      },
    });

    // Optional: Trigger ASN to final branch saying "It just left the DC"
    return {
      success: true,
      message: "Pass-through verified. Transfer auto-routed to outbound lane.",
      nextStep: "Load onto truck for Branch B",
    };
  },

  /**
   * "Rectification" Transfer.
   * Used when Branch A physically received an item meant for Project B.
   * Instead of shipping it back, we transfer ownership digitally and bill appropriately.
   */
  rectifyIncorrectReceipt: async (
    holdingOrgId: string,
    correctOwnerOrgId: string,
    itemId: string,
    quantity: number,
  ) => {
    // 1. Digital Ownership Transfer
    // The item stays physically at Holding Org, but we treat it as a "Sale" to Holding Org from Owner.
    // OR we just bill Holding Org and remove it from Owner's books.

    // Scenario: Holding Org keeps it. We invoice them.
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new Error("Item not found");

    // 2. Create "Rectification" Invoice
    // We create an invoice from Correct Owner -> Holding Org
    const rectInvoice = await prisma.clientInvoice.create({
      data: {
        organizationId: correctOwnerOrgId,
        clientId: holdingOrgId, // Assuming Org ID maps to Client ID for inter-company
        invoiceNumber: `RECT-${Date.now()}`,
        invoiceDate: new Date(),
        dueDate: new Date(), // Immediate
        periodStart: new Date(),
        periodEnd: new Date(),
        subtotal: 100, // Placeholder price
        total: 100,
        balanceDue: 100,
        status: "SENT",
        notes: `Rectification for item ${item.sku} retained by branch.`,
      },
    });

    // 3. Update Audit Log / Transfer Record
    await prisma.warehouseTransfer.create({
      data: {
        organizationId: holdingOrgId,
        transferNumber: `RECT-${Date.now()}`,
        type: "RECTIFICATION",
        status: "COMPLETED",
        fromLocationId: item.locationId,
        toLocationId: item.locationId,
        inventoryId: item.id,
        quantity: quantity,
        billingStatus: "INVOICED",
        metadata: { invoiceId: rectInvoice.id },
      },
    });

    return { success: true, invoiceNumber: rectInvoice.invoiceNumber };
  },

  /**
   * Global "Clear the Yard" / Recall Logic.
   * Identifies stagnant stock across branches and issuing recall requests.
   */
  runGlobalRecallAnalysis: async (mainDcId: string) => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 90); // 90 days stagnant

    // Find stagnant items in branches (not Main DC)
    const stagnantItems = await prisma.inventoryItem.findMany({
      where: {
        organizationId: { not: mainDcId },
        updatedAt: { lte: thresholdDate },
      },
      include: { organization: true },
    });

    const recalls = [];

    for (const item of stagnantItems) {
      // Create "Recall" Transfer Request
      const recall = await prisma.warehouseTransfer.create({
        data: {
          organizationId: item.organizationId,
          transferNumber: `RECALL-${Date.now()}-${item.id.slice(0, 4)}`,
          type: "RECALL",
          status: "PENDING",
          fromLocationId: item.locationId,
          toLocationId: item.locationId, // Dest is Main DC eventually
          inventoryId: item.id,
          quantity: item.quantity,
          destinationOrgId: mainDcId,
          reason: "Stagnant Stock Recall (90+ Days)",
          requestedById: "SYSTEM_COGNITIVE_ENGINE", // Virtual User
          createdAt: new Date(),
        },
      });
      recalls.push(recall);
    }

    return {
      analyzedCount: stagnantItems.length,
      recallsIssued: recalls.length,
      details: recalls.map((r) => r.transferNumber),
    };
  },
};
