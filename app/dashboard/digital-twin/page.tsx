"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Activity,
  Boxes,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Zap,
  Users,
  Package,
  Truck,
  BarChart3,
  Gauge,
  Clock,
  DollarSign,
  Target,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  variables: {
    orderVolume: number;
    staffLevel: number;
    automationLevel: number;
    peakFactor: number;
  };
  results?: {
    throughput: number;
    utilization: number;
    cost: number;
    accuracy: number;
    efficiency: number;
  };
}

export default function DigitalTwinPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [selectedScenario, setSelectedScenario] =
    useState<SimulationScenario | null>(null);
  const [orderVolume, setOrderVolume] = useState([1000]);
  const [staffLevel, setStaffLevel] = useState([25]);
  const [automationLevel, setAutomationLevel] = useState([50]);
  const [peakFactor, setPeakFactor] = useState([1.5]);

  // Sample scenarios
  const scenarios: SimulationScenario[] = [
    {
      id: "baseline",
      name: "Current State",
      description: "Baseline simulation of current operations",
      variables: {
        orderVolume: 1000,
        staffLevel: 25,
        automationLevel: 50,
        peakFactor: 1.5,
      },
      results: {
        throughput: 950,
        utilization: 78,
        cost: 12500,
        accuracy: 97.5,
        efficiency: 82,
      },
    },
    {
      id: "peak-season",
      name: "Peak Season",
      description: "2x order volume during holiday season",
      variables: {
        orderVolume: 2000,
        staffLevel: 40,
        automationLevel: 50,
        peakFactor: 2.5,
      },
      results: {
        throughput: 1850,
        utilization: 92,
        cost: 24800,
        accuracy: 95.2,
        efficiency: 78,
      },
    },
    {
      id: "high-automation",
      name: "High Automation",
      description: "Increased automation with robotics",
      variables: {
        orderVolume: 1000,
        staffLevel: 18,
        automationLevel: 80,
        peakFactor: 1.5,
      },
      results: {
        throughput: 1100,
        utilization: 85,
        cost: 9800,
        accuracy: 99.1,
        efficiency: 89,
      },
    },
    {
      id: "cost-optimized",
      name: "Cost Optimized",
      description: "Minimize costs while maintaining service",
      variables: {
        orderVolume: 1000,
        staffLevel: 20,
        automationLevel: 60,
        peakFactor: 1.5,
      },
      results: {
        throughput: 980,
        utilization: 82,
        cost: 10200,
        accuracy: 97.8,
        efficiency: 85,
      },
    },
  ];

  // Real-time metrics data
  const realtimeData = [
    { time: "00:00", throughput: 42, utilization: 65, accuracy: 97 },
    { time: "04:00", throughput: 38, utilization: 58, accuracy: 98 },
    { time: "08:00", throughput: 78, utilization: 85, accuracy: 96 },
    { time: "12:00", throughput: 95, utilization: 92, accuracy: 95 },
    { time: "16:00", throughput: 88, utilization: 88, accuracy: 97 },
    { time: "20:00", throughput: 52, utilization: 72, accuracy: 98 },
  ];

  // Scenario comparison
  const comparisonData = scenarios.map((s) => ({
    name: s.name,
    throughput: s.results?.throughput || 0,
    cost: (s.results?.cost || 0) / 100,
    accuracy: s.results?.accuracy || 0,
    efficiency: s.results?.efficiency || 0,
  }));

  // Resource utilization
  const resourceData = [
    { resource: "Staff", current: 78, optimal: 85, capacity: 100 },
    { resource: "Equipment", current: 82, optimal: 80, capacity: 100 },
    { resource: "Storage", current: 68, optimal: 75, capacity: 100 },
    { resource: "Dock Doors", current: 85, optimal: 80, capacity: 100 },
    { resource: "Automation", current: 72, optimal: 85, capacity: 100 },
  ];

  // Performance radar
  const performanceData = [
    {
      metric: "Throughput",
      current: 82,
      optimal: 95,
      industry: 75,
    },
    {
      metric: "Accuracy",
      current: 97.5,
      optimal: 99,
      industry: 95,
    },
    {
      metric: "Efficiency",
      current: 82,
      optimal: 90,
      industry: 78,
    },
    {
      metric: "Cost",
      current: 85,
      optimal: 95,
      industry: 80,
    },
    {
      metric: "Utilization",
      current: 78,
      optimal: 85,
      industry: 72,
    },
  ];

  // Simulate scenario
  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);

    const interval = setInterval(() => {
      setSimulationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  // Create custom scenario from sliders
  const createCustomScenario = (): SimulationScenario => {
    return {
      id: "custom",
      name: "Custom Scenario",
      description: "User-defined simulation parameters",
      variables: {
        orderVolume: orderVolume[0],
        staffLevel: staffLevel[0],
        automationLevel: automationLevel[0],
        peakFactor: peakFactor[0],
      },
    };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Digital Twin Simulation</h1>
        <p className="text-muted-foreground">
          Real-time virtual warehouse simulation for optimization and planning
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Live Throughput
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              950{" "}
              <span className="text-sm font-normal text-muted-foreground">
                orders/day
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> from baseline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Optimal range: 75-85%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Operating Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $12,500{" "}
              <span className="text-sm font-normal text-muted-foreground">
                /day
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-8%</span> vs budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Efficiency Score
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82/100</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3 points</span> this week
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="realtime">Real-Time Twin</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="whatif">What-If Analysis</TabsTrigger>
        </TabsList>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className={
                  selectedScenario?.id === scenario.id ? "border-primary" : ""
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{scenario.name}</CardTitle>
                      <CardDescription>{scenario.description}</CardDescription>
                    </div>
                    <Button
                      variant={
                        selectedScenario?.id === scenario.id
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedScenario(scenario)}
                    >
                      Select
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Variables */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">
                        Order Volume
                      </div>
                      <div className="font-medium">
                        {scenario.variables.orderVolume}/day
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        Staff Level
                      </div>
                      <div className="font-medium">
                        {scenario.variables.staffLevel} workers
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        Automation
                      </div>
                      <div className="font-medium">
                        {scenario.variables.automationLevel}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">
                        Peak Factor
                      </div>
                      <div className="font-medium">
                        {scenario.variables.peakFactor}x
                      </div>
                    </div>
                  </div>

                  {/* Results */}
                  {scenario.results && (
                    <>
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium mb-2">
                          Simulation Results:
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Throughput:
                            </span>
                            <span className="font-medium">
                              {scenario.results.throughput}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Utilization:
                            </span>
                            <span className="font-medium">
                              {scenario.results.utilization}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Cost:</span>
                            <span className="font-medium">
                              ${scenario.results.cost}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Accuracy:
                            </span>
                            <span className="font-medium text-green-600">
                              {scenario.results.accuracy}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={runSimulation}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Run Simulation
                        </Button>
                        <Button variant="outline" size="sm">
                          Compare
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Scenario Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison</CardTitle>
              <CardDescription>
                Compare performance across different scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="throughput" fill="#3b82f6" name="Throughput" />
                  <Bar dataKey="cost" fill="#ef4444" name="Cost (÷100)" />
                  <Bar dataKey="accuracy" fill="#10b981" name="Accuracy %" />
                  <Bar dataKey="efficiency" fill="#f59e0b" name="Efficiency" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-Time Twin Tab */}
        <TabsContent value="realtime" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Live Simulation Status */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Warehouse Twin</CardTitle>
                    <CardDescription>
                      Real-time synchronization with physical warehouse
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="animate-pulse">
                    🟢 Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={realtimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="throughput"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Throughput"
                    />
                    <Area
                      type="monotone"
                      dataKey="utilization"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Utilization %"
                    />
                    <Area
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.6}
                      name="Accuracy %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
                <CardDescription>Live warehouse metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Active Workers</span>
                    </div>
                    <span className="font-medium">23/25</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Orders in Progress</span>
                    </div>
                    <span className="font-medium">142</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span>Outbound Shipments</span>
                    </div>
                    <span className="font-medium">67</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>Automation Active</span>
                    </div>
                    <span className="font-medium text-green-600">Yes</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Sync Status:</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Sync:</span>
                      <span className="font-medium">2 sec ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Data Points:
                      </span>
                      <span className="font-medium">1,247</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Accuracy:</span>
                      <span className="font-medium text-green-600">99.8%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resource Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>
                Real-time capacity and utilization tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resourceData.map((resource) => (
                  <div key={resource.resource}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {resource.resource}
                      </span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Current:{" "}
                          <span className="font-medium">
                            {resource.current}%
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          Optimal:{" "}
                          <span className="font-medium text-blue-600">
                            {resource.optimal}%
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={resource.current} className="h-3" />
                      <div
                        className="absolute top-0 h-3 w-0.5 bg-blue-600"
                        style={{ left: `${resource.optimal}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>
                  Current vs Optimal vs Industry Average
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={performanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Current"
                      dataKey="current"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Optimal"
                      dataKey="optimal"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Industry"
                      dataKey="industry"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Optimization Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI Optimization Recommendations</CardTitle>
                <CardDescription>Data-driven improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        Increase automation to 60%
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Expected: +12% throughput, -$2,300/day cost
                      </div>
                      <Button size="sm">Apply Recommendation</Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        Optimize staff scheduling
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Expected: +8% utilization, same throughput
                      </div>
                      <Button size="sm">View Schedule</Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Zap className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        Implement dynamic slotting
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Expected: -15% pick time, +5% accuracy
                      </div>
                      <Button size="sm">Configure</Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        Add 2 dock doors
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Expected: Eliminate bottleneck, +18% peak capacity
                      </div>
                      <Button size="sm">Simulate Impact</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* What-If Analysis Tab */}
        <TabsContent value="whatif" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What-If Scenario Builder</CardTitle>
              <CardDescription>
                Adjust variables to see predicted outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Order Volume: {orderVolume[0]} orders/day</Label>
                  <Slider
                    value={orderVolume}
                    onValueChange={setOrderVolume}
                    min={500}
                    max={3000}
                    step={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Staff Level: {staffLevel[0]} workers</Label>
                  <Slider
                    value={staffLevel}
                    onValueChange={setStaffLevel}
                    min={10}
                    max={50}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Automation Level: {automationLevel[0]}%</Label>
                  <Slider
                    value={automationLevel}
                    onValueChange={setAutomationLevel}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Peak Factor: {peakFactor[0]}x</Label>
                  <Slider
                    value={peakFactor}
                    onValueChange={setPeakFactor}
                    min={1}
                    max={3}
                    step={0.1}
                  />
                </div>
              </div>

              {isSimulating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Running simulation...</span>
                    <span>{simulationProgress}%</span>
                  </div>
                  <Progress value={simulationProgress} />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={runSimulation}
                  disabled={isSimulating}
                >
                  {isSimulating ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Simulation
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOrderVolume([1000]);
                    setStaffLevel([25]);
                    setAutomationLevel([50]);
                    setPeakFactor([1.5]);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {simulationProgress === 100 && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium mb-2">
                        Simulation Complete
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">
                            Predicted Throughput:
                          </div>
                          <div className="font-medium text-lg">
                            {Math.round(orderVolume[0] * 0.95)} orders/day
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Predicted Cost:
                          </div>
                          <div className="font-medium text-lg">
                            $
                            {Math.round(
                              staffLevel[0] * 500 +
                                (100 - automationLevel[0]) * 50,
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Utilization:
                          </div>
                          <div className="font-medium text-lg">
                            {Math.round(75 + automationLevel[0] / 10)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Accuracy:</div>
                          <div className="font-medium text-lg text-green-600">
                            {(95 + automationLevel[0] / 25).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Button className="mt-3" size="sm">
                        Save Scenario
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
