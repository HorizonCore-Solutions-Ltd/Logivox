'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, TrendingUp, TrendingDown, Minus, Star, AlertTriangle, CheckCircle } from 'lucide-react';

interface SupplierMetrics {
  supplierId: string;
  supplierName: string;
  qualityScore: number;
  deliveryScore: number;
  costScore: number;
  responsiveScore: number;
  overallScore: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  trendChange: number;
  certifications: string[];
  activeIssues: number;
  onTimeDelivery: number;
  defectRate: number;
  avgLeadTime: number;
  priceVariance: number;
}

export default function SupplierRankingsPage() {
  const [suppliers, setSuppliers] = useState<SupplierMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'overall' | 'quality' | 'delivery' | 'cost' | 'responsive'>('overall');

  useEffect(() => {
    // Mock data - replace with API call
    const mockSuppliers: SupplierMetrics[] = [
      {
        supplierId: 'SUP001',
        supplierName: 'Acme Manufacturing Co.',
        qualityScore: 95,
        deliveryScore: 92,
        costScore: 88,
        responsiveScore: 90,
        overallScore: 91.25,
        rank: 1,
        trend: 'up',
        trendChange: 3.2,
        certifications: ['ISO 9001', 'ISO 14001', 'AS9100'],
        activeIssues: 1,
        onTimeDelivery: 97.5,
        defectRate: 0.8,
        avgLeadTime: 14,
        priceVariance: -2.1,
      },
      {
        supplierId: 'SUP002',
        supplierName: 'Global Parts Ltd.',
        qualityScore: 88,
        deliveryScore: 94,
        costScore: 92,
        responsiveScore: 87,
        overallScore: 90.25,
        rank: 2,
        trend: 'stable',
        trendChange: 0.5,
        certifications: ['ISO 9001'],
        activeIssues: 2,
        onTimeDelivery: 96.0,
        defectRate: 1.2,
        avgLeadTime: 12,
        priceVariance: 1.5,
      },
      {
        supplierId: 'SUP003',
        supplierName: 'Precision Components Inc.',
        qualityScore: 92,
        deliveryScore: 85,
        costScore: 90,
        responsiveScore: 88,
        overallScore: 88.75,
        rank: 3,
        trend: 'down',
        trendChange: -2.8,
        certifications: ['ISO 9001', 'IATF 16949'],
        activeIssues: 4,
        onTimeDelivery: 89.5,
        defectRate: 0.9,
        avgLeadTime: 18,
        priceVariance: -1.2,
      },
      {
        supplierId: 'SUP004',
        supplierName: 'Tech Solutions Corp.',
        qualityScore: 85,
        deliveryScore: 88,
        costScore: 85,
        responsiveScore: 92,
        overallScore: 87.5,
        rank: 4,
        trend: 'up',
        trendChange: 4.1,
        certifications: ['ISO 9001'],
        activeIssues: 3,
        onTimeDelivery: 91.0,
        defectRate: 1.5,
        avgLeadTime: 16,
        priceVariance: 3.2,
      },
      {
        supplierId: 'SUP005',
        supplierName: 'Standard Supplies Co.',
        qualityScore: 78,
        deliveryScore: 82,
        costScore: 95,
        responsiveScore: 80,
        overallScore: 83.75,
        rank: 5,
        trend: 'stable',
        trendChange: -0.3,
        certifications: [],
        activeIssues: 6,
        onTimeDelivery: 85.0,
        defectRate: 2.1,
        avgLeadTime: 20,
        priceVariance: -5.5,
      },
    ];

    setSuppliers(mockSuppliers);
    setLoading(false);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-600">Excellent</Badge>;
    if (score >= 80) return <Badge className="bg-yellow-600">Good</Badge>;
    if (score >= 70) return <Badge className="bg-orange-600">Fair</Badge>;
    return <Badge className="bg-red-600">Poor</Badge>;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const sortedSuppliers = [...suppliers].sort((a, b) => {
    switch (sortBy) {
      case 'quality':
        return b.qualityScore - a.qualityScore;
      case 'delivery':
        return b.deliveryScore - a.deliveryScore;
      case 'cost':
        return b.costScore - a.costScore;
      case 'responsive':
        return b.responsiveScore - a.responsiveScore;
      default:
        return b.overallScore - a.overallScore;
    }
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier Rankings & Scorecard</h1>
          <p className="text-muted-foreground">
            Comprehensive supplier performance comparison and rankings
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Excellent Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-600" />
              <div className="text-3xl font-bold text-green-600">
                {suppliers.filter(s => s.overallScore >= 90).length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="text-3xl font-bold text-orange-600">
                {suppliers.filter(s => s.overallScore < 80).length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(suppliers.reduce((sum, s) => sum + s.overallScore, 0) / suppliers.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sort Tabs */}
      <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
          <TabsTrigger value="responsive">Responsive</TabsTrigger>
        </TabsList>

        <TabsContent value={sortBy} className="space-y-4 mt-6">
          {sortedSuppliers.map((supplier, index) => (
            <Card key={supplier.supplierId}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  {/* Rank Badge */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                        index === 0
                          ? 'bg-yellow-400 text-yellow-900'
                          : index === 1
                          ? 'bg-gray-300 text-gray-700'
                          : index === 2
                          ? 'bg-orange-400 text-orange-900'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {getTrendIcon(supplier.trend)}
                      <span className="text-xs font-semibold">
                        {supplier.trendChange > 0 ? '+' : ''}
                        {supplier.trendChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Supplier Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{supplier.supplierName}</h3>
                        <p className="text-sm text-muted-foreground">{supplier.supplierId}</p>
                        <div className="flex gap-2 mt-2">
                          {supplier.certifications.map(cert => (
                            <Badge key={cert} variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-bold ${getScoreColor(supplier.overallScore)}`}>
                          {supplier.overallScore.toFixed(1)}
                        </div>
                        {getScoreBadge(supplier.overallScore)}
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Quality</span>
                          <span className={`text-sm font-bold ${getScoreColor(supplier.qualityScore)}`}>
                            {supplier.qualityScore}
                          </span>
                        </div>
                        <Progress value={supplier.qualityScore} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Delivery</span>
                          <span className={`text-sm font-bold ${getScoreColor(supplier.deliveryScore)}`}>
                            {supplier.deliveryScore}
                          </span>
                        </div>
                        <Progress value={supplier.deliveryScore} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Cost</span>
                          <span className={`text-sm font-bold ${getScoreColor(supplier.costScore)}`}>
                            {supplier.costScore}
                          </span>
                        </div>
                        <Progress value={supplier.costScore} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Responsive</span>
                          <span className={`text-sm font-bold ${getScoreColor(supplier.responsiveScore)}`}>
                            {supplier.responsiveScore}
                          </span>
                        </div>
                        <Progress value={supplier.responsiveScore} className="h-2" />
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground">On-Time Delivery</div>
                        <div className="text-lg font-semibold">{supplier.onTimeDelivery}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Defect Rate</div>
                        <div className="text-lg font-semibold">{supplier.defectRate}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Avg Lead Time</div>
                        <div className="text-lg font-semibold">{supplier.avgLeadTime} days</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Price Variance</div>
                        <div className={`text-lg font-semibold ${supplier.priceVariance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {supplier.priceVariance > 0 ? '+' : ''}{supplier.priceVariance}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Active Issues</div>
                        <div className={`text-lg font-semibold ${supplier.activeIssues === 0 ? 'text-green-600' : supplier.activeIssues <= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {supplier.activeIssues}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
