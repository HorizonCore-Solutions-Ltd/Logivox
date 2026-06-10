import { POST } from "../route";

jest.mock("@/lib/auth-helpers", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    inventoryItem: {
      findUnique: jest.fn(),
    },
    correctivePreventiveAction: {
      findFirst: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
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

import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

describe("Inventory Adjust API CAPA integration", () => {
  const baseItem = {
    id: "item-1",
    organizationId: "org-1",
    warehouseId: "wh-1",
    sku: "SKU-1",
    name: "Item 1",
    quantity: 100,
    reservedQty: 10,
    minStockLevel: 20,
    status: "ACTIVE",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: "user-1" });
    (prisma.inventoryItem.findUnique as jest.Mock).mockResolvedValue(baseItem);
    (
      prisma.correctivePreventiveAction.findFirst as jest.Mock
    ).mockResolvedValue(null);
  });

  it("does not auto-create CAPA when feature is disabled", async () => {
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      securitySettings: {
        capaInventorySettings: {
          enabled: false,
          thresholds: { damage: 1, adjustment: 1, transfer: 1 },
        },
      },
    });

    const tx = {
      inventoryItem: {
        update: jest.fn().mockResolvedValue({}),
      },
      inventoryMovement: {
        create: jest.fn().mockResolvedValue({ id: "mov-1", notes: "" }),
        update: jest.fn(),
      },
      correctivePreventiveAction: {
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(5),
        create: jest.fn(),
      },
      activityLog: {
        create: jest.fn(),
      },
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) =>
      cb(tx),
    );

    const req = {
      json: async () => ({ quantity: 15, type: "DAMAGE" }),
      headers: { get: () => "jest" },
    } as any;

    const response = await POST(req, { params: { id: "item-1" } } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.autoCreatedCapa).toBeNull();
    expect(tx.correctivePreventiveAction.create).not.toHaveBeenCalled();
  });

  it("auto-creates CAPA when warehouse override threshold is met", async () => {
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      securitySettings: {
        capaInventorySettings: {
          enabled: true,
          thresholds: { damage: 100, adjustment: 100, transfer: 100 },
          warehouseOverrides: {
            "wh-1": { damage: 5 },
          },
        },
      },
    });

    const tx = {
      inventoryItem: {
        update: jest.fn().mockResolvedValue({ id: "item-1" }),
      },
      inventoryMovement: {
        create: jest.fn().mockResolvedValue({ id: "mov-1", notes: "" }),
        update: jest.fn().mockResolvedValue({}),
      },
      correctivePreventiveAction: {
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(9),
        create: jest.fn().mockResolvedValue({
          id: "capa-1",
          capaNumber: "CAPA-2026-0010",
        }),
      },
      activityLog: {
        create: jest.fn(),
      },
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) =>
      cb(tx),
    );

    const req = {
      json: async () => ({ quantity: 10, type: "DAMAGE" }),
      headers: { get: () => "jest" },
    } as any;

    const response = await POST(req, { params: { id: "item-1" } } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(tx.correctivePreventiveAction.create).toHaveBeenCalledTimes(1);
    expect(body.autoCreatedCapa).toEqual(
      expect.objectContaining({ id: "capa-1" }),
    );
    expect(tx.inventoryMovement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "mov-1" },
      }),
    );
  });
});
