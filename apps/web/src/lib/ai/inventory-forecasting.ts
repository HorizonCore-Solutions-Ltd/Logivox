/**
 * AI-Powered Inventory Forecasting System for LogiVox
 * 
 * Machine learning models for demand prediction, seasonal pattern detection,
 * and intelligent reorder suggestions.
 */

// ============================================================================
// Types
// ============================================================================

export interface ForecastData {
  productId: string;
  productName: string;
  currentStock: number;
  averageDailySales: number;
  predictedDemand: number[];
  daysOfSupply: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: SeasonalityPattern | null;
  lastUpdated: Date;
}

export interface SeasonalityPattern {
  type: 'weekly' | 'monthly' | 'yearly';
  peaks: number[]; // Day/week/month indices with highest demand
  troughs: number[]; // Day/week/month indices with lowest demand
  strength: number; // 0-1, how strong the pattern is
}

export interface DemandPrediction {
  date: Date;
  predictedQuantity: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface StockOptimization {
  productId: string;
  currentStock: number;
  optimalStock: number;
  overstock: number;
  understock: number;
  recommendation: 'order' | 'reduce' | 'maintain';
  suggestedAction: string;
  estimatedCostSavings: number;
}

export interface ForecastingModel {
  name: string;
  accuracy: number;
  trainedAt: Date;
  parameters: Record<string, any>;
}

// ============================================================================
// Simple Moving Average (SMA)
// ============================================================================

export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }

    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }

  return sma;
}

// ============================================================================
// Exponential Moving Average (EMA)
// ============================================================================

export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  const firstSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(firstSMA);

  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    const prevEMA = ema[i - period];
    const currentValue = data[i];
    if (prevEMA !== undefined && currentValue !== undefined) {
      const currentEMA = (currentValue - prevEMA) * multiplier + prevEMA;
      ema.push(currentEMA);
    }
  }

  return ema;
}

// ============================================================================
// Linear Regression for Trend Analysis
// ============================================================================

export interface TrendLine {
  slope: number;
  intercept: number;
  r2: number; // Coefficient of determination (goodness of fit)
}

export function calculateLinearRegression(data: number[]): TrendLine {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;

  // Calculate means
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    if (xi !== undefined && yi !== undefined) {
      numerator += (xi - xMean) * (yi - yMean);
      denominator += (xi - xMean) ** 2;
    }
  }

  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  // Calculate R-squared
  let ssRes = 0; // Sum of squares of residuals
  let ssTot = 0; // Total sum of squares

  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    if (xi !== undefined && yi !== undefined) {
      const predicted = slope * xi + intercept;
      ssRes += (yi - predicted) ** 2;
      ssTot += (yi - yMean) ** 2;
    }
  }

  const r2 = 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

// ============================================================================
// Seasonality Detection
// ============================================================================

export function detectSeasonality(data: number[], period: number): SeasonalityPattern | null {
  if (data.length < period * 2) {
    return null; // Need at least 2 full cycles
  }

  // Split data into cycles
  const cycles: number[][] = [];
  for (let i = 0; i <= data.length - period; i += period) {
    cycles.push(data.slice(i, i + period));
  }

  // Calculate average for each position in the cycle
  const seasonalIndices: number[] = [];
  for (let pos = 0; pos < period; pos++) {
    const values = cycles.map((cycle) => cycle[pos] || 0);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    seasonalIndices.push(avg);
  }

  // Normalize indices
  const overallMean = seasonalIndices.reduce((a, b) => a + b, 0) / seasonalIndices.length;
  const normalizedIndices = seasonalIndices.map((val) => val / overallMean);

  // Find peaks and troughs
  const threshold = 0.1; // 10% deviation from mean
  const peaks: number[] = [];
  const troughs: number[] = [];

  normalizedIndices.forEach((val, idx) => {
    if (val > 1 + threshold) {
      peaks.push(idx);
    } else if (val < 1 - threshold) {
      troughs.push(idx);
    }
  });

  // Calculate strength (variance from mean)
  const variance =
    normalizedIndices.reduce((sum, val) => sum + (val - 1) ** 2, 0) / normalizedIndices.length;
  const strength = Math.min(Math.sqrt(variance), 1);

  // Only return pattern if it's strong enough
  if (strength < 0.1) {
    return null;
  }

  const type = period === 7 ? 'weekly' : period === 30 ? 'monthly' : 'yearly';

  return {
    type,
    peaks,
    troughs,
    strength,
  };
}

// ============================================================================
// Demand Forecasting with Multiple Methods
// ============================================================================

