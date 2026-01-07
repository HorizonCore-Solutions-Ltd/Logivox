/**
 * Labor Management Service
 * Comprehensive workforce management system
 * Handles productivity tracking, task assignment, performance analytics,
 * scheduling, time tracking, and labor optimization
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export interface LaborMetrics {
  totalWorkers: number;
  activeWorkers: number;
  totalHoursWorked: number;
  totalTasksCompleted: number;
  averageProductivity: number; // units per hour
  averageCostPerHour: number;
  topPerformers: Array<{
    userId: string;
    userName: string;
    totalTasks: number;
    totalHours: number;
    productivity: number;
    accuracy: number;
    efficiency: number;
  }>;
  departmentBreakdown: Array<{
    department: string;
    workerCount: number;
    totalHours: number;
    totalTasks: number;
    avgProductivity: number;
  }>;
  recentActivity: Array<{
    userId: string;
    userName: string;
    taskType: string;
    completedAt: Date;
    duration: number;
    productivity: number;
  }>;
}

export interface ProductivityReport {
  userId: string;
  userName: string;
  period: { startDate: Date; endDate: Date };
  totalHours: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksCancelled: number;
  averageTaskTime: number;
  productivity: number;
  accuracy: number;
  efficiency: number;
  performanceScore: number; // 0-100
  trends: {
    productivityTrend: "INCREASING" | "STABLE" | "DECREASING";
    efficiencyTrend: "INCREASING" | "STABLE" | "DECREASING";
  };
  taskBreakdown: Array<{
    taskType: string;
    count: number;
    totalTime: number;
    avgTime: number;
  }>;
}

export interface TaskAssignment {
  userId: string;
  userName: string;
  currentTasks: Array<{
    taskId: string;
    taskType: string;
    priority: number;
    estimatedTime: number;
    assignedAt: Date;
  }>;
  workload: number; // 0-100
  availability: "AVAILABLE" | "BUSY" | "OVERLOADED" | "OFFLINE";
  efficiency: number;
  suggestedTasks: Array<{
    taskId: string;
    taskType: string;
    priority: number;
    reason: string;
  }>;
}

export interface ScheduleRequest {
  userId: string;
  startDate: Date;
  endDate: Date;
  shifts: Array<{
    date: Date;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
    department?: string;
  }>;
}

export interface TimeEntry {
  userId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  totalHours?: number;
  breakMinutes?: number;
  department?: string;
  taskIds?: string[];
  notes?: string;
}

/**
 * Labor Management Service Class
 */
