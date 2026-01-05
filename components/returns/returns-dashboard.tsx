'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Leaf,
  Globe,
  Shield,
  BarChart3,
  Users,
} from 'lucide-react';

interface ReturnsDashboardProps {
  organizationId: string;
}

export function ReturnsDashboard({ organizationId }: ReturnsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // TODO: Fetch real data from API
    setLoading(false);
    setStats({
      overview: {
        totalReturns: 1247,
        returnRate: 8.5,
        avgProcessingTime: 3.2,
        customerSatisfaction: 4.3,
      },
      financial: {
        totalCost: 187500,
        recovered: 112500,
        netLoss: 75000,
        instantRefunds: 45000,
      },
      prevention: {
        predictedReturns: 156,
        preventableReturns: 62,
        potentialSavings: 18600,
      },
      sustainability: {
        co2Saved: 1250,
        circularityScore: 82,
        itemsReused: 748,
        zeroWaste: false,
      },
    });
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Returns Management</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive returns analytics and automation
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalReturns.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">-2.3%</span> vs last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.returnRate}%</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                Below industry avg (10%)
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Loss</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.financial.netLoss / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">-18%</span> vs last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sustainability.co2Saved}kg</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs bg-green-50">
                🌱 {Math.round(stats.sustainability.co2Saved / 21)} trees equivalent
              </Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="instant-refund">Instant Refunds</TabsTrigger>
          <TabsTrigger value="prevention">Prevention</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
          <TabsTrigger value="cross-border">Cross-Border</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Processing Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Processing Performance
                </CardTitle>
                <CardDescription>Average return processing metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Processing Time</span>
                    <span className="text-2xl font-bold">{stats.overview.avgProcessingTime} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{stats.overview.customerSatisfaction}</span>
                      <span className="text-sm text-muted-foreground">/ 5.0</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <CheckCircle className="inline h-3 w-3 mr-1 text-green-500" />
                    85% returns processed within SLA
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Recovery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Recovery
                </CardTitle>
                <CardDescription>Value recovery from returns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Cost</span>
                    <span className="text-lg font-semibold">
                      ${(stats.financial.totalCost / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Value Recovered</span>
                    <span className="text-lg font-semibold text-green-600">
                      ${(stats.financial.recovered / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Recovery Rate: {((stats.financial.recovered / stats.financial.totalCost) * 100).toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="instant-refund" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Instant Refund Program
              </CardTitle>
              <CardDescription>Trust-based refunds before item receipt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Issued</div>
                    <div className="text-2xl font-bold">${(stats.financial.instantRefunds / 1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Verification Rate</div>
                    <div className="text-2xl font-bold text-green-600">97.8%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Chargebacks</div>
                    <div className="text-2xl font-bold text-red-600">2.2%</div>
                  </div>
                </div>
                <Button>View Pending Verifications</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prevention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Return Prevention Insights
              </CardTitle>
              <CardDescription>Proactive prevention opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Predicted Returns</div>
                    <div className="text-2xl font-bold">{stats.prevention.predictedReturns}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Preventable</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.prevention.preventableReturns}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Potential Savings</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${(stats.prevention.potentialSavings / 1000).toFixed(1)}K
                    </div>
                  </div>
                </div>
                <Button>View Prevention Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sustainability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Sustainability & ESG
              </CardTitle>
              <CardDescription>Environmental impact tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Circularity Score</div>
                    <div className="text-2xl font-bold">
                      {stats.sustainability.circularityScore}
                      <Badge variant="outline" className="ml-2">A</Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Items Reused</div>
                    <div className="text-2xl font-bold">{stats.sustainability.itemsReused}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">CO₂ Saved</div>
                    <div className="text-2xl font-bold">{stats.sustainability.co2Saved}kg</div>
                  </div>
                </div>
                <Button>Generate ESG Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cross-border" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Cross-Border Returns
              </CardTitle>
              <CardDescription>International return management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Cross-border returns tracking, customs clearance, and duty refunds
                </div>
                <Button>View International Returns</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
