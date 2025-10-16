/**
 * Report Engine for FlowStock
 * 
 * Executes report configurations and generates data results.
 * Handles filtering, sorting, grouping, and aggregations.
 */

import { prisma } from '@/lib/prisma';
import {
  ReportConfig,
  ReportFilter,
  ReportSort,
  FilterOperator,
  AggregationType,
  FieldType,
  getFieldById,
} from './report-types';

// ============================================================================
// Report Execution
// ============================================================================

export interface ReportResult {
  data: any[];
  totalRows: number;
  executionTime: number;
  config: ReportConfig;
}

/**
 * Execute a report configuration and return results
 */
export async function executeReport(
  config: ReportConfig,
  tenantId: string
): Promise<ReportResult> {
  const startTime = Date.now();

  // Build and execute query based on report category
  let data: any[] = [];

  switch (config.category) {
    case 'inventory':
      data = await executeInventoryReport(config, tenantId);
      break;
    case 'sales':
      data = await executeSalesReport(config, tenantId);
      break;
    case 'customers':
      data = await executeCustomerReport(config, tenantId);
      break;
    case 'financial':
      data = await executeFinancialReport(config, tenantId);
      break;
    case 'operations':
      data = await executeOperationsReport(config, tenantId);
      break;
    default:
      data = [];
  }

  const executionTime = Date.now() - startTime;

  return {
    data,
    totalRows: data.length,
    executionTime,
    config,
  };
}

// ============================================================================
// Inventory Reports
// ============================================================================

async function executeInventoryReport(
  config: ReportConfig,
  tenantId: string
): Promise<any[]> {
  const where: any = { tenantId };

  // Apply filters
  config.filters.forEach((filter) => {
    applyFilter(where, filter);
  });

  if (config.grouping) {
    // Grouped report
    const groupBy = config.grouping.field;
    const aggregations: any = {};

    config.grouping.aggregations.forEach((agg) => {
      const aggKey = agg.alias || `${agg.type}_${agg.field}`;
      aggregations[aggKey] = {
        [agg.type === AggregationType.COUNT ? '_count' : `_${agg.type}`]:
          agg.field === '*' ? true : { [agg.field]: true },
      };
    });

    const results = await prisma.product.groupBy({
      by: [groupBy as any],
      where,
      ...aggregations,
      orderBy: buildOrderBy(config.sorts),
      take: config.limit,
    });

    return results;
  } else {
    // Standard report
    const select = buildSelect(config.fields);

    const results = await prisma.product.findMany({
      where,
      select,
      orderBy: buildOrderBy(config.sorts),
      take: config.limit,
    });

    return results;
  }
}

// ============================================================================
// Sales Reports
// ============================================================================

async function executeSalesReport(
  config: ReportConfig,
  tenantId: string
): Promise<any[]> {
  const where: any = { tenantId };

  // Apply filters
  config.filters.forEach((filter) => {
    applyFilter(where, filter);
  });

  if (config.grouping) {
    // Grouped report
    const groupBy = config.grouping.field;
    const aggregations: any = {};

    config.grouping.aggregations.forEach((agg) => {
      const aggKey = agg.alias || `${agg.type}_${agg.field}`;
      aggregations[aggKey] = {
        [agg.type === AggregationType.COUNT ? '_count' : `_${agg.type}`]:
          agg.field === '*' ? true : { [agg.field]: true },
      };
    });

    const results = await prisma.booking.groupBy({
      by: [groupBy as any],
      where,
      ...aggregations,
      orderBy: buildOrderBy(config.sorts),
      take: config.limit,
    });

    return results;
  } else {
    // Standard report with joins
    const include: any = {};

    if (config.fields.includes('customer_name')) {
      include.customer = { select: { name: true } };
    }

    if (config.fields.includes('product_name')) {
      include.product = { select: { name: true } };
    }

    const results = await prisma.booking.findMany({
      where,
      include,
      orderBy: buildOrderBy(config.sorts),
      take: config.limit,
    });

    // Transform results to flatten joins
    return results.map((booking: any) => ({
      booking_id: booking.id,
      customer_name: booking.customer?.name,
      product_name: booking.product?.name,
      quantity_sold: booking.quantity,
      unit_price: booking.unitPrice,
      total_amount: booking.totalAmount,
      booking_date: booking.createdAt,
      pickup_date: booking.pickupDate,
      status: booking.status,
    }));
  }
}

// ============================================================================
// Customer Reports
// ============================================================================

async function executeCustomerReport(
  config: ReportConfig,
  tenantId: string
): Promise<any[]> {
  const where: any = { tenantId };

  // Apply filters
  config.filters.forEach((filter) => {
    applyFilter(where, filter);
  });

  const results = await prisma.customer.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: {
        select: { bookings: true },
      },
      bookings: {
        select: {
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: buildOrderBy(config.sorts),
    take: config.limit,
  });

  // Transform results
  return results.map((customer: any) => ({
    customer_name: customer.name,
    email: customer.email,
    phone: customer.phone,
    total_bookings: customer._count.bookings,
    total_spent: customer.bookings.reduce(
      (sum: number, b: any) => sum + (b.totalAmount || 0),
      0
    ),
    last_booking_date: customer.bookings[0]?.createdAt,
    created_at: customer.createdAt,
  }));
}