export function forecastDemand(
  historicalData: number[],
  daysToForecast: number,
  method: 'sma' | 'ema' | 'linear' | 'hybrid' = 'hybrid'
): DemandPrediction[] {
  const predictions: DemandPrediction[] = [];

  if (method === 'sma') {
    // Simple Moving Average forecast
    const period = Math.min(7, historicalData.length);
    const lastSMA =
      historicalData.slice(-period).reduce((a, b) => a + b, 0) / period;

    for (let i = 0; i < daysToForecast; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);

      predictions.push({
        date,
        predictedQuantity: Math.round(lastSMA),
        lowerBound: Math.round(lastSMA * 0.8),
        upperBound: Math.round(lastSMA * 1.2),
        confidence: 0.7,
      });
    }
  } else if (method === 'ema') {
    // Exponential Moving Average forecast
    const period = Math.min(7, historicalData.length);
    const ema = calculateEMA(historicalData, period);
    const lastEMA = ema[ema.length - 1];

    if (lastEMA !== undefined) {
      for (let i = 0; i < daysToForecast; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);

        predictions.push({
          date,
          predictedQuantity: Math.round(lastEMA),
          lowerBound: Math.round(lastEMA * 0.75),
          upperBound: Math.round(lastEMA * 1.25),
          confidence: 0.75,
        });
      }
    }
  } else if (method === 'linear') {
    // Linear regression forecast
    const trend = calculateLinearRegression(historicalData);
    const n = historicalData.length;

    for (let i = 0; i < daysToForecast; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);

      const predicted = trend.slope * (n + i) + trend.intercept;
      const confidence = Math.max(0.5, Math.min(0.95, trend.r2));

      predictions.push({
        date,
        predictedQuantity: Math.max(0, Math.round(predicted)),
        lowerBound: Math.max(0, Math.round(predicted * (1 - (1 - confidence)))),
        upperBound: Math.round(predicted * (1 + (1 - confidence))),
        confidence,
      });
    }
  } else {
    // Hybrid approach: Combine linear trend with seasonal patterns
    const trend = calculateLinearRegression(historicalData);
    const seasonality = detectSeasonality(historicalData, 7); // Weekly pattern
    const n = historicalData.length;

    for (let i = 0; i < daysToForecast; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);

      // Base prediction from linear trend
      let predicted = trend.slope * (n + i) + trend.intercept;

      // Apply seasonal adjustment if pattern exists
      if (seasonality && seasonality.strength > 0.2) {
        const dayOfWeek = (date.getDay() + i) % 7;
        const seasonalFactor = seasonality.peaks.includes(dayOfWeek)
          ? 1.2
          : seasonality.troughs.includes(dayOfWeek)
          ? 0.8
          : 1.0;
        predicted *= seasonalFactor;
      }

      const confidence = Math.max(0.6, Math.min(0.9, trend.r2 + (seasonality?.strength || 0) * 0.2));

      predictions.push({
        date,
        predictedQuantity: Math.max(0, Math.round(predicted)),
        lowerBound: Math.max(0, Math.round(predicted * 0.7)),
        upperBound: Math.round(predicted * 1.3),
        confidence,
      });
    }
  }

  return predictions;
}

// ============================================================================
// Safety Stock Calculation
// ============================================================================

export function calculateSafetyStock(
  averageDemand: number,
  maxDemand: number,
  averageLeadTime: number,
  maxLeadTime: number,
  serviceLevel: number = 0.95 // 95% service level
): number {
  // Z-score for service level (95% = 1.65, 99% = 2.33)
  const zScore = serviceLevel >= 0.99 ? 2.33 : serviceLevel >= 0.95 ? 1.65 : 1.28;

  // Safety stock formula
  const safetyStock =
    zScore *
    Math.sqrt(
      maxLeadTime * averageDemand ** 2 + averageLeadTime ** 2 * maxDemand ** 2
    );

  return Math.ceil(safetyStock);
}

// ============================================================================
// Economic Order Quantity (EOQ)
// ============================================================================

export function calculateEOQ(
  annualDemand: number,
  orderCost: number,
  holdingCost: number
): number {
  if (holdingCost === 0) {
    return Math.ceil(annualDemand / 12); // Monthly order if no holding cost
  }

  const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
  return Math.ceil(eoq);
}

// ============================================================================
// Reorder Point Calculation
// ============================================================================

export function calculateReorderPoint(
  averageDailyDemand: number,
  leadTimeDays: number,
  safetyStock: number
): number {
  const reorderPoint = averageDailyDemand * leadTimeDays + safetyStock;
  return Math.ceil(reorderPoint);
}

// ============================================================================
// ABC Analysis (Inventory Classification)
// ============================================================================

export interface ABCClassification {
  productId: string;
  class: 'A' | 'B' | 'C';
  value: number;
  percentage: number;
  cumulativePercentage: number;
}

