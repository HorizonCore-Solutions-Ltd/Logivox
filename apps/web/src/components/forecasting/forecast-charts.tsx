"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

interface ForecastData {
  productId: string;
  productName: string;
  currentStock: number;
  historicalSales: Array<{ date: string; quantity: number }>;
  predictions: Array<{ 
    date: string; 
    demand: number; 
    confidence: { lower: number; upper: number } 
  }>;
  trend: {
    direction: "increasing" | "decreasing" | "stable";
    slope: number;
    confidence: number;
  };
  seasonality?: {
    detected: boolean;
    pattern: "weekly" | "monthly" | "yearly";
    strength: number;
    peaks: number[];
    troughs: number[];
  };
  reorderPoint: number;
  safetyStock: number;
  optimalOrderQuantity: number;
  daysUntilReorder: number;
  confidence: number;
}

interface ForecastChartsProps {
  forecast: ForecastData;
}

export function ForecastCharts({ forecast }: ForecastChartsProps) {
  // Combine historical and predicted data
  const chartData = [
    ...forecast.historicalSales.map((sale) => ({
      date: new Date(sale.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      actual: sale.quantity,
      predicted: null,
      lower: null,
      upper: null,
      type: "historical",
    })),
    ...forecast.predictions.map((pred) => ({
      date: new Date(pred.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      actual: null,
      predicted: pred.demand,
      lower: pred.confidence.lower,
      upper: pred.confidence.upper,
      type: "forecast",
    })),
  ];

  // Calculate trend line data
  const trendLineData = chartData.map((point, index) => {
    const x = index - forecast.historicalSales.length;
    const trendValue = forecast.trend.slope * x + 
      (forecast.historicalSales.length > 0 
        ? forecast.historicalSales[forecast.historicalSales.length - 1].quantity 
        : 0);
    return {
      ...point,
      trend: trendValue > 0 ? trendValue : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Main Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Demand Forecast Visualization</CardTitle>
          <CardDescription>
            Historical sales data and 30-day AI predictions with confidence intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px"
                }}
              />
              <Legend />
              
              {/* Confidence interval area */}
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
                name="Upper Bound"
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
                name="Lower Bound"
              />
              
              {/* Historical actual sales */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                name="Actual Sales"
              />
              
              {/* Predicted demand */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                name="Predicted Demand"
              />
              
              {/* Reorder point reference line */}
              <ReferenceLine
                y={forecast.reorderPoint}
                stroke="hsl(var(--destructive))"
                strokeDasharray="3 3"
                label={{ 
                  value: `Reorder Point (${forecast.reorderPoint})`, 
                  position: "right",
                  fill: "hsl(var(--destructive))"
                }}
              />
              
              {/* Safety stock reference line */}
              <ReferenceLine
                y={forecast.safetyStock}
                stroke="hsl(var(--warning))"
                strokeDasharray="3 3"
                label={{ 
                  value: `Safety Stock (${forecast.safetyStock})`, 
                  position: "right",
                  fill: "hsl(var(--warning))"
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
          <CardDescription>
            Long-term demand trend ({forecast.trend.direction})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendLineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px"
                }}
              />
              <Legend />
              
              {/* Actual and predicted data */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Actual"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Predicted"
              />
              
              {/* Trend line */}
              <Line
                type="monotone"
                dataKey="trend"
                stroke={
                  forecast.trend.direction === "increasing" 
                    ? "hsl(var(--chart-3))" 
                    : forecast.trend.direction === "decreasing"
                      ? "hsl(var(--destructive))"
                      : "hsl(var(--muted-foreground))"
                }
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={false}
                name="Trend Line"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
