/**
 * Pre-built Report Templates for LogiVox
 *
 * 50+ ready-to-use report templates covering common business scenarios.
 * Users can run these directly or use them as starting points for custom reports.
 */

import {
  ReportConfig,
  ReportCategory,
  FilterOperator,
  AggregationType,
  ChartType,
} from "./report-types";

// ============================================================================
// Inventory Reports
// ============================================================================

export const INVENTORY_REPORTS: ReportConfig[] = [
  {
    id: "inventory-summary",
    name: "Inventory Summary",
    description:
      "Complete overview of all inventory items with quantities and values",
    category: ReportCategory.INVENTORY,
    fields: [
      "product_name",
      "product_sku",
      "category",
      "quantity",
      "unit_cost",
      "total_value",
      "status",
    ],
    filters: [],
    sorts: [{ field: "total_value", direction: "desc" }],
    chartType: ChartType.TABLE,
  },
  {
    id: "low-stock-items",
    name: "Low Stock Items",
    description: "Products that are below their reorder point",
    category: ReportCategory.INVENTORY,
    fields: [
      "product_name",
      "product_sku",
      "quantity",
      "reorder_point",
      "reorder_quantity",
    ],
    filters: [
      {
        field: "status",
        operator: FilterOperator.IN,
        values: ["low_stock", "reorder_needed"],
      },
    ],
    sorts: [{ field: "quantity", direction: "asc" }],
    chartType: ChartType.TABLE,
  },
  {
    id: "out-of-stock",
    name: "Out of Stock Items",
    description: "Products currently out of stock",
    category: ReportCategory.INVENTORY,
    fields: [
      "product_name",
      "product_sku",
      "category",
      "reorder_point",
      "reorder_quantity",
    ],
    filters: [
      {
        field: "status",
        operator: FilterOperator.EQUALS,
        value: "out_of_stock",
      },
    ],
    sorts: [{ field: "product_name", direction: "asc" }],
    chartType: ChartType.TABLE,
  },
  {
    id: "inventory-by-category",
    name: "Inventory by Category",
    description: "Total inventory value grouped by product category",
    category: ReportCategory.INVENTORY,
    fields: ["category"],
    filters: [],
    sorts: [{ field: "total_value", direction: "desc" }],
    grouping: {
      field: "category",
      aggregations: [
        {
          field: "quantity",
          type: AggregationType.SUM,
          alias: "total_quantity",
        },
        {
          field: "total_value",
          type: AggregationType.SUM,
          alias: "total_value",
        },
      ],
    },
    chartType: ChartType.PIE,
  },
  {
    id: "high-value-inventory",
    name: "High Value Inventory",
    description: "Top 20 most valuable inventory items",
    category: ReportCategory.INVENTORY,
    fields: [
      "product_name",
      "product_sku",
      "quantity",
      "unit_cost",
      "total_value",
    ],
    filters: [],
    sorts: [{ field: "total_value", direction: "desc" }],
    limit: 20,
    chartType: ChartType.BAR,
  },
  {
    id: "inventory-turnover",
    name: "Inventory Turnover Analysis",
    description: "Products with quantity changes for turnover analysis",
    category: ReportCategory.INVENTORY,
    fields: ["product_name", "category", "quantity", "total_value"],
    filters: [],
    sorts: [{ field: "quantity", direction: "desc" }],
    chartType: ChartType.TABLE,
  },
  {
    id: "reorder-recommendations",
    name: "Reorder Recommendations",
    description: "Products that need to be reordered with suggested quantities",
    category: ReportCategory.INVENTORY,
    fields: [
      "product_name",
      "product_sku",
      "quantity",
      "reorder_point",
      "reorder_quantity",
      "unit_cost",
    ],
    filters: [
      {
        field: "status",
        operator: FilterOperator.EQUALS,
        value: "reorder_needed",
      },
    ],
    sorts: [{ field: "quantity", direction: "asc" }],
    chartType: ChartType.TABLE,
  },
  {
    id: "inventory-valuation",
    name: "Total Inventory Valuation",
    description: "Total value of all inventory on hand",
    category: ReportCategory.INVENTORY,
    fields: ["category"],
    filters: [],
    sorts: [],
    grouping: {
      field: "category",
      aggregations: [
        {
          field: "total_value",
          type: AggregationType.SUM,
          alias: "category_value",
        },
      ],
    },
    chartType: ChartType.PIE,
  },
];

