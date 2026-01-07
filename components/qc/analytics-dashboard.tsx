'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
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
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface KPI {
  name: string;
  mtd: number;
  qtd: number;
  ytd: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
}

interface TrendData {
  period: string;
  ncr: number;
  capa: number;
  complaints: number;
  holds: number;
}

interface DepartmentData {
  department: string;
  defectRate: number;
  ncrCount: number;
  qualityScore: number;
}

interface ProductData {
  product: string;
  defects: number;
  fpy: number;
  complaints: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard({ organizationId }: { organizationId: string }) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpisRes, trendsRes, deptRes, prodRes] = await Promise.all([
          fetch(`/api/qc/analytics/kpis?organizationId=${organizationId}`),
          fetch(`/api/qc/analytics/trends?organizationId=${organizationId}`),
          fetch(`/api/qc/analytics/departments?organizationId=${organizationId}`),
          fetch(`/api/qc/analytics/products?organizationId=${organizationId}`)
        ]);

        const kpisData = await kpisRes.json();
        const trendsData = await trendsRes.json();
        const deptData = await deptRes.json();
        const prodData = await prodRes.json();

        setKpis(kpisData.kpis || []);
        setTrends(trendsData.trends || []);
        setDepartments(deptData.departments || []);
        setProducts(prodData.products || []);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId]);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="kpis" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kpis">Executive KPIs</TabsTrigger>
          <TabsTrigger value="trends">Quality Trends</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        {/* Executive KPIs Tab */}
        <TabsContent value="kpis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {kpi.name}
                    {kpi.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : kpi.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-gray-600" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-bold">{kpi.ytd.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">YTD</div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">MTD:</span>
                        <span className="font-medium ml-1">{kpi.mtd.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">QTD:</span>
                        <span className="font-medium ml-1">{kpi.qtd.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Target:</span>
                        <span className={kpi.ytd >= kpi.target ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {kpi.target}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quality Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Quality Trends (Last 12 Months)
              </CardTitle>
              <CardDescription>Historical analysis of quality metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ncr" stroke="#8884d8" name="NCRs" />
                  <Line type="monotone" dataKey="capa" stroke="#82ca9d" name="CAPAs" />
                  <Line type="monotone" dataKey="complaints" stroke="#ffc658" name="Complaints" />
                  <Line type="monotone" dataKey="holds" stroke="#ff7c7c" name="Holds" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance Comparison</CardTitle>
              <CardDescription>Quality metrics by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={departments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="qualityScore" fill="#8884d8" name="Quality Score" />
                  <Bar dataKey="ncrCount" fill="#82ca9d" name="NCR Count" />
                  <Bar dataKey="defectRate" fill="#ffc658" name="Defect Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departments.slice(0, 3).map((dept, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base">{dept.department}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Quality Score:</span>
                      <span className="font-medium">{dept.qualityScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">NCR Count:</span>
                      <span className="font-medium">{dept.ncrCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Defect Rate:</span>
                      <span className="font-medium">{dept.defectRate.toFixed(2)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Product Quality Analysis
              </CardTitle>
              <CardDescription>Defect distribution by product</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={products}
                    dataKey="defects"
                    nameKey="product"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label
                  >
                    {products.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base">{product.product}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Defects:</span>
                      <span className="font-medium">{product.defects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">First Pass Yield:</span>
                      <span className="font-medium">{product.fpy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Complaints:</span>
                      <span className="font-medium">{product.complaints}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
