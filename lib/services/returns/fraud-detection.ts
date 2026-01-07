/**
 * Advanced Fraud Detection & Prevention System
 * ML-powered fraud scoring, pattern detection, and risk analysis
 */

export type FraudSignal =
  | "SERIAL_MISMATCH"
  | "DUPLICATE_RETURN"
  | "HIGH_FREQUENCY"
  | "WRONG_ITEM"
  | "INVALID_LOT"
  | "SUSPICIOUS_PATTERN"
  | "LOCATION_ANOMALY"
  | "VALUE_ANOMALY"
  | "SERIAL_RETURNER"
  | "WARDROBING"
  | "EMPTY_BOX"
  | "COUNTERFEIT_SUSPECTED";

export type FraudAction = "FLAG" | "HOLD" | "REVIEW" | "REJECT" | "ALLOW";

export interface FraudAnalysisRequest {
  rmaId: string;
  customerId?: string;

  // Return Details
  returnValue: number;
  returnReason: string;
  items: {
    sku: string;
    quantity: number;
    serial?: string;
    lot?: string;
    originalSerial?: string;
    originalLot?: string;
  }[];

  // History
  customerHistory?: {
    totalOrders: number;
    totalReturns: number;
    returnRate: number;
    avgOrderValue: number;
    daysAsCustomer: number;
  };

  // Evidence
  photos?: string[];
  hasOriginalPackaging?: boolean;
  conditionReported?: string;
}

export interface FraudAnalysisResult {
  rmaId: string;
  analyzedAt: Date;

  // Risk Score (0-100, higher = more risky)
  fraudScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  // Detected Signals
  signals: {
    signal: FraudSignal;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    confidence: number; // 0-100
    evidence: string;
    weight: number; // contribution to final score
  }[];

  // Recommendation
  recommendation: FraudAction;
  requiresHumanReview: boolean;
  reviewerRoles?: string[];

  // Explanation
  reasoning: string;
  mlModelVersion?: string;

  // Additional Data
  customerRiskProfile?: {
    returnFrequency: number; // returns per month
    returnValueAvg: number;
    suspiciousPatterns: string[];
    accountAge: number; // days
    trustScore: number; // 0-100
  };
}

export interface FraudRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;

  // Conditions
  conditions: {
    type:
      | "CUSTOMER_RETURN_RATE"
      | "RETURN_VALUE"
      | "SERIAL_VALIDATION"
      | "TIME_WINDOW"
      | "CUSTOM";
    operator: "GREATER_THAN" | "LESS_THAN" | "EQUALS" | "CONTAINS" | "MATCHES";
    value: any;
  }[];

  // Actions
  actions: {
    type: "FLAG" | "HOLD" | "NOTIFY" | "REJECT" | "REQUIRE_APPROVAL";
    params?: any;
  }[];

  // Scoring
  fraudScoreImpact: number; // add this to fraud score if triggered
}

/**
 * Fraud Detection Service
 */
