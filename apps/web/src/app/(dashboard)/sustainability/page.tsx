"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaf, Zap, Trash2, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SustainabilityPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Sustainability</h2>
        <div className="flex items-center space-x-2">
          <Button>Export ESG Report</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Carbon Footprint
            </CardTitle>
            <Leaf className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4t</div>
            <p className="text-xs text-muted-foreground">-5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Energy Efficiency
            </CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2 kWh</div>
            <p className="text-xs text-muted-foreground">Per unit processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recycling Rate
            </CardTitle>
            <Trash2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">+2% goal target</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,500</div>
            <p className="text-xs text-muted-foreground">
              From eco-initiatives
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Emissions Breakdown</CardTitle>
            <CardDescription>
              Detailed analysis of scope 1, 2, and 3 emissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Transportation</p>
                    <p className="text-xs text-muted-foreground">Scope 3</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">45%</p>
                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[45%]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Facilities</p>
                    <p className="text-xs text-muted-foreground">Scope 1 & 2</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">30%</p>
                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[30%]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Packaging</p>
                    <p className="text-xs text-muted-foreground">Scope 3</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">25%</p>
                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 w-[25%]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Eco-Initiatives</CardTitle>
            <CardDescription>
              Updates on sustainability projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-md border p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Solar Array Installation
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Phase 1 complete. Generating 15% of facility power.
                  </p>
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-200 bg-green-50"
                  >
                    Active
                  </Badge>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-md border p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">EV Fleet Transition</p>
                  <p className="text-sm text-muted-foreground">
                    Deployment of 5 electric forklifts scheduled for Q3.
                  </p>
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-200 bg-blue-50"
                  >
                    Planning
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
