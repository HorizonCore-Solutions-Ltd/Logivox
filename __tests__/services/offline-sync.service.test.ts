/**
 * Unit Tests - Offline Sync Service
 */

import { OfflineSyncService } from "@/lib/services/offline-sync.service";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe("OfflineSyncService", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe("isOnline", () => {
    it("should return true when navigator.onLine is true", () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      expect(OfflineSyncService.isOnline()).toBe(true);
    });

    it("should return false when navigator.onLine is false", () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      expect(OfflineSyncService.isOnline()).toBe(false);
    });
  });

  describe("queueChange", () => {
    it("should add change to queue", () => {
      const localId = OfflineSyncService.queueChange("task", "UPDATE", {
        id: "task-1",
        status: "COMPLETED",
      });

      expect(localId).toMatch(/^local_\d+_[a-z0-9]+$/);

      const state = OfflineSyncService.getSyncState();
      expect(state.pendingChanges).toBe(1);
    });

    it("should store multiple changes", () => {
      OfflineSyncService.queueChange("task", "UPDATE", { id: "task-1" });
      OfflineSyncService.queueChange("task", "CREATE", { id: "task-2" });
      OfflineSyncService.queueChange("item", "UPDATE", { id: "item-1" });

      const state = OfflineSyncService.getSyncState();
      expect(state.pendingChanges).toBe(3);
    });
  });

  describe("getSyncState", () => {
    it("should return initial state when no data", () => {
      const state = OfflineSyncService.getSyncState();

      expect(state).toEqual({
        lastSyncAt: null,
        pendingChanges: 0,
        isSyncing: false,
        lastError: null,
      });
    });

    it("should return correct pending changes count", () => {
      OfflineSyncService.queueChange("task", "UPDATE", { id: "task-1" });
      OfflineSyncService.queueChange("task", "UPDATE", { id: "task-2" });

      const state = OfflineSyncService.getSyncState();
      expect(state.pendingChanges).toBe(2);
    });
  });

  describe("getCachedData", () => {
    it("should return null when no cached data", () => {
      const data = OfflineSyncService.getCachedData("tasks");
      expect(data).toBeNull();
    });

    it("should return cached data", () => {
      const testData = [{ id: "1", name: "Task 1" }];
      OfflineSyncService.setCachedData("tasks", testData);

      const cached = OfflineSyncService.getCachedData("tasks");
      expect(cached).toEqual(testData);
    });
  });

  describe("setCachedData", () => {
    it("should store data in localStorage", () => {
      const testData = { id: "1", name: "Test" };
      OfflineSyncService.setCachedData("test_key", testData);

      const stored = JSON.parse(localStorage.getItem("cached_test_key") || "");
      expect(stored).toEqual(testData);
    });
  });

  describe("sync", () => {
    beforeEach(() => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      localStorageMock.setItem("auth_token", "test-token");
    });

    it("should return false when offline", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      const result = await OfflineSyncService.sync();
      expect(result.success).toBe(false);
    });

    it("should send pending changes to server", async () => {
      OfflineSyncService.queueChange("task", "UPDATE", {
        id: "task-1",
        status: "COMPLETED",
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            appliedChanges: [{ localId: "local_123", serverId: "task-1" }],
            failedChanges: [],
            serverChanges: { tasks: [], items: [] },
          },
        }),
      });

      const result = await OfflineSyncService.sync();

      expect(result.success).toBe(true);
      expect(result.appliedChanges).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/mobile/sync",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("should handle sync errors gracefully", async () => {
      OfflineSyncService.queueChange("task", "UPDATE", { id: "task-1" });

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const result = await OfflineSyncService.sync();

      expect(result.success).toBe(false);
      expect(result.failedChanges).toBeGreaterThan(0);
    });
  });

  describe("clearSyncedChanges", () => {
    it("should remove synced changes but keep pending", () => {
      // Add some changes
      OfflineSyncService.queueChange("task", "UPDATE", { id: "task-1" });
      OfflineSyncService.queueChange("task", "UPDATE", { id: "task-2" });

      // Manually mark first as synced
      const queue = JSON.parse(
        localStorage.getItem("flowstock_offline_data") || "[]",
      );
      queue[0].synced = true;
      queue[0].syncedAt = new Date();
      localStorage.setItem("flowstock_offline_data", JSON.stringify(queue));

      // Clear synced
      OfflineSyncService.clearSyncedChanges();

      const state = OfflineSyncService.getSyncState();
      expect(state.pendingChanges).toBe(1);
    });
  });
});
