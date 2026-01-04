'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  RotateCcw,
  Package,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  ArrowRight,
  PackageX,
  Truck,
  Store,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Return {
  id: string;
  rmaNumber: string;
  orderNumber: string;
  customer: string;
  reason: string;
  reasonCategory: 'defective' | 'wrong-item' | 'not-as-described' | 'unwanted' | 'damaged' | 'other';
  status: 'pending' | 'approved' | 'received' | 'inspecting' | 'processing' | 'completed' | 'rejected';
  items: number;
  value: number;
  requestedDate: Date;
  receivedDate?: Date;
  resolution: 'refund' | 'exchange' | 'store-credit' | 'repair' | 'pending';
  channel: 'online' | 'store' | 'phone' | 'email';
  priority: 'Low' | 'Medium' | 'High';
}

export default function ReturnsManagementPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample returns data
  const returns: Return[] = [
    {
      id: 'RMA-001',
      rmaNumber: 'RMA-2024-001',
      orderNumber: 'ORD-12345',
      customer: 'John Smith',
      reason: 'Product arrived damaged',
      reasonCategory: 'damaged',
      status: 'inspecting',
      items: 1,
      value: 89.99,
      requestedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      resolution: 'pending',
      channel: 'online',
      priority: 'High',
    },
    {
      id: 'RMA-002',
      rmaNumber: 'RMA-2024-002',
      orderNumber: 'ORD-12346',
      customer: 'Sarah Johnson',
      reason: 'Wrong item shipped',
      reasonCategory: 'wrong-item',
      status: 'approved',
      items: 2,
      value: 145.50,
      requestedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      resolution: 'exchange',
      channel: 'phone',
      priority: 'High',
    },
    {
      id: 'RMA-003',
      rmaNumber: 'RMA-2024-003',
      orderNumber: 'ORD-12347',
      customer: 'Mike Davis',
      reason: 'Changed mind',
      reasonCategory: 'unwanted',
      status: 'received',
      items: 1,
      value: 65.00,
      requestedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(),
      resolution: 'refund',
      channel: 'online',
      priority: 'Medium',
    },
    {
      id: 'RMA-004',
      rmaNumber: 'RMA-2024-004',
      orderNumber: 'ORD-12348',
      customer: 'Emily Brown',
      reason: 'Defective product',
      reasonCategory: 'defective',
      status: 'processing',
      items: 1,
      value: 199.99,
      requestedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      resolution: 'refund',
      channel: 'email',
      priority: 'High',
    },
  ];

  // Returns trend data
  const trendData = [
    { month: 'Jan', returns: 234, rate: 8.2 },
    { month: 'Feb', returns: 198, rate: 7.1 },
    { month: 'Mar', returns: 267, rate: 8.9 },
    { month: 'Apr', returns: 189, rate: 6.5 },
    { month: 'May', returns: 223, rate: 7.4 },
    { month: 'Jun', returns: 201, rate: 6.8 },
  ];

  // Return reasons distribution
  const reasonData = [
    { reason: 'Defective', count: 342, percentage: 28 },
    { reason: 'Wrong Item', count: 256, percentage: 21 },
    { reason: 'Not as Described', count: 198, percentage: 16 },
    { reason: 'Unwanted/Changed Mind', count: 287, percentage: 24 },
    { reason: 'Damaged in Shipping', count: 134, percentage: 11 },
  ];

  // Resolution performance
  const resolutionData = [
    { resolution: 'Refund', count: 567, avgTime: 3.2, satisfaction: 94 },
    { resolution: 'Exchange', count: 234, avgTime: 5.1, satisfaction: 96 },
    { resolution: 'Store Credit', count: 189, avgTime: 2.5, satisfaction: 92 },
    { resolution: 'Repair', count: 67, avgTime: 8.3, satisfaction: 89 },
  ];

  // Channel performance
  const channelReturnData = [
    { channel: 'Online', returns: 745, rate: 8.5, avgValue: 87.50 },
    { channel: 'Store', returns: 234, rate: 4.2, avgValue: 65.30 },
    { channel: 'Phone', returns: 156, rate: 6.8, avgValue: 102.40 },
    { channel: 'Email', returns: 82, rate: 5.3, avgValue: 78.90 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'received':
        return 'default';
      case 'inspecting':
        return 'default';
      case 'processing':
        return 'default';
      case 'completed':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getReasonColor = (category: string) => {
    switch (category) {
      case 'defective':
        return 'destructive';
      case 'wrong-item':
        return 'destructive';
      case 'damaged':
        return 'destructive';
      case 'not-as-described':
        return 'default';
      case 'unwanted':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const totalReturns = returns.length;
  const pendingReturns = returns.filter(r => ['pending', 'approved', 'received'].includes(r.status)).length;
  const totalValue = returns.reduce((sum, r) => sum + r.value, 0);
  const avgProcessingTime = 3.8; // days

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Advanced Returns Management</h1>
        <p className="text-muted-foreground">
          Streamlined returns processing with automated workflows and analytics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Returns</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReturns}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6.8%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-0.7%</span> vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Pending resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProcessingTime} days</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-18%</span> faster
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Returns</TabsTrigger>
          <TabsTrigger value="initiate">Initiate Return</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
        </TabsList>

        {/* Active Returns Tab */}
        <TabsContent value="active" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by RMA, order number, or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="inspecting">Inspecting</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Returns List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Return Requests</CardTitle>
                  <CardDescription>Manage and process customer returns</CardDescription>
                </div>
                <Button>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {returns.map((returnItem) => (
                  <div key={returnItem.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <RotateCcw className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{returnItem.rmaNumber}</span>
                            <Badge variant={getStatusColor(returnItem.status)}>
                              {returnItem.status}
                            </Badge>
                            <Badge variant={returnItem.priority === 'High' ? 'destructive' : 'secondary'}>
                              {returnItem.priority}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Order {returnItem.orderNumber} • {returnItem.customer}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${returnItem.value.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{returnItem.items} item(s)</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Reason</div>
                        <Badge variant={getReasonColor(returnItem.reasonCategory)} className="text-xs">
                          {returnItem.reasonCategory}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Resolution</div>
                        <div className="font-medium capitalize">{returnItem.resolution}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Channel</div>
                        <div className="font-medium capitalize">{returnItem.channel}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Requested</div>
                        <div className="font-medium">
                          {Math.floor((Date.now() - returnItem.requestedDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>Reason:</strong> {returnItem.reason}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">View Details</Button>
                        <Button size="sm">Process Return</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Initiate Return Tab */}
        <TabsContent value="initiate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Initiate New Return</CardTitle>
              <CardDescription>Create a new return request for a customer</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order-number">Order Number *</Label>
                    <Input id="order-number" placeholder="ORD-12345" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Customer Email *</Label>
                    <Input id="customer-email" type="email" placeholder="customer@example.com" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="return-reason">Return Reason *</Label>
                  <Select required>
                    <SelectTrigger id="return-reason">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defective">Defective Product</SelectItem>
                      <SelectItem value="wrong-item">Wrong Item Shipped</SelectItem>
                      <SelectItem value="not-as-described">Not as Described</SelectItem>
                      <SelectItem value="unwanted">Unwanted/Changed Mind</SelectItem>
                      <SelectItem value="damaged">Damaged in Shipping</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason-details">Detailed Explanation *</Label>
                  <Textarea
                    id="reason-details"
                    placeholder="Please provide details about the return reason..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Requested Resolution *</Label>
                    <Select required>
                      <SelectTrigger id="resolution">
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="refund">Full Refund</SelectItem>
                        <SelectItem value="exchange">Exchange</SelectItem>
                        <SelectItem value="store-credit">Store Credit</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium">Automated Processing</div>
                    <div className="text-muted-foreground">
                      This return will be automatically reviewed based on your automation rules
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Create Return Request
                  </Button>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Returns Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Returns Trend</CardTitle>
                <CardDescription>Monthly returns volume and rate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="returns"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Returns"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="rate"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                      name="Return Rate %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Return Reasons */}
            <Card>
              <CardHeader>
                <CardTitle>Top Return Reasons</CardTitle>
                <CardDescription>Distribution of return reasons</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reasonData.map((reason, index) => (
                    <div key={reason.reason}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{reason.reason}</span>
                        <span className="text-sm text-muted-foreground">
                          {reason.count} ({reason.percentage}%)
                        </span>
                      </div>
                      <Progress value={reason.percentage} className="h-2" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Action Needed</div>
                      <div className="text-muted-foreground">
                        Defective returns up 15% - investigate quality issues
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resolution Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Resolution Performance</CardTitle>
                <CardDescription>Metrics by resolution type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resolutionData.map((resolution) => (
                    <div key={resolution.resolution} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{resolution.resolution}</span>
                        <Badge>{resolution.count} returns</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Avg Time</div>
                          <div className="font-medium">{resolution.avgTime} days</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Satisfaction</div>
                          <div className="font-medium text-green-600">{resolution.satisfaction}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channel Returns */}
            <Card>
              <CardHeader>
                <CardTitle>Returns by Channel</CardTitle>
                <CardDescription>Channel-specific return metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelReturnData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="returns" fill="#3b82f6" name="Returns" />
                    <Bar yAxisId="right" dataKey="rate" fill="#ef4444" name="Return Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights & Recommendations</CardTitle>
              <CardDescription>AI-powered insights to reduce returns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Return rate improving</div>
                    <div className="text-sm text-muted-foreground">
                      Down 0.7% this month thanks to better product descriptions
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Quality issue detected</div>
                    <div className="text-sm text-muted-foreground">
                      SKU-8374 has 24% defect rate - investigate supplier
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Fast processing paying off</div>
                    <div className="text-sm text-muted-foreground">
                      Customer satisfaction up 8% with sub-4-day processing
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                  <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Exchanges outperform refunds</div>
                    <div className="text-sm text-muted-foreground">
                      96% satisfaction with exchanges vs 94% for refunds
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Rules Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Return Rules</CardTitle>
              <CardDescription>Configure rules for automatic return processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">Auto-approve returns under $50</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically approve returns for orders less than $50
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Applied 234 times this month</span>
                    <Button variant="outline" size="sm">Edit Rule</Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">Fast-track defective returns</div>
                      <div className="text-sm text-muted-foreground">
                        Priority processing for defective product returns
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Applied 89 times this month</span>
                    <Button variant="outline" size="sm">Edit Rule</Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">Offer exchange first for high-value items</div>
                      <div className="text-sm text-muted-foreground">
                        Suggest exchange instead of refund for orders over $200
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Applied 45 times this month</span>
                    <Button variant="outline" size="sm">Edit Rule</Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">Block returns after 60 days</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically reject returns requested after 60 days
                      </div>
                    </div>
                    <Badge variant="secondary">Inactive</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Would have applied 12 times</span>
                    <Button variant="outline" size="sm">Activate Rule</Button>
                  </div>
                </div>

                <Button className="w-full">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create New Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
