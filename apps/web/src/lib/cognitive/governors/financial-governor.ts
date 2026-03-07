import { prisma } from "@/lib/prisma";
import type {
  DecisionContext,
  GovernorInterface,
  ProposedAction,
} from "../types";

export const FinancialGovernor: GovernorInterface = {
  /**
   * Enterprise Financial Risk & Margin Protection.
   * Evaluates proposed actions (like expensive carriers or OT) against profit margins.
   * Vetoes actions that would cause a loss.
   */
  async evaluate(context: DecisionContext): Promise<ProposedAction[]> {
    // This governor typically REACTS to other proposals or runs a standalone Profit Check
    if (context.triggerEvent !== "PROFITABILITY_CHECK") return [];

    // 1. Get Projected Order P&L
    const orderId = context.metadata?.orderId;
    if (!orderId) return [];

    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { items: { include: { inventoryItem: true } } },
    });

    if (!order) return [];

    // Calculate COGS
    let totalCOGS = 0;
    order.items.forEach((item) => {
      totalCOGS += (Number(item.inventoryItem?.costPrice) || 0) * item.quantity;
    });

    // Calculate Revenue
    const revenue = Number(order.totalAmount); // Assuming this is price charged to customer

    // Estimated Fulfilment Cost (Pick + Pack + Ship)
    // In a real system, this comes from Activity Based Costing module
    const estShipping = 15; // Placeholder
    const estLabor = 5;

    const predictedMargin = revenue - totalCOGS - estShipping - estLabor;
    const marginPercent = (predictedMargin / revenue) * 100;

    // Enterprise Rule: No orders below 10% margin unless overriding contract exists
    if (marginPercent < 10) {
      return [
        {
          category: "BILLING_ADJUSTMENT",
          actionType: "FLAG_RISK_ORDER",
          parameters: { orderId, marginPercent, predictedMargin },
          reasoning: `Predicted Margin ${marginPercent.toFixed(1)}% is below 10% threshold. Revenue: ${revenue}, COGS: ${totalCOGS}. Action Required.`,
          predictedOutcomes: [
            {
              metric: "FINANCIAL_RISK",
              value: 100,
              confidence: 1.0,
              impact: "NEGATIVE",
            },
          ],
          confidence: 0.99,
          estimatedCost: 0,
          estimatedTimeRaw: 0,
        },
      ];
    }

    return [];
  },

  async execute(action: ProposedAction): Promise<boolean> {
    console.log(
      `[FinancialGovernor] Executing Risk Action: ${action.actionType}`,
    );

    if (action.actionType === "FLAG_RISK_ORDER") {
      // Enterprise: Update Order Status to 'ON_HOLD_FINANCE'
      await prisma.salesOrder.update({
        where: { id: action.parameters.orderId },
        data: {
          status: "ON_HOLD",
          notes: `Autonomously held by Financial Governor. Reason: ${action.reasoning}`,
        },
      });
      return true;
    }
    return false;
  },
};
