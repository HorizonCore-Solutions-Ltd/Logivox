import { prisma } from "@/lib/prisma";
import { LaborGovernor } from "./governors/labor-governor";
import { CarrierGovernor } from "./governors/carrier-governor";
import { InventoryGovernor } from "./governors/inventory-governor";
import { FinancialGovernor } from "./governors/financial-governor";
import { NetworkLoadBalancer } from "./governors/network-load-balancer";
import { SimulationService } from "../simulation/simulation-service";
import type { DecisionContext, ProposedAction } from "./types";
import { ActionCategory } from "@prisma/client";

export const CognitiveEngine = {
  /**
   * Main entry point for the "Brain".
   * Ingests context, delegates to governors, logs decisions, and executes.
   */
  async runDecisionCycle(context: DecisionContext) {
    console.log(
      `[CognitiveEngine] Starting cycle for event: ${context.triggerEvent}`,
    );

    // OPTIONAL: Run a Pre-Decision Simulation to set context
    // const simResult = await SimulationService.runSimulation("NETWORK_HEALTH", {});

    // 1. Delegate to Governors
    // In a real system, this would be dynamic/plugin based
    const proposals: ProposedAction[] = [];

    // Evaluate all domains (or filter based on event)
    const laborProposals = await LaborGovernor.evaluate(context);
    const carrierProposals = await CarrierGovernor.evaluate(context);
    const inventoryProposals = await InventoryGovernor.evaluate(context);
    const financeProposals = await FinancialGovernor.evaluate(context);
    const networkProposals = await NetworkLoadBalancer.evaluate(context);

    proposals.push(
      ...laborProposals,
      ...carrierProposals,
      ...inventoryProposals,
      ...financeProposals,
      ...networkProposals,
    );

    // 2. Arbitration / Optimization
    // If multiple actions conflict, choose the best one based on Policy Goals
    // For now, we accept all high-confidence proposals
    const acceptedActions = proposals.filter((p) => p.confidence > 0.7);

    // 3. Execution & Logging
    const results = [];
    for (const action of acceptedActions) {
      // A. Log the Decision (The "Thought Process")
      const logEntry = await prisma.decisionLog.create({
        data: {
          organizationId: context.organizationId,
          timestamp: new Date(),
          triggerEvent: context.triggerEvent,
          category: action.category,
          description: `Executed: ${action.actionType}`,
          aiReasoning: action.reasoning, // The "Brain's" explanation
          confidenceScore: action.confidence,
          status: "EXECUTED",
          actionTaken: action.parameters,
          outcomeMetric: { outcomes: action.predictedOutcomes },
        },
      });

      // B. Execute the Action (The "Hands")
      let success = false;
      switch (action.category) {
        case "LABOR_ALLOCATION":
          success = await LaborGovernor.execute(action);
          break;
        case "CARRIER_SELECTION":
          success = await CarrierGovernor.execute(action);
          break;
        case "INVENTORY_ROUTING":
          success = await InventoryGovernor.execute(action);
          break;
        default:
          console.warn("Unknown action category:", action.category);
      }

      results.push({ id: logEntry.id, success, action });
    }

    return {
      cycleId: `CYCLE-${Date.now()}`,
      decisionsMade: results.length,
      details: results,
    };
  },
};
