"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface CarrierCheckIn {
  id: string;
  appointmentId: string;
  shipmentId: string;
  dockId: string;
  driverName: string;
  driverLicense: string;
  driverPhone: string;
  tractorNumber: string;
  trailerNumber: string;
  carrierName: string;
  carrierDOT?: string;
  sealNumber?: string;
  checkInTime: Date;
  scheduledTime: Date;
  checkOutTime?: Date;
  status: string;
  detentionMinutes: number;
  detentionReason?: string;
  currentDetention?: number;
  detentionCost?: number;
}

interface CarrierMetrics {
  totalCheckIns: number;
  activeDrivers: number;
  avgCheckInTime: number;
  avgCheckOutTime: number;
  avgDetentionTime: number;
  onTimePercentage: number;
  totalDetentionCost: number;
  carrierPerformance: Array<{
    carrierId: string;
    carrierName: string;
    totalVisits: number;
    avgDetentionTime: number;
    onTimePercentage: number;
    rating: number;
  }>;
  detentionReasons: Array<{
    reason: string;
    count: number;
    totalMinutes: number;
    avgMinutes: number;
  }>;
}

export default function CarrierManagement() {
  const [activeCheckIns, setActiveCheckIns] = useState<CarrierCheckIn[]>([]);
  const [metrics, setMetrics] = useState<CarrierMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckInForm, setShowCheckInForm] = useState(false);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds to update detention times
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [checkInsRes, metricsRes] = await Promise.all([
        fetch("/api/dock/carrier-management?action=active_check_ins"),
        fetch("/api/dock/carrier-management?action=carrier_metrics"),
      ]);

      const checkInsData = await checkInsRes.json();
      const metricsData = await metricsRes.json();

      setActiveCheckIns(checkInsData.checkIns || []);
      setMetrics(metricsData.metrics);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return "bg-blue-100 text-blue-800";
      case "WAITING":
        return "bg-yellow-100 text-yellow-800";
      case "LOADING":
        return "bg-purple-100 text-purple-800";
      case "READY":
        return "bg-green-100 text-green-800";
      case "CHECKED_OUT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-blue-600";
    if (rating >= 2.5) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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

  const detentionAlerts = activeCheckIns.filter(
    (c) => (c.currentDetention || 0) > 60,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🚛 Carrier Management</h1>
          <p className="text-gray-600">
            Driver check-in/check-out and detention tracking
          </p>
        </div>
        <Button onClick={() => setShowCheckInForm(true)}>
          + Check In Driver
        </Button>
      </div>

      {/* Detention Alerts */}
      {detentionAlerts.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              ⏰ {detentionAlerts.length} Driver
              {detentionAlerts.length !== 1 ? "s" : ""} in Detention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {detentionAlerts.slice(0, 3).map((checkIn) => (
                <div key={checkIn.id} className="p-2 bg-white rounded text-sm">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-medium">{checkIn.driverName}</span>
                      <span className="text-gray-600">
                        {" "}
                        ({checkIn.carrierName})
                      </span>
                    </div>
                    <div className="font-medium text-orange-600">
                      {formatDuration(checkIn.currentDetention || 0)} detention
                    </div>
                  </div>
                  <div className="text-gray-600">
                    Cost: ${checkIn.detentionCost?.toFixed(2) || "0.00"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics?.activeDrivers || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">on-site now</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              On-Time Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {metrics?.onTimePercentage?.toFixed(0) || 0}%
            </div>
            <div className="text-sm text-gray-600 mt-1">within 15 minutes</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Detention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {metrics?.avgDetentionTime?.toFixed(0) || 0}m
            </div>
            <div className="text-sm text-gray-600 mt-1">per visit</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Detention Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              ${(metrics?.totalDetentionCost || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">total incurred</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">🚛 Active Check-ins</TabsTrigger>
          <TabsTrigger value="carriers">📊 Carrier Performance</TabsTrigger>
          <TabsTrigger value="detention">⏰ Detention Report</TabsTrigger>
          <TabsTrigger value="roi">💰 ROI</TabsTrigger>
        </TabsList>

        {/* Active Check-ins Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeCheckIns.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No active check-ins
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeCheckIns.map((checkIn) => {
                const isDetention = (checkIn.currentDetention || 0) > 120;

                return (
                  <Card
                    key={checkIn.id}
                    className={isDetention ? "border-orange-300" : ""}
                  >
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${getStatusColor(checkIn.status)}`}
                            >
                              {checkIn.status}
                            </span>
                            {isDetention && (
                              <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">
                                ⏰ DETENTION
                              </span>
                            )}
                          </div>

                          <div className="font-medium text-lg mb-1">
                            {checkIn.driverName}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            {checkIn.carrierName} • {checkIn.driverLicense}
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Tractor:</span>{" "}
                              <span className="font-medium">
                                {checkIn.tractorNumber}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Trailer:</span>{" "}
                              <span className="font-medium">
                                {checkIn.trailerNumber}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Dock:</span>{" "}
                              <span className="font-medium">
                                {checkIn.dockId}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Seal:</span>{" "}
                              <span className="font-medium">
                                {checkIn.sealNumber || "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-gray-600">Scheduled:</span>{" "}
                              <span className="font-medium">
                                {new Date(
                                  checkIn.scheduledTime,
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Checked In:</span>{" "}
                              <span className="font-medium">
                                {new Date(
                                  checkIn.checkInTime,
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Phone:</span>{" "}
                              <span className="font-medium">
                                {checkIn.driverPhone}
                              </span>
                            </div>
                          </div>

                          {isDetention && (
                            <div className="mt-3 p-2 bg-orange-50 rounded text-sm">
                              <div className="flex justify-between">
                                <span className="text-orange-800">
                                  ⏰ Detention:{" "}
                                  {formatDuration(
                                    checkIn.currentDetention || 0,
                                  )}
                                </span>
                                <span className="text-orange-600 font-medium">
                                  Cost: $
                                  {checkIn.detentionCost?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                              {checkIn.detentionReason && (
                                <div className="text-gray-600 mt-1">
                                  Reason:{" "}
                                  {checkIn.detentionReason.replace(/_/g, " ")}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex flex-col gap-2">
                          {checkIn.status === "READY" && (
                            <Button size="sm" className="bg-green-600">
                              Check Out
                            </Button>
                          )}
                          {checkIn.status === "WAITING" && (
                            <Button size="sm">Assign Dock</Button>
                          )}
                          <Button size="sm" variant="outline">
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Carrier Performance Tab */}
        <TabsContent value="carriers" className="space-y-4">
          <div className="space-y-3">
            {metrics?.carrierPerformance?.map((carrier, index) => (
              <Card key={carrier.carrierId}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-2xl font-bold ${getRatingColor(carrier.rating)}`}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-lg">
                          {carrier.carrierName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {carrier.carrierId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {carrier.totalVisits}
                        </div>
                        <div className="text-xs text-gray-600">Visits</div>
                      </div>

                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${
                            carrier.onTimePercentage >= 90
                              ? "text-green-600"
                              : carrier.onTimePercentage >= 75
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {carrier.onTimePercentage.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">On-Time</div>
                      </div>

                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${
                            carrier.avgDetentionTime <= 30
                              ? "text-green-600"
                              : carrier.avgDetentionTime <= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {carrier.avgDetentionTime}m
                        </div>
                        <div className="text-xs text-gray-600">
                          Avg Detention
                        </div>
                      </div>

                      <div className="text-center">
                        <div
                          className={`text-3xl font-bold ${getRatingColor(carrier.rating)}`}
                        >
                          {carrier.rating.toFixed(1)}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={
                                star <= carrier.rating
                                  ? "text-yellow-500"
                                  : "text-gray-300"
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Detention Report Tab */}
        <TabsContent value="detention" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Detention by Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.detentionReasons?.map((reason) => (
                    <div key={reason.reason}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">
                          {reason.reason.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm text-gray-600">
                          {reason.count} events
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>
                          Total: {formatDuration(reason.totalMinutes)}
                        </span>
                        <span>Avg: {formatDuration(reason.avgMinutes)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (reason.avgMinutes / 120) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detention Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded text-center">
                    <div className="text-3xl font-bold text-red-600">
                      ${(metrics?.totalDetentionCost || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Total Detention Cost
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {metrics?.avgDetentionTime?.toFixed(0) || 0}m
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Average per Visit
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded">
                    <h4 className="font-medium mb-2">Cost Calculation</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• First 2 hours: Free</li>
                      <li>• After 2 hours: $100/hour</li>
                      <li>• Billed in 15-minute increments</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                    <span className="font-medium">$35,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Kiosk Hardware</span>
                    <span className="font-medium">$15,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Training</span>
                    <span className="font-medium">$5,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Integration</span>
                    <span className="font-medium">$3,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4">
                    <span className="font-bold">Total Investment</span>
                    <span className="font-bold text-lg">$58,000</span>
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
                    <span className="text-gray-600">Faster Check-in</span>
                    <span className="font-medium text-green-600">$92,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Detention Recovery</span>
                    <span className="font-medium text-green-600">$78,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Labor Efficiency</span>
                    <span className="font-medium text-green-600">$55,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Improved Scheduling</span>
                    <span className="font-medium text-green-600">$48,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 -mx-4 px-4">
                    <span className="font-bold">Total Annual Savings</span>
                    <span className="font-bold text-lg text-green-600">
                      $273,000
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
                  <div className="text-3xl font-bold text-green-600">471%</div>
                  <div className="text-sm text-gray-600 mt-1">ROI</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-3xl font-bold text-blue-600">2.5</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Payback (months)
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-3xl font-bold text-purple-600">70%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Faster check-in
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-3xl font-bold text-orange-600">85%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Detention recovery
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-3">Key Impacts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>70% faster check-in process</strong> -
                      Self-service kiosk eliminates delays
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>85% detention cost recovery</strong> - Automated
                      tracking and billing
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>100% carrier visibility</strong> - Real-time
                      status tracking
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>90% on-time compliance</strong> - Better carrier
                      performance management
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
