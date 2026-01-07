/**
 * Shipping Operations Dashboard
 * Comprehensive UI for outbound shipments, carrier selection, rate shopping, and tracking
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Package, 
  DollarSign, 
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Plane,
  Ship
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Shipment {
  id: string;
  shipmentNumber: string;
  orderNumber: string;
  customerName: string;
  carrierName: string;
  serviceLevel: string;
  trackingNumber: string;
  status: 'DRAFT' | 'PENDING' | 'PICKED' | 'PACKED' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  totalWeight: number;
  shippingCost: number;
  destination: string;
  createdAt: string;
  shippedAt?: string;
  estimatedDelivery?: string;
}

interface CarrierRate {
  carrier: string;
  service: string;
  cost: number;
  transitDays: number;
  deliveryDate: string;
}

interface ShippingStats {
  totalShipments: number;
  pendingShipments: number;
  inTransit: number;
  delivered: number;
  totalShippingCost: number;
  avgShippingCost: number;
  onTimeDeliveryRate: number;
}

interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  location: string;
  estimatedDelivery: string;
  events: Array<{
    timestamp: string;
    status: string;
    location: string;
    description: string;
  }>;
}

export default function ShippingDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<ShippingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [carrierRates, setCarrierRates] = useState<CarrierRate[]>([]);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);

  // Form states
  const [newShipmentOrder, setNewShipmentOrder] = useState('');
  const [newShipmentCarrier, setNewShipmentCarrier] = useState('');
  const [trackingSearch, setTrackingSearch] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load shipments
      const shipmentsResponse = await fetch('/api/shipping?action=list-shipments');
      const shipmentsData = await shipmentsResponse.json();
      setShipments(shipmentsData.shipments || []);

      // Load statistics
      const statsResponse = await fetch('/api/shipping?action=statistics');
      const statsData = await statsResponse.json();
      setStats(statsData);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createShipment = async () => {
    try {
      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-shipment',
          orderId: newShipmentOrder,
          carrierCode: newShipmentCarrier,
          serviceLevel: 'STANDARD',
          destination: {
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US'
          }
        })
      });

      if (response.ok) {
        setNewShipmentOrder('');
        setNewShipmentCarrier('');
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to create shipment:', error);
    }
  };

  const getRates = async (shipmentId: string) => {
    try {
      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-rates',
          shipmentId,
          carriers: ['UPS', 'FedEx', 'USPS', 'DHL']
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCarrierRates(data.rates || []);
        setActiveTab('rate-shopping');
      }
    } catch (error) {
      console.error('Failed to get rates:', error);
    }
  };

  const selectCarrier = async (shipmentId: string, carrierId: string, rateId: string) => {
    try {
      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select-carrier',
          shipmentId,
          carrierId,
          rateId
        })
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to select carrier:', error);
    }
  };

  const generateLabel = async (shipmentId: string) => {
    try {
      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-label',
          shipmentId
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Download label
        if (data.labelUrl) {
          window.open(data.labelUrl, '_blank');
        }
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to generate label:', error);
    }
  };

  const trackShipment = async () => {
    try {
      const response = await fetch(`/api/shipping?action=track&trackingNumber=${trackingSearch}`);
      const data = await response.json();
      setTrackingInfo(data.tracking);
    } catch (error) {
      console.error('Failed to track shipment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary' as const, icon: Clock },
      PENDING: { variant: 'secondary' as const, icon: Clock },
      PICKED: { variant: 'default' as const, icon: Package },
      PACKED: { variant: 'default' as const, icon: Package },
      SHIPPED: { variant: 'default' as const, icon: Truck },
      IN_TRANSIT: { variant: 'default' as const, icon: Plane },
      DELIVERED: { variant: 'success' as const, icon: CheckCircle },
      CANCELLED: { variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading shipping dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="h-8 w-8" />
            Shipping Operations
          </h1>
          <p className="text-muted-foreground">
            Manage outbound shipments, carrier selection, and tracking
          </p>
        </div>
        <Button onClick={() => setActiveTab('create-shipment')}>
          <Package className="mr-2 h-4 w-4" />
          Create Shipment
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShipments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingShipments} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inTransit}</div>
              <p className="text-xs text-muted-foreground">
                {stats.onTimeDeliveryRate.toFixed(1)}% on-time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.delivered}</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipping Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalShippingCost.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                ${stats.avgShippingCost.toFixed(2)} avg/shipment
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="rate-shopping">Rate Shopping</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="create-shipment">Create Shipment</TabsTrigger>
          <TabsTrigger value="bulk-ship">Bulk Ship</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Shipments</CardTitle>
              <CardDescription>Latest shipment activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.slice(0, 10).map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.shipmentNumber}</TableCell>
                      <TableCell>{shipment.orderNumber}</TableCell>
                      <TableCell>{shipment.customerName}</TableCell>
                      <TableCell>{shipment.carrierName}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {shipment.trackingNumber || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>${shipment.shippingCost.toFixed(2)}</TableCell>
                      <TableCell>
                        {shipment.status === 'PENDING' && (
                          <Button size="sm" onClick={() => getRates(shipment.id)}>
                            Get Rates
                          </Button>
                        )}
                        {shipment.status === 'PACKED' && (
                          <Button size="sm" onClick={() => generateLabel(shipment.id)}>
                            Print Label
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Shipments</CardTitle>
              <CardDescription>View and manage all shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.shipmentNumber}</TableCell>
                      <TableCell>{shipment.orderNumber}</TableCell>
                      <TableCell>{shipment.customerName}</TableCell>
                      <TableCell>{shipment.carrierName}</TableCell>
                      <TableCell>{shipment.serviceLevel}</TableCell>
                      <TableCell>{shipment.destination}</TableCell>
                      <TableCell>{shipment.totalWeight} lbs</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>${shipment.shippingCost.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-shopping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carrier Rate Comparison</CardTitle>
              <CardDescription>Compare rates from different carriers</CardDescription>
            </CardHeader>
            <CardContent>
              {carrierRates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Transit Time</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carrierRates.map((rate, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{rate.carrier}</TableCell>
                        <TableCell>{rate.service}</TableCell>
                        <TableCell className="text-lg font-bold">
                          ${rate.cost.toFixed(2)}
                        </TableCell>
                        <TableCell>{rate.transitDays} days</TableCell>
                        <TableCell>
                          {new Date(rate.deliveryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => selectCarrier('shipment-id', rate.carrier, 'rate-id')}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No rates to display. Click "Get Rates" on a shipment to compare carriers.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Track Shipment</CardTitle>
              <CardDescription>Enter tracking number to track a shipment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter tracking number"
                  value={trackingSearch}
                  onChange={(e) => setTrackingSearch(e.target.value)}
                />
                <Button onClick={trackShipment}>Track</Button>
              </div>

              {trackingInfo && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Tracking Number</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {trackingInfo.trackingNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Carrier</p>
                      <p className="text-sm text-muted-foreground">{trackingInfo.carrier}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Current Status</p>
                      <p className="text-sm text-muted-foreground">{trackingInfo.status}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Current Location</p>
                      <p className="text-sm text-muted-foreground">{trackingInfo.location}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Tracking Events</h3>
                    <div className="space-y-2">
                      {trackingInfo.events.map((event, index) => (
                        <div key={index} className="border-l-2 border-primary pl-4 pb-2">
                          <p className="text-sm font-medium">{event.status}</p>
                          <p className="text-xs text-muted-foreground">{event.location}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                          <p className="text-sm">{event.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-shipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Shipment</CardTitle>
              <CardDescription>Create a new shipment for an order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order-number">Order Number</Label>
                  <Input
                    id="order-number"
                    placeholder="ORD-001"
                    value={newShipmentOrder}
                    onChange={(e) => setNewShipmentOrder(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier Code</Label>
                  <Select value={newShipmentCarrier} onValueChange={setNewShipmentCarrier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPS">UPS</SelectItem>
                      <SelectItem value="FEDEX">FedEx</SelectItem>
                      <SelectItem value="USPS">USPS</SelectItem>
                      <SelectItem value="DHL">DHL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createShipment} disabled={!newShipmentOrder || !newShipmentCarrier}>
                Create Shipment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-ship" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Ship Orders</CardTitle>
              <CardDescription>Process multiple shipments at once</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Select orders to ship in bulk. Rates will be automatically selected based on cost optimization.
              </p>
              <Button className="mt-4">Select Orders</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
