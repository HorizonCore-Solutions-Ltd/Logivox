"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, FileText, Filter, Download } from "lucide-react";
import { DateRange } from "react-day-picker";

interface ReportConfig {
  name: string;
  description: string;
  metrics: string[];
  groupBy: string;
  dateRange: DateRange | undefined;
  filters: {
    warehouseId?: string;
    categoryId?: string;
    customerId?: string;
    status?: string;
  };
}

const AVAILABLE_METRICS = [
  { id: "inventory_count", label: "Inventory Count", category: "inventory" },
  { id: "inventory_value", label: "Inventory Value", category: "inventory" },
  { id: "low_stock_items", label: "Low Stock Items", category: "inventory" },
  { id: "stock_movements", label: "Stock Movements", category: "inventory" },
  { id: "booking_count", label: "Booking Count", category: "bookings" },
  { id: "booking_revenue", label: "Booking Revenue", category: "bookings" },
  {
    id: "avg_booking_value",
    label: "Average Booking Value",
    category: "bookings",
  },
  { id: "customer_count", label: "Customer Count", category: "customers" },
  { id: "top_customers", label: "Top Customers", category: "customers" },
];

const GROUP_BY_OPTIONS = [
  { value: "day", label: "By Day" },
  { value: "week", label: "By Week" },
  { value: "month", label: "By Month" },
  { value: "warehouse", label: "By Warehouse" },
  { value: "category", label: "By Category" },
  { value: "customer", label: "By Customer" },
  { value: "status", label: "By Status" },
];

export default function ReportsPage() {
  const [config, setConfig] = useState<ReportConfig>({
    name: "",
    description: "",
    metrics: [],
    groupBy: "day",
    dateRange: undefined,
    filters: {},
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await fetch("/api/warehouses");
      if (!res.ok) throw new Error("Failed to fetch warehouses");
      return res.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const handleMetricToggle = (metricId: string) => {
    setConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter((m) => m !== metricId)
        : [...prev.metrics, metricId],
    }));
  };

  const handleGenerateReport = () => {
    // TODO: Implement report generation
    console.log("Generate report with config:", config);
  };

  const handleSaveTemplate = () => {
    // TODO: Implement template saving
    console.log("Save template:", config);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Report Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create custom reports with your preferred metrics and filters
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Configuration Panel */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>
                Give your report a name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Monthly Inventory Summary"
                  value={config.name}
                  onChange={(e) =>
                    setConfig({ ...config, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Overview of inventory levels and movements"
                  value={config.description}
                  onChange={(e) =>
                    setConfig({ ...config, description: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Metrics Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Metrics</CardTitle>
              <CardDescription>
                Choose the metrics to include in your report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Inventory Metrics */}
                <div>
                  <h3 className="font-medium mb-3">Inventory Metrics</h3>
                  <div className="space-y-2">
                    {AVAILABLE_METRICS.filter(
                      (m) => m.category === "inventory",
                    ).map((metric) => (
                      <div
                        key={metric.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={metric.id}
                          checked={config.metrics.includes(metric.id)}
                          onCheckedChange={() => handleMetricToggle(metric.id)}
                        />
                        <label
                          htmlFor={metric.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {metric.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking Metrics */}
                <div>
                  <h3 className="font-medium mb-3">Booking Metrics</h3>
                  <div className="space-y-2">
                    {AVAILABLE_METRICS.filter(
                      (m) => m.category === "bookings",
                    ).map((metric) => (
                      <div
                        key={metric.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={metric.id}
                          checked={config.metrics.includes(metric.id)}
                          onCheckedChange={() => handleMetricToggle(metric.id)}
                        />
                        <label
                          htmlFor={metric.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {metric.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Metrics */}
                <div>
                  <h3 className="font-medium mb-3">Customer Metrics</h3>
                  <div className="space-y-2">
                    {AVAILABLE_METRICS.filter(
                      (m) => m.category === "customers",
                    ).map((metric) => (
                      <div
                        key={metric.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={metric.id}
                          checked={config.metrics.includes(metric.id)}
                          onCheckedChange={() => handleMetricToggle(metric.id)}
                        />
                        <label
                          htmlFor={metric.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {metric.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grouping & Date Range */}
          <Card>
            <CardHeader>
              <CardTitle>Grouping & Time Period</CardTitle>
              <CardDescription>
                How to organize and filter the data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Group By</Label>
                <Select
                  value={config.groupBy}
                  onValueChange={(value) =>
                    setConfig({ ...config, groupBy: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_BY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !config.dateRange && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.dateRange?.from ? (
                        config.dateRange.to ? (
                          <>
                            {format(config.dateRange.from, "LLL dd, y")} -{" "}
                            {format(config.dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(config.dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={config.dateRange?.from}
                      selected={config.dateRange}
                      onSelect={(range: DateRange | undefined) =>
                        setConfig({ ...config, dateRange: range })
                      }
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Apply additional filters to your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Warehouse</Label>
                <Select
                  value={config.filters.warehouseId}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      filters: { ...config.filters, warehouseId: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All warehouses</SelectItem>
                    {warehouses?.map((warehouse: any) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={config.filters.categoryId}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      filters: { ...config.filters, categoryId: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Booking Status</Label>
                <Select
                  value={config.filters.status}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      filters: { ...config.filters, status: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
              <CardDescription>Current configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Selected Metrics</p>
                <p className="text-2xl font-bold">{config.metrics.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Group By</p>
                <p className="text-sm text-muted-foreground">
                  {
                    GROUP_BY_OPTIONS.find((opt) => opt.value === config.groupBy)
                      ?.label
                  }
                </p>
              </div>
              {config.dateRange?.from && (
                <div>
                  <p className="text-sm font-medium">Date Range</p>
                  <p className="text-sm text-muted-foreground">
                    {format(config.dateRange.from, "MMM dd, yyyy")}
                    {config.dateRange.to &&
                      ` - ${format(config.dateRange.to, "MMM dd, yyyy")}`}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Active Filters</p>
                <p className="text-sm text-muted-foreground">
                  {Object.values(config.filters).filter(Boolean).length ||
                    "None"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={handleGenerateReport}
                disabled={config.metrics.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSaveTemplate}
                disabled={!config.name || config.metrics.length === 0}
              >
                Save as Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>• Select at least one metric to generate a report</li>
                <li>• Use date range to focus on specific periods</li>
                <li>• Apply filters to narrow down results</li>
                <li>• Save templates for recurring reports</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
