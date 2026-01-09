'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RealtimeDashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [dockStatus, setDockStatus] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [
        dashboardRes,
        dockRes,
        shipmentsRes,
        workersRes,
        equipmentRes,
        alertsRes,
      ] = await Promise.all([
        fetch('/api/receiving/realtime-dashboard?action=get_live_dashboard'),
        fetch('/api/receiving/realtime-dashboard?action=get_dock_status'),
        fetch('/api/receiving/realtime-dashboard?action=get_active_shipments'),
        fetch('/api/receiving/realtime-dashboard?action=get_worker_activity'),
        fetch('/api/receiving/realtime-dashboard?action=get_equipment_status'),
        fetch('/api/receiving/realtime-dashboard?action=get_alerts'),
      ]);

      const dashboardData = await dashboardRes.json();
      const dockData = await dockRes.json();
      const shipmentsData = await shipmentsRes.json();
      const workersData = await workersRes.json();
      const equipmentData = await equipmentRes.json();
      const alertsData = await alertsRes.json();

      setDashboard(dashboardData.dashboard);
      setDockStatus(dockData.dockStatus);
      setShipments(shipmentsData.shipments || []);
      setWorkers(workersData.workers || []);
      setEquipment(equipmentData.equipmentStatus);
      setAlerts(alertsData.alertsData);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      RECEIVING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      URGENT: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      LOW: 'bg-gray-100 text-gray-800',
    };
    return badges[priority] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityBadge = (severity: string) => {
    const badges: Record<string, string> = {
      CRITICAL: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-blue-100 text-blue-800',
    };
    return badges[severity] || 'bg-gray-100 text-gray-800';
  };

  const getEquipmentStatusColor = (status: string) => {
    return status === 'IN_USE'
      ? 'text-green-600'
      : status === 'AVAILABLE'
      ? 'text-blue-600'
      : 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading real-time dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Real-Time Receiving Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Live operations monitoring and control center
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              <div className="text-xs">
                Updated {Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s
                ago
              </div>
            </div>
            <Button onClick={fetchData} size="sm" variant="outline">
              🔄 Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Active Receiving</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">
            {dashboard?.activeReceiving || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">shipments in progress</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Today Completed</div>
          <div className="text-3xl font-bold text-green-600 mt-1">
            {dashboard?.todayCompleted || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {dashboard?.todayUnits?.toLocaleString() || 0} units
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Velocity</div>
          <div className="text-3xl font-bold text-purple-600 mt-1">
            {dashboard?.velocity || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">units/hour</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Dock Utilization</div>
          <div className="text-3xl font-bold text-orange-600 mt-1">
            {dashboard?.dockUtilization || 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {dockStatus?.occupied || 0}/{dockStatus?.totalDocks || 0} docks
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Active Workers</div>
          <div className="text-3xl font-bold text-cyan-600 mt-1">
            {dashboard?.activeWorkers || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">currently working</div>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Avg Cycle Time</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {dashboard?.avgCycleTime || 0} min
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Quality Pass Rate</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {dashboard?.qualityPassRate || 0}%
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Damage Rate</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {dashboard?.damageRate || 0}%
          </div>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-sm text-red-700">Active Alerts</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {dashboard?.alerts || 0}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="docks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="docks">
            Dock Status ({dockStatus?.occupied || 0}/{dockStatus?.totalDocks || 0})
          </TabsTrigger>
          <TabsTrigger value="shipments">
            Active Shipments ({shipments.length})
          </TabsTrigger>
          <TabsTrigger value="workers">Workers ({workers.length})</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts?.summary.total || 0})</TabsTrigger>
        </TabsList>

        {/* Dock Status Tab */}
        <TabsContent value="docks" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Live Dock Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {dockStatus?.docks.map((dock: any) => (
                <div
                  key={dock.dockNumber}
                  className={`p-4 rounded-lg border-2 ${
                    dock.status === 'OCCUPIED'
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-lg font-bold">Dock {dock.dockNumber}</div>
                    <Badge
                      className={
                        dock.status === 'OCCUPIED'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-700'
                      }
                    >
                      {dock.status}
                    </Badge>
                  </div>

                  {dock.shipment ? (
                    <div className="space-y-1 text-sm">
                      <div className="font-medium truncate">
                        {dock.shipment.supplier}
                      </div>
                      <div className="text-xs text-gray-600">
                        PO: {dock.shipment.poNumber}
                      </div>
                      <div className="text-xs text-gray-600">
                        {dock.shipment.quantityExpected} units
                      </div>
                      <div className="text-xs text-gray-600">
                        {dock.shipment.assignedTo}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getPriorityBadge(dock.shipment.priority)}>
                          {dock.shipment.priority}
                        </Badge>
                        {dock.shipment.isLate && (
                          <span className="text-xs text-red-600">⚠️ LATE</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        ⏱️ {dock.shipment.elapsedMinutes} min
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Available</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Active Shipments Tab */}
        <TabsContent value="shipments" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Active Shipments</h2>
            {shipments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active shipments
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        PO #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Dock
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Progress
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Assigned
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {shipments.map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{shipment.supplier}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {shipment.poNumber}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(shipment.status)}>
                            {shipment.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getPriorityBadge(shipment.priority)}>
                            {shipment.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {shipment.dockDoor ? (
                            <span className="font-semibold">
                              #{shipment.dockDoor}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${shipment.percentComplete}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-10">
                              {shipment.percentComplete}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {shipment.assignedTo}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {shipment.elapsedMinutes} min
                            {shipment.isLate && (
                              <div className="text-xs text-red-600">LATE</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Workers Tab */}
        <TabsContent value="workers" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Worker Activity</h2>
            {workers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active workers
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.map((worker) => (
                  <div
                    key={worker.userId}
                    className="border border-gray-200 rounded-lg p-4 bg-green-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold">{worker.name}</div>
                        <div className="text-xs text-gray-600">
                          {worker.email}
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        {worker.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Shipments:</span>
                        <span className="font-semibold">
                          {worker.activeShipments}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Today Completed:</span>
                        <span className="font-semibold">
                          {worker.todayCompleted}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Today Units:</span>
                        <span className="font-semibold">
                          {worker.todayUnits.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Equipment Status</h2>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold">
                  {equipment?.summary.total || 0}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {equipment?.summary.inUse || 0}
                </div>
                <div className="text-xs text-gray-600">In Use</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {equipment?.summary.available || 0}
                </div>
                <div className="text-xs text-gray-600">Available</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {equipment?.summary.lowBattery || 0}
                </div>
                <div className="text-xs text-gray-600">Low Battery</div>
              </div>
            </div>

            {/* Equipment List */}
            <div className="space-y-3">
              {equipment?.equipment.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      Type: {item.type} • Location: {item.location}
                    </div>
                    {item.operator && (
                      <div className="text-xs text-gray-500 mt-1">
                        Operator: {item.operator}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {item.batteryLevel !== null && (
                      <div className="text-sm">
                        <div className="text-xs text-gray-600 mb-1">Battery</div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                item.batteryLevel < 20
                                  ? 'bg-red-500'
                                  : item.batteryLevel < 50
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${item.batteryLevel}%` }}
                            />
                          </div>
                          <span className="text-xs">{item.batteryLevel}%</span>
                        </div>
                      </div>
                    )}

                    <Badge
                      className={`${
                        item.status === 'IN_USE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Active Alerts</h2>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold">
                  {alerts?.summary.total || 0}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {alerts?.summary.critical || 0}
                </div>
                <div className="text-xs text-gray-600">Critical</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded">
                <div className="text-2xl font-bold text-orange-600">
                  {alerts?.summary.high || 0}
                </div>
                <div className="text-xs text-gray-600">High</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">
                  {alerts?.summary.medium || 0}
                </div>
                <div className="text-xs text-gray-600">Medium</div>
              </div>
            </div>

            {/* Alerts List */}
            {alerts?.alerts.length === 0 ? (
              <div className="text-center py-8 text-green-600">
                ✅ No active alerts - all operations normal
              </div>
            ) : (
              <div className="space-y-3">
                {alerts?.alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityBadge(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="font-semibold">{alert.title}</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          {alert.message}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* ROI Summary */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 mt-6">
        <h3 className="font-semibold text-lg mb-4">ROI Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Annual Investment</div>
            <div className="text-2xl font-bold text-gray-900">$38K</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Annual Savings</div>
            <div className="text-2xl font-bold text-green-600">$135K</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">ROI</div>
            <div className="text-2xl font-bold text-blue-600">355%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Payback</div>
            <div className="text-2xl font-bold text-purple-600">3.4 months</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Impact Metrics:
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Visibility:</span>
              <span className="font-semibold ml-2">100% real-time</span>
            </div>
            <div>
              <span className="text-gray-600">Decision Speed:</span>
              <span className="font-semibold ml-2">80% faster</span>
            </div>
            <div>
              <span className="text-gray-600">Downtime:</span>
              <span className="font-semibold ml-2">65% reduction</span>
            </div>
            <div>
              <span className="text-gray-600">Capacity:</span>
              <span className="font-semibold ml-2">92% utilization</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
