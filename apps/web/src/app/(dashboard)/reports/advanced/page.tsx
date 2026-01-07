"use client";

import { useState, useEffect } from "react";
import {
  ChartBarIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CalendarIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: string[];
}

interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

interface ChartConfig {
  type: "bar" | "line" | "pie" | "table";
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
}

export default function AdvancedReportingPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: "table",
  });
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const reportCategories = [
    { id: "inventory", name: "Inventory", icon: "📦" },
    { id: "orders", name: "Orders", icon: "📋" },
    { id: "fulfillment", name: "Fulfillment", icon: "🚚" },
    { id: "warehouse", name: "Warehouse", icon: "🏭" },
    { id: "financial", name: "Financial", icon: "💰" },
    { id: "performance", name: "Performance", icon: "📊" },
  ];

  const reportTemplates: ReportTemplate[] = [
    {
      id: "inventory-valuation",
      name: "Inventory Valuation",
      category: "inventory",
      description: "Current inventory value by product, location, and category",
      fields: [
        "sku",
        "product_name",
        "quantity",
        "unit_cost",
        "total_value",
        "location",
        "category",
      ],
    },
    {
      id: "inventory-turnover",
      name: "Inventory Turnover",
      category: "inventory",
      description: "Turnover rates and aging analysis",
      fields: [
        "sku",
        "product_name",
        "units_sold",
        "average_inventory",
        "turnover_rate",
        "days_on_hand",
      ],
    },
    {
      id: "stock-movement",
      name: "Stock Movement",
      category: "inventory",
      description:
        "Detailed stock movements (receipts, shipments, adjustments)",
      fields: [
        "date",
        "sku",
        "product_name",
        "transaction_type",
        "quantity",
        "location",
        "user",
      ],
    },
    {
      id: "order-summary",
      name: "Order Summary",
      category: "orders",
      description: "Order metrics by status, customer, and date",
      fields: [
        "order_number",
        "customer",
        "order_date",
        "status",
        "total_items",
        "total_value",
      ],
    },
    {
      id: "order-fulfillment-time",
      name: "Order Fulfillment Time",
      category: "fulfillment",
      description: "Time from order placement to shipment",
      fields: [
        "order_number",
        "order_date",
        "ship_date",
        "fulfillment_time_hours",
        "status",
      ],
    },
    {
      id: "picking-efficiency",
      name: "Picking Efficiency",
      category: "fulfillment",
      description: "Picker performance and productivity metrics",
      fields: [
        "picker_name",
        "orders_picked",
        "items_picked",
        "average_time",
        "accuracy_rate",
      ],
    },
    {
      id: "warehouse-utilization",
      name: "Warehouse Utilization",
      category: "warehouse",
      description: "Space utilization by zone and location",
      fields: [
        "warehouse",
        "zone",
        "total_locations",
        "occupied_locations",
        "utilization_percent",
      ],
    },
    {
      id: "revenue-by-product",
      name: "Revenue by Product",
      category: "financial",
      description: "Sales revenue breakdown by product",
      fields: [
        "sku",
        "product_name",
        "units_sold",
        "revenue",
        "cost",
        "profit",
        "margin_percent",
      ],
    },
    {
      id: "kpi-dashboard",
      name: "KPI Dashboard",
      category: "performance",
      description: "Key performance indicators overview",
      fields: ["metric", "current_value", "target", "variance", "trend"],
    },
  ];

  const availableFields: Record<string, string[]> = {
    inventory: [
      "sku",
      "product_name",
      "quantity",
      "unit_cost",
      "total_value",
      "location",
      "category",
      "warehouse",
      "zone",
      "last_counted",
      "reorder_point",
    ],
    orders: [
      "order_number",
      "customer",
      "order_date",
      "ship_date",
      "status",
      "priority",
      "total_items",
      "total_value",
      "shipping_method",
    ],
    fulfillment: [
      "order_number",
      "picker_name",
      "pick_date",
      "pick_time",
      "items_picked",
      "accuracy",
      "fulfillment_time_hours",
    ],
    warehouse: [
      "warehouse",
      "zone",
      "location",
      "capacity",
      "occupied",
      "utilization_percent",
      "last_activity",
    ],
    financial: [
      "sku",
      "product_name",
      "revenue",
      "cost",
      "profit",
      "margin_percent",
      "units_sold",
      "returns",
    ],
    performance: ["metric", "value", "target", "variance", "trend", "period"],
  };

  const operators = [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "contains", label: "Contains" },
    { value: "starts_with", label: "Starts With" },
  ];

  useEffect(() => {
    setTemplates(reportTemplates);
  }, []);

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setSelectedFields(template.fields);
    setFilters([]);
    setReportData([]);
  };

  const handleFieldToggle = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter((f) => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleAddFilter = () => {
    setFilters([
      ...filters,
      { field: selectedFields[0] || "", operator: "equals", value: "" },
    ]);
  };

  const handleFilterChange = (
    index: number,
    key: keyof ReportFilter,
    value: string,
  ) => {
    const newFilters = [...filters];
    newFilters[index][key] = value;
    setFilters(newFilters);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const generateReport = async () => {
    if (!selectedTemplate || selectedFields.length === 0) return;

    setGenerating(true);

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedTemplate.id,
          fields: selectedFields,
          filters,
          dateRange,
          chartConfig,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data.rows || []);
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (format: "csv" | "excel" | "pdf") => {
    if (reportData.length === 0) return;

    try {
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: reportData,
          fields: selectedFields,
          format,
          template: selectedTemplate?.name,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedTemplate?.id}-${Date.now()}.${format}`;
        a.click();
      }
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DocumentChartBarIcon className="w-8 h-8" />
            Advanced Reporting
          </h1>
          <p className="text-gray-600 mt-2">
            Create custom reports with flexible fields, filters, and
            visualizations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Report Templates */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Report Templates</h2>

            {reportCategories.map((category) => {
              const categoryTemplates = templates.filter(
                (t) => t.category === category.id,
              );
              if (categoryTemplates.length === 0) return null;

              return (
                <div key={category.id} className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.name}
                  </h3>
                  <div className="space-y-1">
                    {categoryTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                          selectedTemplate?.id === template.id
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content - Report Builder */}
          <div className="lg:col-span-3 space-y-6">
            {selectedTemplate ? (
              <>
                {/* Template Info */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-2">
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {selectedTemplate.description}
                  </p>
                </div>

                {/* Field Selection */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Select Fields</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableFields[selectedTemplate.category]?.map(
                      (field) => (
                        <label
                          key={field}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field)}
                            onChange={() => handleFieldToggle(field)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">
                            {field
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FunnelIcon className="w-5 h-5" />
                      Filters
                    </h3>
                    <button
                      onClick={handleAddFilter}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Add Filter
                    </button>
                  </div>

                  {filters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-3 mb-3">
                      <select
                        value={filter.field}
                        onChange={(e) =>
                          handleFilterChange(index, "field", e.target.value)
                        }
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        {selectedFields.map((field) => (
                          <option key={field} value={field}>
                            {field
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) =>
                          handleFilterChange(index, "operator", e.target.value)
                        }
                        className="border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        {operators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) =>
                          handleFilterChange(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      />

                      <button
                        onClick={() => handleRemoveFilter(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {filters.length === 0 && (
                    <p className="text-gray-500 text-sm italic">
                      No filters applied
                    </p>
                  )}
                </div>

                {/* Date Range */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Date Range
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From
                      </label>
                      <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, from: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        To
                      </label>
                      <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, to: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Chart Configuration */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5" />
                    Visualization
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chart Type
                      </label>
                      <select
                        value={chartConfig.type}
                        onChange={(e) =>
                          setChartConfig({
                            ...chartConfig,
                            type: e.target.value as any,
                          })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      >
                        <option value="table">Table</option>
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="pie">Pie Chart</option>
                      </select>
                    </div>

                    {chartConfig.type !== "table" &&
                      chartConfig.type !== "pie" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              X-Axis
                            </label>
                            <select
                              value={chartConfig.xAxis || ""}
                              onChange={(e) =>
                                setChartConfig({
                                  ...chartConfig,
                                  xAxis: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                              <option value="">Select field</option>
                              {selectedFields.map((field) => (
                                <option key={field} value={field}>
                                  {field}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Y-Axis
                            </label>
                            <select
                              value={chartConfig.yAxis || ""}
                              onChange={(e) =>
                                setChartConfig({
                                  ...chartConfig,
                                  yAxis: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                              <option value="">Select field</option>
                              {selectedFields.map((field) => (
                                <option key={field} value={field}>
                                  {field}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={generateReport}
                      disabled={generating || selectedFields.length === 0}
                      className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {generating ? "Generating..." : "Generate Report"}
                    </button>

                    {reportData.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => exportReport("csv")}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Export CSV
                        </button>
                        <button
                          onClick={() => exportReport("excel")}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Export Excel
                        </button>
                        <button
                          onClick={() => exportReport("pdf")}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Export PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Report Results */}
                {reportData.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Report Results ({reportData.length} rows)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {selectedFields.map((field) => (
                              <th
                                key={field}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {field.replace(/_/g, " ")}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.slice(0, 100).map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {selectedFields.map((field) => (
                                <td
                                  key={field}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                  {row[field]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.length > 100 && (
                        <p className="text-sm text-gray-500 mt-4 text-center">
                          Showing first 100 rows. Export to see all{" "}
                          {reportData.length} rows.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <DocumentChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a Report Template
                </h3>
                <p className="text-gray-600">
                  Choose a template from the sidebar to start building your
                  report
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