export function performABCAnalysis(
  products: Array<{ id: string; annualValue: number }>
): ABCClassification[] {
  // Sort by value (descending)
  const sorted = [...products].sort((a, b) => b.annualValue - a.annualValue);

  // Calculate total value
  const totalValue = sorted.reduce((sum, p) => sum + p.annualValue, 0);

  // Classify products
  const classifications: ABCClassification[] = [];
  let cumulativeValue = 0;

  sorted.forEach((product) => {
    cumulativeValue += product.annualValue;
    const percentage = (product.annualValue / totalValue) * 100;
    const cumulativePercentage = (cumulativeValue / totalValue) * 100;

    let productClass: 'A' | 'B' | 'C';
    if (cumulativePercentage <= 70) {
      productClass = 'A'; // Top 70% of value
    } else if (cumulativePercentage <= 90) {
      productClass = 'B'; // Next 20% of value
    } else {
      productClass = 'C'; // Bottom 10% of value
    }

    classifications.push({
      productId: product.id,
      class: productClass,
      value: product.annualValue,
      percentage,
      cumulativePercentage,
    });
  });

  return classifications;
}

// ============================================================================
// Stock Turnover Analysis
// ============================================================================

export interface TurnoverAnalysis {
  productId: string;
  turnoverRate: number;
  daysInInventory: number;
  status: 'fast-moving' | 'medium-moving' | 'slow-moving' | 'obsolete';
  recommendation: string;
}

export function analyzeStockTurnover(
  soldQuantity: number,
  averageStock: number,
  periodDays: number = 365
): TurnoverAnalysis {
  const turnoverRate = averageStock > 0 ? soldQuantity / averageStock : 0;
  const daysInInventory = turnoverRate > 0 ? periodDays / turnoverRate : Infinity;

  let status: TurnoverAnalysis['status'];
  let recommendation: string;

  if (daysInInventory < 30) {
    status = 'fast-moving';
    recommendation = 'High demand - ensure stock availability';
  } else if (daysInInventory < 90) {
    status = 'medium-moving';
    recommendation = 'Moderate demand - maintain optimal stock levels';
  } else if (daysInInventory < 180) {
    status = 'slow-moving';
    recommendation = 'Low demand - consider reducing stock levels';
  } else {
    status = 'obsolete';
    recommendation = 'Very low demand - consider liquidation or discontinuation';
  }

  return {
    productId: '',
    turnoverRate: Math.round(turnoverRate * 100) / 100,
    daysInInventory: Math.round(daysInInventory),
    status,
    recommendation,
  };
}

// ============================================================================
// Demand Variability Analysis
// ============================================================================

export function calculateDemandVariability(data: number[]): {
  mean: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  variability: 'low' | 'medium' | 'high';
} {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;

  const variance =
    data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length;
  const standardDeviation = Math.sqrt(variance);

  const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 0;

  let variability: 'low' | 'medium' | 'high';
  if (coefficientOfVariation < 0.3) {
    variability = 'low';
  } else if (coefficientOfVariation < 0.6) {
    variability = 'medium';
  } else {
    variability = 'high';
  }

  return {
    mean: Math.round(mean * 100) / 100,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
    variability,
  };
}

// ============================================================================
// Comprehensive Forecast Generation
// ============================================================================

export async function generateForecast(
  productId: string,
  historicalSales: number[],
  currentStock: number,
  leadTimeDays: number = 7,
  orderCost: number = 50,
  holdingCostPerUnit: number = 5
): Promise<ForecastData> {
  // Calculate basic statistics
  const avgDailySales =
    historicalSales.reduce((a, b) => a + b, 0) / historicalSales.length;
  const maxDailySales = Math.max(...historicalSales);

  // Detect trend
  const trend = calculateLinearRegression(historicalSales);
  const trendDirection: ForecastData['trend'] =
    trend.slope > 0.1 ? 'increasing' : trend.slope < -0.1 ? 'decreasing' : 'stable';

  // Detect seasonality
  const seasonality = detectSeasonality(historicalSales, 7);

  // Forecast demand for next 30 days
  const predictions = forecastDemand(historicalSales, 30, 'hybrid');
  const predictedDemand = predictions.map((p) => p.predictedQuantity);

  // Calculate safety stock
  const safetyStock = calculateSafetyStock(
    avgDailySales,
    maxDailySales,
    leadTimeDays,
    leadTimeDays + 2
  );

  // Calculate reorder point
  const reorderPoint = calculateReorderPoint(avgDailySales, leadTimeDays, safetyStock);

  // Calculate EOQ
  const annualDemand = avgDailySales * 365;
  const eoq = calculateEOQ(annualDemand, orderCost, holdingCostPerUnit);

  // Calculate days of supply
  const daysOfSupply = avgDailySales > 0 ? currentStock / avgDailySales : Infinity;

  // Confidence based on data quality and trend strength
  const confidence = Math.min(
    0.95,
    Math.max(
      0.5,
      trend.r2 * 0.6 + (seasonality?.strength || 0) * 0.3 + 0.1
    )
  );

  return {
    productId,
    productName: '', // Will be populated from database
    currentStock,
    averageDailySales: Math.round(avgDailySales * 100) / 100,
    predictedDemand,
    daysOfSupply: Math.round(daysOfSupply * 10) / 10,
    reorderPoint,
    suggestedOrderQuantity: eoq,
    confidence: Math.round(confidence * 100) / 100,
    trend: trendDirection,
    seasonality,
    lastUpdated: new Date(),
  };
}
