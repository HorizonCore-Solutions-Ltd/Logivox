'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Package,
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Truck,
  DollarSign,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface RTVDetail {
  id: string;
  rtvNumber: string;
  supplier: { id: string; name: string; email: string; phone?: string };
  defect: {
    id: string;
    defectType: string;
    category: string;
    quantityAffected: number;
    description: string;
    photos: string[];
    item: { productName: string; sku: string };
  };
  quantity: number;
  value: number;
  status: string;
  priority: string;
  reason: string;
  vendorRmaNumber?: string;
  notifiedAt?: string;
  approvedAt?: string;
  shippedAt?: string;
  carrier?: string;
  trackingNumber?: string;
  shippingCost?: number;
  resolutionType?: string;
  creditAmount?: number;
  creditMemoNumber?: string;
  closedAt?: string;
  notes?: string;
  createdAt: string;
  activities: Array<{
    id: string;
    action: string;
    description: string;
    performedAt: string;
    performedBy: { name: string };
  }>;
}

export default function RTVDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rtv, setRtv] = useState<RTVDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [vendorRma, setVendorRma] = useState('');
  const [resolutionType, setResolutionType] = useState('');
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditMemo, setCreditMemo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchRTV();
  }, [id]);

  const fetchRTV = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/qc/rtv/${id}`);
      const data = await response.json();
      setRtv(data);
    } catch (error) {
      console.error('Error fetching RTV:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, payload?: any) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/qc/rtv/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });

      if (response.ok) {
        await fetchRTV();
      } else {
        alert('Action failed');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'bg-gray-500', text: 'Pending' },
      VENDOR_NOTIFIED: { color: 'bg-blue-500', text: 'Vendor Notified' },
      APPROVED: { color: 'bg-green-500', text: 'Approved' },
      REJECTED: { color: 'bg-red-500', text: 'Rejected' },
      SHIPPED: { color: 'bg-purple-500', text: 'Shipped' },
      CREDITED: { color: 'bg-teal-500', text: 'Credited' },
      CLOSED: { color: 'bg-gray-400', text: 'Closed' },
    };

    const { color, text } = config[status] || config.PENDING;
    return <Badge className={`${color} text-white`}>{text}</Badge>;
  };

  if (loading || !rtv) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/qc/rtv">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            {rtv.rtvNumber}
          </h1>
          <p className="text-muted-foreground">{rtv.supplier.name}</p>
        </div>
        {getStatusBadge(rtv.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product & Defect Info */}
          <Card>
            <CardHeader>
              <CardTitle>Defect Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Product</Label>
                <div className="font-medium">
                  {rtv.defect.item.productName} ({rtv.defect.item.sku})
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Defect Type</Label>
                  <div className="font-medium text-red-600">{rtv.defect.defectType}</div>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="font-medium">{rtv.defect.category}</div>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="text-sm">{rtv.defect.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity Affected</Label>
                  <div className="text-2xl font-bold">{rtv.quantity}</div>
                </div>
                <div>
                  <Label>Estimated Value</Label>
                  <div className="text-2xl font-bold text-green-600">
                    ${rtv.value.toFixed(2)}
                  </div>
                </div>
              </div>
              {rtv.defect.photos.length > 0 && (
                <div>
                  <Label>Photos</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {rtv.defect.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Defect ${idx + 1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Info */}
          {rtv.status === 'APPROVED' && (
            <Card>
              <CardHeader>
                <CardTitle>Ship RTV</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Carrier</Label>
                  <Input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="UPS, FedEx, USPS..."
                  />
                </div>
                <div>
                  <Label>Tracking Number</Label>
                  <Input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
                <div>
                  <Label>Shipping Cost ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button
                  onClick={() =>
                    handleAction('ship', {
                      carrier,
                      trackingNumber: tracking,
                      shippingCost: parseFloat(shippingCost),
                    })
                  }
                  disabled={!carrier || !tracking || actionLoading}
                  className="w-full"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Mark as Shipped
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Vendor Response */}
          {rtv.status === 'VENDOR_NOTIFIED' && (
            <Card>
              <CardHeader>
                <CardTitle>Record Vendor Response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Vendor RMA Number</Label>
                  <Input
                    value={vendorRma}
                    onChange={(e) => setVendorRma(e.target.value)}
                    placeholder="Enter RMA number from vendor"
                  />
                </div>
                <div>
                  <Label>Resolution Type</Label>
                  <select
                    value={resolutionType}
                    onChange={(e) => setResolutionType(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select resolution</option>
                    <option value="CREDIT">Credit</option>
                    <option value="REPLACEMENT">Replacement</option>
                    <option value="REFUSED">Refused</option>
                  </select>
                </div>
                <Button
                  onClick={() =>
                    handleAction('recordVendorResponse', {
                      vendorRmaNumber: vendorRma,
                      resolutionType,
                    })
                  }
                  disabled={!vendorRma || !resolutionType || actionLoading}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Record Response
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Credit Recording */}
          {rtv.status === 'SHIPPED' && rtv.resolutionType === 'CREDIT' && (
            <Card>
              <CardHeader>
                <CardTitle>Record Credit Received</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Credit Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Credit Memo Number</Label>
                  <Input
                    value={creditMemo}
                    onChange={(e) => setCreditMemo(e.target.value)}
                    placeholder="Enter credit memo number"
                  />
                </div>
                <Button
                  onClick={() =>
                    handleAction('recordCredit', {
                      creditAmount: parseFloat(creditAmount),
                      creditMemoNumber: creditMemo,
                    })
                  }
                  disabled={!creditAmount || !creditMemo || actionLoading}
                  className="w-full"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Credit
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rtv.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 pb-3 border-b last:border-0">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{activity.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {activity.performedBy.name} •{' '}
                        {new Date(activity.performedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Summary */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rtv.status === 'PENDING' && (
                <>
                  <Button
                    onClick={() => handleAction('notifyVendor')}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Notify Vendor
                  </Button>
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve RTV
                  </Button>
                  <Button
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) handleAction('reject', { reason });
                    }}
                    disabled={actionLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject RTV
                  </Button>
                </>
              )}
              {rtv.status === 'CREDITED' && (
                <Button
                  onClick={() => handleAction('close')}
                  disabled={actionLoading}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Close RTV
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>RTV Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                {getStatusBadge(rtv.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority:</span>
                <Badge>{rtv.priority}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(rtv.createdAt).toLocaleDateString()}</span>
              </div>
              {rtv.vendorRmaNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor RMA:</span>
                  <span className="font-medium">{rtv.vendorRmaNumber}</span>
                </div>
              )}
              {rtv.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking:</span>
                  <span className="font-mono text-xs">{rtv.trackingNumber}</span>
                </div>
              )}
              {rtv.resolutionType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolution:</span>
                  <span>{rtv.resolutionType}</span>
                </div>
              )}
              {rtv.creditAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credit Amount:</span>
                  <span className="font-bold text-green-600">
                    ${rtv.creditAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="text-muted-foreground">Name</div>
                <div className="font-medium">{rtv.supplier.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Email</div>
                <div className="font-medium">{rtv.supplier.email}</div>
              </div>
              {rtv.supplier.phone && (
                <div>
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">{rtv.supplier.phone}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
