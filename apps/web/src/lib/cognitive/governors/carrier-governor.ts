
import { prisma } from "@/lib/prisma";
import type { DecisionContext, GovernorInterface, ProposedAction } from "../types";

export const CarrierGovernor: GovernorInterface = {

  /**
   * Selects optimal carrier based on "Cost vs Speed" goal.
   * Simulates a "Rate Shop" against predicted SLA performance.
   */
  async evaluate(context: DecisionContext): Promise<ProposedAction[]> {
    if (context.triggerEvent !== "ORDER_PLACED" || !context.metadata?.orderId) return [];

    const orderId = context.metadata.orderId;
    
    // 1. Simulate Rate Shopping
    const carriers = [
      { name: "FedEx", service: "Express", cost: 25, sla: 99, time: 24 * 60 },
      { name: "UPS", service: "Ground", cost: 12, sla: 95, time: 72 * 60 },
      { name: "USPS", service: "Priority", cost: 8, sla: 90, time: 96 * 60 }
    ];

    // 2. Apply Policy (e.g. "Minimize Cost" vs "Maximize Speed")
    // Retrieve active policy for this org
    const activePolicy = await prisma.cognitivePolicy.findFirst({
        where: { organizationId: context.organizationId, isActive: true }
    });
    
    const goal = activePolicy?.goalType || "BALANCE_ALL";

    let bestOption = carriers[1]; // Default to middle ground

    if (goal === "MINIMIZE_COST") {
        bestOption = carriers.sort((a,b) => a.cost - b.cost)[0];
    } else if (goal === "MAXIMIZE_SPEED") {
        bestOption = carriers.sort((a,b) => a.time - b.time)[0];
    }

    return [{
      category: "CARRIER_SELECTION",
      actionType: "ASSIGN_CARRIER",
      parameters: { orderId, carrier: bestOption.name, service: bestOption.service },
      reasoning: `Selected ${bestOption.name} based on goal ${goal}. Cost: $${bestOption.cost}, Time: ${bestOption.time/60}h`,
      predictedOutcomes: [
        { metric: "DELIVERY_TIME", value: bestOption.time, confidence: 0.95, impact: "POSITIVE" },
        { metric: "SHIPPING_COST", value: bestOption.cost, confidence: 1.0, impact: goal === "MINIMIZE_COST" ? "POSITIVE" : "NEGATIVE" }
      ],
      confidence: 0.98,
      estimatedCost: bestOption.cost,
      estimatedTimeRaw: bestOption.time
    }];
  },

  async execute(action: ProposedAction): Promise<boolean> {
    console.log(`[CarrierGovernor] Assigning Carrier: ${action.parameters.carrier}`);
    // Update Order with Carrier Metadata
    // await prisma.salesOrder.update(...)
    return true;
  }
};
