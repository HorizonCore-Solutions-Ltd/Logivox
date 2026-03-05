
import { type ActionCategory, type CognitiveGoalType } from "@prisma/client";

export interface DecisionContext {
  organizationId: string;
  warehouseId?: string;
  triggerEvent: string;
  metadata?: Record<string, any>;
}

export interface PredictedOutcome {
  metric: string;
  value: number;
  confidence: number;
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
}

export interface ProposedAction {
  category: ActionCategory;
  actionType: string;
  parameters: Record<string, any>; // e.g., { carrierId: "UPS", serviceType: "Ground" }
  reasoning: string;
  predictedOutcomes: PredictedOutcome[];
  confidence: number;
  estimatedCost: number;
  estimatedTimeRaw: number; // minutes
}

export interface GovernorInterface {
  evaluate(context: DecisionContext): Promise<ProposedAction[]>;
  execute(action: ProposedAction): Promise<boolean>;
}
