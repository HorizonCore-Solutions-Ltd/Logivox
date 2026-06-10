import { GET, PATCH } from "../route";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/permissions", () => ({
  requirePermission: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
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

import { getServerSession } from "next-auth";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

describe("CAPA Inventory Settings API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "u-1", organizationId: "org-1" },
    });
    (requirePermission as jest.Mock).mockResolvedValue({
      session: { user: { id: "u-1" } },
    });
  });

  it("GET returns merged defaults and saved settings", async () => {
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      securitySettings: {
        capaInventorySettings: {
          enabled: true,
          thresholds: { damage: 7 },
        },
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.settings.enabled).toBe(true);
    expect(body.settings.thresholds.damage).toBe(7);
    expect(body.settings.thresholds.adjustment).toBe(25);
    expect(body.settings.thresholds.transfer).toBe(50);
    expect(requirePermission).toHaveBeenCalledWith("view");
  });

  it("PATCH enforces manageSettings permission", async () => {
    (requirePermission as jest.Mock).mockResolvedValue({
      session: null,
      error: {
        status: 403,
        json: async () => ({ message: "Insufficient permissions" }),
      },
    });

    const request = {
      json: async () => ({ enabled: false }),
      headers: { get: () => "test" },
    } as any;

    const response = await PATCH(request);

    expect(response.status).toBe(403);
    expect(prisma.organization.update).not.toHaveBeenCalled();
  });

  it("PATCH saves updated threshold settings", async () => {
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      securitySettings: {
        someOtherSetting: true,
        capaInventorySettings: {
          enabled: true,
          thresholds: { damage: 10, adjustment: 25, transfer: 50 },
        },
      },
    });

    const request = {
      json: async () => ({
        enabled: true,
        thresholds: { damage: 5, transfer: 40 },
      }),
      headers: {
        get: (k: string) => (k === "x-forwarded-for" ? "127.0.0.1" : "jest"),
      },
    } as any;

    const response = await PATCH(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "org-1" },
        data: {
          securitySettings: expect.objectContaining({
            capaInventorySettings: expect.objectContaining({
              enabled: true,
              thresholds: expect.objectContaining({
                damage: 5,
                adjustment: 25,
                transfer: 40,
              }),
            }),
          }),
        },
      }),
    );
    expect(body.success).toBe(true);
    expect(prisma.activityLog.create).toHaveBeenCalledTimes(1);
  });
});