// ============================================================================
// Financial Reports
// ============================================================================

async function executeFinancialReport(
  config: ReportConfig,
  tenantId: string
): Promise<any[]> {
  // Financial reports combine inventory and sales data
  // Use the appropriate execution based on fields
  if (config.fields.some((f) => f.includes('booking') || f.includes('revenue'))) {
    return executeSalesReport(config, tenantId);
  } else {
    return executeInventoryReport(config, tenantId);
  }
}

// ============================================================================
// Operations Reports
// ============================================================================

async function executeOperationsReport(
  config: ReportConfig,
  tenantId: string
): Promise<any[]> {
  // Operations reports are primarily booking-based
  return executeSalesReport(config, tenantId);
}

// ============================================================================
// Filter Application
// ============================================================================

function applyFilter(where: any, filter: ReportFilter): void {
  const field = filter.field;

  switch (filter.operator) {
    case FilterOperator.EQUALS:
      where[field] = filter.value;
      break;

    case FilterOperator.NOT_EQUALS:
      where[field] = { not: filter.value };
      break;

    case FilterOperator.GREATER_THAN:
      where[field] = { gt: filter.value };
      break;

    case FilterOperator.LESS_THAN:
      where[field] = { lt: filter.value };
      break;

    case FilterOperator.GREATER_OR_EQUAL:
      where[field] = { gte: filter.value };
      break;

    case FilterOperator.LESS_OR_EQUAL:
      where[field] = { lte: filter.value };
      break;

    case FilterOperator.CONTAINS:
      where[field] = { contains: filter.value, mode: 'insensitive' };
      break;

    case FilterOperator.NOT_CONTAINS:
      where[field] = { not: { contains: filter.value, mode: 'insensitive' } };
      break;

    case FilterOperator.STARTS_WITH:
      where[field] = { startsWith: filter.value, mode: 'insensitive' };
      break;

    case FilterOperator.ENDS_WITH:
      where[field] = { endsWith: filter.value, mode: 'insensitive' };
      break;

    case FilterOperator.IN:
      where[field] = { in: filter.values };
      break;

    case FilterOperator.NOT_IN:
      where[field] = { notIn: filter.values };
      break;

    case FilterOperator.BETWEEN:
      if (filter.values && filter.values.length === 2) {
        where[field] = { gte: filter.values[0], lte: filter.values[1] };
      }
      break;

    case FilterOperator.IS_NULL:
      where[field] = null;
      break;

    case FilterOperator.IS_NOT_NULL:
      where[field] = { not: null };
      break;
  }
}

// ============================================================================
// Query Builders
// ============================================================================

function buildSelect(fields: string[]): any {
  const select: any = {};
  fields.forEach((field) => {
    select[field] = true;
  });
  return select;
}

function buildOrderBy(sorts: ReportSort[]): any {
  if (!sorts || sorts.length === 0) return undefined;

  if (sorts.length === 1 && sorts[0]) {
    return { [sorts[0].field]: sorts[0].direction };
  }

  return sorts.map((sort) => ({ [sort.field]: sort.direction }));
}

// ============================================================================
// Data Transformation
// ============================================================================

export function formatReportData(
  data: any[],
  config: ReportConfig
): any[] {
  return data.map((row) => {
    const formatted: any = {};

    config.fields.forEach((fieldId) => {
      const field = getFieldById(fieldId, config.category);
      const value = row[fieldId];

      if (field) {
        formatted[fieldId] = formatValue(value, field.type);
      } else {
        formatted[fieldId] = value;
      }
    });

    return formatted;
  });
}

function formatValue(value: any, type: FieldType): any {
  if (value === null || value === undefined) return null;

  switch (type) {
    case FieldType.CURRENCY:
      return typeof value === 'number' ? value.toFixed(2) : value;

    case FieldType.PERCENTAGE:
      return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : value;

    case FieldType.DATE:
      return value instanceof Date ? value.toISOString().split('T')[0] : value;

    case FieldType.DATETIME:
      return value instanceof Date ? value.toISOString() : value;

    case FieldType.NUMBER:
      return typeof value === 'number' ? value : parseFloat(value);

    default:
      return value;
  }
}

// ============================================================================
// Report Validation
// ============================================================================

export function validateReportConfig(config: ReportConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!config.name || config.name.trim() === '') {
    errors.push('Report name is required');
  }

  if (!config.category) {
    errors.push('Report category is required');
  }

  if (!config.fields || config.fields.length === 0) {
    errors.push('At least one field must be selected');
  }

  // Validate filters
  config.filters?.forEach((filter, index) => {
    if (!filter.field) {
      errors.push(`Filter ${index + 1}: Field is required`);
    }
    if (!filter.operator) {
      errors.push(`Filter ${index + 1}: Operator is required`);
    }
    if (
      filter.operator !== FilterOperator.IS_NULL &&
      filter.operator !== FilterOperator.IS_NOT_NULL &&
      !filter.value &&
      !filter.values
    ) {
      errors.push(`Filter ${index + 1}: Value is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
