
import { apiClient } from "./client";

export interface DecisionPayload {
  organizationId: string;
  warehouseId?: string;
  event: string; // e.g., 'ORDER_PLACED', 'SHIFT_START'
  metadata?: Record<string, any>;
}

export interface SimulationPayload {
  organizationId: string;
  scenarioType: string; // e.g., 'LABOR_STRESS_TEST'
  parameters?: Record<string, any>;
}

export const cognitiveApi = {
  /**
   * Trigger the Autonomous Decision Engine cycle manually.
   * Use for testing or forcing an evaluation.
   */
  triggerDecisionCycle: async (payload: DecisionPayload) => {
    const { data } = await apiClient.post("/api/cognitive/decision-cycle", payload);
    return data;
  },

  /**
   * Run a digital twin simulation for a specific scenario.
   */
  runSimulation: async (payload: SimulationPayload) => {
    const { data } = await apiClient.post("/api/simulation/run", payload);
    return data;
  },
};
