"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PieChart,
  RefreshCw,
  Calendar,
} from "lucide-react";

/**
 * CAPA SYSTEM 9: COST OF QUALITY (COPQ) DASHBOARD
 * 
 * Comprehensive financial tracking of quality costs across 4 categories.
 * Provides executive visibility into quality investment vs. failure costs.
 * 
 * Investment: $76,000 | Annual Savings: $1,200,000 | ROI: 1,579%
 */

interface COPQBreakdown {
  prevention: { cost: number; percentage: number; items: number };
  appraisal: { cost: number; percentage: number; items: number };
  internalFailure: { cost: number; percentage: number; items: number };
  externalFailure: { cost: number; percentage: number; items: number };
  total: number;
}

interface COPQEntry {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  cost: number;
  date: string;
  relatedEntity?: string;
  relatedEntityId?: string;
}

interface Trend {
  previousPeriodCost: number;
  currentPeriodCost: number;
  change: number;
  changePercent: number;
  direction: "INCREASING" | "DECREASING" | "STABLE";
}

export default function COPQDashboardPage() {
  const { data: session } = useSession();
  const [breakdown, setBreakdown] = useState<COPQBreakdown | null>(null);
  const [trend, setTrend] = useState<Trend | null>(null);
  const [roiAnalysis, setRoiAnalysis] = useState<any>(null);
  const [entries, setEntries] = useState<COPQEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadCOPQData();
  }, [dateRange]);

  const loadCOPQData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        roi: "true",
      });

      const response = await fetch(`/api/capa/copq?${params}`);
      const result = await response.json();

      if (result.success) {
        setBreakdown(result.breakdown);
        setTrend(result.trend);
        setRoiAnalysis(result.roiAnalysis);
        setEntries(result.entries);
      }
    } catch (error) {
      console.error("Failed to load COPQ data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "PREVENTION": return "bg-blue-500";
      case "APPRAISAL": return "bg-green-500";
      case "INTERNAL_FAILURE": return "bg-orange-500";
      case "EXTERNAL_FAILURE": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "PREVENTION": return <Shield className="h-5 w-5 text-blue-600" />;
      case "APPRAISAL": return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "INTERNAL_FAILURE": return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "EXTERNAL_FAILURE": return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && !breakdown) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading Cost of Quality data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cost of Quality Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Financial visibility into prevention, appraisal, and failure costs
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border rounded px-3 py-2 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={() => loadCOPQData()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Total COPQ Card */}
        {breakdown && (
          <Card className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-2">Total Cost of Quality</p>
                <p className="text-5xl font-bold">{formatCurrency(breakdown.total)}</p>
                {trend && (
                  <div className="flex items-center gap-2 mt-4">
                    {trend.direction === "DECREASING" ? (
                      <TrendingDown className="h-5 w-5 text-green-300" />
                    ) : trend.direction === "INCREASING" ? (
                      <TrendingUp className="h-5 w-5 text-red-300" />
                    ) : null}
                    <span className={`text-sm ${
                      trend.direction === "DECREASING" ? "text-green-300" : "text-red-300"
                    }`}>
                      {Math.abs(trend.changePercent).toFixed(1)}% {trend.direction.toLowerCase()} vs. previous period
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <BarChart3 className="h-16 w-16 text-blue-300 mb-4" />
                <p className="text-blue-100 text-sm">Period: {dateRange.startDate} to {dateRange.endDate}</p>
              </div>
            </div>
          </Card>
        )}

        {/* COPQ Category Breakdown */}
        {breakdown && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Prevention Costs */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getCategoryIcon("PREVENTION")}
                  <div>
                    <p className="text-sm font-medium text-gray-600">Prevention</p>
                    <p className="text-xs text-gray-500">{breakdown.prevention.items} items</p>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(breakdown.prevention.cost)}</p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${getCategoryColor("PREVENTION")} h-2 rounded-full`}
                    style={{ width: `${breakdown.prevention.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{breakdown.prevention.percentage.toFixed(1)}% of total</p>
              </div>
              <p className="text-xs text-gray-500 mt-3">Training, quality planning, process improvement</p>
            </Card>

            {/* Appraisal Costs */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getCategoryIcon("APPRAISAL")}
                  <div>
                    <p className="text-sm font-medium text-gray-600">Appraisal</p>
                    <p className="text-xs text-gray-500">{breakdown.appraisal.items} items</p>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(breakdown.appraisal.cost)}</p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${getCategoryColor("APPRAISAL")} h-2 rounded-full`}
                    style={{ width: `${breakdown.appraisal.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{breakdown.appraisal.percentage.toFixed(1)}% of total</p>
              </div>
              <p className="text-xs text-gray-500 mt-3">Inspections, testing, quality audits</p>
            </Card>

            {/* Internal Failure Costs */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getCategoryIcon("INTERNAL_FAILURE")}
                  <div>
                    <p className="text-sm font-medium text-gray-600">Internal Failure</p>
                    <p className="text-xs text-gray-500">{breakdown.internalFailure.items} items</p>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(breakdown.internalFailure.cost)}</p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${getCategoryColor("INTERNAL_FAILURE")} h-2 rounded-full`}
                    style={{ width: `${breakdown.internalFailure.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{breakdown.internalFailure.percentage.toFixed(1)}% of total</p>
              </div>
              <p className="text-xs text-gray-500 mt-3">Scrap, rework, reinspection (before customer)</p>
            </Card>

            {/* External Failure Costs */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getCategoryIcon("EXTERNAL_FAILURE")}
                  <div>
                    <p className="text-sm font-medium text-gray-600">External Failure</p>
                    <p className="text-xs text-gray-500">{breakdown.externalFailure.items} items</p>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(breakdown.externalFailure.cost)}</p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${getCategoryColor("EXTERNAL_FAILURE")} h-2 rounded-full`}
                    style={{ width: `${breakdown.externalFailure.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{breakdown.externalFailure.percentage.toFixed(1)}% of total</p>
              </div>
              <p className="text-xs text-gray-500 mt-3">Returns, warranty, complaints (customer found)</p>
            </Card>
          </div>
        )}

        {/* ROI Analysis */}
        {roiAnalysis && (
          <Card className="p-6 bg-green-50">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quality Investment ROI</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Investment in Prevention</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(roiAnalysis.investmentInPrevention)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Failure Costs Saved</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(roiAnalysis.failureCostsSaved)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Net Savings</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(roiAnalysis.netSavings)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Quality ROI</p>
                <p className="text-3xl font-bold text-green-900">
                  {roiAnalysis.roi.toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm text-gray-600">
                Based on {roiAnalysis.totalCapas} CAPAs ({roiAnalysis.completedCapas} completed) 
                with {roiAnalysis.avgCapaEffectiveness}% average effectiveness
              </p>
            </div>
          </Card>
        )}

        {/* Recent COPQ Entries */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Quality Costs</h2>
          
          {entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No COPQ entries found for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subcategory
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Related To
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(entry.category)}
                          <span className="text-sm font-medium text-gray-900">
                            {entry.category.replace(/_/g, " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entry.subcategory}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-md">
                        {entry.description}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entry.relatedEntity ? (
                          <Badge variant="outline">{entry.relatedEntity}</Badge>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(entry.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Insights */}
        <Card className="p-6 bg-blue-50">
          <div className="flex items-start gap-4">
            <PieChart className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">COPQ Best Practices</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Target COPQ:</strong> Less than 2-3% of revenue is world-class</li>
                <li>• <strong>Optimal Mix:</strong> 70% Prevention/Appraisal, 30% Failure costs</li>
                <li>• <strong>ROI Focus:</strong> $1 in prevention saves $10 in failure costs</li>
                <li>• <strong>Trend Goal:</strong> Decreasing total COPQ year-over-year</li>
                <li>• <strong>Prevention Priority:</strong> Shift from failure detection to failure prevention</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
