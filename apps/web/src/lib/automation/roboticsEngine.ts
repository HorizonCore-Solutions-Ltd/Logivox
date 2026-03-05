import { prisma } from "@/lib/prisma";
import type { Robot, RobotTask, RobotType, RobotStatus, RobotTaskStatus, RobotTaskType } from "@prisma/client";

// Digital Twin State (In-Memory for low latency, mirrored to DB)
interface RobotState {
  id: string;
  location: { x: number; y: number; z: number; zone?: string };
  battery: number;
  status: RobotStatus;
  lastSeen: number;
  currentTaskId?: string;
}

const activeFleet = new Map<string, RobotState>();

/**
 * Register or update a robot's connection.
 * Called by the Robot or Vendor API on startup/heartbeat.
 */
export async function registerRobot(
  id: string, 
  orgId: string, 
  warehouseId: string,
  type: RobotType,
  name?: string
): Promise<Robot> {
  // Upsert into DB
  const robot = await prisma.robot.upsert({
    where: { id },
    update: { 
      lastSeen: new Date(), 
      status: "IDLE" 
    },
    create: {
      id,
      organizationId: orgId,
      warehouseId,
      name: name || `Robot-${id.slice(-4)}`,
      type,
      status: "IDLE",
    }
  });

  // Init in-memory state
  activeFleet.set(id, {
    id,
    location: { x:0, y:0, z:0 },
    battery: 100,
    status: "IDLE",
    lastSeen: Date.now()
  });

  return robot;
}

/**
 * Ingest high-frequency telemetry from a robot.
 */
export async function updateTelemetry(
  robotId: string, 
  telemetry: { x: number; y: number; battery: number; status: RobotStatus }
) {
  const state = activeFleet.get(robotId);
  if (state) {
    state.location = { x: telemetry.x, y: telemetry.y, z: 0 };
    state.battery = telemetry.battery;
    state.status = telemetry.status;
    state.lastSeen = Date.now();
  }

  // Persist significant changes or periodically to DB (optimization: debounce this in real prod)
  await prisma.robot.update({
    where: { id: robotId },
    data: {
      location: `${telemetry.x},${telemetry.y}`,
      batteryLevel: telemetry.battery,
      status: telemetry.status,
      lastSeen: new Date()
    }
  });
}

/**
 * "The Brain": Assigns pending tasks to available robots.
 * Logic: Distance + Battery + Capability
 */
export async function processPendingTasks(warehouseId: string) {
  // 1. Get PENDING tasks
  const pendingTasks = await prisma.robotTask.findMany({
    where: { warehouseId, status: "PENDING" },
    orderBy: { priority: "desc" },
    take: 10
  });

  if (pendingTasks.length === 0) return;

  // 2. Get AVAILABLE robots from DB (synced from telemetry)
  const availableRobots = await prisma.robot.findMany({
    where: { warehouseId, status: "IDLE", batteryLevel: { gt: 20 } }
  });

  for (const task of pendingTasks) {
    if (availableRobots.length === 0) break;

    // SCORING: Find best robot
    const bestRobot = findBestRobot(task, availableRobots);

    if (bestRobot) {
      await assignTask(bestRobot.id, task.id);
      // Remove from available pool for this iteration
      const index = availableRobots.findIndex(r => r.id === bestRobot.id);
      if (index > -1) availableRobots.splice(index, 1);
    }
  }
}

/**
 * Score robots based on Type Compatibility, Distance, and Battery.
 */
function findBestRobot(task: RobotTask, candidates: Robot[]): Robot | null {
  // Filter by capabilities (Example: AMRs for Pallets, Drones for Counting)
  let eligible = candidates;
  
  if (task.type === "MOVE_PALLET") {
     eligible = candidates.filter(r => r.type === "AMR" || r.type === "AGV");
  } else if (task.type === "CYCLE_COUNT") {
     eligible = candidates.filter(r => r.type === "DRONE" || r.type === "AMR");
  }

  if (eligible.length === 0) return null;

  // If task has source location (format "x,y"), sort by distance
  if (task.sourceLocation && task.sourceLocation.includes(",")) {
    const [tx, ty] = task.sourceLocation.split(",").map(Number);
    eligible.sort((a, b) => {
        const distA = getDistance(a.location, tx, ty);
        const distB = getDistance(b.location, tx, ty);
        return distA - distB;
    });
  }

  // Pick the closest
  return eligible[0];
}

function getDistance(locString: string | null, tx: number, ty: number): number {
    if (!locString) return 9999;
    try {
        const parts = locString.split(",");
        if (parts.length < 2) return 9999;
        const rx = Number(parts[0]);
        const ry = Number(parts[1]);
        
        if (isNaN(rx) || isNaN(ry)) return 9999;
        return Math.sqrt(Math.pow(tx - rx, 2) + Math.pow(ty - ry, 2));
    } catch {
        return 9999;
    }
}

async function assignTask(robotId: string, taskId: string) {
  // 1. Update Task
  await prisma.robotTask.update({
    where: { id: taskId },
    data: { 
      status: "ASSIGNED", 
      robotId: robotId,
      startedAt: new Date() 
    }
  });

  // 2. Update Robot Status in DB
  await prisma.robot.update({
    where: { id: robotId },
    data: { status: "WORKING" }
  });

  // 3. Update Memory State
  const state = activeFleet.get(robotId);
  if (state) {
    state.status = "WORKING";
    state.currentTaskId = taskId;
  }

  console.log(`[Orchestrator] Assigned Task ${taskId} to Robot ${robotId}`);
}

/**
 * Validates task completion and releases robot.
 */
export async function completeTask(taskId: string, success: boolean, notes?: string) {
    const task = await prisma.robotTask.findUnique({ where: { id: taskId } });
    if (!task || !task.robotId) return;

    // Update Task
    await prisma.robotTask.update({
        where: { id: taskId },
        data: {
            status: success ? "COMPLETED" : "FAILED",
            completedAt: new Date(),
            errorMessage: notes
        }
    });

    // Release Robot
    await prisma.robot.update({
        where: { id: task.robotId },
        data: { status: "IDLE" } // Should create logic to go to charging if battery low
    });

    // Update Memory
    const state = activeFleet.get(task.robotId);
    if (state) {
        state.status = "IDLE";
        state.currentTaskId = undefined;
    }
    
    // If this was a Picking Task, verify collaborative updates??
}

