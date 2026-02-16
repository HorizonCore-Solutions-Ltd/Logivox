"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShippingLabel {
  id: string;
  shipmentId: string;
  carrierName: string;
  carrierService: string;
  trackingNumber: string;
  labelUrl: string;
  labelFormat: string;
  status: string;
  generatedAt: Date;
  generatedBy: string;
  cost: number;
  weight: number;
  dimensions: string;
  fromAddress: string;
  toAddress: string;
  estimatedDelivery?: Date;
}

interface Carrier {
  id: string;
  name: string;
  code: string;
  logo: string;
  services: Array<{
    id: string;
    name: string;
    transitDays: string;
    features: string[];
  }>;
  status: string;
}

interface LabelMetrics {
  totalLabels: number;
  labelsToday: number;
  avgCostPerLabel: number;
  totalShippingCost: number;
  carrierBreakdown: Array<{
    carrierId: string;
    carrierName: string;
    labelCount: number;
    totalCost: number;
    avgCost: number;
    percentage: number;
  }>;
  serviceBreakdown: Array<{
    service: string;
    count: number;
    percentage: number;
  }>;
  labelsByFormat: Record<string, number>;
}

export default function LabelGeneration() {
  const [labels, setLabels] = useState<ShippingLabel[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [metrics, setMetrics] = useState<LabelMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [labelsRes, carriersRes, metricsRes] = await Promise.all([
        fetch("/api/dock/label-generation?action=recent_labels&limit=20"),
        fetch("/api/dock/label-generation?action=carriers"),
        fetch("/api/dock/label-generation?action=label_metrics"),
      ]);

      const labelsData = await labelsRes.json();
      const carriersData = await carriersRes.json();
      const metricsData = await metricsRes.json();

      setLabels(labelsData.labels || []);
      setCarriers(carriersData.carriers || []);
      setMetrics(metricsData.metrics);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "VOIDED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCarrierColor = (carrierName: string) => {
    switch (carrierName.toUpperCase()) {
      case "UPS":
        return "bg-yellow-100 text-yellow-800";
      case "FEDEX":
        return "bg-purple-100 text-purple-800";
      case "USPS":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📮 Shipping Label Generation</h1>
          <p className="text-gray-600">
            Multi-carrier label generation and tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Compare Rates</Button>
          <Button>+ Generate Label</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Labels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics?.totalLabels || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {metrics?.labelsToday || 0} today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${metrics?.avgCostPerLabel?.toFixed(2) || "0.00"}
            </div>
            <div className="text-sm text-gray-600 mt-1">per label</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              ${metrics?.totalShippingCost?.toLocaleString() || "0"}
            </div>
            <div className="text-sm text-gray-600 mt-1">shipping spend</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Carriers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {carriers.filter((c) => c.status === "ACTIVE").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">integrated</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="labels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="labels">📋 Recent Labels</TabsTrigger>
          <TabsTrigger value="carriers">🚚 Carriers</TabsTrigger>
          <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
          <TabsTrigger value="roi">💰 ROI</TabsTrigger>
        </TabsList>

        {/* Recent Labels Tab */}
        <TabsContent value="labels" className="space-y-4">
          <div className="space-y-3">
            {labels.map((label) => (
              <Card key={label.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${getCarrierColor(label.carrierName)}`}
                        >
                          {label.carrierName}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${getStatusColor(label.status)}`}
                        >
                          {label.status}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                          {label.labelFormat}
                        </span>
                      </div>

                      <div className="font-medium text-lg mb-1">
                        {label.trackingNumber}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {label.shipmentId} • {label.carrierService}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">From:</span>{" "}
                          <span className="font-medium">
                            {label.fromAddress}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">To:</span>{" "}
                          <span className="font-medium">{label.toAddress}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Weight:</span>{" "}
                          <span className="font-medium">
                            {label.weight} lbs
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-gray-600">Dimensions:</span>{" "}
                          <span className="font-medium">
                            {label.dimensions}"
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost:</span>{" "}
                          <span className="font-medium text-green-600">
                            ${label.cost.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Generated:</span>{" "}
                          <span className="font-medium">
                            {new Date(label.generatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {label.estimatedDelivery && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                          📅 Estimated Delivery:{" "}
                          <span className="font-medium">
                            {new Date(
                              label.estimatedDelivery,
                            ).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <Button size="sm">📄 Download</Button>
                      <Button size="sm" variant="outline">
                        🔍 Track
                      </Button>
                      {label.status === "ACTIVE" && (
                        <Button size="sm" variant="destructive">
                          ❌ Void
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Carriers Tab */}
        <TabsContent value="carriers" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {carriers.map((carrier) => (
              <Card key={carrier.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{carrier.name}</CardTitle>
                      <div className="text-sm text-gray-600 mt-1">
                        {carrier.code}
                      </div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        carrier.status === "ACTIVE"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-2">
                        Available Services
                      </div>
                      <div className="space-y-2">
                        {carrier.services.map((service) => (
                          <div
                            key={service.id}
                            className="p-2 bg-gray-50 rounded"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm">
                                  {service.name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {service.transitDays} business days
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 mt-2">
                              {service.features.map((feature) => (
                                <span
                                  key={feature}
                                  className="text-xs px-2 py-0.5 bg-white rounded border"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Carrier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.carrierBreakdown?.map((carrier) => (
                    <div key={carrier.carrierId}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">
                          {carrier.carrierName}
                        </span>
                        <span className="text-sm text-gray-600">
                          {carrier.labelCount} labels (
                          {carrier.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div
                          className={`h-2 rounded-full ${
                            carrier.carrierName === "UPS"
                              ? "bg-yellow-500"
                              : carrier.carrierName === "FedEx"
                                ? "bg-purple-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${carrier.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Total: ${carrier.totalCost.toFixed(2)}</span>
                        <span>Avg: ${carrier.avgCost.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Level Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.serviceBreakdown?.map((service) => (
                    <div key={service.service}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">
                          {service.service}
                        </span>
                        <span className="text-sm text-gray-600">
                          {service.count} ({service.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${service.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Label Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(metrics?.labelsByFormat || {}).map(
                  ([format, count]) => (
                    <div
                      key={format}
                      className="text-center p-4 bg-gray-50 rounded"
                    >
                      <div className="text-3xl font-bold text-blue-600">
                        {count}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{format}</div>
                    </div>
                  ),
                )}
              </div>
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
                    <span className="font-medium">$45,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Carrier Integrations</span>
                    <span className="font-medium">$22,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Label Printers</span>
                    <span className="font-medium">$8,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Training</span>
                    <span className="font-medium">$5,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4">
                    <span className="font-bold">Total Investment</span>
                    <span className="font-bold text-lg">$80,000</span>
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
                    <span className="text-gray-600">Rate Shopping</span>
                    <span className="font-medium text-green-600">$168,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Automated Processing</span>
                    <span className="font-medium text-green-600">$95,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Error Reduction</span>
                    <span className="font-medium text-green-600">$62,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Carrier Discounts</span>
                    <span className="font-medium text-green-600">$48,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 -mx-4 px-4">
                    <span className="font-bold">Total Annual Savings</span>
                    <span className="font-bold text-lg text-green-600">
                      $373,000
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
                  <div className="text-3xl font-bold text-green-600">466%</div>
                  <div className="text-sm text-gray-600 mt-1">ROI</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-3xl font-bold text-blue-600">2.6</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Payback (months)
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-3xl font-bold text-purple-600">22%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Shipping savings
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-3xl font-bold text-orange-600">85%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Automation rate
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-3">Key Impacts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>22% shipping cost reduction</strong> -
                      Multi-carrier rate shopping
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>85% label automation</strong> - Batch generation
                      capabilities
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>95% address accuracy</strong> - Validation reduces
                      errors
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>100% tracking visibility</strong> - Real-time
                      status updates
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
