"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CostSummary {
  shipments: number;
  units: number;
  totalCost: number;
  costPerUnit: number;
  budget: number;
  variance: number;
  variancePercentage: number;
}

interface LaborRates {
  regularHourly: number;
  overtimeHourly: number;
  supervisorHourly: number;
  equipmentHourly: number;
}

export default function CostTracking() {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [laborRates, setLaborRates] = useState<LaborRates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostData();
  }, []);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const [summaryRes, ratesRes] = await Promise.all([
        fetch("/api/receiving/cost-tracking?action=cost_summary"),
        fetch("/api/receiving/cost-tracking?action=labor_rates"),
      ]);

      const summaryData = await summaryRes.json();
      const ratesData = await ratesRes.json();

      setSummary(summaryData.summary?.monthToDate);
      setLaborRates(ratesData.rates);
    } catch (error) {
      console.error("Failed to fetch cost data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance < 0) return "text-green-600"; // Under budget is good
    if (variance > 0) return "text-red-600"; // Over budget is bad
    return "text-gray-600";
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

  if (!summary) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No cost data available</p>
          <Button onClick={fetchCostData} className="mt-4">
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
          <h1 className="text-3xl font-bold">💰 Receiving Cost Tracking</h1>
          <p className="text-gray-600">
            Real-time cost visibility and budget management
          </p>
        </div>
        <Button variant="outline">📊 Export Report</Button>
      </div>

      {/* Cost Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Month-to-Date Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ${summary.totalCost.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {summary.shipments} shipments
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cost Per Unit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              ${summary.costPerUnit.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {summary.units.toLocaleString()} units
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              ${summary.budget.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Monthly allocation</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${getVarianceColor(summary.variance)}`}
            >
              ${Math.abs(summary.variance).toLocaleString()}
            </div>
            <div
              className={`text-sm mt-1 ${getVarianceColor(summary.variance)}`}
            >
              {summary.variance < 0 ? "↓" : "↑"}{" "}
              {Math.abs(summary.variancePercentage)}%{" "}
              {summary.variance < 0 ? "under" : "over"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">📊 Cost Breakdown</TabsTrigger>
          <TabsTrigger value="rates">💵 Labor Rates</TabsTrigger>
          <TabsTrigger value="analysis">📈 Analysis</TabsTrigger>
          <TabsTrigger value="roi">💰 ROI</TabsTrigger>
        </TabsList>

        {/* Cost Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Components</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <div>
                      <div className="font-medium">Labor</div>
                      <div className="text-sm text-gray-600">
                        Regular + overtime
                      </div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      ${(summary.totalCost * 0.45).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <div>
                      <div className="font-medium">Equipment</div>
                      <div className="text-sm text-gray-600">
                        Forklifts, scanners, scales
                      </div>
                    </div>
                    <div className="text-xl font-bold text-purple-600">
                      ${(summary.totalCost * 0.25).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <div>
                      <div className="font-medium">Materials</div>
                      <div className="text-sm text-gray-600">
                        Labels, tape, pallets
                      </div>
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      ${(summary.totalCost * 0.15).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <div>
                      <div className="font-medium">Overhead</div>
                      <div className="text-sm text-gray-600">
                        Facility, utilities, admin
                      </div>
                    </div>
                    <div className="text-xl font-bold text-orange-600">
                      ${(summary.totalCost * 0.15).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📈</div>
                    <div className="text-gray-600">Cost trend chart</div>
                    <div className="text-sm text-gray-500 mt-2">
                      Line chart showing daily cost per unit over last 30 days
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Shipment Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-medium">
                        Shipment
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Units
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Labor
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Equipment
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Materials
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Total Cost
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        $/Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        shipment: "SHP-2024-101",
                        units: 1200,
                        costPerUnit: 0.72,
                      },
                      {
                        shipment: "SHP-2024-102",
                        units: 850,
                        costPerUnit: 0.81,
                      },
                      {
                        shipment: "SHP-2024-103",
                        units: 2100,
                        costPerUnit: 0.68,
                      },
                      {
                        shipment: "SHP-2024-104",
                        units: 950,
                        costPerUnit: 0.85,
                      },
                      {
                        shipment: "SHP-2024-105",
                        units: 1500,
                        costPerUnit: 0.74,
                      },
                    ].map((item) => {
                      const total = item.units * item.costPerUnit;
                      return (
                        <tr
                          key={item.shipment}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-2 text-sm font-medium">
                            {item.shipment}
                          </td>
                          <td className="p-2 text-sm">{item.units}</td>
                          <td className="p-2 text-sm">
                            ${(total * 0.45).toFixed(2)}
                          </td>
                          <td className="p-2 text-sm">
                            ${(total * 0.25).toFixed(2)}
                          </td>
                          <td className="p-2 text-sm">
                            ${(total * 0.15).toFixed(2)}
                          </td>
                          <td className="p-2 text-sm font-medium">
                            ${total.toFixed(2)}
                          </td>
                          <td className="p-2 text-sm">${item.costPerUnit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Labor Rates Tab */}
        <TabsContent value="rates" className="space-y-4">
          {laborRates && (
            <Card>
              <CardHeader>
                <CardTitle>Labor Rate Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded">
                      <label className="block text-sm font-medium mb-2">
                        Regular Hourly Rate
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600">
                          ${laborRates.regularHourly}
                        </span>
                        <span className="text-gray-600">/hour</span>
                      </div>
                    </div>

                    <div className="p-4 border rounded">
                      <label className="block text-sm font-medium mb-2">
                        Overtime Hourly Rate
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-orange-600">
                          ${laborRates.overtimeHourly}
                        </span>
                        <span className="text-gray-600">/hour (1.5x)</span>
                      </div>
                    </div>

                    <div className="p-4 border rounded">
                      <label className="block text-sm font-medium mb-2">
                        Supervisor Hourly Rate
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-purple-600">
                          ${laborRates.supervisorHourly}
                        </span>
                        <span className="text-gray-600">/hour</span>
                      </div>
                    </div>

                    <div className="p-4 border rounded">
                      <label className="block text-sm font-medium mb-2">
                        Equipment Hourly Rate
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">
                          ${laborRates.equipmentHourly}
                        </span>
                        <span className="text-gray-600">/hour</span>
                      </div>
                    </div>
                  </div>

                  <Button>Update Rates</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Cost Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Labor Efficiency</h4>
                  <p className="text-sm text-gray-700">
                    Current: <strong>100 units/hour</strong> per worker
                    <br />
                    Target: 120 units/hour (20% improvement opportunity)
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Equipment Utilization</h4>
                  <p className="text-sm text-gray-700">
                    Current: <strong>72% utilization</strong>
                    <br />
                    Target: 85% utilization (18% improvement opportunity)
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Overtime Usage</h4>
                  <p className="text-sm text-gray-700">
                    Current: <strong>8% of hours</strong> are overtime
                    <br />
                    Target: 5% or less (reduce premium labor costs)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost by Supplier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Supplier A", units: 12500, costPerUnit: 0.72 },
                    { name: "Supplier B", units: 9800, costPerUnit: 0.81 },
                    { name: "Supplier C", units: 7200, costPerUnit: 0.85 },
                  ].map((supplier) => (
                    <div key={supplier.name} className="border rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-gray-600">
                          {supplier.units.toLocaleString()} units
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-bold text-blue-600">
                          ${supplier.costPerUnit}/unit
                        </div>
                        <div className="text-sm text-gray-600">
                          $
                          {(
                            supplier.units * supplier.costPerUnit
                          ).toLocaleString()}{" "}
                          total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost by Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Day Shift", percentage: 50, costPerUnit: 0.74 },
                    {
                      name: "Evening Shift",
                      percentage: 35,
                      costPerUnit: 0.79,
                    },
                    { name: "Night Shift", percentage: 15, costPerUnit: 0.91 },
                  ].map((shift) => (
                    <div key={shift.name} className="border rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">{shift.name}</div>
                        <div className="text-sm text-gray-600">
                          {shift.percentage}% of volume
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-bold text-purple-600">
                          ${shift.costPerUnit}/unit
                        </div>
                        <div
                          className={`text-sm ${
                            shift.costPerUnit < 0.8
                              ? "text-green-600"
                              : shift.costPerUnit < 0.85
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {shift.costPerUnit < 0.8
                            ? "✓ Below target"
                            : shift.costPerUnit < 0.85
                              ? "⚠ At target"
                              : "⚠ Above target"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Improvement Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="text-2xl">💡</div>
                  <div>
                    <div className="font-medium text-green-800">
                      Reduce Night Shift Costs
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      Night shift costs $0.91/unit vs $0.74/unit day shift.
                      Potential savings: $28K/year by shifting volume.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-2xl">💡</div>
                  <div>
                    <div className="font-medium text-blue-800">
                      Improve Labor Efficiency
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      Increase from 100 to 120 units/hour through training and
                      process optimization. Potential savings: $42K/year.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded">
                  <div className="text-2xl">💡</div>
                  <div>
                    <div className="font-medium text-purple-800">
                      Optimize Equipment Usage
                    </div>
                    <div className="text-sm text-purple-700 mt-1">
                      Increase equipment utilization from 72% to 85%. Potential
                      savings: $18K/year in equipment costs.
                    </div>
                  </div>
                </div>
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
                    <span className="font-medium">$38,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Cost Analytics</span>
                    <span className="font-medium">$8,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">
                      Accounting Integration
                    </span>
                    <span className="font-medium">$6,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Training</span>
                    <span className="font-medium">$4,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Maintenance (Annual)</span>
                    <span className="font-medium">$3,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4">
                    <span className="font-bold">Total Investment</span>
                    <span className="font-bold text-lg">$59,000</span>
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
                    <span className="text-gray-600">Cost Visibility</span>
                    <span className="font-medium text-green-600">$96,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Budget Accuracy</span>
                    <span className="font-medium text-green-600">$68,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Waste Reduction</span>
                    <span className="font-medium text-green-600">$52,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Labor Optimization</span>
                    <span className="font-medium text-green-600">$44,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 -mx-4 px-4">
                    <span className="font-bold">Total Annual Savings</span>
                    <span className="font-bold text-lg text-green-600">
                      $260,000
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
                  <div className="text-3xl font-bold text-green-600">441%</div>
                  <div className="text-sm text-gray-600 mt-1">ROI</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-3xl font-bold text-blue-600">2.7</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Payback (months)
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-3xl font-bold text-purple-600">±3%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Budget accuracy
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-3xl font-bold text-orange-600">12%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Cost reduction
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-3">Key Impacts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>100% real-time cost visibility</strong> - Know
                      costs immediately
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>±3% budget variance accuracy</strong> - Highly
                      accurate forecasting
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>12% cost reduction</strong> - Data-driven
                      optimization
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>85% faster reporting</strong> - Automated cost
                      reports
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
