'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DollarSign,
  RefreshCw,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface Chargeback {
  id: string;
  chargebackNumber: string;
  vendor: { id: string; name: string };
  totalAmount: number;
  status: string;
  invoiceDate: string;
  paymentDue: string;
  disputed: boolean;
  paidAmount?: number;
  rtvIds: string[];
}

export default function VendorChargebacksPage() {
  const [loading, setLoading] = useState(true);
  const [chargebacks, setChargebacks] = useState<Chargeback[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const organizationId = 'org_123';

  useEffect(() => {
    fetchChargebacks();
    fetchStats();
  }, [filterStatus]);

  const fetchChargebacks = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockChargebacks: Chargeback[] = [
        {
          id: '1',
          chargebackNumber: 'CB-202601-0001',
          vendor: { id: 'v1', name: 'Acme Suppliers Inc.' },
          totalAmount: 15420.50,
          status: 'INVOICED',
          invoiceDate: '2026-01-03',
          paymentDue: '2026-02-02',
          disputed: false,
          rtvIds: ['RTV-001', 'RTV-002'],
        },
        {
          id: '2',
          chargebackNumber: 'CB-202601-0002',
          vendor: { id: 'v2', name: 'Global Trade Co.' },
          totalAmount: 8750.00,
          status: 'DISPUTED',
          invoiceDate: '2026-01-02',
          paymentDue: '2026-02-01',
          disputed: true,
          rtvIds: ['RTV-003'],
        },
        {
          id: '3',
          chargebackNumber: 'CB-202512-0045',
          vendor: { id: 'v3', name: 'Best Products Ltd.' },
          totalAmount: 22340.75,
          status: 'PAID',
          invoiceDate: '2025-12-15',
          paymentDue: '2026-01-14',
          disputed: false,
          paidAmount: 22340.75,
          rtvIds: ['RTV-004', 'RTV-005', 'RTV-006'],
        },
      ];

      setChargebacks(mockChargebacks);
    } catch (error) {
      console.error('Error fetching chargebacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // TODO: Replace with actual API call
      setStats({
        totalChargebacks: 48,
        totalAmount: 187650.25,
        paidAmount: 142320.50,
        pendingAmount: 38580.00,
        disputedAmount: 6749.75,
        collectionRate: 76,
        avgChargebackValue: 3909.38,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; text: string }> = {
      PENDING: { color: 'bg-yellow-500', icon: Clock, text: 'Pending' },
      APPROVED: { color: 'bg-blue-500', icon: CheckCircle, text: 'Approved' },
      INVOICED: { color: 'bg-purple-500', icon: FileText, text: 'Invoiced' },
      PAID: { color: 'bg-green-500', icon: DollarSign, text: 'Paid' },
      DISPUTED: { color: 'bg-red-500', icon: AlertTriangle, text: 'Disputed' },
      WRITTEN_OFF: { color: 'bg-gray-500', icon: XCircle, text: 'Written Off' },
    };

    const { color, icon: Icon, text } = config[status] || config.PENDING;
    return (
      <Badge className={`${color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  const filteredChargebacks = chargebacks.filter(cb => {
    const matchesStatus = filterStatus === 'ALL' || cb.status === filterStatus;
    const matchesSearch = cb.chargebackNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cb.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
            <DollarSign className="w-8 h-8" />
            Vendor Chargebacks
          </h1>
          <p className="text-muted-foreground">
            Recover costs from defective merchandise and quality issues
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchChargebacks} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/qc/vendor-chargebacks/create">
            <Button>
              <DollarSign className="w-4 h-4 mr-2" />
              Create Chargeback
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalChargebacks} chargebacks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.paidAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.collectionRate}% collection rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ${stats.pendingAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disputed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${stats.disputedAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Under review
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search by chargeback # or vendor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'INVOICED', 'PAID', 'DISPUTED'].map((status) => (
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

      {/* Chargebacks List */}
      <div className="space-y-4">
        {filteredChargebacks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No chargebacks found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Create your first chargeback to recover costs'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredChargebacks.map((chargeback) => (
            <Card key={chargeback.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{chargeback.chargebackNumber}</h3>
                      {getStatusBadge(chargeback.status)}
                      {chargeback.disputed && (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Disputed
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">
                      <strong>Vendor:</strong> {chargeback.vendor.name}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-semibold text-lg">
                          ${chargeback.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Invoice Date</p>
                        <p className="font-medium">
                          {new Date(chargeback.invoiceDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Payment Due</p>
                        <p className="font-medium">
                          {new Date(chargeback.paymentDue).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Related RTVs</p>
                        <p className="font-medium">{chargeback.rtvIds.length} items</p>
                      </div>
                    </div>
                    {chargeback.paidAmount && (
                      <div className="mt-3 flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Paid: ${chargeback.paidAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <Link href={`/dashboard/qc/vendor-chargebacks/${chargeback.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Chargeback Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Chargeback Value</p>
                <p className="text-2xl font-bold">${stats?.avgChargebackValue?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collection Rate</p>
                <p className="text-2xl font-bold">{stats?.collectionRate || 0}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recovered (YTD)</p>
                <p className="text-2xl font-bold text-green-600">
                  ${stats?.paidAmount?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