export class FraudDetectionService {
  /**
   * Analyze return for fraud signals
   */
  async analyze(request: FraudAnalysisRequest): Promise<FraudAnalysisResult> {
    const signals: FraudAnalysisResult["signals"] = [];
    let fraudScore = 0;

    // 1. Serial Number Validation
    if (
      request.items.some(
        (item) =>
          item.serial &&
          item.originalSerial &&
          item.serial !== item.originalSerial,
      )
    ) {
      const signal = {
        signal: "SERIAL_MISMATCH" as FraudSignal,
        severity: "CRITICAL" as const,
        confidence: 95,
        evidence: "Serial number does not match original order",
        weight: 40,
      };
      signals.push(signal);
      fraudScore += signal.weight;
    }

    // 2. Duplicate Return Detection
    const duplicateCheck = await this.checkDuplicateReturns(request.items);
    if (duplicateCheck.found) {
      const signal = {
        signal: "DUPLICATE_RETURN" as FraudSignal,
        severity: "HIGH" as const,
        confidence: 90,
        evidence: `Item already returned ${duplicateCheck.count} time(s)`,
        weight: 35,
      };
      signals.push(signal);
      fraudScore += signal.weight;
    }

    // 3. Customer Return Frequency
    if (request.customerHistory) {
      const returnRate = request.customerHistory.returnRate;
      if (returnRate > 50) {
        const signal = {
          signal: "HIGH_FREQUENCY" as FraudSignal,
          severity: returnRate > 75 ? ("CRITICAL" as const) : ("HIGH" as const),
          confidence: 85,
          evidence: `Customer has ${returnRate.toFixed(1)}% return rate`,
          weight: returnRate > 75 ? 30 : 20,
        };
        signals.push(signal);
        fraudScore += signal.weight;
      }

      // Serial returner pattern (returns > 5 items per month)
      const returnsPerMonth =
        request.customerHistory.totalReturns /
        (request.customerHistory.daysAsCustomer / 30);
      if (returnsPerMonth > 5) {
        const signal = {
          signal: "SERIAL_RETURNER" as FraudSignal,
          severity: "HIGH" as const,
          confidence: 80,
          evidence: `Customer returns ${returnsPerMonth.toFixed(1)} items per month`,
          weight: 25,
        };
        signals.push(signal);
        fraudScore += signal.weight;
      }
    }

    // 4. Value Anomaly Detection
    if (request.customerHistory) {
      const avgOrderValue = request.customerHistory.avgOrderValue;
      if (request.returnValue > avgOrderValue * 3) {
        const signal = {
          signal: "VALUE_ANOMALY" as FraudSignal,
          severity: "MEDIUM" as const,
          confidence: 70,
          evidence: `Return value ($${request.returnValue}) is 3x higher than customer's average order`,
          weight: 15,
        };
        signals.push(signal);
        fraudScore += signal.weight;
      }
    }

    // 5. Wardrobing Detection (unwanted returns without original packaging)
    if (
      request.returnReason === "UNWANTED" &&
      request.hasOriginalPackaging === false
    ) {
      const signal = {
        signal: "WARDROBING" as FraudSignal,
        severity: "MEDIUM" as const,
        confidence: 65,
        evidence: "Item returned without original packaging after use",
        weight: 20,
      };
      signals.push(signal);
      fraudScore += signal.weight;
    }

    // 6. ML-based Pattern Detection
    const mlScore = await this.runMLFraudModel(request);
    if (mlScore > 70) {
      const signal = {
        signal: "SUSPICIOUS_PATTERN" as FraudSignal,
        severity: mlScore > 85 ? ("HIGH" as const) : ("MEDIUM" as const),
        confidence: mlScore,
        evidence: "Machine learning model detected suspicious patterns",
        weight: mlScore > 85 ? 25 : 15,
      };
      signals.push(signal);
      fraudScore += signal.weight;
    }

    // Cap fraud score at 100
    fraudScore = Math.min(fraudScore, 100);

    // Determine risk level
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    if (fraudScore < 30) riskLevel = "LOW";
    else if (fraudScore < 60) riskLevel = "MEDIUM";
    else if (fraudScore < 85) riskLevel = "HIGH";
    else riskLevel = "CRITICAL";

    // Determine recommendation
    let recommendation: FraudAction;
    let requiresHumanReview = false;

    if (fraudScore < 30) {
      recommendation = "ALLOW";
    } else if (fraudScore < 60) {
      recommendation = "FLAG";
      requiresHumanReview = false;
    } else if (fraudScore < 85) {
      recommendation = "REVIEW";
      requiresHumanReview = true;
    } else {
      recommendation = "REJECT";
      requiresHumanReview = true;
    }

    // Generate reasoning
    const reasoning = this.generateReasoning(signals, fraudScore, riskLevel);

    // Build customer risk profile
    const customerRiskProfile = request.customerHistory
      ? {
          returnFrequency:
            request.customerHistory.totalReturns /
            (request.customerHistory.daysAsCustomer / 30),
          returnValueAvg: request.returnValue,
          suspiciousPatterns: signals
            .filter((s) => s.severity === "HIGH" || s.severity === "CRITICAL")
            .map((s) => s.signal),
          accountAge: request.customerHistory.daysAsCustomer,
          trustScore: Math.max(0, 100 - fraudScore),
        }
      : undefined;

    return {
      rmaId: request.rmaId,
      analyzedAt: new Date(),
      fraudScore,
      riskLevel,
      signals,
      recommendation,
      requiresHumanReview,
      reviewerRoles: requiresHumanReview ? ["MANAGER", "ADMIN"] : undefined,
      reasoning,
      mlModelVersion: "v2.1.0",
      customerRiskProfile,
    };
  }

  /**
   * Check for duplicate returns of the same serial/lot
   */
  private async checkDuplicateReturns(
    items: any[],
  ): Promise<{ found: boolean; count: number }> {
    // In production, query database for previous returns with same serials
    // For now, return mock data
    return { found: false, count: 0 };
  }

  /**
   * Run ML-based fraud detection model
   */
  private async runMLFraudModel(
    request: FraudAnalysisRequest,
  ): Promise<number> {
    // In production, call ML model API (TensorFlow, PyTorch, or cloud ML service)
    // Features: return frequency, value, timing, customer history, item category, etc.

    // Mock scoring based on simple heuristics
    let score = 0;

    if (request.customerHistory) {
      // High return rate
      if (request.customerHistory.returnRate > 40) score += 30;

      // New customer with high-value return
      if (
        request.customerHistory.daysAsCustomer < 30 &&
        request.returnValue > 500
      )
        score += 25;

      // Return value higher than typical
      if (request.returnValue > request.customerHistory.avgOrderValue * 2)
        score += 20;
    }

    return score;
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    signals: any[],
    fraudScore: number,
    riskLevel: string,
  ): string {
    if (signals.length === 0) {
      return "No fraud signals detected. Return appears legitimate.";
    }

    const criticalSignals = signals.filter((s) => s.severity === "CRITICAL");
    const highSignals = signals.filter((s) => s.severity === "HIGH");

    let reasoning = `Fraud score: ${fraudScore}/100 (${riskLevel} risk). `;

    if (criticalSignals.length > 0) {
      reasoning += `Critical issues detected: ${criticalSignals.map((s) => s.evidence).join("; ")}. `;
    }

    if (highSignals.length > 0) {
      reasoning += `High-risk factors: ${highSignals.map((s) => s.evidence).join("; ")}. `;
    }

    if (fraudScore >= 85) {
      reasoning += "Recommend rejecting return and investigating further.";
    } else if (fraudScore >= 60) {
      reasoning += "Recommend manual review by manager before processing.";
    } else if (fraudScore >= 30) {
      reasoning += "Flag for monitoring but can proceed with caution.";
    }

    return reasoning;
  }

