import { InboundBrain } from "@/lib/services/inbound-brain";
import { prisma } from "@/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    supplier: {
      findUnique: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
    },
    salesOrderItem: {
      findMany: jest.fn(),
    },
    slottingRule: {
        findMany: jest.fn()
    },
    lot: {
        findFirst: jest.fn()
    }
  },
}));

describe("InboundBrain & Slotting Integration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should flag for QC if supplier quality is low (< 80)", async () => {
        // Mock Supplier with Low Score
        (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({
            id: "SUP-BAD",
            qualityScore: { score: 50 }
        });
        
        // Mock QC Location
        (prisma.location.findFirst as jest.Mock).mockResolvedValue({ 
            id: "QC-LOC-1", 
            type: "QUARANTINE" 
        });

        const result = await InboundBrain.determineAction({
            itemId: "ITEM-1",
            organizationId: "ORG-1",
            warehouseId: "WH-1",
            quantity: 100,
            supplierId: "SUP-BAD"
        });

        expect(result.qcStatus).toBe("PENDING_QC");
        expect(result.recommendedLocationId).toBe("QC-LOC-1");
        expect(result.notes).toContain("QC");
    });

    it("should detect cross-dock opportunity (Backorder)", async () => {
        // High quality supplier
        (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({
            qualityScore: { score: 95 }
        });
        
        // Mock Backorders (Sales Order Items needing this item)
        (prisma.salesOrderItem.findMany as jest.Mock).mockResolvedValue([
            {
                inventoryItemId: "ITEM-1",
                quantity: 50,
                quantityShipped: 0,
                salesOrder: { soNumber: "SO-URGENT" }
            }
        ]);

        // Mock Staging Location
        (prisma.location.findFirst as jest.Mock).mockResolvedValue({ 
            id: "STAGE-1", 
            type: "STAGING" 
        });

        const result = await InboundBrain.determineAction({
            itemId: "ITEM-1",
            organizationId: "ORG-1",
            warehouseId: "WH-1",
            quantity: 10,
            supplierId: "SUP-GOOD"
        });

        expect(result.isCrossDock).toBe(true);
        expect(result.recommendedLocationId).toBe("STAGE-1");
        expect(result.notes).toContain("Cross-dock");
    });

    it("should consolidate inventory if existing lot found (Slotting Engine)", async () => {
         // High quality, no backorder
        (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ qualityScore: { score: 90 } });
        (prisma.salesOrderItem.findMany as jest.Mock).mockResolvedValue([]);
        
        // Slotting Engine logic:
        // 1. Rules: None
        (prisma.slottingRule.findMany as jest.Mock).mockResolvedValue([]);
        
        // 2. Consolidation: Found existing existing active lot in a bin
        (prisma.lot.findFirst as jest.Mock).mockResolvedValue({
            location: { id: "BIN-CONSOLIDATE", name: "A-01-01" }
        });

        const result = await InboundBrain.determineAction({
            itemId: "ITEM-1",
            organizationId: "ORG-1",
            warehouseId: "WH-1",
            quantity: 10,
            supplierId: "SUP-GOOD"
        });

        expect(result.isCrossDock).toBe(false);
        // Correctly consolidated
        expect(result.recommendedLocationId).toBe("BIN-CONSOLIDATE");
    });

    it("should use fallback empty location if no rules overlap", async () => {
        // Basic conditions
        (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ qualityScore: { score: 90 } });
        (prisma.salesOrderItem.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.slottingRule.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.lot.findFirst as jest.Mock).mockResolvedValue(null); // No consolidation

        // Fallback search mock (matches the fallback query in code)
        // Usually findFirst call order matters. 
        // 1. QC check (returns null first time called in brain?) -> Mocked logic handles it
        // 2. Staging check -> skipped
        // 3. Slotting -> Rules -> Consolidation -> Empty Location
        
        // We need to return a location for the final fallback `findFirst` calls in SlottingEngine
        (prisma.location.findFirst as jest.Mock).mockResolvedValue({ 
            id: "BIN-EMPTY", 
            name: "Z-99-99",
            isPutaway: true 
        });

        const result = await InboundBrain.determineAction({
            itemId: "ITEM-NEW",
            organizationId: "ORG-1",
            warehouseId: "WH-1",
            quantity: 10,
            supplierId: "SUP-GOOD"
        });

        expect(result.recommendedLocationId).toBe("BIN-EMPTY");
        expect(result.notes).toContain("Found empty location");
    });
});
