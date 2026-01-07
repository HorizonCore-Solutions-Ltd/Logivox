/**
 * Reporting & Analytics Dashboard
 * Comprehensive UI for reports, KPIs, analytics, and business intelligence
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package,
  Download,
  FileText,
  Calendar,
  Filter,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface InventoryValuation {
  sku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  category: string;
  aging: number;
}

interface OrderFulfillment {
  date: string;
  totalOrders: number;
  shipped: number;
  cancelled: number;
  avgFulfillmentTime: number;
  fulfillmentRate: number;
}

interface KPIMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  target: number;
}

interface ABCAnalysis {
  category: 'A' | 'B' | 'C';
  itemCount: number;
  percentage: number;
  revenue: number;
  revenuePercentage: number;
}

interface StockAlert {
  sku: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  daysToStockout: number;
  recommendedOrder: number;
  alertType: 'STOCKOUT' | 'LOW_STOCK' | 'OVERSTOCK' | 'SLOW_MOVING';
}

interface ReportSummary {
  totalInventoryValue: number;
  totalOrders: number;
  fulfillmentRate: number;
  avgTurnoverRate: number;
  warehouseUtilization: number;
  orderAccuracy: number;
  pickAccuracy: number;
  onTimeDelivery: number;
}

export default function ReportingDashboard() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [inventoryValuation, setInventoryValuation] = useState<InventoryValuation[]>([]);
  const [fulfillmentData, setFulfillmentData] = useState<OrderFulfillment[]>([]);
  const [kpis, setKpis] = useState<KPIMetric[]>([]);
  const [abcAnalysis, setAbcAnalysis] = useState<ABCAnalysis[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load KPI Dashboard
      const kpiResponse = await fetch(`/api/reporting?action=kpi-dashboard&dateRange=${dateRange}`);
      const kpiData = await kpiResponse.json();
      setKpis(kpiData.kpis || []);
      setSummary(kpiData.summary);

      // Load Inventory Valuation
      const valuationResponse = await fetch('/api/reporting?action=inventory-valuation');
      const valuationData = await valuationResponse.json();
      setInventoryValuation(valuationData.items || []);

      // Load Order Fulfillment
      const fulfillmentResponse = await fetch(`/api/reporting?action=order-fulfillment&dateRange=${dateRange}`);
      const fulfillmentData = await fulfillmentResponse.json();
      setFulfillmentData(fulfillmentData.daily || []);

      // Load ABC Analysis
      const abcResponse = await fetch('/api/reporting?action=abc-analysis');
      const abcData = await abcResponse.json();
      setAbcAnalysis(abcData.categories || []);

      // Load Stock Alerts
      const alertsResponse = await fetch('/api/reporting?action=stock-alerts');
      const alertsData = await alertsResponse.json();
      setStockAlerts(alertsData.alerts || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType: string) => {
    try {
      const response = await fetch('/api/reporting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export-report',
          reportType,
          format: 'CSV',
          dateRange
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Trigger download
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'UP') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'DOWN') return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getAlertBadge = (alertType: string) => {
    const config = {
      STOCKOUT: { variant: 'destructive' as const, label: 'Stockout' },
      LOW_STOCK: { variant: 'warning' as const, label: 'Low Stock' },
      OVERSTOCK: { variant: 'secondary' as const, label: 'Overstock' },
      SLOW_MOVING: { variant: 'secondary' as const, label: 'Slow Moving' },
    };

    const alert = config[alertType as keyof typeof config] || config.LOW_STOCK;

    return (
      <Badge variant={alert.variant}>
        {alert.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading reporting dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Business intelligence, KPIs, and comprehensive reports
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1day">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(summary.totalInventoryValue / 1000000).toFixed(2)}M
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.avgTurnoverRate.toFixed(1)}x turnover rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Order Volume</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {summary.fulfillmentRate.toFixed(1)}% fulfillment rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warehouse Utilization</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.warehouseUtilization.toFixed(1)}%</div>
              <Progress value={summary.warehouseUtilization} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.orderAccuracy.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {summary.pickAccuracy.toFixed(1)}% pick accuracy
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
          <TabsTrigger value="abc">ABC Analysis</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Critical business metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {kpis.slice(0, 6).map((kpi, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(kpi.trend)}
                      <span className="font-medium">{kpi.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {kpi.value.toFixed(1)}{kpi.unit}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Target: {kpi.target}{kpi.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Alerts</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Alert</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockAlerts.slice(0, 5).map((alert, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{alert.sku}</TableCell>
                        <TableCell>{alert.currentStock}</TableCell>
                        <TableCell>{getAlertBadge(alert.alertType)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>KPI Dashboard</CardTitle>
                <CardDescription>Comprehensive performance metrics</CardDescription>
              </div>
              <Button onClick={() => exportReport('kpi-dashboard')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((kpi, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">{kpi.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">
                              {kpi.value.toFixed(1)}{kpi.unit}
                            </span>
                            {getTrendIcon(kpi.trend)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress to Target</span>
                          <span>{((kpi.value / kpi.target) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={(kpi.value / kpi.target) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inventory Valuation</CardTitle>
                <CardDescription>Current inventory value and aging</CardDescription>
              </div>
              <Button onClick={() => exportReport('inventory-valuation')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Aging (days)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryValuation.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.quantity.toLocaleString()}</TableCell>
                      <TableCell>${item.unitCost.toFixed(2)}</TableCell>
                      <TableCell className="font-bold">${item.totalValue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={item.aging > 90 ? 'destructive' : item.aging > 60 ? 'warning' : 'secondary'}>
                          {item.aging} days
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={5}>TOTAL INVENTORY VALUE</TableCell>
                    <TableCell>
                      ${inventoryValuation.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fulfillment" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Order Fulfillment Performance</CardTitle>
                <CardDescription>Daily fulfillment metrics and trends</CardDescription>
              </div>
              <Button onClick={() => exportReport('order-fulfillment')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Shipped</TableHead>
                    <TableHead>Cancelled</TableHead>
                    <TableHead>Avg Fulfillment Time</TableHead>
                    <TableHead>Fulfillment Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fulfillmentData.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-bold">{day.totalOrders}</TableCell>
                      <TableCell className="text-green-600">{day.shipped}</TableCell>
                      <TableCell className="text-red-600">{day.cancelled}</TableCell>
                      <TableCell>{day.avgFulfillmentTime.toFixed(1)}h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={day.fulfillmentRate} className="h-2 w-16" />
                          <span className="text-sm font-bold">{day.fulfillmentRate.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abc" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>ABC Analysis</CardTitle>
                <CardDescription>Inventory classification by value</CardDescription>
              </div>
              <Button onClick={() => exportReport('abc-analysis')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {abcAnalysis.map((category) => (
                  <Card key={category.category}>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${
                          category.category === 'A' ? 'text-green-600' :
                          category.category === 'B' ? 'text-blue-600' :
                          'text-orange-600'
                        }`}>
                          Category {category.category}
                        </div>
                        <div className="mt-4 space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Items</p>
                            <p className="text-xl font-bold">{category.itemCount}</p>
                            <p className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}% of total</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="text-xl font-bold">${(category.revenue / 1000).toFixed(0)}K</p>
                            <p className="text-xs text-muted-foreground">{category.revenuePercentage.toFixed(1)}% of total</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Category A:</strong> High-value items (~20% of items, ~80% of revenue)</p>
                <p><strong>Category B:</strong> Medium-value items (~30% of items, ~15% of revenue)</p>
                <p><strong>Category C:</strong> Low-value items (~50% of items, ~5% of revenue)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Stock Alerts & Recommendations</CardTitle>
                <CardDescription>Items requiring immediate attention</CardDescription>
              </div>
              <Button onClick={() => exportReport('stock-alerts')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Reorder Point</TableHead>
                    <TableHead>Days to Stockout</TableHead>
                    <TableHead>Recommended Order</TableHead>
                    <TableHead>Alert Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockAlerts.map((alert, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">{alert.sku}</TableCell>
                      <TableCell className="font-medium">{alert.productName}</TableCell>
                      <TableCell className="font-bold">{alert.currentStock}</TableCell>
                      <TableCell>{alert.reorderPoint}</TableCell>
                      <TableCell>
                        <Badge variant={alert.daysToStockout < 7 ? 'destructive' : 'warning'}>
                          {alert.daysToStockout} days
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">{alert.recommendedOrder}</TableCell>
                      <TableCell>{getAlertBadge(alert.alertType)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Revenue, costs, and profitability</CardDescription>
              </div>
              <Button onClick={() => exportReport('financial-summary')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Inventory Value</p>
                    <p className="text-2xl font-bold">${(summary?.totalInventoryValue || 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Order Revenue</p>
                    <p className="text-2xl font-bold">$0.00</p>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Operating Costs</p>
                    <p className="text-2xl font-bold">$0.00</p>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Profit Margin</p>
                    <p className="text-2xl font-bold">0%</p>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
