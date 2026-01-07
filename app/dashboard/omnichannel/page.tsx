"use client";

import React, { useState } from "react";
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
import {
  Store,
  Warehouse,
  ShoppingCart,
  Truck,
  Package,
  MapPin,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Globe,
  ShoppingBag,
  RefreshCw,
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface FulfillmentNode {
  id: string;
  name: string;
  type: "warehouse" | "store" | "dc" | "3pl";
  location: string;
  inventory: number;
  capacity: number;
  distance: number;
  averageShipTime: number;
  shippingCost: number;
  utilization: number;
}

interface Order {
  id: string;
  orderNumber: string;
  channel: "online" | "store" | "marketplace" | "b2b";
  customer: string;
  items: number;
  total: number;
  status: "routing" | "assigned" | "picking" | "shipped" | "delivered";
  fulfillmentNode: string;
  fulfillmentMethod:
    | "ship-from-warehouse"
    | "ship-from-store"
    | "buy-online-pickup-in-store"
    | "curbside";
  priority: "Standard" | "Express" | "Same-Day";
  createdAt: Date;
  promiseDate: Date;
}

export default function OmnichannelFulfillmentPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Sample fulfillment nodes
  const fulfillmentNodes: FulfillmentNode[] = [
    {
      id: "WH-001",
      name: "Central Distribution Center",
      type: "warehouse",
      location: "Chicago, IL",
      inventory: 45780,
      capacity: 100000,
      distance: 0,
      averageShipTime: 2.5,
      shippingCost: 8.5,
      utilization: 45.8,
    },
    {
      id: "WH-002",
      name: "West Coast Hub",
      type: "warehouse",
      location: "Los Angeles, CA",
      inventory: 32150,
      capacity: 75000,
      distance: 1800,
      averageShipTime: 3.2,
      shippingCost: 12.75,
      utilization: 42.9,
    },
    {
      id: "STORE-001",
      name: "Downtown Store",
      type: "store",
      location: "New York, NY",
      inventory: 1250,
      capacity: 2500,
      distance: 800,
      averageShipTime: 0.5,
      shippingCost: 4.25,
      utilization: 50.0,
    },
    {
      id: "STORE-002",
      name: "Mall Location",
      type: "store",
      location: "Miami, FL",
      inventory: 980,
      capacity: 2000,
      distance: 1200,
      averageShipTime: 0.8,
      shippingCost: 5.5,
      utilization: 49.0,
    },
    {
      id: "3PL-001",
      name: "Partner Fulfillment Center",
      type: "3pl",
      location: "Dallas, TX",
      inventory: 18500,
      capacity: 50000,
      distance: 900,
      averageShipTime: 2.8,
      shippingCost: 9.25,
      utilization: 37.0,
    },
  ];

  // Sample orders
  const orders: Order[] = [
    {
      id: "ORD-001",
      orderNumber: "WEB-12345",
      channel: "online",
      customer: "John Smith",
      items: 3,
      total: 157.5,
      status: "routing",
      fulfillmentNode: "Optimizing...",
      fulfillmentMethod: "ship-from-warehouse",
      priority: "Standard",
      createdAt: new Date(),
      promiseDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ORD-002",
      orderNumber: "BOPIS-789",
      channel: "store",
      customer: "Sarah Johnson",
      items: 2,
      total: 89.99,
      status: "assigned",
      fulfillmentNode: "STORE-001",
      fulfillmentMethod: "buy-online-pickup-in-store",
      priority: "Same-Day",
      createdAt: new Date(Date.now() - 3600000),
      promiseDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
    },
    {
      id: "ORD-003",
      orderNumber: "AMZ-45678",
      channel: "marketplace",
      customer: "Mike Davis",
      items: 1,
      total: 45.0,
      status: "picking",
      fulfillmentNode: "WH-001",
      fulfillmentMethod: "ship-from-warehouse",
      priority: "Express",
      createdAt: new Date(Date.now() - 7200000),
      promiseDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  ];

  // Channel performance data
  const channelData = [
    {
      channel: "Web",
      orders: 1245,
      revenue: 98500,
      fulfillment: 94.5,
      avgTime: 2.3,
    },
    {
      channel: "Store",
      orders: 567,
      revenue: 45600,
      fulfillment: 98.2,
      avgTime: 0.5,
    },
    {
      channel: "Marketplace",
      orders: 892,
      revenue: 67800,
      fulfillment: 92.1,
      avgTime: 2.8,
    },
    {
      channel: "Mobile App",
      orders: 734,
      revenue: 56700,
      fulfillment: 95.3,
      avgTime: 2.1,
    },
    {
      channel: "B2B",
      orders: 234,
      revenue: 156000,
      fulfillment: 96.8,
      avgTime: 3.5,
    },
  ];

  // Fulfillment method distribution
  const fulfillmentMethodData = [
    { method: "Ship from Warehouse", count: 1856, percentage: 62 },
    { method: "Ship from Store", count: 538, percentage: 18 },
    { method: "BOPIS", count: 358, percentage: 12 },
    { method: "Curbside Pickup", count: 148, percentage: 5 },
    { method: "Same-Day Delivery", count: 92, percentage: 3 },
  ];

  // Real-time routing data
  const routingData = [
    { time: "8AM", routed: 45, optimal: 42 },
    { time: "9AM", routed: 67, optimal: 65 },
    { time: "10AM", routed: 83, optimal: 79 },
    { time: "11AM", routed: 76, optimal: 74 },
    { time: "12PM", routed: 54, optimal: 52 },
    { time: "1PM", routed: 62, optimal: 60 },
    { time: "2PM", routed: 88, optimal: 85 },
    { time: "3PM", routed: 71, optimal: 69 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "online":
        return <Globe className="h-4 w-4" />;
      case "store":
        return <Store className="h-4 w-4" />;
      case "marketplace":
        return <ShoppingCart className="h-4 w-4" />;
      case "b2b":
        return <Package className="h-4 w-4" />;
      default:
        return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case "warehouse":
        return <Warehouse className="h-5 w-5" />;
      case "store":
        return <Store className="h-5 w-5" />;
      case "dc":
        return <Package className="h-5 w-5" />;
      case "3pl":
        return <Truck className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "routing":
        return "default";
      case "assigned":
        return "secondary";
      case "picking":
        return "default";
      case "shipped":
        return "default";
      case "delivered":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Omnichannel Fulfillment Hub</h1>
        <p className="text-muted-foreground">
          Intelligent order routing across warehouses, stores, and fulfillment
          centers
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Orders Today
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fulfillment Rate
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.8%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> vs last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Fulfillment Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1 days</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-12%</span> faster
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Network Utilization
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.3%</div>
            <p className="text-xs text-muted-foreground">
              Optimal range: 70-85%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="routing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="routing">Intelligent Routing</TabsTrigger>
          <TabsTrigger value="nodes">Fulfillment Nodes</TabsTrigger>
          <TabsTrigger value="channels">Channel Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Intelligent Routing Tab */}
        <TabsContent value="routing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Real-time Order Queue */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Real-Time Order Queue</CardTitle>
                    <CardDescription>
                      Orders being routed through intelligent algorithm
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {getChannelIcon(order.channel)}
                        </div>
                        <div>
                          <div className="font-medium">{order.orderNumber}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{order.customer}</span>
                            <span>•</span>
                            <span>{order.items} items</span>
                            <span>•</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={
                            order.priority === "Same-Day"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {order.priority}
                        </Badge>
                        <Badge variant={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing 3 of 247 orders in queue
                  </div>
                  <Button variant="outline" size="sm">
                    View All Orders
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Routing Algorithm Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Routing Intelligence</CardTitle>
                <CardDescription>
                  AI-powered optimization metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Cost Optimization:</span>
                    <span className="text-green-600 font-medium">94.2%</span>
                  </div>
                  <Progress value={94.2} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    $12,450 saved today vs standard routing
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Speed Optimization:</span>
                    <span className="text-blue-600 font-medium">91.8%</span>
                  </div>
                  <Progress value={91.8} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Average 1.2 days faster delivery
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Inventory Balance:</span>
                    <span className="text-purple-600 font-medium">87.5%</span>
                  </div>
                  <Progress value={87.5} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Even distribution across network
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-3">
                    Routing Factors:
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Inventory availability
                      </span>
                      <Badge variant="outline">35%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Distance to customer
                      </span>
                      <Badge variant="outline">25%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Shipping cost
                      </span>
                      <Badge variant="outline">20%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Node capacity
                      </span>
                      <Badge variant="outline">15%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Promise date
                      </span>
                      <Badge variant="outline">5%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Routing Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Routing Performance</CardTitle>
              <CardDescription>
                Orders routed vs optimal routing today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={routingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="routed"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="Orders Routed"
                  />
                  <Area
                    type="monotone"
                    dataKey="optimal"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Optimal Route"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fulfillment Nodes Tab */}
        <TabsContent value="nodes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {fulfillmentNodes.map((node) => (
              <Card key={node.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getNodeTypeIcon(node.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{node.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {node.location}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {node.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {node.inventory.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Inventory
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {node.averageShipTime}d
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg Ship Time
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        ${node.shippingCost}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg Cost
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Capacity Utilization:</span>
                      <span className="text-muted-foreground">
                        {node.utilization}%
                      </span>
                    </div>
                    <Progress value={node.utilization} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {node.capacity - node.inventory} units available
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Manage Inventory
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Channel Performance Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance Overview</CardTitle>
              <CardDescription>
                Sales and fulfillment metrics by channel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channelData.map((channel, index) => (
                  <div key={channel.channel} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${COLORS[index]}20`,
                            color: COLORS[index],
                          }}
                        >
                          {getChannelIcon(channel.channel.toLowerCase())}
                        </div>
                        <div>
                          <div className="font-medium">{channel.channel}</div>
                          <div className="text-sm text-muted-foreground">
                            {channel.orders} orders • $
                            {channel.revenue.toLocaleString()} revenue
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {channel.fulfillment}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Fulfillment Rate
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Orders</div>
                        <div className="font-medium">{channel.orders}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Avg Time
                        </div>
                        <div className="font-medium">
                          {channel.avgTime} days
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Revenue
                        </div>
                        <div className="font-medium">
                          ${channel.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Fulfillment Method Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Fulfillment Method Distribution</CardTitle>
                <CardDescription>
                  How orders are being fulfilled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fulfillmentMethodData.map((method, index) => (
                    <div key={method.method}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {method.method}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {method.count} orders ({method.percentage}%)
                        </span>
                      </div>
                      <Progress value={method.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Network Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Network Performance Insights</CardTitle>
                <CardDescription>
                  Key insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        Ship-from-store growing
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Up 23% this month, reducing delivery times by 1.5 days
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        BOPIS performing well
                      </div>
                      <div className="text-sm text-muted-foreground">
                        98.2% on-time pickup rate with high customer
                        satisfaction
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        West Coast Hub under-utilized
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Consider routing more orders to WH-002 (currently at
                        42.9%)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        Same-day delivery opportunity
                      </div>
                      <div className="text-sm text-muted-foreground">
                        67% of orders could qualify for same-day with optimized
                        routing
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Channel Revenue Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Channel Revenue Performance</CardTitle>
                <CardDescription>
                  Revenue and order volume by channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      fill="#3b82f6"
                      name="Revenue ($)"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="orders"
                      fill="#10b981"
                      name="Orders"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
