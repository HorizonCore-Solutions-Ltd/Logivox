'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  Leaf, 
  TrendingDown, 
  Package,
  Truck,
  Zap,
  Droplet,
  Recycle,
  Award,
  Download,
  RefreshCw,
  Target,
  AlertCircle
} from 'lucide-react';

interface CarbonFootprint {
  id: string;
  entityType: 'ORDER' | 'SHIPMENT' | 'WAREHOUSE' | 'PRODUCT';
  entityId: string;
  totalCO2e: number; // kg CO2 equivalent
  breakdown: {
    transportation: number;
    packaging: number;
    warehousing: number;
    manufacturing: number;
  };
  timestamp: string;
}

interface SustainabilityMetrics {
  totalCO2e: number;
  co2ePerOrder: number;
  co2eReduction: number;
  recyclingRate: number;
  wasteReduction: number;
  energyConsumption: number;
  waterUsage: number;
  sustainablePackaging: number;
}

interface PackagingRecommendation {
  orderId: string;
  currentPackaging: string;
  recommendedPackaging: string;
  co2eSavings: number;
  costSavings: number;
  reason: string;
}

export default function SustainabilityDashboard() {
  const [metrics, setMetrics] = useState<SustainabilityMetrics>({
    totalCO2e: 0,
    co2ePerOrder: 0,
    co2eReduction: 0,
    recyclingRate: 0,
    wasteReduction: 0,
    energyConsumption: 0,
    waterUsage: 0,
    sustainablePackaging: 0,
  });
  const [footprints, setFootprints] = useState<CarbonFootprint[]>([]);
  const [recommendations, setRecommendations] = useState<PackagingRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | '365'>('30');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsRes, footprintsRes, recsRes] = await Promise.all([
        fetch(`/api/sustainability/metrics?days=${timeRange}`),
        fetch(`/api/sustainability/footprints?days=${timeRange}`),
        fetch('/api/sustainability/recommendations'),
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (footprintsRes.ok) setFootprints(await footprintsRes.json());
      if (recsRes.ok) setRecommendations(await recsRes.json());
    } catch (error) {
      console.error('Error fetching sustainability data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const carbonTrendData = footprints
    .slice(0, 30)
    .reverse()
    .map(f => ({
      date: new Date(f.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      co2e: f.totalCO2e,
      transportation: f.breakdown.transportation,
      packaging: f.breakdown.packaging,
      warehousing: f.breakdown.warehousing,
    }));

  const breakdownData = [
    { name: 'Transportation', value: footprints.reduce((sum, f) => sum + f.breakdown.transportation, 0), color: '#ef4444' },
    { name: 'Packaging', value: footprints.reduce((sum, f) => sum + f.breakdown.packaging, 0), color: '#f59e0b' },
    { name: 'Warehousing', value: footprints.reduce((sum, f) => sum + f.breakdown.warehousing, 0), color: '#3b82f6' },
    { name: 'Manufacturing', value: footprints.reduce((sum, f) => sum + f.breakdown.manufacturing, 0), color: '#8b5cf6' },
  ];

  const targetCO2e = 10000; // kg - example target
  const currentProgress = (1 - (metrics.totalCO2e / targetCO2e)) * 100;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sustainability & Carbon Intelligence</h1>
          <p className="text-gray-600 mt-1">
            Track environmental impact and optimize for carbon neutrality
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            ESG Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Carbon Footprint
            </CardTitle>
            <Leaf className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {(metrics.totalCO2e / 1000).toFixed(1)}t
            </div>
            <p className="text-xs text-gray-500 mt-1">CO₂e last {timeRange} days</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                {metrics.co2eReduction.toFixed(1)}% vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              CO₂e Per Order
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics.co2ePerOrder.toFixed(2)} kg
            </div>
            <p className="text-xs text-gray-500 mt-1">Average per shipment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Recycling Rate
            </CardTitle>
            <Recycle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {(metrics.recyclingRate * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Materials diverted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sustainable Packaging
            </CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {(metrics.sustainablePackaging * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Eco-friendly materials</p>
          </CardContent>
        </Card>
      </div>

      {/* Carbon Neutrality Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Carbon Neutrality Target</CardTitle>
              <CardDescription>Progress toward net-zero emissions</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg">
              <Target className="h-4 w-4 mr-1" />
              Target: {(targetCO2e / 1000).toFixed(0)}t CO₂e
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current: {(metrics.totalCO2e / 1000).toFixed(1)}t CO₂e</span>
              <span className="font-medium text-green-600">
                {currentProgress > 0 ? `${currentProgress.toFixed(0)}% below target` : `${Math.abs(currentProgress).toFixed(0)}% above target`}
              </span>
            </div>
            <Progress 
              value={Math.min(100, Math.max(0, currentProgress + 50))} 
              className="h-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Leaf className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="breakdown">
            <Package className="h-4 w-4 mr-2" />
            Carbon Breakdown
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Zap className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="resources">
            <Droplet className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carbon Footprint Trend</CardTitle>
              <CardDescription>Daily CO₂e emissions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={carbonTrendData}>
                  <defs>
                    <linearGradient id="colorCO2e" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="co2e"
                    stroke="#10b981"
                    fill="url(#colorCO2e)"
                    strokeWidth={2}
                    name="Total CO₂e (kg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Emissions by Source</CardTitle>
                <CardDescription>Where carbon comes from</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {breakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sustainability Scores</CardTitle>
                <CardDescription>Key environmental metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Recycling Rate</span>
                    <span className="font-medium">{(metrics.recyclingRate * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.recyclingRate * 100} className="bg-green-100 [&>div]:bg-green-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Sustainable Packaging</span>
                    <span className="font-medium">{(metrics.sustainablePackaging * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.sustainablePackaging * 100} className="bg-yellow-100 [&>div]:bg-yellow-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Waste Reduction</span>
                    <span className="font-medium">{(metrics.wasteReduction * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.wasteReduction * 100} className="bg-blue-100 [&>div]:bg-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Carbon Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emissions by Category</CardTitle>
              <CardDescription>Stacked area chart of carbon sources</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={carbonTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="transportation" stackId="1" stroke="#ef4444" fill="#ef4444" name="Transportation" />
                  <Area type="monotone" dataKey="packaging" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Packaging" />
                  <Area type="monotone" dataKey="warehousing" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Warehousing" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: Truck, label: 'Transportation', value: breakdownData[0]?.value || 0, color: 'text-red-600', bgColor: 'bg-red-50' },
              { icon: Package, label: 'Packaging', value: breakdownData[1]?.value || 0, color: 'text-orange-600', bgColor: 'bg-orange-50' },
              { icon: Zap, label: 'Warehousing', value: breakdownData[2]?.value || 0, color: 'text-blue-600', bgColor: 'bg-blue-50' },
              { icon: Package, label: 'Manufacturing', value: breakdownData[3]?.value || 0, color: 'text-purple-600', bgColor: 'bg-purple-50' },
            ].map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-full ${item.bgColor} flex items-center justify-center mb-3`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                  <div className={`text-2xl font-bold ${item.color}`}>
                    {(item.value / 1000).toFixed(1)}t
                  </div>
                  <div className="text-xs text-gray-500 mt-1">CO₂e emissions</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Packaging Optimization</CardTitle>
              <CardDescription>
                AI recommendations to reduce carbon footprint ({recommendations.length} opportunities)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div 
                    key={rec.orderId}
                    className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        Order {rec.orderId}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {rec.currentPackaging} → {rec.recommendedPackaging}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rec.reason}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 ml-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-600">CO₂e Savings</div>
                        <div className="text-lg font-bold text-green-600">
                          {rec.co2eSavings.toFixed(2)} kg
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">Cost Savings</div>
                        <div className="text-lg font-bold text-blue-600">
                          ${rec.costSavings.toFixed(2)}
                        </div>
                      </div>
                      <Button size="sm">
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Energy Consumption
                </CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {(metrics.energyConsumption / 1000).toFixed(1)} MWh
                </div>
                <p className="text-xs text-gray-500 mt-1">Last {timeRange} days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Water Usage
                </CardTitle>
                <Droplet className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {metrics.waterUsage.toLocaleString()} gal
                </div>
                <p className="text-xs text-gray-500 mt-1">Total consumption</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Waste Diverted
                </CardTitle>
                <Recycle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {(metrics.recyclingRate * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">From landfill</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
