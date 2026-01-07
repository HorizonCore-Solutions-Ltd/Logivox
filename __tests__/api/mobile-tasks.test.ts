/**
 * API Route Tests - Mobile Tasks
 */

import { GET } from "@/app/api/mobile/tasks/route";
import { POST } from "@/app/api/mobile/tasks/[id]/[action]/route";
import {
  createAuthenticatedRequest,
  parseResponse,
  factories,
  assertSuccessResponse,
} from "@/lib/test-utils/api-test-utils";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    pickingTask: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";

describe("API: /api/mobile/tasks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/mobile/tasks", () => {
    it("should return user-assigned tasks", async () => {
      const mockTasks = [
        factories.pickingTask({
          assignedToId: "test-user-id",
          status: "PENDING",
        }),
        factories.pickingTask({
          assignedToId: "test-user-id",
          status: "IN_PROGRESS",
        }),
      ];

      (prisma.pickingTask.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const request = createAuthenticatedRequest({
        method: "GET",
        url: "http://localhost:3000/api/mobile/tasks",
        userId: "test-user-id",
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(data.data.tasks).toHaveLength(2);
      expect(prisma.pickingTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedToId: "test-user-id",
          }),
        }),
      );
    });

    it("should filter tasks by status", async () => {
      (prisma.pickingTask.findMany as jest.Mock).mockResolvedValue([]);

      const request = createAuthenticatedRequest({
        method: "GET",
        url: "http://localhost:3000/api/mobile/tasks",
        searchParams: {
          status: "PENDING",
        },
        userId: "test-user-id",
      });

      await GET(request);

      expect(prisma.pickingTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
          }),
        }),
      );
    });

    it("should filter tasks by type", async () => {
      (prisma.pickingTask.findMany as jest.Mock).mockResolvedValue([]);

      const request = createAuthenticatedRequest({
        method: "GET",
        url: "http://localhost:3000/api/mobile/tasks",
        searchParams: {
          taskType: "PICKING",
        },
        userId: "test-user-id",
      });

      await GET(request);

      expect(prisma.pickingTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            taskType: "PICKING",
          }),
        }),
      );
    });

    it("should order tasks by priority", async () => {
      (prisma.pickingTask.findMany as jest.Mock).mockResolvedValue([]);

      const request = createAuthenticatedRequest({
        method: "GET",
        url: "http://localhost:3000/api/mobile/tasks",
        userId: "test-user-id",
      });

      await GET(request);

      expect(prisma.pickingTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ priority: "desc" }, { scheduledFor: "asc" }],
        }),
      );
    });

    it("should limit results to 50 tasks", async () => {
      (prisma.pickingTask.findMany as jest.Mock).mockResolvedValue([]);

      const request = createAuthenticatedRequest({
        method: "GET",
        url: "http://localhost:3000/api/mobile/tasks",
        userId: "test-user-id",
      });

      await GET(request);

      expect(prisma.pickingTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });
  });

  describe("POST /api/mobile/tasks/:id/start", () => {
    it("should start assigned task", async () => {
      const mockTask = factories.pickingTask({
        id: "task-1",
        assignedToId: "test-user-id",
        status: "PENDING",
      });

      (prisma.pickingTask.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.pickingTask.update as jest.Mock).mockResolvedValue({
        ...mockTask,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      });

      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/mobile/tasks/task-1/start",
        userId: "test-user-id",
      });

      // Mock params
      const params = { id: "task-1", action: "start" };
      const response = await POST(request, { params });
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(prisma.pickingTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "task-1" },
          data: expect.objectContaining({
            status: "IN_PROGRESS",
            startedAt: expect.any(Date),
          }),
        }),
      );
    });

    it("should return 404 for non-existent task", async () => {
      (prisma.pickingTask.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/mobile/tasks/invalid-id/start",
        userId: "test-user-id",
      });

      const params = { id: "invalid-id", action: "start" };
      const response = await POST(request, { params });

      expect(response.status).toBe(404);
    });

    it("should return 403 when task not assigned to user", async () => {
      const mockTask = factories.pickingTask({
        id: "task-1",
        assignedToId: "other-user-id",
      });

      (prisma.pickingTask.findUnique as jest.Mock).mockResolvedValue(mockTask);

      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/mobile/tasks/task-1/start",
        userId: "test-user-id",
      });

      const params = { id: "task-1", action: "start" };
      const response = await POST(request, { params });

      expect(response.status).toBe(403);
    });
  });
});
