'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface YardMetrics {
  trucksInYard: number;
  averageWaitTime: number;
  docksInUse: number;
  availableDocks: number;
  todayTrucks: number;
  avgDwellTime: number;
  detentionEvents: number;
  onTimePercentage: number;
}

interface ParkingSpot {
  spotNumber: string;
  type: string;
  status: string;
  truckNumber: string | null;
  occupiedSince: string | null;
}

interface YardTruck {
  id: string;
  truckNumber: string;
  carrier: string;
  driverName: string;
  driverPhone: string;
  status: string;
  checkInTime: string;
  parkingSpot?: string;
  dockNumber?: number;
  appointmentTime: string;
  priority: string;
}

interface DetentionEvent {
  id: string;
  truckNumber: string;
  carrier: string;
  detentionMinutes: number;
  reason: string;
  chargeable: boolean;
  timestamp: string;
  cost: number;
}

export default function YardManagement() {
  const [metrics, setMetrics] = useState<YardMetrics | null>(null);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [trucksInYard, setTrucksInYard] = useState<YardTruck[]>([]);
  const [detentionEvents, setDetentionEvents] = useState<DetentionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    fetchYardData();
    const interval = setInterval(fetchYardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchYardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, detentionRes] = await Promise.all([
        fetch('/api/receiving/yard-management?action=yard_overview'),
        fetch('/api/receiving/yard-management?action=detention_events'),
      ]);

      const overviewData = await overviewRes.json();
      const detentionData = await detentionRes.json();

      setMetrics(overviewData.metrics);
      setParkingSpots(overviewData.parkingSpots || []);
      setTrucksInYard(overviewData.trucksInYard || []);
      setDetentionEvents(detentionData.events || []);
    } catch (error) {
      console.error('Failed to fetch yard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallToDock = async (truckId: string, dockNumber: number) => {
    try {
      const response = await fetch('/api/receiving/yard-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'call_to_dock',
          truckId,
          dockNumber,
          priority: 'NORMAL',
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Truck called to dock ${dockNumber}`);
        fetchYardData();
      }
    } catch (error) {
      alert('Failed to call truck to dock');
    }
  };

  const handleCheckOut = async (truckId: string) => {
    try {
      const response = await fetch('/api/receiving/yard-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_out_truck',
          truckId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Truck checked out successfully');
        fetchYardData();
      }
    } catch (error) {
      alert('Failed to check out truck');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
      case 'WAITING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CALLED_TO_DOCK':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'AT_DOCK':
      case 'UNLOADING':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpotColor = (status: string) => {
    return status === 'OCCUPIED'
      ? 'bg-red-50 border-red-300'
      : 'bg-green-50 border-green-300';
  };

  const formatDuration = (startTime: string) => {
    const minutes = Math.floor(
      (Date.now() - new Date(startTime).getTime()) / 1000 / 60
    );
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No yard data available</p>
          <Button onClick={fetchYardData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🚚 Yard Management</h1>
          <p className="text-gray-600">
            Real-time truck tracking and yard operations
          </p>
        </div>
        <Button onClick={() => setShowCheckIn(!showCheckIn)}>
          {showCheckIn ? '✕ Cancel' : '➕ Check In Truck'}
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Trucks in Yard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics.trucksInYard}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {metrics.todayTrucks} today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Wait Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {metrics.averageWaitTime}m
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Target: &lt;20 minutes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Dock Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {metrics.docksInUse}/12
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {metrics.availableDocks} available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              On-Time %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {metrics.onTimePercentage}%
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {metrics.detentionEvents} detention events
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check In Form */}
      {showCheckIn && (
        <Card className="border-blue-500 border-2">
          <CardHeader>
            <CardTitle>Check In Truck</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Truck Number
                </label>
                <Input placeholder="e.g., TRUCK-101" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Carrier
                </label>
                <Input placeholder="e.g., ABC Transport" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Driver Name
                </label>
                <Input placeholder="e.g., John Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Driver Phone
                </label>
                <Input placeholder="555-0101" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Trailer Number (Optional)
                </label>
                <Input placeholder="e.g., TRL-456" />
              </div>
              <div className="col-span-2 flex gap-2">
                <Button className="flex-1">Check In</Button>
                <Button variant="outline" onClick={() => setShowCheckIn(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="trucks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trucks">
            🚛 Trucks ({trucksInYard.length})
          </TabsTrigger>
          <TabsTrigger value="parking">
            🅿️ Parking ({parkingSpots.length})
          </TabsTrigger>
          <TabsTrigger value="detention">
            ⏱️ Detention ({detentionEvents.length})
          </TabsTrigger>
          <TabsTrigger value="roi">💰 ROI</TabsTrigger>
        </TabsList>

        {/* Trucks Tab */}
        <TabsContent value="trucks" className="space-y-3">
          {trucksInYard.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-3">🚚</div>
                <p className="text-gray-600">No trucks in yard</p>
              </CardContent>
            </Card>
          ) : (
            trucksInYard.map((truck) => (
              <Card key={truck.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg">{truck.truckNumber}</div>
                      <div className="text-sm text-gray-600">{truck.carrier}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(truck.priority)}>
                        {truck.priority}
                      </Badge>
                      <Badge className={getStatusColor(truck.status)}>
                        {truck.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Driver:</span>{' '}
                      <span className="font-medium">{truck.driverName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Wait Time:</span>{' '}
                      <span className="font-medium">
                        {formatDuration(truck.checkInTime)}
                      </span>
                    </div>
                    {truck.parkingSpot && (
                      <div>
                        <span className="text-gray-600">Spot:</span>{' '}
                        <span className="font-medium">{truck.parkingSpot}</span>
                      </div>
                    )}
                    {truck.dockNumber && (
                      <div>
                        <span className="text-gray-600">Dock:</span>{' '}
                        <span className="font-medium">{truck.dockNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {truck.status === 'WAITING' && (
                      <Button
                        size="sm"
                        onClick={() => handleCallToDock(truck.id, 5)}
                      >
                        📢 Call to Dock
                      </Button>
                    )}
                    {truck.status === 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckOut(truck.id)}
                      >
                        ✅ Check Out
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      📱 Notify Driver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Parking Tab */}
        <TabsContent value="parking" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {['WAITING', 'LIVE_LOAD', 'DROP_TRAILER', 'STAGING'].map((type) => (
              <div key={type}>
                <h3 className="font-medium mb-2 text-sm">
                  {type.replace('_', ' ')}
                </h3>
                <div className="space-y-2">
                  {parkingSpots
                    .filter((spot) => spot.type === type)
                    .map((spot) => (
                      <Card
                        key={spot.spotNumber}
                        className={`${getSpotColor(spot.status)} border-2`}
                      >
                        <CardContent className="p-3">
                          <div className="font-bold">{spot.spotNumber}</div>
                          {spot.status === 'OCCUPIED' ? (
                            <>
                              <div className="text-xs text-gray-700 mt-1">
                                {spot.truckNumber}
                              </div>
                              <div className="text-xs text-gray-600">
                                {spot.occupiedSince &&
                                  formatDuration(spot.occupiedSince)}
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-green-700 mt-1">
                              Available
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Detention Tab */}
        <TabsContent value="detention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detention Events</CardTitle>
            </CardHeader>
            <CardContent>
              {detentionEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No detention events
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 text-sm font-medium">
                          Truck
                        </th>
                        <th className="text-left p-2 text-sm font-medium">
                          Carrier
                        </th>
                        <th className="text-left p-2 text-sm font-medium">
                          Duration
                        </th>
                        <th className="text-left p-2 text-sm font-medium">
                          Reason
                        </th>
                        <th className="text-left p-2 text-sm font-medium">
                          Chargeable
                        </th>
                        <th className="text-left p-2 text-sm font-medium">
                          Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detentionEvents.map((event) => (
                        <tr key={event.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 text-sm">{event.truckNumber}</td>
                          <td className="p-2 text-sm">{event.carrier}</td>
                          <td className="p-2 text-sm">
                            {event.detentionMinutes} min
                          </td>
                          <td className="p-2 text-sm">{event.reason}</td>
                          <td className="p-2">
                            <Badge
                              className={
                                event.chargeable
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }
                            >
                              {event.chargeable ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                          <td className="p-2 text-sm font-medium">
                            {event.cost > 0 ? `$${event.cost}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROI Tab */}
        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Development</span>
                    <span className="font-medium">$48,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Gate Hardware</span>
                    <span className="font-medium">$12,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Parking Management</span>
                    <span className="font-medium">$8,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Driver Communication</span>
                    <span className="font-medium">$6,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Maintenance (Annual)</span>
                    <span className="font-medium">$5,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4">
                    <span className="font-bold">Total Investment</span>
                    <span className="font-bold text-lg">$79,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annual Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Reduced Wait Time</span>
                    <span className="font-medium text-green-600">$124,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Detention Prevention</span>
                    <span className="font-medium text-green-600">$86,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Dock Optimization</span>
                    <span className="font-medium text-green-600">$72,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Yard Space Usage</span>
                    <span className="font-medium text-green-600">$45,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 -mx-4 px-4">
                    <span className="font-bold">Total Annual Savings</span>
                    <span className="font-bold text-lg text-green-600">
                      $327,000
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ROI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-3xl font-bold text-green-600">414%</div>
                  <div className="text-sm text-gray-600 mt-1">ROI</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-3xl font-bold text-blue-600">2.9</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Payback (months)
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-3xl font-bold text-purple-600">65%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Wait time reduction
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-3xl font-bold text-orange-600">40%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Throughput increase
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-3">Key Impacts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>65% wait time reduction</strong> - Faster truck
                      turnaround with optimized scheduling
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>40% throughput increase</strong> - More trucks
                      processed per day
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>75% detention reduction</strong> - Proactive
                      scheduling prevents delays
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>90% driver satisfaction</strong> - Better
                      communication and visibility
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
