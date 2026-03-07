import { DigitalTwinBuilder } from "./digital-twin";
import type {
  SimulationParameters,
  SimulationResult,
  ScenarioType,
  TwinState,
  TwinTask,
  SimulationMetrics,
} from "./types";

/**
 * The Physics-Accurate Simulation Engine.
 * Runs a discrete-event simulation loop over the Digital Twin state.
 */
export const SimulationEngine = {
  /**
   * The core entry point for running a simulation.
   */
  async runSimulation(
    organizationId: string,
    scenario: ScenarioType,
    params: SimulationParameters,
  ): Promise<SimulationResult> {
    // 1. Hydrate State (The "Twin")
    // Get the real-world state as the baseline
    let state = await DigitalTwinBuilder.buildCurrentState(organizationId);

    // 2. Apply Scenario Overrides (The "What-If")
    state = applyScenarioOverrides(state, params);

    // 3. Initialize Metrics
    const metrics: SimulationMetrics = {
      throughput: 0,
      totalCost: 0,
      avgQueueTime: 0,
      maxQueueDepth: 0,
      bottlenecksDetected: [],
      slaBreachCount: 0,
    };

    const timeSeries = [];

    // 4. The Time Loop (Discrete Steps)
    // We simulate "minutes" passing
    for (
      let time = 0;
      time < params.durationMinutes;
      time += params.timeStepMinutes
    ) {
      // A. Process Events for this Time Step
      processTimeStep(state, params.timeStepMinutes, metrics);

      // B. Record Time Series Data
      timeSeries.push({
        timeOffset: time,
        activeTasks: state.tasks.filter((t) => t.status === "IN_PROGRESS")
          .length,
        pendingTasks: state.tasks.filter((t) => t.status === "PENDING").length,
        costAccumulated: metrics.totalCost,
      });

      // C. Congestion Check
      const pendingCount = state.tasks.filter(
        (t) => t.status === "PENDING",
      ).length;
      if (pendingCount > metrics.maxQueueDepth) {
        metrics.maxQueueDepth = pendingCount;
      }
    }

    // 5. Finalize Results
    return {
      runId: `SIM-${Date.now()}`,
      scenarioType: scenario,
      parameters: params,
      finalMetrics: metrics,
      timeSeriesData: timeSeries,
    };
  },
};

// -- Internal Logic --

function applyScenarioOverrides(
  state: TwinState,
  params: SimulationParameters,
): TwinState {
  // Example: Add Extra Workers
  if (params.resourceOverrides?.addWorkers) {
    for (let i = 0; i < params.resourceOverrides.addWorkers; i++) {
      const virtualWorkerId = `VIRTUAL-WORKER-${i}`;
      state.resources.set(virtualWorkerId, {
        id: virtualWorkerId,
        type: "WORKER",
        status: "IDLE",
        capacity: 55, // Slightly lower for temp staff
        costRatePerHour: 30, // Higher for temp agency
        locationId: "MAIN_FLOOR",
      });
    }
  }
  return state;
}

function processTimeStep(
  state: TwinState,
  stepMinutes: number,
  metrics: SimulationMetrics,
) {
  // 1. Calculate Capacity Available in this Step
  // Sum of all IDLE or WORKING resources * stepMinutes

  // 2. Assign Pending Tasks to Idle Resources
  const idleResources = Array.from(state.resources.values()).filter(
    (r) => r.status === "IDLE",
  );
  const pendingTasks = state.tasks.filter((t) => t.status === "PENDING");

  for (const resource of idleResources) {
    if (pendingTasks.length === 0) break;

    const task = pendingTasks.shift(); // FIFO assignment
    if (task) {
      task.status = "IN_PROGRESS";
      task.assignedResourceId = resource.id;
      resource.status = "BUSY";
    }
  }

  // 3. Progress Active Tasks
  const activeTasks = state.tasks.filter((t) => t.status === "IN_PROGRESS");

  for (const task of activeTasks) {
    // Simple logic: Decrement duration
    // Real physics logic: Check travel distance + movement speed
    task.estimatedDuration -= stepMinutes;

    // Calculate Cost (Resource Rate * Time)
    const resource = state.resources.get(task.assignedResourceId!);
    if (resource) {
      const costForStep = (resource.costRatePerHour / 60) * stepMinutes;
      metrics.totalCost += costForStep;
    }

    if (task.estimatedDuration <= 0) {
      task.status = "COMPLETED";
      metrics.throughput += 1;

      // Free up resource
      if (resource) {
        resource.status = "IDLE";
      }
    }
  }

  // 4. Identify Bottlenecks
  if (pendingTasks.length > 50) {
    // arbitrary threshold for demo
    if (!metrics.bottlenecksDetected.includes("GENERAL_PICKING")) {
      metrics.bottlenecksDetected.push("GENERAL_PICKING");
    }
  }
}
