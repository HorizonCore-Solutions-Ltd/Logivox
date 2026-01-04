'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  Package,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Plus,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

interface QCStats {
  inspections: {
    totalInspections: number;
    totalUnits: number;
    totalDefects: number;
    passedInspections: number;
    failedInspections: number;
    avgDefectRate: number;
    passRate: number;
  };
  rtv: {
    totalRTVs: number;
    totalValue: number;
    pendingRTVs: number;
    creditedRTVs: number;
  };
}

interface Inspection {
  id: string;
  inspectionNumber: string;
  supplier: { name: string };
  warehouse: { name: string };
  inspectionType: string;
  totalUnits: number;
  passedUnits: number;
  failedUnits: number;
  status: string;
  result: string | null;
  createdAt: string;
}

export default function QCDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QCStats | null>(null);
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);

  const organizationId = 'org_123'; // TODO: Get from auth context

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsRes, inspectionsRes] = await Promise.all([
        fetch(`/api/qc/stats?organizationId=${organizationId}`),
        fetch(`/api/qc/inspections?organizationId=${organizationId}`),
      ]);

      const statsData = await statsRes.json();
      const inspectionsData = await inspectionsRes.json();

      setStats(statsData);
      setRecentInspections(inspectionsData.inspections.slice(0, 10));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'bg-gray-500', text: 'Pending' },
      IN_PROGRESS: { color: 'bg-blue-500', text: 'In Progress' },
      COMPLETED: { color: 'bg-green-500', text: 'Completed' },
      CANCELLED: { color: 'bg-red-500', text: 'Cancelled' },
    };

    const { color, text } = config[status] || config.PENDING;
    return <Badge className={`${color} text-white`}>{text}</Badge>;
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return <Badge className="bg-gray-400 text-white">Pending</Badge>;

    const config: Record<string, { color: string; text: string }> = {
      PASS: { color: 'bg-green-500', text: 'Pass' },
      FAIL: { color: 'bg-red-500', text: 'Fail' },
      CONDITIONAL: { color: 'bg-yellow-500', text: 'Conditional' },
    };

    const { color, text } = config[result] || config.PASS;
    return <Badge className={`${color} text-white`}>{text}</Badge>;
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
            <ClipboardCheck className="w-8 h-8" />
            Quality Control
          </h1>
          <p className="text-muted-foreground">
            Receiving inspections and supplier quality management
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/qc/inspections/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Inspection
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Total Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.inspections.totalInspections || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.inspections.totalUnits || 0} units inspected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats?.inspections.passRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.inspections.passedInspections || 0} passed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Defect Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats?.inspections.avgDefectRate.toFixed(2) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.inspections.totalDefects || 0} defects found
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Active RTVs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats?.rtv.pendingRTVs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats?.rtv.totalValue.toFixed(2) || 0} total value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/qc/inspections">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ClipboardCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-lg">Inspections</div>
                  <div className="text-sm text-muted-foreground">
                    View all quality inspections
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/qc/rtv">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="font-bold text-lg">Return to Vendor</div>
                  <div className="text-sm text-muted-foreground">Manage RTVs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/qc/supplier-quality">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-lg">Supplier Quality</div>
                  <div className="text-sm text-muted-foreground">
                    View quality scorecards
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Inspections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentInspections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-2" />
                <p>No inspections found</p>
              </div>
            ) : (
              recentInspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <ClipboardCheck className="w-8 h-8 text-primary" />
                    <div>
                      <div className="font-bold">{inspection.inspectionNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {inspection.supplier.name} • {inspection.warehouse.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(inspection.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {inspection.totalUnits} units
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {inspection.passedUnits} passed / {inspection.failedUnits} failed
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(inspection.status)}
                      {getResultBadge(inspection.result)}
                    </div>
                    <Link href={`/dashboard/qc/inspections/${inspection.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