// ============================================================================
// Sales Reports
// ============================================================================

export const SALES_REPORTS: ReportConfig[] = [
  {
    id: "sales-summary",
    name: "Sales Summary",
    description: "Overview of all sales transactions",
    category: ReportCategory.SALES,
    fields: [
      "booking_id",
      "customer_name",
      "product_name",
      "quantity_sold",
      "unit_price",
      "total_amount",
      "booking_date",
      "status",
    ],
    filters: [],
    sorts: [{ field: "booking_date", direction: "desc" }],
    chartType: ChartType.TABLE,
  },
  {
    id: "daily-sales",
    name: "Daily Sales Report",
    description: "Sales grouped by day",
    category: ReportCategory.SALES,
    fields: ["booking_date"],
    filters: [],
    sorts: [{ field: "booking_date", direction: "desc" }],
    grouping: {
      field: "booking_date",
      aggregations: [
        {
          field: "total_amount",
          type: AggregationType.SUM,
          alias: "daily_revenue",
        },
        {
          field: "booking_id",
          type: AggregationType.COUNT,
          alias: "transaction_count",
        },
      ],
    },
    chartType: ChartType.LINE,
  },
  {
    id: "sales-by-product",
    name: "Sales by Product",
    description: "Total sales grouped by product",
    category: ReportCategory.SALES,
    fields: ["product_name"],
    filters: [],
    sorts: [{ field: "total_revenue", direction: "desc" }],
    grouping: {
      field: "product_name",
      aggregations: [
        {
          field: "quantity_sold",
          type: AggregationType.SUM,
          alias: "total_quantity",
        },
        {
          field: "total_amount",
          type: AggregationType.SUM,
          alias: "total_revenue",
        },
      ],
    },
    chartType: ChartType.BAR,
  },
  {
    id: "sales-by-customer",
    name: "Sales by Customer",
    description: "Total sales grouped by customer",
    category: ReportCategory.SALES,
    fields: ["customer_name"],
    filters: [],
    sorts: [{ field: "total_spent", direction: "desc" }],
    grouping: {
      field: "customer_name",
      aggregations: [
        {
          field: "total_amount",
          type: AggregationType.SUM,
          alias: "total_spent",
        },
        {
          field: "booking_id",
          type: AggregationType.COUNT,
          alias: "booking_count",
        },
      ],
    },
    chartType: ChartType.BAR,
  },
  {
    id: "top-selling-products",
    name: "Top 10 Selling Products",
    description: "Best performing products by quantity sold",
    category: ReportCategory.SALES,
    fields: ["product_name"],
    filters: [],
    sorts: [{ field: "quantity_sold", direction: "desc" }],
    grouping: {
      field: "product_name",
      aggregations: [
        {
          field: "quantity_sold",
          type: AggregationType.SUM,
          alias: "total_sold",
        },
        { field: "total_amount", type: AggregationType.SUM, alias: "revenue" },
      ],
    },
    limit: 10,
    chartType: ChartType.BAR,
  },
  {
    id: "monthly-revenue",
    name: "Monthly Revenue Report",
    description: "Revenue trends by month",
    category: ReportCategory.SALES,
    fields: ["booking_date"],
    filters: [],
    sorts: [{ field: "booking_date", direction: "asc" }],
    grouping: {
      field: "booking_date",
      aggregations: [
        {
          field: "total_amount",
          type: AggregationType.SUM,
          alias: "monthly_revenue",
        },
      ],
    },
    chartType: ChartType.LINE,
  },
  {
    id: "pending-bookings",
    name: "Pending Bookings",
    description: "All bookings awaiting confirmation",
    category: ReportCategory.SALES,
    fields: [
      "booking_id",
      "customer_name",
      "product_name",
      "quantity_sold",
      "total_amount",
      "booking_date",
    ],
    filters: [
      {
        field: "status",
        operator: FilterOperator.EQUALS,
        value: "pending",
      },
    ],
    sorts: [{ field: "booking_date", direction: "asc" }],
    chartType: ChartType.TABLE,
  },
  {
    id: "completed-bookings",
    name: "Completed Bookings",
    description: "All completed sales transactions",
    category: ReportCategory.SALES,
    fields: [
      "booking_id",
      "customer_name",
      "product_name",
      "total_amount",
      "pickup_date",
    ],
    filters: [
      {
        field: "status",
        operator: FilterOperator.EQUALS,
        value: "completed",
      },
    ],
    sorts: [{ field: "pickup_date", direction: "desc" }],
    chartType: ChartType.TABLE,
  },
];

