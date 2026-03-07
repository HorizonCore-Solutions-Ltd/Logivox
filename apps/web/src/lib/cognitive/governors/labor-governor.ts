import { prisma } from "@/lib/prisma";
import type {
  DecisionContext,
  GovernorInterface,
  ProposedAction,
} from "../types";

export const LaborGovernor: GovernorInterface = {
  /**
   * Evaluates labor needs based on pending tasks vs. available workforce.
   * Uses simple predictive logic: (Tasks / AvgRate) vs (ActiveWorkers * ShiftRemaining).
   */
  async evaluate(context: DecisionContext): Promise<ProposedAction[]> {
    if (!context.warehouseId) return [];

    // 1. Get Pending Tasks (Demand)
    const pendingTasks = await prisma.pickingTask.count({
      where: {
        warehouseId: context.warehouseId,
        status: "PENDING",
      },
    });

    // 2. Get Active Workers (Supply)
    // Assuming simple active status check
    const activeWorkers = await prisma.user.count({
      where: {
        isActive: true,
        // Role check would go here in real app
      },
    });

    const laborRatePerHour = 50; // Picks per hour per person (Simulated)
    const requiredHours = pendingTasks / laborRatePerHour;
    const availableCapacity = activeWorkers * 8; // Assuming 8h shift

    if (requiredHours > availableCapacity) {
      // Overtime Needed
      return [
        {
          category: "LABOR_ALLOCATION",
          actionType: "REQUEST_OVERTIME",
          parameters: {
            warehouseId: context.warehouseId,
            hoursNeeded: requiredHours - availableCapacity,
          },
          reasoning: `Predicted capacity shortfall: ${requiredHours.toFixed(1)}h needed vs ${availableCapacity}h avail.`,
          predictedOutcomes: [
            {
              metric: "SLA_BREACH_PROBABILITY",
              value: 0.1,
              confidence: 0.9,
              impact: "POSITIVE",
            }, // Reduced probability
            {
              metric: "COST_IMP",
              value: (requiredHours - availableCapacity) * 30,
              confidence: 1.0,
              impact: "NEGATIVE",
            }, // Cost increase
          ],
          confidence: 0.95,
          estimatedCost: (requiredHours - availableCapacity) * 30, // $30/hr cost
          estimatedTimeRaw: 0,
        },
      ];
    } else if (availableCapacity > requiredHours * 1.5) {
      // Too much labor -> Suggest early dismissal or training
      return [
        {
          category: "LABOR_ALLOCATION",
          actionType: "OPTIMIZE_DOWNTIME",
          parameters: {
            warehouseId: context.warehouseId,
            excessHours: availableCapacity - requiredHours,
          },
          reasoning:
            "Excess capacity detected. Reallocating to cycle counting or training.",
          predictedOutcomes: [
            {
              metric: "EFFICIENCY",
              value: 15,
              confidence: 0.8,
              impact: "POSITIVE",
            },
          ],
          confidence: 0.85,
          estimatedCost: 0,
          estimatedTimeRaw: 0,
        },
      ];
    }

    return [];
  },

  async execute(action: ProposedAction): Promise<boolean> {
    console.log(
      `[LaborGovernor] Executing: ${action.actionType}`,
      action.parameters,
    );
    // In a real system, this would trigger PagerDuty, SMS, or create a 'Shift' record.
    return true;
  },
};
