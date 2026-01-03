'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  TruckIcon, 
  AlertCircle, 
  CheckCircle2,
  Calculator,
  BarChart3
} from 'lucide-react';

interface LoadItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  weight: number;
  volume: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Vehicle {
  id: string;
  name: string;
  type: string;
  maxWeight: number;
  maxVolume: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  costPerMile: number;
}

interface LoadPlan {
  id: string;
  vehicleId: string;
  items: LoadItem[];
  totalWeight: number;
  totalVolume: number;
  weightUtilization: number;
  volumeUtilization: number;
  efficiency: number;
}

export default function LoadPlanningPage() {
  const [items, setItems] = useState<LoadItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loadPlans, setLoadPlans] = useState<LoadPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    fetchPendingItems();
    fetchVehicles();
  }, []);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shipments/pending-items');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching pending items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const optimizeLoads = async () => {
    setOptimizing(true);
    try {
      const selectedItemsData = items.filter(item => 
        selectedItems.includes(item.id)
      );

      const response = await fetch('/api/load-planning/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItemsData,
          vehicles: vehicles,
          optimization: 'BALANCED' // or WEIGHT, VOLUME, COST
        })
      });

      const data = await response.json();
      setLoadPlans(data.loadPlans || []);
    } catch (error) {
      console.error('Error optimizing loads:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const createShipments = async () => {
    try {
      const response = await fetch('/api/shipments/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loadPlans })
      });

      if (response.ok) {
        alert('Shipments created successfully!');
        fetchPendingItems();
        setLoadPlans([]);
        setSelectedItems([]);
      }
    } catch (error) {
      console.error('Error creating shipments:', error);
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 85) return 'text-green-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-gray-100 text-gray-800'
    };
    return colors[priority as keyof typeof colors] || colors.LOW;
  };

  const totalSelectedWeight = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.weight * item.quantity), 0);

  const totalSelectedVolume = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.volume * item.quantity), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Load Planning</h1>
          <p className="text-muted-foreground mt-1">
            Optimize shipment loading for maximum efficiency
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={optimizeLoads}
            disabled={selectedItems.length === 0 || optimizing}
            className="gap-2"
          >
            <Calculator className="h-4 w-4" />
            {optimizing ? 'Optimizing...' : 'Optimize Loads'}
          </Button>
          {loadPlans.length > 0 && (
            <Button onClick={createShipments} variant="default" className="gap-2">
              <TruckIcon className="h-4 w-4" />
              Create Shipments
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedItems.length} selected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSelectedWeight.toFixed(0)} lbs</div>
            <p className="text-xs text-muted-foreground mt-1">
              Selected items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSelectedVolume.toFixed(0)} ft³</div>
            <p className="text-xs text-muted-foreground mt-1">
              Selected items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Load Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadPlans.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Optimized loads
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pending Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading items...
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending items</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelection(item.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedItems.includes(item.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {item.sku}
                        </div>
                      </div>
                      <Badge className={getPriorityBadge(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Qty</div>
                        <div className="font-medium">{item.quantity}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Weight</div>
                        <div className="font-medium">{item.weight} lbs</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Volume</div>
                        <div className="font-medium">{item.volume} ft³</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {item.dimensions.length}" × {item.dimensions.width}" × {item.dimensions.height}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Load Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Optimized Load Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadPlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select items and click "Optimize Loads"</p>
                <p className="text-sm mt-1">
                  The system will calculate the most efficient loading plan
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {loadPlans.map((plan, index) => {
                  const vehicle = vehicles.find(v => v.id === plan.vehicleId);
                  return (
                    <div
                      key={plan.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">Load #{index + 1}</div>
                          <div className="text-sm text-muted-foreground">
                            {vehicle?.name} - {vehicle?.type}
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${getEfficiencyColor(plan.efficiency)}`}>
                          {plan.efficiency}%
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Weight Utilization
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${plan.weightUtilization}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {plan.weightUtilization}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {plan.totalWeight.toFixed(0)} / {vehicle?.maxWeight} lbs
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Volume Utilization
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${plan.volumeUtilization}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {plan.volumeUtilization}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {plan.totalVolume.toFixed(0)} / {vehicle?.maxVolume} ft³
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-2">
                        <div className="text-sm font-medium mb-1">
                          Items ({plan.items.length})
                        </div>
                        <div className="space-y-1">
                          {plan.items.slice(0, 3).map(item => (
                            <div
                              key={item.id}
                              className="text-sm text-muted-foreground flex justify-between"
                            >
                              <span>{item.name}</span>
                              <span>×{item.quantity}</span>
                            </div>
                          ))}
                          {plan.items.length > 3 && (
                            <div className="text-sm text-muted-foreground">
                              +{plan.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>

                      {plan.efficiency >= 85 ? (
                        <div className="flex items-center gap-2 mt-3 text-green-600 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          Excellent efficiency
                        </div>
                      ) : plan.efficiency < 70 ? (
                        <div className="flex items-center gap-2 mt-3 text-yellow-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Consider consolidating
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Vehicles */}
      <Card>
        <CardHeader>
          <CardTitle>Available Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <TruckIcon className="h-8 w-8 text-primary" />
                  <div>
                    <div className="font-medium">{vehicle.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle.type}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Weight:</span>
                    <span className="font-medium">{vehicle.maxWeight} lbs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Volume:</span>
                    <span className="font-medium">{vehicle.maxVolume} ft³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost/Mile:</span>
                    <span className="font-medium">${vehicle.costPerMile}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {vehicle.dimensions.length}' × {vehicle.dimensions.width}' × {vehicle.dimensions.height}'
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
