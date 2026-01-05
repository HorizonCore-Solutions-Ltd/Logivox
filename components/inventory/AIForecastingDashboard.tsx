/**
 * AI Forecasting Dashboard Component
 * Real-time demand forecasting visualization
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ForecastData {
  forecastId: string;
  intelligence: any;
  metadata: any;
}

export default function AIForecastingDashboard({ organizationId }: { organizationId: string }) {
  const [loading, setLoading] = useState(false);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [forecastDetail, setForecastDetail] = useState<ForecastData | null>(null);
  const [accuracyReport, setAccuracyReport] = useState<any>(null);

  // Load recent forecasts
  const loadForecasts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/forecast/accuracy?period=30');
      const data = await response.json();
      if (data.success) {
        setAccuracyReport(data.data);
        setForecasts(data.data.topPerformers || []);
      }
    } catch (error) {
      console.error('Failed to load forecasts:', error);
    }
    setLoading(false);
  };

  // Generate forecast for product
  const generateForecast = async (productId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/forecast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, horizonDays: 90 })
      });
      const data = await response.json();
      if (data.success) {
        setForecastDetail(data.data);
        setSelectedProduct(productId);
      }
    } catch (error) {
      console.error('Failed to generate forecast:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadForecasts();
  }, []);

  // Prepare chart data
  const prepareChartData = () => {
    if (!forecastDetail?.intelligence?.predictions) return [];
    
    return forecastDetail.intelligence.predictions.slice(0, 30).map((pred: any, index: number) => ({
      day: index + 1,
      predicted: Math.round(pred.predictedDemand),
      lower: Math.round(pred.lowerBound),
      upper: Math.round(pred.upperBound),
      confidence: pred.confidence
    }));
  };

  const chartData = prepareChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Demand Forecasting</h1>
          <p className="text-muted-foreground">95%+ accuracy AI-powered inventory predictions</p>
        </div>
        <Button onClick={loadForecasts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Accuracy Summary */}
      {accuracyReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accuracyReport.summary?.avgAccuracy}</div>
              <Badge variant={accuracyReport.summary?.metTarget ? 'default' : 'secondary'} className="mt-2">
                Target: 95%+
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Forecasts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accuracyReport.summary?.totalForecasts}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Last {accuracyReport.summary?.period}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Above 95% Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {accuracyReport.summary?.distribution?.above95Percent || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Excellent performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {accuracyReport.summary?.performance === 'EXCELLENT' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
                <span className="text-lg font-semibold">{accuracyReport.summary?.performance}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forecast Detail */}
      {forecastDetail && (
        <Card>
          <CardHeader>
            <CardTitle>30-Day Demand Forecast</CardTitle>
            <CardDescription>
              Predicted demand with confidence intervals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Units', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="upper" stackId="1" stroke="#93c5fd" fill="#93c5fd" name="Upper Bound" />
                <Area type="monotone" dataKey="predicted" stackId="2" stroke="#3b82f6" fill="#3b82f6" name="Predicted" />
                <Area type="monotone" dataKey="lower" stackId="1" stroke="#60a5fa" fill="#60a5fa" name="Lower Bound" />
              </AreaChart>
            </ResponsiveContainer>

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Avg Daily Demand</p>
                <p className="text-2xl font-bold">{Math.round(forecastDetail.intelligence.avgDailyDemand)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Stockout Risk</p>
                <p className="text-2xl font-bold text-red-600">{forecastDetail.intelligence.stockoutRisk}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Overstock Risk</p>
                <p className="text-2xl font-bold text-yellow-600">{forecastDetail.intelligence.overstockRisk}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Velocity Class</p>
                <Badge variant="outline" className="text-lg">{forecastDetail.intelligence.velocityClass}</Badge>
              </div>
            </div>

            {/* Recommendations */}
            {forecastDetail.intelligence.recommendations?.length > 0 && (
              <Alert className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommended Action:</strong> {forecastDetail.intelligence.recommendations[0].action}
                  {forecastDetail.intelligence.recommendations[0].quantity && (
                    <> - Order {forecastDetail.intelligence.recommendations[0].quantity} units</>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Forecast Performers</CardTitle>
          <CardDescription>Products with highest forecast accuracy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {forecasts.slice(0, 10).map((forecast) => (
              <div key={forecast.productId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                   onClick={() => generateForecast(forecast.productId)}>
                <div className="flex-1">
                  <p className="font-medium">{forecast.productName}</p>
                  <p className="text-sm text-muted-foreground">SKU: {forecast.productId}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-lg font-bold text-green-600">{forecast.accuracy}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Predicted / Actual</p>
                    <p className="text-sm">{forecast.predicted} / {forecast.actual}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
