"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  BarChart2,
  RefreshCw,
  AlertCircle,
  Lightbulb,
  Package,
  RotateCcw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FinancialKPIs {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  shippingCost: number;
  taxCollected: number;
  discountsGiven: number;
  inventoryValue: number;
  salesCount: number;
  avgOrderValue: number;
  costPerOrder: number;
  rmaCount: number;
  returnRate: number;
}

interface FinancialChanges {
  revenueGrowthPct: number | null;
  marginChangePct: number | null;
  aovChangePct: number | null;
}

interface TrendPoint {
  month: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  orders: number;
}

interface TopProduct {
  sku: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface FinancialSummary {
  kpis: FinancialKPIs;
  changes: FinancialChanges;
  trend: TrendPoint[];
  topProducts: TopProduct[];
  recommendations: string[];
}

const PERIODS = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 6 months", days: 180 },
  { label: "Last 12 months", days: 365 },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

function ChangeChip({ value }: { value: number | null }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        positive ? "text-green-600" : "text-red-500"
      }`}
    >
      {positive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {fmtPct(value)}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FinancialOptimizationPage() {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("180");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const days = Number(period);
      const periodEnd = new Date();
      const periodStart = new Date(periodEnd.getTime() - days * 86_400_000);
      const params = new URLSearchParams({
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      });
      const res = await fetch(`/api/financial/summary?${params}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = data?.kpis ?? null;
  const changes = data?.changes ?? null;
  const trend = data?.trend ?? [];
  const topProducts = data?.topProducts ?? [];
  const recommendations = data?.recommendations ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Financial Optimization
          </h1>
          <p className="text-muted-foreground mt-1">
            Revenue, margins, cost-to-serve, and product-level performance
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.days} value={String(p.days)}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse h-28" />
          ))}
        </div>
      ) : kpis ? (
        <>
          {/* Primary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Revenue
                </div>
                <p className="text-2xl font-bold">{fmt(kpis.revenue)}</p>
                <ChangeChip value={changes?.revenueGrowthPct ?? null} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <BarChart2 className="w-3.5 h-3.5" /> Gross Margin
                </div>
                <p className="text-2xl font-bold">{kpis.grossMarginPct}%</p>
                <ChangeChip value={changes?.marginChangePct ?? null} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <ShoppingCart className="w-3.5 h-3.5" /> Avg Order Value
                </div>
                <p className="text-2xl font-bold">{fmt(kpis.avgOrderValue)}</p>
                <ChangeChip value={changes?.aovChangePct ?? null} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <Package className="w-3.5 h-3.5" /> Inventory Value
                </div>
                <p className="text-2xl font-bold">{fmt(kpis.inventoryValue)}</p>
                <span className="text-xs text-muted-foreground">
                  live stock
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Gross Profit
                </p>
                <p className="text-xl font-semibold">{fmt(kpis.grossProfit)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">COGS</p>
                <p className="text-xl font-semibold">{fmt(kpis.cogs)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Returns
                </p>
                <p className="text-xl font-semibold">
                  {kpis.rmaCount}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({kpis.returnRate}%)
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Cost / Order
                </p>
                <p className="text-xl font-semibold">
                  {fmt(kpis.costPerOrder)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Trend + Top Products */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Revenue vs. COGS
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trend.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No data for this period
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-end justify-between gap-1 h-24">
                      {trend.map((t) => {
                        const maxRev = Math.max(
                          ...trend.map((x) => x.revenue),
                          1,
                        );
                        const revH = Math.max((t.revenue / maxRev) * 100, 4);
                        const cogsH = Math.max((t.cogs / maxRev) * 100, 4);
                        return (
                          <div
                            key={t.month}
                            className="flex-1 flex items-end gap-0.5"
                            title={`${t.month} — Revenue: ${fmt(t.revenue)} COGS: ${fmt(t.cogs)}`}
                          >
                            <div
                              className="flex-1 bg-blue-500 rounded-sm min-h-[3px]"
                              style={{ height: `${revH}%` }}
                            />
                            <div
                              className="flex-1 bg-orange-400 rounded-sm min-h-[3px]"
                              style={{ height: `${cogsH}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-2 bg-blue-500 rounded-sm inline-block" />
                        Revenue
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-2 bg-orange-400 rounded-sm inline-block" />
                        COGS
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                      {trend.map((t) => (
                        <span
                          key={t.month}
                          className="truncate"
                          style={{ maxWidth: 40 }}
                        >
                          {t.month.slice(5)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Top Products by Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No product data for this period
                  </p>
                ) : (
                  <div className="space-y-2">
                    {topProducts.map((p, i) => {
                      const maxRev = topProducts[0]?.revenue ?? 1;
                      const pct = (p.revenue / maxRev) * 100;
                      return (
                        <div key={p.sku} className="space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium truncate max-w-[200px]">
                              <span className="text-muted-foreground mr-1">
                                {i + 1}.
                              </span>
                              {p.name}
                            </span>
                            <span className="font-semibold">
                              {fmt(p.revenue)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cost breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  {
                    label: "COGS",
                    value: kpis.cogs,
                    pct:
                      kpis.revenue > 0 ? (kpis.cogs / kpis.revenue) * 100 : 0,
                  },
                  {
                    label: "Shipping Costs",
                    value: kpis.shippingCost,
                    pct:
                      kpis.revenue > 0
                        ? (kpis.shippingCost / kpis.revenue) * 100
                        : 0,
                  },
                  {
                    label: "Tax Collected",
                    value: kpis.taxCollected,
                    pct:
                      kpis.revenue > 0
                        ? (kpis.taxCollected / kpis.revenue) * 100
                        : 0,
                  },
                  {
                    label: "Discounts Given",
                    value: kpis.discountsGiven,
                    pct:
                      kpis.revenue > 0
                        ? (kpis.discountsGiven / kpis.revenue) * 100
                        : 0,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="font-semibold">{fmt(item.value)}</p>
                    <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full"
                        style={{ width: `${Math.min(item.pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.pct.toFixed(1)}% of revenue
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-500" />
                  Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-lg font-medium">No financial data available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create sales orders and purchase orders to see financial metrics
              here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
