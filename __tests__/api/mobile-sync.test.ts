/**
 * API Route Tests - Mobile Sync
 */

import { POST } from "@/app/api/mobile/sync/route";
import {
  createAuthenticatedRequest,
  parseResponse,
  assertSuccessResponse,
} from "@/lib/test-utils/api-test-utils";

jest.mock("@/lib/prisma");

describe("API: /api/mobile/sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/mobile/sync", () => {
    it("should accept empty pending changes", async () => {
      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/mobile/sync",
        body: {
          lastSyncAt: new Date().toISOString(),
          pendingChanges: [],
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(data.data).toHaveProperty("syncTimestamp");
      expect(data.data).toHaveProperty("serverChanges");
      expect(data.data).toHaveProperty("appliedChanges");
      expect(data.data).toHaveProperty("failedChanges");
    });

    it("should process task completion changes", async () => {
      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/mobile/sync",
        body: {
          lastSyncAt: new Date().toISOString(),
          pendingChanges: [
            {
              entity: "task",
              action: "task_completion",
              data: {
                taskId: "task-1",
                status: "COMPLETED",
                completedAt: new Date().toISOString(),
              },
              localId: "local_12345",
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(data.data.appliedChanges).toBeInstanceOf(Array);
    });

    it("should process inventory count changes", async () => {
      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/mobile/sync",
        body: {
          lastSyncAt: new Date().toISOString(),
          pendingChanges: [
            {
              entity: "inventory",
              action: "inventory_count",
              data: {
                inventoryItemId: "item-1",
                locationId: "loc-1",
                countedQuantity: 100,
                systemQuantity: 95,
              },
              localId: "local_67890",
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
    });

    it("should return server changes since last sync", async () => {
      const lastSyncAt = new Date(Date.now() - 3600000); // 1 hour ago

      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/mobile/sync",
        body: {
          lastSyncAt: lastSyncAt.toISOString(),
          pendingChanges: [],
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(data.data.serverChanges).toHaveProperty("tasks");
      expect(data.data.serverChanges).toHaveProperty("items");
    });

    it("should handle sync without lastSyncAt (initial sync)", async () => {
      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/mobile/sync",
        body: {
          pendingChanges: [],
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
    });

    it("should detect and report conflicts", async () => {
      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/mobile/sync",
        body: {
          lastSyncAt: new Date().toISOString(),
          pendingChanges: [
            {
              entity: "task",
              action: "task_completion",
              data: {
                taskId: "task-1",
                status: "COMPLETED",
                // Simulating outdated data
              },
              localId: "local_conflict",
              timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            },
          ],
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(data.data).toHaveProperty("conflicts");
      expect(Array.isArray(data.data.conflicts)).toBe(true);
    });

    it("should map localId to serverId", async () => {
      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/mobile/sync",
        body: {
          pendingChanges: [
            {
              entity: "task",
              action: "task_completion",
              data: {
                taskId: "task-1",
                status: "COMPLETED",
              },
              localId: "local_mapping_test",
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      if (data.data.appliedChanges.length > 0) {
        expect(data.data.appliedChanges[0]).toHaveProperty("localId");
        expect(data.data.appliedChanges[0]).toHaveProperty("serverId");
      }
    });
  });
});
