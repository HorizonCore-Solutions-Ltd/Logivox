/**
 * AI-Powered Customer Behavior Analytics
 * Predictive analytics, churn prediction, and customer insights
 */

export interface CustomerBehavior {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseDate: Date;
  daysSinceLastPurchase: number;
  purchaseFrequency: number; // purchases per month
  categoryPreferences: Array<{ category: string; percentage: number }>;
  riskScore: number; // 0-1, higher = more at risk
  segment: "VIP" | "Loyal" | "Regular" | "At-Risk" | "Churned";
}

export interface PurchasePattern {
  pattern: "increasing" | "decreasing" | "stable" | "seasonal";
  trend: number;
  seasonality: boolean;
  nextPurchaseDate?: Date;
  confidence: number;
}

export interface ChurnPrediction {
  customerId: string;
  churnProbability: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  reasons: string[];
  recommendations: string[];
}

export interface CustomerSegment {
  segment: string;
  count: number;
  totalRevenue: number;
  averageValue: number;
  characteristics: string[];
}

/**
 * Calculate RFM (Recency, Frequency, Monetary) scores
 */
export function calculateRFM(
  customerId: string,
  purchases: Array<{ date: Date; amount: number }>,
  referenceDate: Date = new Date()
): { recency: number; frequency: number; monetary: number } {
  if (purchases.length === 0) {
    return { recency: 0, frequency: 0, monetary: 0 };
  }

  // Recency: days since last purchase
  const lastPurchase = purchases.reduce((latest, p) =>
    p.date > latest ? p.date : latest,
    purchases[0]?.date ?? new Date()
  );
  const recencyDays = Math.floor(
    (referenceDate.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Frequency: number of purchases
  const frequency = purchases.length;

  // Monetary: total amount spent
  const monetary = purchases.reduce((sum, p) => sum + p.amount, 0);

  return { recency: recencyDays, frequency, monetary };
}

/**
 * Segment customers based on RFM scores
 */
export function segmentCustomer(
  rfm: { recency: number; frequency: number; monetary: number }
): "VIP" | "Loyal" | "Regular" | "At-Risk" | "Churned" {
  const { recency, frequency, monetary } = rfm;

  // VIP: Recent, frequent, high-value customers
  if (recency <= 30 && frequency >= 10 && monetary >= 5000) {
    return "VIP";
  }

  // Loyal: Regular purchasers with good frequency
  if (recency <= 60 && frequency >= 5 && monetary >= 1000) {
    return "Loyal";
  }

  // Regular: Active customers
  if (recency <= 90 && frequency >= 2) {
    return "Regular";
  }

  // At-Risk: Haven't purchased recently but have history
  if (recency <= 180 && frequency >= 2) {
    return "At-Risk";
  }

  // Churned: Inactive for a long time
  return "Churned";
}

/**
 * Predict customer churn probability
 */
export function predictChurn(
  customerBehavior: CustomerBehavior
): ChurnPrediction {
  let churnProbability = 0;
  const reasons: string[] = [];

  // Factor 1: Days since last purchase (40% weight)
  const recencyScore = Math.min(customerBehavior.daysSinceLastPurchase / 180, 1);
  churnProbability += recencyScore * 0.4;
  if (customerBehavior.daysSinceLastPurchase > 90) {
    reasons.push(`No purchase in ${customerBehavior.daysSinceLastPurchase} days`);
  }

  // Factor 2: Purchase frequency decline (30% weight)
  const frequencyScore = 1 - Math.min(customerBehavior.purchaseFrequency / 5, 1);
  churnProbability += frequencyScore * 0.3;
  if (customerBehavior.purchaseFrequency < 1) {
    reasons.push("Low purchase frequency (less than once per month)");
  }

  // Factor 3: Total purchases (20% weight)
  const purchasesScore = 1 - Math.min(customerBehavior.totalPurchases / 20, 1);
  churnProbability += purchasesScore * 0.2;
  if (customerBehavior.totalPurchases < 3) {
    reasons.push("Limited purchase history");
  }

  // Factor 4: Average order value (10% weight)
  const aovScore = 1 - Math.min(customerBehavior.averageOrderValue / 1000, 1);
  churnProbability += aovScore * 0.1;
  if (customerBehavior.averageOrderValue < 100) {
    reasons.push("Low average order value");
  }

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" | "critical";
  if (churnProbability >= 0.7) {
    riskLevel = "critical";
  } else if (churnProbability >= 0.5) {
    riskLevel = "high";
  } else if (churnProbability >= 0.3) {
    riskLevel = "medium";
  } else {
    riskLevel = "low";
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (churnProbability >= 0.5) {
    recommendations.push("Send personalized re-engagement email");
    recommendations.push("Offer special discount or promotion");
  }
  if (customerBehavior.daysSinceLastPurchase > 90) {
    recommendations.push("Reach out with product recommendations");
  }
  if (customerBehavior.purchaseFrequency < 1) {
    recommendations.push("Create loyalty program incentive");
  }

  return {
    customerId: customerBehavior.customerId,
    churnProbability,
    riskLevel,
    reasons,
    recommendations,
  };
}

/**
 * Analyze purchase patterns
 */
export function analyzePurchasePattern(
  purchases: Array<{ date: Date; amount: number }>
): PurchasePattern {
  if (purchases.length < 3) {
    return {
      pattern: "stable",
      trend: 0,
      seasonality: false,
      confidence: 0.5,
    };
  }

  // Sort by date
  const sorted = [...purchases].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate trend using linear regression
  const n = sorted.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  sorted.forEach((purchase, index) => {
    const x = index;
    const y = purchase.amount;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Determine pattern
  let pattern: "increasing" | "decreasing" | "stable" | "seasonal";
  if (Math.abs(slope) < 0.1) {
    pattern = "stable";
  } else if (slope > 0) {
    pattern = "increasing";
  } else {
    pattern = "decreasing";
  }

  // Check for seasonality (simplified)
  const seasonality = detectSeasonality(sorted);

  // Predict next purchase date
  const daysBetweenPurchases = sorted.slice(1).map((purchase, i) => {
    const prevPurchase = sorted[i];
    if (!prevPurchase) return 30; // Default to 30 days
    const diff = purchase.date.getTime() - prevPurchase.date.getTime();
    return diff / (1000 * 60 * 60 * 24);
  });
  const avgDaysBetween = daysBetweenPurchases.length > 0 
    ? daysBetweenPurchases.reduce((sum, d) => sum + d, 0) / daysBetweenPurchases.length
    : 30; // Default to 30 days if no history
  
  const lastDate = sorted[sorted.length - 1]?.date ?? new Date();
  const nextDate = new Date(lastDate.getTime() + avgDaysBetween * 24 * 60 * 60 * 1000);

  return {
    pattern: seasonality ? "seasonal" : pattern,
    trend: slope,
    seasonality,
    nextPurchaseDate: nextDate,
    confidence: n >= 10 ? 0.8 : 0.6,
  };
}

/**
 * Detect seasonality in purchase data
 */
function detectSeasonality(purchases: Array<{ date: Date; amount: number }>): boolean {
  if (purchases.length < 12) return false;

  // Group by month
  const monthlyTotals = new Map<number, number>();
  purchases.forEach(p => {
    const month = p.date.getMonth();
    const current = monthlyTotals.get(month) || 0;
    monthlyTotals.set(month, current + p.amount);
  });

  // Check if variance is significant
  const values = Array.from(monthlyTotals.values());
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean; // Coefficient of variation

  return cv > 0.3; // Significant seasonality if CV > 30%
}

/**
 * Calculate Customer Lifetime Value (CLV)
 */
export function calculateCLV(
  customerBehavior: CustomerBehavior,
  retentionRate: number = 0.8,
  discountRate: number = 0.1
): number {
  const { averageOrderValue, purchaseFrequency } = customerBehavior;
  
  // CLV = (Average Order Value × Purchase Frequency) × Customer Lifespan
  // Customer Lifespan = 1 / Churn Rate = 1 / (1 - Retention Rate)
  
  const customerLifespan = 1 / (1 - retentionRate);
  const annualValue = averageOrderValue * purchaseFrequency * 12;
  
  // Present value of future cash flows
  let clv = 0;
  for (let year = 1; year <= customerLifespan; year++) {
    clv += annualValue / Math.pow(1 + discountRate, year);
  }

  return clv;
}

/**
 * Segment customers into groups
 */
export function segmentCustomers(
  customers: CustomerBehavior[]
): CustomerSegment[] {
  const segments = new Map<string, CustomerBehavior[]>();

  customers.forEach(customer => {
    const segment = customer.segment;
    if (!segments.has(segment)) {
      segments.set(segment, []);
    }
    segments.get(segment)!.push(customer);
  });

  return Array.from(segments.entries()).map(([segment, customers]) => {
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageValue = totalRevenue / customers.length;

    const characteristics: string[] = [];
    if (segment === "VIP") {
      characteristics.push("High value, frequent purchasers");
      characteristics.push("Recent activity");
    } else if (segment === "Loyal") {
      characteristics.push("Regular purchasers");
      characteristics.push("Good retention");
    } else if (segment === "At-Risk") {
      characteristics.push("Declining activity");
      characteristics.push("Need re-engagement");
    } else if (segment === "Churned") {
      characteristics.push("Inactive for >6 months");
      characteristics.push("Win-back campaigns needed");
    }

    return {
      segment,
      count: customers.length,
      totalRevenue,
      averageValue,
      characteristics,
    };
  });
}

/**
 * Identify top customers by value
 */
export function getTopCustomers(
  customers: CustomerBehavior[],
  limit: number = 20
): CustomerBehavior[] {
  return [...customers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

/**
 * Calculate customer retention rate
 */
export function calculateRetentionRate(
  customersAtStart: number,
  customersAtEnd: number,
  newCustomers: number
): number {
  if (customersAtStart === 0) return 0;
  
  const retainedCustomers = customersAtEnd - newCustomers;
  return (retainedCustomers / customersAtStart) * 100;
}

/**
 * Analyze customer cohorts
 */
export interface CohortAnalysis {
  cohort: string;
  size: number;
  retentionRate: number;
  averageValue: number;
  churnRate: number;
}

export function analyzeCohorts(
  customers: Array<{
    id: string;
    joinDate: Date;
    purchases: Array<{ date: Date; amount: number }>;
  }>,
  periodMonths: number = 1
): CohortAnalysis[] {
  // Group by cohort (month joined)
  const cohorts = new Map<string, typeof customers>();

  customers.forEach(customer => {
    const cohortKey = `${customer.joinDate.getFullYear()}-${String(customer.joinDate.getMonth() + 1).padStart(2, '0')}`;
    if (!cohorts.has(cohortKey)) {
      cohorts.set(cohortKey, []);
    }
    cohorts.get(cohortKey)!.push(customer);
  });

  // Analyze each cohort
  return Array.from(cohorts.entries()).map(([cohort, customers]) => {
    const size = customers.length;
    const totalValue = customers.reduce((sum, c) =>
      sum + c.purchases.reduce((pSum, p) => pSum + p.amount, 0), 0
    );
    const averageValue = totalValue / size;

    // Calculate retention (customers who made purchase in last period)
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - periodMonths);
    const activeCustomers = customers.filter(c =>
      c.purchases.some(p => p.date >= cutoffDate)
    ).length;
    const retentionRate = (activeCustomers / size) * 100;
    const churnRate = 100 - retentionRate;

    return {
      cohort,
      size,
      retentionRate,
      averageValue,
      churnRate,
    };
  });
}
