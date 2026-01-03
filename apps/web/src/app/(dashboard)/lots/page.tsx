'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Search, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Barcode,
  TrendingUp
} from 'lucide-react';

interface LotTracking {
  id: string;
  lotNumber: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  manufacturingDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'QUARANTINE' | 'EXPIRED' | 'RECALLED';
  warehouseId: string;
  warehouseName: string;
  locationZone: string;
  notes?: string;
  daysUntilExpiry: number;
}

export default function LotTrackingPage() {
  const [lots, setLots] = useState<LotTracking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expiryFilter, setExpiryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLots();
  }, [statusFilter, expiryFilter]);

  const fetchLots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (expiryFilter !== 'ALL') params.append('expiry', expiryFilter);

      const response = await fetch(`/api/lots?${params}`);
      const data = await response.json();
      
      // Calculate days until expiry
      const lotsWithExpiry = (data.lots || []).map((lot: any) => ({
        ...lot,
        daysUntilExpiry: Math.floor(
          (new Date(lot.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
      }));
      
      setLots(lotsWithExpiry);
    } catch (error) {
      console.error('Error fetching lots:', error);
    } finally {
      setLoading(false);
    }
  };

  const quarantineLot = async (lotId: string) => {
    try {
      const response = await fetch(`/api/lots/${lotId}/quarantine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual quarantine' })
      });

      if (response.ok) {
        fetchLots();
      }
    } catch (error) {
      console.error('Error quarantining lot:', error);
    }
  };

  const recallLot = async (lotId: string) => {
    if (!confirm('Are you sure you want to recall this lot? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/lots/${lotId}/recall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Product recall' })
      });

      if (response.ok) {
        alert('Lot recalled successfully. All orders with this lot have been flagged.');
        fetchLots();
      }
    } catch (error) {
      console.error('Error recalling lot:', error);
    }
  };

  const filteredLots = lots.filter(lot => {
    const matchesSearch = 
      lot.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      QUARANTINE: 'bg-yellow-100 text-yellow-800',
      EXPIRED: 'bg-red-100 text-red-800',
      RECALLED: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || styles.ACTIVE;
  };

  const getExpiryBadge = (days: number) => {
    if (days < 0) {
      return { icon: AlertTriangle, color: 'text-red-600', text: 'EXPIRED' };
    } else if (days <= 30) {
      return { icon: AlertTriangle, color: 'text-orange-600', text: `${days} days` };
    } else if (days <= 90) {
      return { icon: Clock, color: 'text-yellow-600', text: `${days} days` };
    }
    return { icon: CheckCircle2, color: 'text-green-600', text: `${days} days` };
  };

  // Calculate statistics
  const stats = {
    total: lots.length,
    active: lots.filter(l => l.status === 'ACTIVE').length,
    expiringSoon: lots.filter(l => l.daysUntilExpiry > 0 && l.daysUntilExpiry <= 30).length,
    expired: lots.filter(l => l.daysUntilExpiry < 0).length,
    quarantine: lots.filter(l => l.status === 'QUARANTINE').length
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Lot Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage product lots with expiry dates and recalls
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Lots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quarantined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.quarantine}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by lot number, product name, or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="QUARANTINE">Quarantine</option>
                <option value="EXPIRED">Expired</option>
                <option value="RECALLED">Recalled</option>
              </select>

              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="ALL">All Expiry</option>
                <option value="EXPIRED">Expired</option>
                <option value="30_DAYS">Next 30 Days</option>
                <option value="90_DAYS">Next 90 Days</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lot Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading lots...
            </div>
          ) : filteredLots.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No lots found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Lot Number</th>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Quantity</th>
                    <th className="text-left p-4 font-medium">Location</th>
                    <th className="text-left p-4 font-medium">Manufactured</th>
                    <th className="text-left p-4 font-medium">Expiry</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLots.map(lot => {
                    const expiryBadge = getExpiryBadge(lot.daysUntilExpiry);
                    const ExpiryIcon = expiryBadge.icon;

                    return (
                      <tr key={lot.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Barcode className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono font-medium">
                              {lot.lotNumber}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{lot.productName}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {lot.sku}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{lot.quantity}</div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{lot.warehouseName}</div>
                            <div className="text-sm text-muted-foreground">
                              Zone: {lot.locationZone}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(lot.manufacturingDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <ExpiryIcon className={`h-4 w-4 ${expiryBadge.color}`} />
                            <div>
                              <div className="text-sm font-medium">
                                {new Date(lot.expiryDate).toLocaleDateString()}
                              </div>
                              <div className={`text-xs ${expiryBadge.color}`}>
                                {expiryBadge.text}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusBadge(lot.status)}>
                            {lot.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {lot.status === 'ACTIVE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => quarantineLot(lot.id)}
                              >
                                Quarantine
                              </Button>
                            )}
                            {(lot.status === 'ACTIVE' || lot.status === 'QUARANTINE') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => recallLot(lot.id)}
                              >
                                Recall
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expiry Timeline */}
      {stats.expiringSoon > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Expiry Timeline (Next 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLots
                .filter(lot => lot.daysUntilExpiry > 0 && lot.daysUntilExpiry <= 30)
                .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
                .map(lot => (
                  <div
                    key={lot.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{lot.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        Lot: {lot.lotNumber} • Qty: {lot.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-orange-600">
                        {lot.daysUntilExpiry} days
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(lot.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
