import { POST, triggerWebhook } from "../route";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    loadSheet: {
      findUnique: jest.fn(),
    },
    webhook: {
      findMany: jest.fn(),
      update: jest.fn(),
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
import { prisma } from "@/lib/prisma";

describe("Integrations API resilience", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "u-1" } });
    process.env.SAP_API_URL = "https://erp.example.com/sap";
    process.env.ERP_API_TOKEN = "token-1";
    global.fetch = jest.fn();
  });

  it("retries retryable ERP failures and succeeds", async () => {
    (prisma.loadSheet.findUnique as jest.Mock).mockResolvedValue({
      id: "ls-1",
      loadSheetNumber: "LS-100",
      shipmentDate: "2026-03-11",
      customer: { code: "C-1", name: "Acme" },
      containers: [{ containerItems: [{ sku: "SKU-1", quantity: 3 }] }],
      totalWeight: 1200,
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "upstream unavailable",
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ reference: "ERP-REF-1" }),
        headers: new Headers(),
      });

    const req = {
      json: async () => ({
        action: "syncToERP",
        loadSheetId: "ls-1",
        erpSystem: "SAP",
      }),
    } as any;

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.erpReference).toBe("ERP-REF-1");
    expect(global.fetch).toHaveBeenCalledTimes(2);

    const firstCallHeaders = (global.fetch as jest.Mock).mock.calls[0][1]
      .headers;
    expect(firstCallHeaders["Authorization"]).toBe("Bearer token-1");
    expect(firstCallHeaders["X-Trace-Id"]).toBeDefined();
  });

  it("does not retry non-retryable ERP response codes", async () => {
    (prisma.loadSheet.findUnique as jest.Mock).mockResolvedValue({
      id: "ls-2",
      loadSheetNumber: "LS-200",
      shipmentDate: "2026-03-11",
      customer: { code: "C-2", name: "Beta" },
      containers: [{ containerItems: [{ sku: "SKU-2", quantity: 1 }] }],
      totalWeight: 500,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "bad payload",
      headers: new Headers(),
    });

    const req = {
      json: async () => ({
        action: "syncToERP",
        loadSheetId: "ls-2",
        erpSystem: "SAP",
      }),
    } as any;

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.message).toContain("ERP sync failed (400)");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries webhook delivery and updates successful webhooks", async () => {
    (prisma.webhook.findMany as jest.Mock).mockResolvedValue([
      {
        id: "w-1",
        url: "https://hook.one",
        status: "ACTIVE",
        events: ["order.created"],
      },
    ]);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "temporary",
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "ok",
        headers: new Headers(),
      });

    await triggerWebhook("order.created", { id: "o-1" });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(prisma.webhook.update).toHaveBeenCalledTimes(1);
    expect(prisma.webhook.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "w-1" } }),
    );
  });
});