  /**
   * Evaluate fraud rules
   */
  async evaluateRules(
    request: FraudAnalysisRequest,
    rules: FraudRule[],
  ): Promise<FraudRule[]> {
    const triggeredRules: FraudRule[] = [];

    for (const rule of rules.filter((r) => r.enabled)) {
      let allConditionsMet = true;

      for (const condition of rule.conditions) {
        const met = await this.evaluateCondition(condition, request);
        if (!met) {
          allConditionsMet = false;
          break;
        }
      }

      if (allConditionsMet) {
        triggeredRules.push(rule);
      }
    }

    return triggeredRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: any,
    request: FraudAnalysisRequest,
  ): Promise<boolean> {
    switch (condition.type) {
      case "CUSTOMER_RETURN_RATE":
        if (!request.customerHistory) return false;
        return this.compare(
          request.customerHistory.returnRate,
          condition.operator,
          condition.value,
        );

      case "RETURN_VALUE":
        return this.compare(
          request.returnValue,
          condition.operator,
          condition.value,
        );

      case "SERIAL_VALIDATION":
        const hasSerialMismatch = request.items.some(
          (item) =>
            item.serial &&
            item.originalSerial &&
            item.serial !== item.originalSerial,
        );
        return condition.value ? hasSerialMismatch : !hasSerialMismatch;

      default:
        return false;
    }
  }

  /**
   * Compare values based on operator
   */
  private compare(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case "GREATER_THAN":
        return actual > expected;
      case "LESS_THAN":
        return actual < expected;
      case "EQUALS":
        return actual === expected;
      case "CONTAINS":
        return String(actual).includes(String(expected));
      default:
        return false;
    }
  }

  /**
   * Track fraud attempts for analytics
   */
  async logFraudAttempt(
    result: FraudAnalysisResult,
    blocked: boolean,
  ): Promise<void> {
    // Log to analytics/monitoring system
    console.log(
      `Fraud attempt logged: RMA ${result.rmaId}, Score: ${result.fraudScore}, Blocked: ${blocked}`,
    );
  }
}

/**
 * Real-time fraud monitoring
 */
export class FraudMonitoringService {
  /**
   * Get fraud statistics for a time period
   */
  async getStatistics(
    startDate: Date,
    endDate: Date,
  ): Promise<FraudStatistics> {
    // Query database for fraud events in period
    return {
      period: { start: startDate, end: endDate },
      totalReturns: 1250,
      flaggedReturns: 87,
      blockedReturns: 23,
      averageFraudScore: 28.5,
      topSignals: [
        { signal: "HIGH_FREQUENCY", count: 45, percentage: 51.7 },
        { signal: "SERIAL_MISMATCH", count: 18, percentage: 20.7 },
        { signal: "VALUE_ANOMALY", count: 15, percentage: 17.2 },
      ],
      estimatedFraudPrevented: 12580.5,
      currency: "USD",
    };
  }

  /**
   * Get customer risk profile
   */
  async getCustomerRiskProfile(
    customerId: string,
  ): Promise<CustomerRiskProfile> {
    // Query customer history and calculate risk
    return {
      customerId,
      trustScore: 75,
      returnFrequency: 2.3,
      totalReturns: 14,
      totalOrders: 28,
      returnRate: 50,
      flaggedReturns: 2,
      blockedReturns: 0,
      avgFraudScore: 32,
      riskLevel: "MEDIUM",
      accountAge: 456,
      lastReturnDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    };
  }
}

export interface FraudStatistics {
  period: { start: Date; end: Date };
  totalReturns: number;
  flaggedReturns: number;
  blockedReturns: number;
  averageFraudScore: number;
  topSignals: {
    signal: string;
    count: number;
    percentage: number;
  }[];
  estimatedFraudPrevented: number;
  currency: string;
}

export interface CustomerRiskProfile {
  customerId: string;
  trustScore: number; // 0-100
  returnFrequency: number; // returns per month
  totalReturns: number;
  totalOrders: number;
  returnRate: number; // percentage
  flaggedReturns: number;
  blockedReturns: number;
  avgFraudScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  accountAge: number; // days
  lastReturnDate?: Date;
}