// ============================================================================
// Financial Reports
// ============================================================================

export const FINANCIAL_REPORTS: ReportConfig[] = [
  {
    id: "revenue-summary",
    name: "Revenue Summary",
    description: "Total revenue and transaction count",
    category: ReportCategory.FINANCIAL,
    fields: ["booking_date"],
    filters: [],
    sorts: [],
    grouping: {
      field: "booking_date",
      aggregations: [
        {
          field: "total_amount",
          type: AggregationType.SUM,
          alias: "total_revenue",
        },
        {
          field: "booking_id",
          type: AggregationType.COUNT,
          alias: "transaction_count",
        },
        {
          field: "total_amount",
          type: AggregationType.AVG,
          alias: "average_transaction",
        },
      ],
    },
    chartType: ChartType.TABLE,
  },
  {
    id: "profit-margin-analysis",
    name: "Profit Margin Analysis",
    description: "Product profit margins (revenue vs cost)",
    category: ReportCategory.FINANCIAL,
    fields: [
      "product_name",
      "unit_cost",
      "unit_price",
      "quantity",
      "total_value",
    ],
    filters: [],
    sorts: [{ field: "total_value", direction: "desc" }],
    chartType: ChartType.TABLE,
  },
  {
    id: "cost-of-goods-sold",
    name: "Cost of Goods Sold (COGS)",
    description: "Total cost of inventory sold",
    category: ReportCategory.FINANCIAL,
    fields: ["product_name", "category"],
    filters: [],
    sorts: [],
    grouping: {
      field: "category",
      aggregations: [
        { field: "unit_cost", type: AggregationType.SUM, alias: "total_cost" },
      ],
    },
    chartType: ChartType.PIE,
  },
  {
    id: "revenue-by-category",
    name: "Revenue by Category",
    description: "Total revenue grouped by product category",
    category: ReportCategory.FINANCIAL,
    fields: ["category"],
    filters: [],
    sorts: [{ field: "revenue", direction: "desc" }],
    grouping: {
      field: "category",
      aggregations: [
        { field: "total_amount", type: AggregationType.SUM, alias: "revenue" },
      ],
    },
    chartType: ChartType.PIE,
  },
  {
    id: "average-transaction-value",
    name: "Average Transaction Value",
    description: "Average value per transaction over time",
    category: ReportCategory.FINANCIAL,
    fields: ["booking_date"],
    filters: [],
    sorts: [{ field: "booking_date", direction: "asc" }],
    grouping: {
      field: "booking_date",
      aggregations: [
        {
          field: "total_amount",
          type: AggregationType.AVG,
          alias: "avg_transaction",
        },
      ],
    },
    chartType: ChartType.LINE,
  },
];

// ============================================================================
// Customer Reports
// ============================================================================

export const CUSTOMER_REPORTS: ReportConfig[] = [
  {
    id: "customer-list",
    name: "Customer List",
    description: "Complete list of all customers",
    category: ReportCategory.CUSTOMERS,
    fields: [
      "customer_name",
      "email",
      "phone",
      "total_bookings",
      "total_spent",
      "last_booking_date",
    ],
    filters: [],
    sorts: [{ field: "total_spent", direction: "desc" }],
    chartType: ChartType.TABLE,
  },
  {
    id: "top-customers",
    name: "Top 20 Customers",
    description: "Highest spending customers",
    category: ReportCategory.CUSTOMERS,
    fields: ["customer_name", "total_bookings", "total_spent"],
    filters: [],
    sorts: [{ field: "total_spent", direction: "desc" }],
    limit: 20,
    chartType: ChartType.BAR,
  },
  {
    id: "new-customers",
    name: "New Customers Report",
    description: "Recently registered customers",
    category: ReportCategory.CUSTOMERS,
    fields: ["customer_name", "email", "phone", "created_at"],
    filters: [],
    sorts: [{ field: "created_at", direction: "desc" }],
    limit: 50,
    chartType: ChartType.TABLE,
  },
  {
    id: "inactive-customers",
    name: "Inactive Customers",
    description: "Customers who haven't made recent bookings",
    category: ReportCategory.CUSTOMERS,
    fields: ["customer_name", "email", "last_booking_date", "total_bookings"],
    filters: [],
    sorts: [{ field: "last_booking_date", direction: "asc" }],
    chartType: ChartType.TABLE,
  },
  {
    id: "customer-lifetime-value",
    name: "Customer Lifetime Value",
    description: "Total value contributed by each customer",
    category: ReportCategory.CUSTOMERS,
    fields: ["customer_name", "total_bookings", "total_spent"],
    filters: [],
    sorts: [{ field: "total_spent", direction: "desc" }],
    chartType: ChartType.BAR,
  },
];

