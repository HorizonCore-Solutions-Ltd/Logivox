/**
 * Component Tests - Mobile Task List
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MobileTaskList from "@/components/mobile/MobileTaskList";

// Mock offline sync service
jest.mock("@/lib/services/offline-sync.service", () => ({
  OfflineSyncService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getSyncState: jest.fn().mockReturnValue({
      lastSyncAt: new Date(),
      pendingChanges: 0,
      isSyncing: false,
      lastError: null,
    }),
    isOnline: jest.fn().mockReturnValue(true),
    sync: jest.fn().mockResolvedValue({
      success: true,
      appliedChanges: 0,
      failedChanges: 0,
    }),
    setCachedData: jest.fn(),
    getCachedData: jest.fn().mockReturnValue(null),
    queueChange: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        success: true,
        data: {
          tasks: [
            {
              id: "1",
              taskNumber: "TASK-001",
              taskType: "PICKING",
              status: "PENDING",
              priority: 5,
              warehouse: { name: "Main Warehouse" },
              fromLocation: { name: "A-01-01-01" },
              toLocation: { name: "B-02-02-02" },
              inventoryItem: { name: "Test Product", sku: "SKU-001" },
            },
          ],
          count: 1,
        },
      }),
  }),
) as jest.Mock;

describe("MobileTaskList Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("auth_token", "test-token");
  });

  it("should render task list", async () => {
    render(<MobileTaskList />);

    await waitFor(() => {
      expect(screen.getByText("TASK-001")).toBeInTheDocument();
    });
  });

  it("should show online status", async () => {
    render(<MobileTaskList />);

    await waitFor(() => {
      expect(screen.getByText("Online")).toBeInTheDocument();
    });
  });

  it("should show offline status when offline", async () => {
    const {
      OfflineSyncService,
    } = require("@/lib/services/offline-sync.service");
    OfflineSyncService.isOnline.mockReturnValueOnce(false);

    render(<MobileTaskList />);

    await waitFor(() => {
      expect(screen.getByText("Offline")).toBeInTheDocument();
    });
  });

  it("should show pending changes count", async () => {
    const {
      OfflineSyncService,
    } = require("@/lib/services/offline-sync.service");
    OfflineSyncService.getSyncState.mockReturnValueOnce({
      lastSyncAt: new Date(),
      pendingChanges: 3,
      isSyncing: false,
      lastError: null,
    });

    render(<MobileTaskList />);

    await waitFor(() => {
      expect(screen.getByText(/3 pending/i)).toBeInTheDocument();
    });
  });

  it("should filter tasks by status", async () => {
    render(<MobileTaskList />);

    await waitFor(() => {
      expect(screen.getByLabelText("Status")).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText("Status");
    fireEvent.change(statusFilter, { target: { value: "PENDING" } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("status=PENDING"),
        expect.any(Object),
      );
    });
  });

  it("should filter tasks by type", async () => {
    render(<MobileTaskList />);

    await waitFor(() => {
      expect(screen.getByLabelText("Type")).toBeInTheDocument();
    });

    const typeFilter = screen.getByLabelText("Type");
    fireEvent.change(typeFilter, { target: { value: "PICKING" } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("taskType=PICKING"),
        expect.any(Object),
      );
    });
  });

  it("should display task details", async () => {
    render(<MobileTaskList />);

    await waitFor(() => {
      expect(screen.getByText("TASK-001")).toBeInTheDocument();
      expect(screen.getByText("PICKING")).toBeInTheDocument();
      expect(screen.getByText(/SKU-001/)).toBeInTheDocument();
      expect(screen.getByText(/Main Warehouse/)).toBeInTheDocument();
    });
  });

  it("should show start button for pending tasks", async () => {
    render(<MobileTaskList />);

    await waitFor(() => {
      const startButton = screen.getByRole("button", { name: /start/i });
      expect(startButton).toBeInTheDocument();
    });
  });

  it("should start task when start button clicked", async () => {
    render(<MobileTaskList />);

    await waitFor(() => {
      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/mobile/tasks/1/start"),
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  it("should queue task start when offline", async () => {
    const {
      OfflineSyncService,
    } = require("@/lib/services/offline-sync.service");
    OfflineSyncService.isOnline.mockReturnValueOnce(false);

    render(<MobileTaskList />);

    await waitFor(() => {
      const startButton = screen.getByRole("button", { name: /start/i });
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(OfflineSyncService.queueChange).toHaveBeenCalledWith(
        "task",
        "UPDATE",
        expect.objectContaining({
          id: "1",
          status: "IN_PROGRESS",
        }),
      );
    });
  });

  it("should handle sync button click", async () => {
    const {
      OfflineSyncService,
    } = require("@/lib/services/offline-sync.service");

    render(<MobileTaskList />);

    await waitFor(() => {
      const syncButton = screen.getByRole("button", { name: /refresh/i });
      fireEvent.click(syncButton);
    });

    await waitFor(() => {
      expect(OfflineSyncService.sync).toHaveBeenCalled();
    });
  });

  it("should show error when tasks fail to load", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<MobileTaskList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
    });
  });

  it("should show cached data when offline", async () => {
    const {
      OfflineSyncService,
    } = require("@/lib/services/offline-sync.service");

    const cachedTasks = [
      {
        id: "1",
        taskNumber: "CACHED-TASK",
        taskType: "PICKING",
        status: "PENDING",
        priority: 5,
        warehouse: { name: "Main Warehouse" },
      },
    ];

    OfflineSyncService.getCachedData.mockReturnValueOnce(cachedTasks);
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Offline"));

    render(<MobileTaskList />);

    await waitFor(() => {
      expect(screen.getByText("CACHED-TASK")).toBeInTheDocument();
      expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
    });
  });

  it("should display priority badges", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            tasks: [
              {
                id: "1",
                taskNumber: "URGENT-TASK",
                taskType: "PICKING",
                status: "PENDING",
                priority: 9, // Urgent
                warehouse: { name: "Main Warehouse" },
              },
            ],
          },
        }),
    });

    render(<MobileTaskList />);

    await waitFor(() => {
      expect(screen.getByText("Urgent")).toBeInTheDocument();
    });
  });

  it("should show empty state when no tasks", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            tasks: [],
            count: 0,
          },
        }),
    });

    render(<MobileTaskList />);

    await waitFor(() => {
      expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();
    });
  });
});
