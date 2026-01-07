'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertTriangle, CheckCircle, TrendingUp, FileText, BarChart3, LogOut, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SupplierUser {
  id: string;
  name: string;
  email: string;
  role: string;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
}

interface DashboardStats {
  openNCRs: number;
  pendingResponses: number;
  qualityScore: number;
  recentNCRs: Array<{
    id: string;
    ncrNumber: string;
    title: string;
    severity: string;
    reportDate: string;
    status: string;
  }>;
}

export default function SupplierDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<SupplierUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem('supplier_user');
    if (!storedUser) {
      router.push('/supplier/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);
    loadDashboardStats(userData.supplier.id);
  }, [router]);

  const loadDashboardStats = async (supplierId: string) => {
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`/api/supplier/dashboard?supplierId=${supplierId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load dashboard');

      const result = await response.json();
      setStats(result.data);
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('supplier_token');
    localStorage.removeItem('supplier_user');
    router.push('/supplier/login');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'MAJOR': return 'bg-orange-100 text-orange-800';
      case 'MINOR': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Supplier Portal</h1>
                <p className="text-sm text-muted-foreground">{user.supplier.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Welcome Message */}
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}!</h2>
          <p className="text-muted-foreground">Manage your quality communications and view performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                Open NCRs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.openNCRs || 0}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-600" />
                Pending Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.pendingResponses || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting your input</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                Quality Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.qualityScore || 0}%</div>
              <p className="text-xs text-muted-foreground">Current rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.recentNCRs?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total NCRs</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            className="h-24" 
            variant="outline"
            onClick={() => router.push('/supplier/ncr')}
          >
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold">View NCRs</div>
              <div className="text-xs text-muted-foreground">Review quality issues</div>
            </div>
          </Button>

          <Button 
            className="h-24" 
            variant="outline"
            onClick={() => router.push('/supplier/scorecard')}
          >
            <div className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold">Quality Scorecard</div>
              <div className="text-xs text-muted-foreground">View performance metrics</div>
            </div>
          </Button>

          <Button 
            className="h-24" 
            variant="outline"
            onClick={() => router.push('/supplier/documents')}
          >
            <div className="text-center">
              <Package className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold">Documents</div>
              <div className="text-xs text-muted-foreground">Quality agreements</div>
            </div>
          </Button>
        </div>

        {/* Recent NCRs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Non-Conformance Reports</CardTitle>
            <CardDescription>Latest quality issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {stats && stats.recentNCRs && stats.recentNCRs.length > 0 ? (
              <div className="space-y-3">
                {stats.recentNCRs.map((ncr) => (
                  <div 
                    key={ncr.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/supplier/ncr/${ncr.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge className={getSeverityColor(ncr.severity)}>
                          {ncr.severity}
                        </Badge>
                        <span className="font-medium">{ncr.ncrNumber}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(ncr.reportDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{ncr.title}</p>
                    </div>
                    <Badge variant="outline">{ncr.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No active NCRs. Great work maintaining quality standards!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
