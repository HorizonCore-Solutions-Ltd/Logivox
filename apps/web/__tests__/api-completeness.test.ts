import { GET as getLabor } from "@/app/api/labor/route";
import { GET as getSustainability } from "@/app/api/sustainability/route";
import { GET as getInterleaving } from "@/app/api/task-interleaving/route";

// Mock Next.js server components to avoid environment issues in Jest
jest.mock("next/server", () => {
  return {
    NextResponse: {
      json: (data: any, options?: any) => {
        return {
          status: options?.status || 200,
          json: async () => data,
        };
      },
    },
  };
});

describe("New Enterprise Modules API Completeness", () => {
  test("Labor Management API returns correct metric structure", async () => {
    const response = await getLabor();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("activeWorkforce");
    expect(data).toHaveProperty("averageEfficiency");
    expect(data.employees).toBeInstanceOf(Array);
  });

  test("Sustainability API returns ESG data structure", async () => {
    const response = await getSustainability();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("carbonFootprint");
    expect(data).toHaveProperty("energyEfficiency");
    expect(data.initiatives).toBeInstanceOf(Array);
  });

  test("Task Interleaving API returns optimization status", async () => {
    const response = await getInterleaving();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("ratio");
    expect(data).toHaveProperty("travelSaved");
    expect(data.queue).toBeInstanceOf(Array);
  });
});
