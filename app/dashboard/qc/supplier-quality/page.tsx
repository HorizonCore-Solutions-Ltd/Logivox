'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';

interface SupplierQuality {
  id: string;
  supplier: {
    id: string;
    name: string;
    email: string;
  };
  totalInspections: number;
  totalUnitsInspected: number;
  totalDefects: number;
  totalRtvCount: number;
  totalRtvValue: number;
  defectRate: number;
  passRate: number;
  qualityScore: number;
  reliabilityScore: number;
  responseScore: number;
  overallScore: number;
  status: string;
  tier: string;
  consecutiveGoodOrders: number;
  lastInspectionDate?: string;
  inspections90Days: number;
  unitsInspected90Days: number;
  defects90Days: number;
  defectRate90Days: number;
  updatedAt: string;
}

export default function SupplierQualityPage() {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<SupplierQuality[]>([]);
  const [filterTier, setFilterTier] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const organizationId = 'org_123';

  useEffect(() => {
    fetchSupplierQuality();
  }, [filterTier, filterStatus]);

  const fetchSupplierQuality = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ organizationId });
      if (filterTier !== 'ALL') params.append('tier', filterTier);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);

      const response = await fetch(`/api/qc/supplier-quality?${params}`);
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Error fetching supplier quality:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAllScores = async () => {
    try {
      setLoading(true);
      await fetch('/api/qc/supplier-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateAll', organizationId }),
      });
      await fetchSupplierQuality();
    } catch (error) {
      console.error('Error updating scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      PREMIUM: { color: 'bg-purple-500', icon: '👑' },
      STANDARD: { color: 'bg-blue-500', icon: '⭐' },
      BASIC: { color: 'bg-yellow-500', icon: '⚠️' },
      POOR: { color: 'bg-red-500', icon: '❌' },
    };

    const { color, icon } = config[tier] || config.BASIC;
    return (
      <Badge className={`${color} text-white`}>
        {icon} {tier}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      APPROVED: { color: 'bg-green-500', text: 'Approved' },
      PROBATION: { color: 'bg-yellow-500', text: 'Probation' },
      SUSPENDED: { color: 'bg-orange-500', text: 'Suspended' },
      BLOCKED: { color: 'bg-red-500', text: 'Blocked' },
    };

    const { color, text } = config[status] || config.APPROVED;
    return <Badge className={`${color} text-white`}>{text}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="w-8 h-8" />
            Supplier Quality Scorecard
          </h1>
          <p className="text-muted-foreground">
            Monitor and compare supplier performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSupplierQuality} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={updateAllScores}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Recalculate All
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {suppliers.filter((s) => s.tier === 'PREMIUM').length}
            </div>
            <div className="text-sm text-muted-foreground">Premium Suppliers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {suppliers.filter((s) => s.status === 'APPROVED').length}
            </div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {suppliers.filter((s) => s.status === 'PROBATION').length}
            </div>
            <div className="text-sm text-muted-foreground">On Probation</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {(
                suppliers.reduce((sum, s) => sum + s.overallScore, 0) / suppliers.length
              ).toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Quality Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <span className="text-sm font-medium">Tier:</span>
              {['ALL', 'PREMIUM', 'STANDARD', 'BASIC', 'POOR'].map((tier) => (
                <Button
                  key={tier}
                  variant={filterTier === tier ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTier(tier)}
                >
                  {tier}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <span className="text-sm font-medium">Status:</span>
              {['ALL', 'APPROVED', 'PROBATION', 'SUSPENDED', 'BLOCKED'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{supplier.supplier.name}</CardTitle>
                <div className="flex gap-2">
                  {getTierBadge(supplier.tier)}
                  {getStatusBadge(supplier.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Score</span>
                  <span className={`text-3xl font-bold ${getScoreColor(supplier.overallScore)}`}>
                    {supplier.overallScore.toFixed(0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${getScoreBarColor(supplier.overallScore)}`}
                    style={{ width: `${supplier.overallScore}%` }}
                  />
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className={`text-2xl font-bold ${getScoreColor(supplier.qualityScore)}`}>
                    {supplier.qualityScore.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Quality</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className={`text-2xl font-bold ${getScoreColor(supplier.reliabilityScore)}`}>
                    {supplier.reliabilityScore.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Reliability</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className={`text-2xl font-bold ${getScoreColor(supplier.responseScore)}`}>
                    {supplier.responseScore.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Response</div>
                </div>
              </div>

              {/* Lifetime Stats */}
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  LIFETIME METRICS
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Inspections:</span>{' '}
                    <span className="font-medium">{supplier.totalInspections}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Units:</span>{' '}
                    <span className="font-medium">{supplier.totalUnitsInspected.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Defects:</span>{' '}
                    <span className="font-medium text-red-600">{supplier.totalDefects}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Defect Rate:</span>{' '}
                    <span className="font-medium">{supplier.defectRate.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RTVs:</span>{' '}
                    <span className="font-medium">{supplier.totalRtvCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RTV Value:</span>{' '}
                    <span className="font-medium">${supplier.totalRtvValue.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* 90-Day Stats */}
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  LAST 90 DAYS
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Inspections:</span>{' '}
                    <span className="font-medium">{supplier.inspections90Days}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Units:</span>{' '}
                    <span className="font-medium">{supplier.unitsInspected90Days.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Defects:</span>{' '}
                    <span className="font-medium text-red-600">{supplier.defects90Days}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Defect Rate:</span>{' '}
                    <span className="font-medium">{supplier.defectRate90Days.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="flex gap-2 text-xs">
                {supplier.consecutiveGoodOrders > 0 && (
                  <Badge variant="outline" className="bg-green-50">
                    🔥 {supplier.consecutiveGoodOrders} consecutive good orders
                  </Badge>
                )}
                {supplier.defectRate90Days > supplier.defectRate && (
                  <Badge variant="outline" className="bg-red-50">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Defect rate rising
                  </Badge>
                )}
                {supplier.defectRate90Days < supplier.defectRate && (
                  <Badge variant="outline" className="bg-green-50">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Defect rate improving
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  View Inspections
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {suppliers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No supplier quality data found</p>
            <Button onClick={updateAllScores} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Calculate Scores
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
