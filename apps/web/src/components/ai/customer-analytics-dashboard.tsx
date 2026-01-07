"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Activity,
  Crown,
  Heart,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";

interface ChurnPrediction {
  customerId: string;
  customerName: string;
  churnProbability: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  reasons: string[];
  recommendations: string[];
}

interface CustomerSegment {
  segment: string;
  count: number;
  totalRevenue: number;
  averageValue: number;
  characteristics: string[];
}

export function CustomerAnalyticsDashboard() {
  const [churnPredictions, setChurnPredictions] = useState<ChurnPrediction[]>(
    [],
  );
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<string>("all");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch churn predictions
      const churnResponse = await fetch("/api/analytics/churn");
      if (churnResponse.ok) {
        const churnData = await churnResponse.json();
        setChurnPredictions(churnData.predictions || []);
      }

      // Fetch customer segments
      const segmentsResponse = await fetch("/api/analytics/segments");
      if (segmentsResponse.ok) {
        const segmentsData = await segmentsResponse.json();
        setSegments(segmentsData.segments || []);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "high":
        return <TrendingDown className="h-5 w-5 text-orange-600" />;
      case "medium":
        return <Activity className="h-5 w-5 text-yellow-600" />;
      default:
        return <UserCheck className="h-5 w-5 text-green-600" />;
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case "VIP":
        return <Crown className="h-5 w-5 text-yellow-600" />;
      case "Loyal":
        return <Heart className="h-5 w-5 text-pink-600" />;
      case "Regular":
        return <Users className="h-5 w-5 text-blue-600" />;
      case "At-Risk":
        return <TrendingDown className="h-5 w-5 text-orange-600" />;
      default:
        return <UserX className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredPredictions =
    selectedRisk === "all"
      ? churnPredictions
      : churnPredictions.filter((p) => p.riskLevel === selectedRisk);

  const churnSummary = {
    critical: churnPredictions.filter((p) => p.riskLevel === "critical").length,
    high: churnPredictions.filter((p) => p.riskLevel === "high").length,
    medium: churnPredictions.filter((p) => p.riskLevel === "medium").length,
    low: churnPredictions.filter((p) => p.riskLevel === "low").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Customer Analytics
          </h2>
          <p className="text-muted-foreground">
            AI-powered insights into customer behavior and churn prediction
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="churn" className="space-y-6">
        <TabsList>
          <TabsTrigger value="churn" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Churn Prediction
          </TabsTrigger>
          <TabsTrigger value="segments" className="gap-2">
            <Users className="h-4 w-4" />
            Customer Segments
          </TabsTrigger>
        </TabsList>

        {/* Churn Prediction Tab */}
        <TabsContent value="churn" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Critical Risk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-red-600">
                    {churnSummary.critical}
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>High Risk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-orange-600">
                    {churnSummary.high}
                  </div>
                  <TrendingDown className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Medium Risk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-yellow-600">
                    {churnSummary.medium}
                  </div>
                  <Activity className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Low Risk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-green-600">
                    {churnSummary.low}
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Filter */}
          <div className="flex gap-2">
            <Button
              variant={selectedRisk === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRisk("all")}
            >
              All ({churnPredictions.length})
            </Button>
            <Button
              variant={selectedRisk === "critical" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRisk("critical")}
            >
              Critical ({churnSummary.critical})
            </Button>
            <Button
              variant={selectedRisk === "high" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRisk("high")}
            >
              High ({churnSummary.high})
            </Button>
            <Button
              variant={selectedRisk === "medium" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRisk("medium")}
            >
              Medium ({churnSummary.medium})
            </Button>
            <Button
              variant={selectedRisk === "low" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRisk("low")}
            >
              Low ({churnSummary.low})
            </Button>
          </div>

          {/* Churn Predictions List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredPredictions.map((prediction) => (
              <Card key={prediction.customerId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getRiskIcon(prediction.riskLevel)}
                      <div>
                        <CardTitle className="text-lg">
                          {prediction.customerName}
                        </CardTitle>
                        <CardDescription>
                          Customer ID: {prediction.customerId}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={getRiskBadgeVariant(prediction.riskLevel)}
                      >
                        {prediction.riskLevel.toUpperCase()}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Churn Probability
                        </p>
                        <p className="text-2xl font-bold">
                          {(prediction.churnProbability * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Reasons */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Risk Factors
                    </h4>
                    <ul className="space-y-1">
                      {prediction.reasons.map((reason, index) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-orange-600 mt-0.5">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Recommended Actions
                    </h4>
                    <ul className="space-y-1">
                      {prediction.recommendations.map((rec, index) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-green-600 mt-0.5">✓</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="default">
                      Contact Customer
                    </Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Customer Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          {/* Segments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <Card key={segment.segment}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getSegmentIcon(segment.segment)}
                    <div>
                      <CardTitle>{segment.segment}</CardTitle>
                      <CardDescription>
                        {segment.count} customers
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Revenue
                      </p>
                      <p className="text-lg font-bold flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {segment.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Value</p>
                      <p className="text-lg font-bold flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {segment.averageValue.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Characteristics */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Characteristics
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {segment.characteristics.map((char, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {char}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
