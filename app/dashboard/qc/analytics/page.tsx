'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign,
  FileText,
  Users,
  Target,
  BarChart3,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface KPIData {
  totalNCRs: number;
  openCAPAs: number;
  criticalRisks: number;
  overdueAudits: number;
  totalClaims: number;
  qualityScore: number;
  ncrTrend: number;
  capaTrend: number;
}

interface TrendData {
  period: string;
  ncrs: number;
  capas: number;
  risks: number;
}

interface SupplierScore {
  name: string;
  score: number;
  ncrs: number;
}

interface SPCAlert {
  id: string;
  measurementType: string;
  rule: string;
  severity: string;
  timestamp: string;
}

interface ComplianceMetric {
  name: string;
  value: number;
  total: number;
  percentage: number;
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  
  const [kpis, setKpis] = useState<KPIData>({
    totalNCRs: 0,
    openCAPAs: 0,
    criticalRisks: 0,
    overdueAudits: 0,
    totalClaims: 0,
    qualityScore: 0,
    ncrTrend: 0,
    capaTrend: 0
  });

  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [supplierScores, setSupplierScores] = useState<SupplierScore[]>([]);
  const [spcAlerts, setSpcAlerts] = useState<SPCAlert[]>([]);
  const [compliance, setCompliance] = useState<ComplianceMetric[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const [kpiRes, trendRes] = await Promise.all([
        fetch(`/api/qc/analytics/kpis?period=${period}`),
        fetch(`/api/qc/analytics/trends?period=${period}`)
      ]);

      if (kpiRes.ok) {
        const kpiData = await kpiRes.json();
        setKpis(kpiData.data);
      }

      if (trendRes.ok) {
        const trendDataRes = await trendRes.json();
        setTrendData(trendDataRes.data.trends);
        setSupplierScores(trendDataRes.data.suppliers);
        setSpcAlerts(trendDataRes.data.spcAlerts);
        setCompliance(trendDataRes.data.compliance);
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-red-600';
    if (trend < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quality Analytics</h1>
          <p className="text-muted-foreground">Comprehensive quality management insights</p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="365">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total NCRs</CardDescription>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold">{kpis.totalNCRs}</div>
              {getTrendIcon(kpis.ncrTrend)}
              <span className={`text-sm ${getTrendColor(kpis.ncrTrend)}`}>
                {Math.abs(kpis.ncrTrend)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Open CAPAs</CardDescription>
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold">{kpis.openCAPAs}</div>
              {getTrendIcon(kpis.capaTrend)}
              <span className={`text-sm ${getTrendColor(kpis.capaTrend)}`}>
                {Math.abs(kpis.capaTrend)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Critical Risks</CardDescription>
              <Target className="w-5 h-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{kpis.criticalRisks}</div>
            <p className="text-xs text-muted-foreground mt-1">RPN ≥ 200</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Quality Score</CardDescription>
              <Activity className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{kpis.qualityScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost of Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Cost of Quality</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Claims</p>
              <p className="text-3xl font-bold">{formatCurrency(kpis.totalClaims)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average per NCR</p>
              <p className="text-3xl font-bold">
                {formatCurrency(kpis.totalNCRs > 0 ? kpis.totalClaims / kpis.totalNCRs : 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overdue Audits</p>
              <p className="text-3xl font-bold text-orange-600">{kpis.overdueAudits}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="spc">SPC Alerts</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Quality Trends</CardTitle>
              <CardDescription>NCRs, CAPAs, and Risks over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ncrs" stroke="#ef4444" name="NCRs" strokeWidth={2} />
                  <Line type="monotone" dataKey="capas" stroke="#f97316" name="CAPAs" strokeWidth={2} />
                  <Line type="monotone" dataKey="risks" stroke="#eab308" name="Risks" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Suppliers by Quality Score</CardTitle>
              <CardDescription>Best performing suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supplierScores.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                      <div>
                        <p className="font-semibold">{supplier.name}</p>
                        <p className="text-sm text-muted-foreground">{supplier.ncrs} NCRs</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{supplier.score}</div>
                      <p className="text-xs text-muted-foreground">Quality Score</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={supplierScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#22c55e" name="Quality Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SPC Alerts Tab */}
        <TabsContent value="spc">
          <Card>
            <CardHeader>
              <CardTitle>SPC Control Chart Alerts</CardTitle>
              <CardDescription>Out-of-control conditions detected</CardDescription>
            </CardHeader>
            <CardContent>
              {spcAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-600 mb-4" />
                  <p className="text-lg font-semibold">All Processes In Control</p>
                  <p className="text-sm text-muted-foreground">No Western Electric violations detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {spcAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-semibold">{alert.measurementType}</p>
                          <p className="text-sm text-muted-foreground">{alert.rule}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">{alert.severity}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>ISO 9001:2015 requirements tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {compliance.map((metric, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <span className="text-sm font-bold">{metric.value}/{metric.total}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          metric.percentage >= 90 ? 'bg-green-600' :
                          metric.percentage >= 70 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${metric.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{metric.percentage}% complete</p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={compliance}
                      dataKey="percentage"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.name}: ${entry.percentage}%`}
                    >
                      {compliance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