export class LaborManagementService {
  /**
   * Clock in worker
   */
  async clockIn(
    organizationId: string,
    userId: string,
    data: {
      department?: string;
      station?: string;
      notes?: string;
    },
  ): Promise<any> {
    // Check if already clocked in
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        organizationId,
        clockOutTime: null,
      },
    });

    if (existingEntry) {
      throw new Error("Worker already clocked in");
    }

    // Create time entry
    const entry = await prisma.timeEntry.create({
      data: {
        organizationId,
        userId,
        clockInTime: new Date(),
        department: data.department,
        station: data.station,
        notes: data.notes,
      },
      include: {
        user: true,
      },
    });

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStatus: "AVAILABLE",
        lastActivityAt: new Date(),
      },
    });

    return entry;
  }

  /**
   * Clock out worker
   */
  async clockOut(
    organizationId: string,
    userId: string,
    data?: {
      breakMinutes?: number;
      notes?: string;
    },
  ): Promise<any> {
    const entry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        organizationId,
        clockOutTime: null,
      },
    });

    if (!entry) {
      throw new Error("No active clock-in found");
    }

    const clockOutTime = new Date();
    const totalMinutes =
      (clockOutTime.getTime() - entry.clockInTime.getTime()) / (1000 * 60);
    const breakMinutes = data?.breakMinutes || 0;
    const totalHours = (totalMinutes - breakMinutes) / 60;

    // Update time entry
    const updatedEntry = await prisma.timeEntry.update({
      where: { id: entry.id },
      data: {
        clockOutTime,
        totalHours,
        breakMinutes,
        notes: data?.notes || entry.notes,
      },
      include: {
        user: true,
      },
    });

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStatus: "OFFLINE",
      },
    });

    return updatedEntry;
  }

  /**
   * Assign task to worker
   */
  async assignTask(
    organizationId: string,
    taskId: string,
    taskType:
      | "PICK"
      | "PACK"
      | "RECEIVE"
      | "PUTAWAY"
      | "COUNT"
      | "QC"
      | "OTHER",
    userId: string,
    priority?: number,
  ): Promise<any> {
    // Get worker
    const worker = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
    });

    if (!worker) {
      throw new Error("Worker not found");
    }

    // Create task assignment
    const assignment = await prisma.taskAssignment.create({
      data: {
        organizationId,
        taskId,
        taskType,
        userId,
        priority: priority || 5,
        assignedAt: new Date(),
        status: "ASSIGNED",
      },
      include: {
        user: true,
      },
    });

    return assignment;
  }

  /**
   * Complete task
   */
  async completeTask(
    taskAssignmentId: string,
    organizationId: string,
    data: {
      unitsProcessed?: number;
      accuracy?: number;
      notes?: string;
    },
  ): Promise<any> {
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        id: taskAssignmentId,
        organizationId,
      },
    });

    if (!assignment) {
      throw new Error("Task assignment not found");
    }

    const completedAt = new Date();
    const duration =
      (completedAt.getTime() - assignment.assignedAt.getTime()) / (1000 * 60);

    return await prisma.taskAssignment.update({
      where: { id: taskAssignmentId },
      data: {
        status: "COMPLETED",
        completedAt,
        duration,
        unitsProcessed: data.unitsProcessed,
        accuracy: data.accuracy,
        notes: data.notes,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Get worker productivity
   */
  async getWorkerProductivity(
    organizationId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ProductivityReport> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Get worker
    const worker = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
    });

    if (!worker) {
      throw new Error("Worker not found");
    }

    // Get time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        organizationId,
        clockInTime: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalHours = timeEntries.reduce(
      (sum, entry) => sum + (entry.totalHours || 0),
      0,
    );

    // Get task assignments
    const tasks = await prisma.taskAssignment.findMany({
      where: {
        userId,
        organizationId,
        assignedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalTasks = tasks.length;
    const tasksCompleted = tasks.filter((t) => t.status === "COMPLETED").length;
    const tasksCancelled = tasks.filter((t) => t.status === "CANCELLED").length;

    const completedTasks = tasks.filter(
      (t) => t.status === "COMPLETED" && t.duration,
    );
    const averageTaskTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0) /
          completedTasks.length
        : 0;

    const totalUnits = completedTasks.reduce(
      (sum, t) => sum + (t.unitsProcessed || 0),
      0,
    );
    const productivity = totalHours > 0 ? totalUnits / totalHours : 0;

    const averageAccuracy =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + (t.accuracy || 100), 0) /
          completedTasks.length
        : 100;

    const efficiency = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

    // Calculate performance score
    const productivityScore = Math.min((productivity / 50) * 40, 40); // Max 40 points
    const accuracyScore = (averageAccuracy / 100) * 30; // Max 30 points
    const efficiencyScore = (efficiency / 100) * 30; // Max 30 points
    const performanceScore =
      productivityScore + accuracyScore + efficiencyScore;

    // Task breakdown
    const taskTypeGroups = tasks.reduce((acc: any, task) => {
      const type = task.taskType || "OTHER";
      if (!acc[type]) {
        acc[type] = { count: 0, totalTime: 0 };
      }
      acc[type].count++;
      acc[type].totalTime += task.duration || 0;
      return acc;
    }, {});

    const taskBreakdown = Object.entries(taskTypeGroups).map(
      ([type, data]: [string, any]) => ({
        taskType: type,
        count: data.count,
        totalTime: data.totalTime,
        avgTime: data.count > 0 ? data.totalTime / data.count : 0,
      }),
    );

    return {
      userId,
      userName: worker.name,
      period: { startDate: start, endDate: end },
      totalHours,
      totalTasks,
      tasksCompleted,
      tasksCancelled,
      averageTaskTime,
      productivity,
      accuracy: averageAccuracy,
      efficiency,
      performanceScore,
      trends: {
        productivityTrend: "STABLE", // Would calculate actual trend
        efficiencyTrend: "STABLE",
      },
      taskBreakdown,
    };
  }

  /**
   * Get labor metrics
   */
  async getLaborMetrics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<LaborMetrics> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Total workers
    const totalWorkers = await prisma.user.count({
      where: {
        organizationId,
        role: { in: ["PICKER", "PACKER", "RECEIVER", "QC", "WAREHOUSE"] },
      },
    });

    // Active workers (clocked in)
    const activeWorkers = await prisma.timeEntry.count({
      where: {
        organizationId,
        clockOutTime: null,
      },
    });

    // Total hours
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        organizationId,
        clockInTime: {
          gte: start,
          lte: end,
        },
      },
      include: {
        user: true,
      },
    });

    const totalHoursWorked = timeEntries.reduce(
      (sum, entry) => sum + (entry.totalHours || 0),
      0,
    );

    // Total tasks
    const tasks = await prisma.taskAssignment.findMany({
      where: {
        organizationId,
        assignedAt: {
          gte: start,
          lte: end,
        },
        status: "COMPLETED",
      },
      include: {
        user: true,
      },
    });

    const totalTasksCompleted = tasks.length;
    const totalUnits = tasks.reduce(
      (sum, t) => sum + (t.unitsProcessed || 0),
      0,
    );
    const averageProductivity =
      totalHoursWorked > 0 ? totalUnits / totalHoursWorked : 0;
    const averageCostPerHour = 25; // Placeholder

    // Top performers
    const workerGroups = tasks.reduce((acc: any, task) => {
      const userId = task.userId;
      if (!acc[userId]) {
        acc[userId] = {
          userName: task.user.name,
          tasks: [],
          hours: 0,
        };
      }
      acc[userId].tasks.push(task);
      return acc;
    }, {});

    const topPerformers = Object.entries(workerGroups)
      .map(([userId, data]: [string, any]) => {
        const userEntries = timeEntries.filter((e) => e.userId === userId);
        const hours = userEntries.reduce(
          (sum, e) => sum + (e.totalHours || 0),
          0,
        );
        const units = data.tasks.reduce(
          (sum: number, t: any) => sum + (t.unitsProcessed || 0),
          0,
        );
        const productivity = hours > 0 ? units / hours : 0;

        const accuracies = data.tasks
          .filter((t: any) => t.accuracy)
          .map((t: any) => t.accuracy);
        const accuracy =
          accuracies.length > 0
            ? accuracies.reduce((sum: number, a: number) => sum + a, 0) /
              accuracies.length
            : 100;

        return {
          userId,
          userName: data.userName,
          totalTasks: data.tasks.length,
          totalHours: hours,
          productivity,
          accuracy,
          efficiency: 85,
        };
      })
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, 10);

    // Department breakdown
    const departmentGroups = timeEntries.reduce((acc: any, entry) => {
      const dept = entry.department || "GENERAL";
      if (!acc[dept]) {
        acc[dept] = { entries: [], tasks: [] };
      }
      acc[dept].entries.push(entry);
      return acc;
    }, {});

    tasks.forEach((task) => {
      const entry = timeEntries.find((e) => e.userId === task.userId);
      const dept = entry?.department || "GENERAL";
      if (departmentGroups[dept]) {
        departmentGroups[dept].tasks.push(task);
      }
    });

    const departmentBreakdown = Object.entries(departmentGroups).map(
      ([dept, data]: [string, any]) => {
        const workers = new Set(data.entries.map((e: any) => e.userId)).size;
        const hours = data.entries.reduce(
          (sum: number, e: any) => sum + (e.totalHours || 0),
          0,
        );
        const taskCount = data.tasks.length;
        const units = data.tasks.reduce(
          (sum: number, t: any) => sum + (t.unitsProcessed || 0),
          0,
        );
        const avgProductivity = hours > 0 ? units / hours : 0;

        return {
          department: dept,
          workerCount: workers,
          totalHours: hours,
          totalTasks: taskCount,
          avgProductivity,
        };
      },
    );

    // Recent activity
    const recentActivity = tasks
      .slice(-10)
      .reverse()
      .map((task) => ({
        userId: task.userId,
        userName: task.user.name,
        taskType: task.taskType || "OTHER",
        completedAt: task.completedAt!,
        duration: task.duration || 0,
        productivity:
          task.duration && task.unitsProcessed
            ? task.unitsProcessed / (task.duration / 60)
            : 0,
      }));

    return {
      totalWorkers,
      activeWorkers,
      totalHoursWorked,
      totalTasksCompleted,
      averageProductivity,
      averageCostPerHour,
      topPerformers,
      departmentBreakdown,
      recentActivity,
    };
  }

  /**
   * Get worker assignment suggestions
   */
  async getWorkerAssignments(
    organizationId: string,
  ): Promise<TaskAssignment[]> {
    // Get all active workers
    const workers = await prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
        role: { in: ["PICKER", "PACKER", "RECEIVER", "QC", "WAREHOUSE"] },
      },
    });

    const assignments: TaskAssignment[] = [];

    for (const worker of workers) {
      // Get current tasks
      const currentTasks = await prisma.taskAssignment.findMany({
        where: {
          userId: worker.id,
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
        orderBy: { priority: "desc" },
      });

      // Calculate workload
      const workload = Math.min(currentTasks.length * 20, 100);

      // Determine availability
      let availability: TaskAssignment["availability"] = "AVAILABLE";
      if (workload >= 80) availability = "OVERLOADED";
      else if (workload >= 40) availability = "BUSY";

      // Check if clocked in
      const clockedIn = await prisma.timeEntry.findFirst({
        where: {
          userId: worker.id,
          clockOutTime: null,
        },
      });

      if (!clockedIn) {
        availability = "OFFLINE";
      }

      assignments.push({
        userId: worker.id,
        userName: worker.name,
        currentTasks: currentTasks.map((t) => ({
          taskId: t.taskId,
          taskType: t.taskType || "OTHER",
          priority: t.priority,
          estimatedTime: 30, // Placeholder
          assignedAt: t.assignedAt,
        })),
        workload,
        availability,
        efficiency: 85,
        suggestedTasks: [], // Would implement task suggestion logic
      });
    }

    return assignments.sort((a, b) => a.workload - b.workload);
  }

  /**
   * Create schedule
   */
  async createSchedule(
    organizationId: string,
    request: ScheduleRequest,
  ): Promise<any> {
    const schedules = [];

    for (const shift of request.shifts) {
      const schedule = await prisma.schedule.create({
        data: {
          organizationId,
          userId: request.userId,
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          breakMinutes: shift.breakMinutes || 0,
          department: shift.department,
        },
        include: {
          user: true,
        },
      });

      schedules.push(schedule);
    }

    return schedules;
  }

  /**
   * Get schedule for worker
   */
  async getWorkerSchedule(
    organizationId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return await prisma.schedule.findMany({
      where: {
        organizationId,
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
      include: {
        user: true,
      },
    });
  }

  /**
   * Get all schedules
   */
  async getAllSchedules(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return await prisma.schedule.findMany({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        user: true,
      },
    });
  }

  /**
   * Calculate labor cost
   */
  async calculateLaborCost(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalHours: number;
    totalCost: number;
    breakdown: Array<{
      userId: string;
      userName: string;
      hours: number;
      hourlyRate: number;
      totalCost: number;
    }>;
  }> {
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        organizationId,
        clockInTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: true,
      },
    });

    const userGroups = timeEntries.reduce((acc: any, entry) => {
      const userId = entry.userId;
      if (!acc[userId]) {
        acc[userId] = {
          userName: entry.user.name,
          entries: [],
        };
      }
      acc[userId].entries.push(entry);
      return acc;
    }, {});

    let totalCost = 0;
    const breakdown = Object.entries(userGroups).map(
      ([userId, data]: [string, any]) => {
        const hours = data.entries.reduce(
          (sum: number, e: any) => sum + (e.totalHours || 0),
          0,
        );
        const hourlyRate = 25; // Would get from user profile
        const cost = hours * hourlyRate;
        totalCost += cost;

        return {
          userId,
          userName: data.userName,
          hours,
          hourlyRate,
          totalCost: cost,
        };
      },
    );

    const totalHours = timeEntries.reduce(
      (sum, e) => sum + (e.totalHours || 0),
      0,
    );

    return {
      totalHours,
      totalCost,
      breakdown,
    };
  }

  /**
   * Optimize task distribution
   */
  async optimizeTaskDistribution(
    organizationId: string,
    tasks: Array<{
      taskId: string;
      taskType: string;
      priority: number;
      estimatedTime: number;
    }>,
  ): Promise<Array<{ userId: string; taskIds: string[] }>> {
    // Get available workers
    const assignments = await this.getWorkerAssignments(organizationId);
    const availableWorkers = assignments
      .filter(
        (a) => a.availability === "AVAILABLE" || a.availability === "BUSY",
      )
      .sort((a, b) => a.workload - b.workload);

    if (availableWorkers.length === 0) {
      throw new Error("No available workers");
    }

    // Distribute tasks evenly
    const distribution: Array<{ userId: string; taskIds: string[] }> =
      availableWorkers.map((worker) => ({
        userId: worker.userId,
        taskIds: [],
      }));

    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    let workerIndex = 0;
    for (const task of sortedTasks) {
      distribution[workerIndex].taskIds.push(task.taskId);
      workerIndex = (workerIndex + 1) % availableWorkers.length;
    }

    return distribution;
  }
}

export default LaborManagementService;
