"use client";

import { useState, useEffect } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Navigation } from "@/components/landing";
import { Footer } from "@/components/layout/footer";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Package,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";

// Can't use metadata in client component, so we'll handle it in layout

interface ROICalculation {
  currentCosts: number;
  logiVoxCost: number;
  annualSavings: number;
  roi: number;
  paybackMonths: number;
  pickingErrorReduction: number;
  timeReduction: number;
  laborSavings: number;
}

export default function ROICalculatorPage() {
  // Input states
  const [employees, setEmployees] = useState(25);
  const [facilities, setFacilities] = useState(3);
  const [ordersPerDay, setOrdersPerDay] = useState(150);
  const [errorRate, setErrorRate] = useState(8); // percentage
  const [avgOrderValue, setAvgOrderValue] = useState(125);
  const [hourlyWage, setHourlyWage] = useState(18);
  const [currentWMSCost, setCurrentWMSCost] = useState(0);

  // Calculated results
  const [results, setResults] = useState<ROICalculation>({
    currentCosts: 0,
    logiVoxCost: 0,
    annualSavings: 0,
    roi: 0,
    paybackMonths: 0,
    pickingErrorReduction: 0,
    timeReduction: 0,
    laborSavings: 0,
  });

  useEffect(() => {
    // Calculate ROI based on inputs
    const annualOrders = ordersPerDay * 365;
    const currentErrorCost = annualOrders * (errorRate / 100) * avgOrderValue;
    const pickingTimePerOrder = 8; // minutes average
    const currentLaborCost =
      ((annualOrders * pickingTimePerOrder) / 60) * hourlyWage;
    const totalCurrentCosts =
      currentErrorCost + currentLaborCost + currentWMSCost * 12;

    // LogiVox benefits
    const errorReduction = 95; // 95% error reduction
    const timeReduction = 60; // 60% time reduction
    const newErrorCost = currentErrorCost * (1 - errorReduction / 100);
    const newLaborCost = currentLaborCost * (1 - timeReduction / 100);

    // LogiVox deployment pricing model (facility/scoped agreement)
    const monthlyLogiVoxCost =
      facilities <= 3 ? 1500 : facilities <= 10 ? 4500 : 10000;
    const annualLogiVoxCost = monthlyLogiVoxCost * 12;

    const annualSavings =
      currentErrorCost - newErrorCost + (currentLaborCost - newLaborCost);
    const netSavings = annualSavings - annualLogiVoxCost + currentWMSCost * 12;
    const roi = netSavings > 0 ? (netSavings / annualLogiVoxCost) * 100 : 0;
    const paybackMonths = annualLogiVoxCost / (annualSavings / 12);

    setResults({
      currentCosts: totalCurrentCosts,
      logiVoxCost: annualLogiVoxCost,
      annualSavings,
      roi: Math.max(0, roi),
      paybackMonths: Math.max(0.1, paybackMonths),
      pickingErrorReduction: currentErrorCost - newErrorCost,
      timeReduction: currentLaborCost - newLaborCost,
      laborSavings: currentLaborCost - newLaborCost,
    });
  }, [
    employees,
    facilities,
    ordersPerDay,
    errorRate,
    avgOrderValue,
    hourlyWage,
    currentWMSCost,
  ]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
        {/* Hero Section */}
        <section className="py-20 md:py-28">
          <div className="container-enterprise">
            <div className="text-center space-y-6 mb-16">
              <Badge variant="secondary" className="mb-4">
                💰 ROI Calculator
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Calculate Your
                <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  LogiVox Savings
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See exactly how much LogiVox will save your warehouse. Real
                numbers based on 500+ customer implementations and proven
                industry benchmarks.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Input Panel */}
              <Card className="p-8">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Calculator className="h-6 w-6" />
                    Your Warehouse Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  {/* Number of Employees */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Warehouse Employees: {employees}
                    </Label>
                    <Slider
                      value={[employees]}
                      onValueChange={(value) => setEmployees(value[0])}
                      max={200}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>5 employees</span>
                      <span>200+ employees</span>
                    </div>
                  </div>

                  {/* Orders Per Day */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Facilities in Scope: {facilities}
                    </Label>
                    <Slider
                      value={[facilities]}
                      onValueChange={(value) => setFacilities(value[0])}
                      max={20}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>1 facility</span>
                      <span>20+ facilities</span>
                    </div>
                  </div>

                  {/* Orders Per Day */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Orders Per Day: {ordersPerDay}
                    </Label>
                    <Slider
                      value={[ordersPerDay]}
                      onValueChange={(value) => setOrdersPerDay(value[0])}
                      max={2000}
                      min={10}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>10 orders</span>
                      <span>2000+ orders</span>
                    </div>
                  </div>

                  {/* Current Error Rate */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Current Picking Error Rate: {errorRate}%
                    </Label>
                    <Slider
                      value={[errorRate]}
                      onValueChange={(value) => setErrorRate(value[0])}
                      max={25}
                      min={1}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>1% (excellent)</span>
                      <span>25% (poor)</span>
                    </div>
                  </div>

                  {/* Average Order Value */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="orderValue"
                      className="text-base font-semibold"
                    >
                      Average Order Value ($)
                    </Label>
                    <Input
                      id="orderValue"
                      type="number"
                      value={avgOrderValue}
                      onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                      className="text-lg"
                    />
                  </div>

                  {/* Hourly Wage */}
                  <div className="space-y-2">
                    <Label htmlFor="wage" className="text-base font-semibold">
                      Average Hourly Wage ($)
                    </Label>
                    <Input
                      id="wage"
                      type="number"
                      value={hourlyWage}
                      onChange={(e) => setHourlyWage(Number(e.target.value))}
                      className="text-lg"
                    />
                  </div>

                  {/* Current WMS Cost */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="wmsCost"
                      className="text-base font-semibold"
                    >
                      Current WMS Cost ($/month)
                    </Label>
                    <Input
                      id="wmsCost"
                      type="number"
                      value={currentWMSCost}
                      onChange={(e) =>
                        setCurrentWMSCost(Number(e.target.value))
                      }
                      className="text-lg"
                      placeholder="0 (if using spreadsheets)"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Results Panel */}
              <div className="space-y-6">
                {/* ROI Summary */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      <div className="text-6xl font-bold text-green-600">
                        {Math.round(results.roi)}%
                      </div>
                      <div className="text-xl font-semibold text-green-800">
                        Annual Return on Investment
                      </div>
                      <div className="text-sm text-green-700">
                        Payback in {Math.round(results.paybackMonths)} months
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Savings Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Annual Savings Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-medium">Error Reduction</span>
                      </div>
                      <div className="font-bold text-green-600">
                        $
                        {Math.round(
                          results.pickingErrorReduction,
                        ).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Time Savings</span>
                      </div>
                      <div className="font-bold text-blue-600">
                        ${Math.round(results.laborSavings).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">LogiVox Investment</span>
                      </div>
                      <div className="font-bold text-purple-600">
                        ${Math.round(results.logiVoxCost).toLocaleString()}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Net Annual Savings</span>
                        <span className="text-green-600">
                          $
                          {Math.round(
                            results.annualSavings -
                              results.logiVoxCost +
                              currentWMSCost * 12,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Benefits */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      What You'll Achieve
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">
                        95% reduction in picking errors
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">
                        60% faster order fulfillment
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">
                        Real-time inventory visibility
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Voice-enabled operations</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">30-day implementation</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center mt-16 space-y-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-12">
              <h2 className="text-3xl font-bold">
                Ready to Achieve These Results?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Request a tailored deployment quote and see these savings in
                action with your actual facility profile and workflow scope.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact?type=sales">
                    Request Enterprise Quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/demo">Get Custom ROI Report</Link>
                </Button>
              </div>
              <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground mt-6">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span>Setup in hours</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>30-day guarantee</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-green-500" />
                  <span>24/7 expert support</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
