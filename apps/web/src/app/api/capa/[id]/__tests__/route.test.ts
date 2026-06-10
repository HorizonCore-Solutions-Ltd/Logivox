import { PATCH } from "../route";

jest.mock("@/lib/api-guard", () => ({
  requireApiAuth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, options?: any) => ({
      status: options?.status ?? 200,
      json: async () => data,
    }),
  },
}));

import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

describe("CAPA PATCH inventory adjustments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireApiAuth as jest.Mock).mockResolvedValue({
      organizationId: "org-1",
    });
  });

  it("applies valid inventory adjustments and tags movements with CAPA id", async () => {
    const tx = {
      correctivePreventiveAction: {
        update: jest
          .fn()
          .mockResolvedValue({ id: "capa-1", title: "Test CAPA" }),
      },
      inventoryItem: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: "item-1",
            organizationId: "org-1",
            quantity: 20,
            reservedQty: 2,
            minStockLevel: 5,
          })
          .mockResolvedValueOnce({
            id: "item-2",
            organizationId: "org-1",
            quantity: 4,
            reservedQty: 1,
            minStockLevel: 3,
          }),
        update: jest.fn().mockResolvedValue({}),
      },
      inventoryMovement: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: "mov-1" })
          .mockResolvedValueOnce({ id: "mov-2" }),
      },
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) =>
      cb(tx),
    );

    const request = {
      json: async () => ({
        status: "IN_PROGRESS",
        inventoryAdjustments: [
          {
            inventoryItemId: "item-1",
            quantity: 5,
            type: "DAMAGE",
            reason: "Damaged in transit",
            notes: "Box crushed",
          },
          {
            inventoryItemId: "item-2",
            quantity: 3,
            type: "RETURN",
          },
        ],
      }),
    } as any;

    const response = await PATCH(request, { params: { id: "capa-1" } } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(tx.correctivePreventiveAction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "capa-1", organizationId: "org-1" },
        data: { status: "IN_PROGRESS" },
      }),
    );

    expect(tx.inventoryItem.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: "item-1" },
        data: expect.objectContaining({
          quantity: 15,
          availableQty: 13,
          status: "ACTIVE",
        }),
      }),
    );

    expect(tx.inventoryItem.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: "item-2" },
        data: expect.objectContaining({
          quantity: 7,
          availableQty: 6,
          status: "ACTIVE",
        }),
      }),
    );

    expect(tx.inventoryMovement.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          inventoryItemId: "item-1",
          quantity: 5,
          notes: "Box crushed [CAPA:capa-1]",
        }),
      }),
    );

    expect(tx.inventoryMovement.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          inventoryItemId: "item-2",
          quantity: 3,
          notes: "[CAPA:capa-1]",
        }),
      }),
    );

    expect(body.appliedAdjustments).toHaveLength(2);
  });

  it("skips invalid inventory adjustments safely", async () => {
    const tx = {
      correctivePreventiveAction: {
        update: jest.fn().mockResolvedValue({ id: "capa-2" }),
      },
      inventoryItem: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: "item-3",
            organizationId: "org-1",
            quantity: 2,
            reservedQty: 0,
            minStockLevel: 1,
          })
          .mockResolvedValueOnce({
            id: "item-4",
            organizationId: "org-1",
            quantity: 1,
            reservedQty: 0,
            minStockLevel: 1,
          }),
        update: jest.fn(),
      },
      inventoryMovement: {
        create: jest.fn(),
      },
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) =>
      cb(tx),
    );

    const request = {
      json: async () => ({
        inventoryAdjustments: [
          { inventoryItemId: "missing-item", quantity: 5, type: "DAMAGE" },
          { inventoryItemId: "item-3", quantity: 0, type: "RETURN" },
          { inventoryItemId: "item-4", quantity: 5, type: "SALE" },
        ],
      }),
    } as any;

    const response = await PATCH(request, { params: { id: "capa-2" } } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(tx.inventoryItem.update).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
    expect(body.appliedAdjustments).toEqual([]);
  });
});
