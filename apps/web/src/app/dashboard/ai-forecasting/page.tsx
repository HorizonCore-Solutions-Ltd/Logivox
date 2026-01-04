'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { 
  TrendingUp, 
  Brain, 
  Target, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw,
  Download,
  Settings,
  Zap
} from 'lucide-react';

interface Forecast {
  id: string;
  sku: string;
  productName: string;
  forecastDate: string;
  predictedDemand: number;
  actualDemand?: number;
  confidence: number;
  modelVersion: string;
  accuracy?: number;
}

interface SlottingRecommendation {
  id: string;
  sku: string;
  currentLocation: string;
  recommendedLocation: string;
  pickFrequency: number;
  expectedImprovement: number;
  status: 'PENDING' | 'APPROVED' | 'IMPLEMENTED' | 'REJECTED';
}

interface ModelMetrics {
  modelName: string;
  version: string;
  accuracy: number;
  mape: number; // Mean Absolute Percentage Error
  mae: number; // Mean Absolute Error
  lastTrained: string;
  trainingDataPoints: number;
}

export default function AIForecastingPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [slottingRecs, setSlottingRecs] = useState<SlottingRecommendation[]>([]);
  const [models, setModels] = useState<ModelMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSKU, setSelectedSKU] = useState<string>('ALL');
  const [timeHorizon, setTimeHorizon] = useState<'7' | '14' | '30' | '90'>('30');

  useEffect(() => {
    fetchData();
  }, [timeHorizon]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [forecastRes, slottingRes, modelsRes] = await Promise.all([
        fetch(`/api/ml/forecasts?horizon=${timeHorizon}`),
        fetch('/api/ml/slotting-recommendations'),
        fetch('/api/ml/models/metrics'),
      ]);

      if (forecastRes.ok) setForecasts(await forecastRes.json());
      if (slottingRes.ok) setSlottingRecs(await slottingRes.json());
      if (modelsRes.ok) setModels(await modelsRes.json());
    } catch (error) {
      console.error('Error fetching AI/ML data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const avgAccuracy = forecasts
    .filter(f => f.accuracy !== undefined)
    .reduce((sum, f) => sum + (f.accuracy || 0), 0) / forecasts.filter(f => f.accuracy).length || 0;

  const pendingRecs = slottingRecs.filter(r => r.status === 'PENDING').length;
  const approvedRecs = slottingRecs.filter(r => r.status === 'APPROVED').length;

  const totalImprovementPotential = slottingRecs
    .filter(r => r.status === 'PENDING' || r.status === 'APPROVED')
    .reduce((sum, r) => sum + r.expectedImprovement, 0);

  // Prepare chart data
  const forecastChartData = forecasts
    .slice(0, 30)
    .map(f => ({
      date: new Date(f.forecastDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted: f.predictedDemand,
      actual: f.actualDemand || null,
      confidence: f.confidence * 100,
    }));

  const accuracyTrendData = models.map(m => ({
    model: m.modelName,
    accuracy: m.accuracy * 100,
    mape: m.mape,
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI/ML Forecasting & Optimization</h1>
          <p className="text-gray-600 mt-1">
            Demand forecasting, slotting optimization, and predictive analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeHorizon} onValueChange={(v: any) => setTimeHorizon(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Models
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Forecast Accuracy
            </CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {(avgAccuracy * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Last {timeHorizon} days average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Forecasts
            </CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {forecasts.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">SKUs being tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Slotting Recommendations
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {pendingRecs}
            </div>
            <p className="text-xs text-gray-500 mt-1">{approvedRecs} approved, awaiting implementation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Efficiency Gain Potential
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              +{totalImprovementPotential.toFixed(0)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">From pending optimizations</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="forecasts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecasts">
            <Brain className="h-4 w-4 mr-2" />
            Demand Forecasts
          </TabsTrigger>
          <TabsTrigger value="slotting">
            <Zap className="h-4 w-4 mr-2" />
            Slotting Optimization
          </TabsTrigger>
          <TabsTrigger value="models">
            <Target className="h-4 w-4 mr-2" />
            Model Performance
          </TabsTrigger>
        </TabsList>

        {/* Demand Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecast vs Actuals</CardTitle>
              <CardDescription>
                AI-predicted demand compared to actual demand ({timeHorizon} day horizon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={forecastChartData}>
                  <defs>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#3b82f6"
                    fill="url(#colorPredicted)"
                    strokeWidth={2}
                    name="Predicted Demand"
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    fill="url(#colorActual)"
                    strokeWidth={2}
                    name="Actual Demand"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Forecasts</CardTitle>
              <CardDescription>Top predicted demand by SKU</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forecasts.slice(0, 10).map((forecast) => (
                  <div key={forecast.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{forecast.productName}</div>
                      <div className="text-sm text-gray-500">SKU: {forecast.sku}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Predicted Demand</div>
                        <div className="text-lg font-bold text-blue-600">
                          {forecast.predictedDemand.toLocaleString()} units
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Confidence</div>
                        <Badge variant={forecast.confidence > 0.8 ? 'default' : 'secondary'}>
                          {(forecast.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      {forecast.accuracy !== undefined && (
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Accuracy</div>
                          <Badge variant={forecast.accuracy > 0.85 ? 'default' : 'outline'}>
                            {(forecast.accuracy * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slotting Optimization Tab */}
        <TabsContent value="slotting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slotting Recommendations</CardTitle>
              <CardDescription>
                AI-powered location optimization to reduce pick times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {slottingRecs.map((rec) => (
                  <div 
                    key={rec.id} 
                    className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">SKU: {rec.sku}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Pick Frequency: <span className="font-medium">{rec.pickFrequency}</span> times/day
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {rec.currentLocation} → {rec.recommendedLocation}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Expected Improvement</div>
                        <div className="text-2xl font-bold text-green-600">
                          +{rec.expectedImprovement.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <Badge 
                          variant={
                            rec.status === 'APPROVED' ? 'default' :
                            rec.status === 'IMPLEMENTED' ? 'outline' :
                            rec.status === 'REJECTED' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {rec.status}
                        </Badge>
                      </div>
                      {rec.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Performance Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Accuracy Comparison</CardTitle>
              <CardDescription>Performance metrics across all ML models</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={accuracyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="model" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy %" />
                  <Bar dataKey="mape" fill="#f59e0b" name="MAPE %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {models.map((model) => (
              <Card key={model.modelName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{model.modelName}</CardTitle>
                    <Badge>{model.version}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accuracy</span>
                    <span className="font-bold text-green-600">
                      {(model.accuracy * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MAPE</span>
                    <span className="font-bold">{model.mape.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MAE</span>
                    <span className="font-bold">{model.mae.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Training Data Points</span>
                    <span className="font-bold">{model.trainingDataPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Trained</span>
                    <span className="text-sm">
                      {new Date(model.lastTrained).toLocaleDateString()}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full mt-2">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retrain Model
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
