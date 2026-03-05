
import { type ActionCategory } from "@prisma/client";

// -- Core State Entities --

export interface TwinResource {
    id: string;
    type: "WORKER" | "ROBOT" | "DOCK" | "CONVEYOR";
    status: "IDLE" | "BUSY" | "DOWN";
    capacity: number; // e.g., throughput per hour
    costRatePerHour: number;
    locationId: string;
}

export interface TwinTask {
    id: string;
    type: "PICK" | "PACK" | "LOAD" | "REPLENISH";
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    priority: number;
    estimatedDuration: number; // minutes
    assignedResourceId?: string;
    requiredSkill?: string;
}

export interface TwinState {
    timestamp: Date;
    resources: Map<string, TwinResource>;
    tasks: TwinTask[];
    inventorySnapshot: Record<string, number>; // SKU -> Qty
    activeCongestionZones: string[]; // List of Location IDs
}

// -- Simulation Configuration --

export type ScenarioType = 
    | "BASELINE" 
    | "LABOR_SPIKE" 
    | "CARRIER_DELAY" 
    | "DEMAND_SURGE" 
    | "EQUIPMENT_FAILURE";

export interface SimulationParameters {
    durationMinutes: number;
    timeStepMinutes: number; // Granularity (e.g., 5 min)
    resourceOverrides?: {
        addWorkers?: number;
        removeDocks?: number;
    };
    demandMultiplier?: number; // e.g., 1.5x normal volume
}

export interface SimulationMetrics {
    throughput: number; // Total tasks completed
    totalCost: number;
    avgQueueTime: number;
    maxQueueDepth: number;
    bottlenecksDetected: string[]; // Resource IDs
    slaBreachCount: number;
}

export interface SimulationResult {
    runId: string;
    scenarioType: ScenarioType;
    parameters: SimulationParameters;
    finalMetrics: SimulationMetrics;
    timeSeriesData: {
        timeOffset: number;
        activeTasks: number;
        costAccumulated: number;
    }[];
}