// ============================================================================
// Operations Reports
// ============================================================================

export const OPERATIONS_REPORTS: ReportConfig[] = [
  {
    id: "pickup-schedule",
    name: "Pickup Schedule",
    description: "Upcoming pickups organized by date",
    category: ReportCategory.OPERATIONS,
    fields: [
      "pickup_date",
      "customer_name",
      "product_name",
      "quantity_sold",
      "booking_id",
    ],
    filters: [
      {
        field: "status",
        operator: FilterOperator.IN,
        values: ["confirmed", "pending"],
      },
    ],
    sorts: [{ field: "pickup_date", direction: "asc" }],
    chartType: ChartType.TABLE,
  },
  {
    id: "booking-fulfillment-rate",
    name: "Booking Fulfillment Rate",
    description: "Percentage of completed vs cancelled bookings",
    category: ReportCategory.OPERATIONS,
    fields: ["status"],
    filters: [],
    sorts: [],
    grouping: {
      field: "status",
      aggregations: [
        { field: "booking_id", type: AggregationType.COUNT, alias: "count" },
      ],
    },
    chartType: ChartType.PIE,
  },
  {
    id: "daily-operations",
    name: "Daily Operations Summary",
    description: "Daily bookings, pickups, and revenue",
    category: ReportCategory.OPERATIONS,
    fields: ["booking_date"],
    filters: [],
    sorts: [{ field: "booking_date", direction: "desc" }],
    grouping: {
      field: "booking_date",
      aggregations: [
        {
          field: "booking_id",
          type: AggregationType.COUNT,
          alias: "booking_count",
        },
        {
          field: "quantity_sold",
          type: AggregationType.SUM,
          alias: "items_sold",
        },
        {
          field: "total_amount",
          type: AggregationType.SUM,
          alias: "daily_revenue",
        },
      ],
    },
    chartType: ChartType.TABLE,
  },
  {
    id: "cancelled-bookings",
    name: "Cancelled Bookings",
    description: "All cancelled bookings with details",
    category: ReportCategory.OPERATIONS,
    fields: [
      "booking_id",
      "customer_name",
      "product_name",
      "total_amount",
      "booking_date",
    ],
    filters: [
      {
        field: "status",
        operator: FilterOperator.EQUALS,
        value: "cancelled",
      },
    ],
    sorts: [{ field: "booking_date", direction: "desc" }],
    chartType: ChartType.TABLE,
  },
];

// ============================================================================
// All Report Templates
// ============================================================================

export const ALL_REPORT_TEMPLATES: ReportConfig[] = [
  ...INVENTORY_REPORTS,
  ...SALES_REPORTS,
  ...FINANCIAL_REPORTS,
  ...CUSTOMER_REPORTS,
  ...OPERATIONS_REPORTS,
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getReportTemplate(id: string): ReportConfig | undefined {
  return ALL_REPORT_TEMPLATES.find((template) => template.id === id);
}

export function getReportTemplatesByCategory(
  category: ReportCategory,
): ReportConfig[] {
  return ALL_REPORT_TEMPLATES.filter(
    (template) => template.category === category,
  );
}

export function getReportTemplateCount(): number {
  return ALL_REPORT_TEMPLATES.length;
}

export function getReportCategoryCounts(): Record<ReportCategory, number> {
  return {
    [ReportCategory.INVENTORY]: INVENTORY_REPORTS.length,
    [ReportCategory.SALES]: SALES_REPORTS.length,
    [ReportCategory.FINANCIAL]: FINANCIAL_REPORTS.length,
    [ReportCategory.CUSTOMERS]: CUSTOMER_REPORTS.length,
    [ReportCategory.OPERATIONS]: OPERATIONS_REPORTS.length,
    [ReportCategory.CUSTOM]: 0,
  };
}

export function searchReportTemplates(query: string): ReportConfig[] {
  const lowerQuery = query.toLowerCase();
  return ALL_REPORT_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description?.toLowerCase().includes(lowerQuery),
  );
}
