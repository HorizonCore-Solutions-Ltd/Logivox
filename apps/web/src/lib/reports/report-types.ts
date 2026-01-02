/**
 * Report Types & Categories for LogiVox
 * 
 * Defines all available report types, their metadata, and categorization.
 * Used by the report builder and report engine.
 */

// ============================================================================
// Report Categories
// ============================================================================

export enum ReportCategory {
  INVENTORY = 'inventory',
  SALES = 'sales',
  FINANCIAL = 'financial',
  OPERATIONS = 'operations',
  CUSTOMERS = 'customers',
  CUSTOM = 'custom',
}

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  [ReportCategory.INVENTORY]: 'Inventory',
  [ReportCategory.SALES]: 'Sales',
  [ReportCategory.FINANCIAL]: 'Financial',
  [ReportCategory.OPERATIONS]: 'Operations',
  [ReportCategory.CUSTOMERS]: 'Customers',
  [ReportCategory.CUSTOM]: 'Custom',
};

// ============================================================================
// Report Field Types
// ============================================================================

export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  ENUM = 'enum',
}

export enum AggregationType {
  SUM = 'sum',
  AVG = 'avg',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  DISTINCT_COUNT = 'distinct_count',
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_OR_EQUAL = 'greater_or_equal',
  LESS_OR_EQUAL = 'less_or_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN = 'in',
  NOT_IN = 'not_in',
  BETWEEN = 'between',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
}

// ============================================================================
// Report Field Definition
// ============================================================================

export interface ReportField {
  id: string;
  name: string;
  description?: string;
  type: FieldType;
  category: string;
  aggregatable: boolean;
  filterable: boolean;
  sortable: boolean;
  groupable: boolean;
  defaultAggregation?: AggregationType;
  enumValues?: { value: string; label: string }[];
}

// ============================================================================
// Report Filter
// ============================================================================

export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value?: any;
  values?: any[]; // For IN, NOT_IN, BETWEEN operators
}

// ============================================================================
// Report Sort
// ============================================================================

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// Report Grouping
// ============================================================================

export interface ReportGrouping {
  field: string;
  aggregations: {
    field: string;
    type: AggregationType;
    alias?: string;
  }[];
}

// ============================================================================
// Report Configuration
// ============================================================================

export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  category: ReportCategory;
  fields: string[]; // Field IDs to include
  filters: ReportFilter[];
  sorts: ReportSort[];
  grouping?: ReportGrouping;
  limit?: number;
  chartType?: ChartType;
}

// ============================================================================
// Chart Types
// ============================================================================

export enum ChartType {
  TABLE = 'table',
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter',
  COMBO = 'combo',
}

// ============================================================================
// Available Report Fields
// ============================================================================

export const INVENTORY_FIELDS: ReportField[] = [
  {
    id: 'product_name',
    name: 'Product Name',
    type: FieldType.STRING,
    category: 'Product',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: true,
  },
  {
    id: 'product_sku',
    name: 'SKU',
    type: FieldType.STRING,
    category: 'Product',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: true,
  },
  {
    id: 'category',
    name: 'Category',
    type: FieldType.STRING,
    category: 'Product',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: true,
  },
  {
    id: 'quantity',
    name: 'Quantity on Hand',
    type: FieldType.NUMBER,
    category: 'Inventory',
    aggregatable: true,
    filterable: true,
    sortable: true,
    groupable: false,
    defaultAggregation: AggregationType.SUM,
  },
  {
    id: 'reorder_point',
    name: 'Reorder Point',
    type: FieldType.NUMBER,
    category: 'Inventory',
    aggregatable: true,
    filterable: true,
    sortable: true,
    groupable: false,
  },
  {
    id: 'reorder_quantity',
    name: 'Reorder Quantity',
    type: FieldType.NUMBER,
    category: 'Inventory',
    aggregatable: true,
    filterable: true,
    sortable: true,
    groupable: false,
  },
  {
    id: 'unit_cost',
    name: 'Unit Cost',
    type: FieldType.CURRENCY,
    category: 'Financial',
    aggregatable: true,
    filterable: true,
    sortable: true,
    groupable: false,
    defaultAggregation: AggregationType.AVG,
  },
  {
    id: 'unit_price',
    name: 'Unit Price',
    type: FieldType.CURRENCY,
    category: 'Financial',
    aggregatable: true,
    filterable: true,
    sortable: true,
    groupable: false,
    defaultAggregation: AggregationType.AVG,
  },
  {
    id: 'total_value',
    name: 'Total Value',
    type: FieldType.CURRENCY,
    category: 'Financial',
    aggregatable: true,
    filterable: true,
    sortable: true,
    groupable: false,
    defaultAggregation: AggregationType.SUM,
  },
  {
    id: 'status',
    name: 'Status',
    type: FieldType.ENUM,
    category: 'Inventory',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: true,
    enumValues: [
      { value: 'in_stock', label: 'In Stock' },
      { value: 'low_stock', label: 'Low Stock' },
      { value: 'out_of_stock', label: 'Out of Stock' },
      { value: 'reorder_needed', label: 'Reorder Needed' },
    ],
  },
];

export const SALES_FIELDS: ReportField[] = [
  {
    id: 'booking_id',
    name: 'Booking ID',
    type: FieldType.STRING,
    category: 'Booking',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: false,
  },
  {
    id: 'customer_name',
    name: 'Customer Name',
    type: FieldType.STRING,
    category: 'Customer',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: true,
  },
  {
    id: 'product_name',
    name: 'Product Name',
    type: FieldType.STRING,
    category: 'Product',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: true,
  },
  {
    id: 'quantity_sold',
    name: 'Quantity Sold',
    type: FieldType.NUMBER,
    category: 'Sales',
    aggregatable: true,
    filterable: true,
    sortable: true,
    groupable: false,
    defaultAggregation: AggregationType.SUM,
  },
  {
    id: 'unit_price',
    name: 'Unit Price',
    type: FieldType.CURRENCY,
    category: 'Sales',
    aggregatable: true,
    filterable: true,
    sortable: true,
    groupable: false,
    defaultAggregation: AggregationType.AVG,
  },
  {
    id: 'total_amount',
    name: 'Total Amount',
    type: FieldType.CURRENCY,
    category: 'Sales',
    aggregatable: true,
    filterable: true,
    sortable: true,
    groupable: false,
    defaultAggregation: AggregationType.SUM,
  },
  {
    id: 'booking_date',
    name: 'Booking Date',
    type: FieldType.DATE,
    category: 'Booking',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: true,
  },
  {
    id: 'pickup_date',
    name: 'Pickup Date',
    type: FieldType.DATE,
    category: 'Booking',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: true,
  },
  {
    id: 'status',
    name: 'Status',
    type: FieldType.ENUM,
    category: 'Booking',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: true,
    enumValues: [
      { value: 'pending', label: 'Pending' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
];

export const CUSTOMER_FIELDS: ReportField[] = [
  {
    id: 'customer_name',
    name: 'Customer Name',
    type: FieldType.STRING,
    category: 'Customer',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: true,
  },
  {
    id: 'email',
    name: 'Email',
    type: FieldType.STRING,
    category: 'Customer',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: false,
  },
  {
    id: 'phone',
    name: 'Phone',
    type: FieldType.STRING,
    category: 'Customer',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: false,
  },
  {
    id: 'total_bookings',
    name: 'Total Bookings',
    type: FieldType.NUMBER,
    category: 'Activity',
    aggregatable: true,
    filterable: true,
    sortable: true,
    groupable: false,
    defaultAggregation: AggregationType.SUM,
  },
  {
    id: 'total_spent',
    name: 'Total Spent',
    type: FieldType.CURRENCY,
    category: 'Activity',
    aggregatable: true,
    filterable: true,
    sortable: true,
    groupable: false,
    defaultAggregation: AggregationType.SUM,
  },
  {
    id: 'last_booking_date',
    name: 'Last Booking Date',
    type: FieldType.DATE,
    category: 'Activity',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: false,
  },
  {
    id: 'created_at',
    name: 'Registration Date',
    type: FieldType.DATE,
    category: 'Customer',
    aggregatable: false,
    filterable: true,
    sortable: true,
    groupable: true,
  },
];

// ============================================================================
// Field Registry
// ============================================================================

export const ALL_FIELDS: Record<ReportCategory, ReportField[]> = {
  [ReportCategory.INVENTORY]: INVENTORY_FIELDS,
  [ReportCategory.SALES]: SALES_FIELDS,
  [ReportCategory.CUSTOMERS]: CUSTOMER_FIELDS,
  [ReportCategory.FINANCIAL]: [...INVENTORY_FIELDS, ...SALES_FIELDS],
  [ReportCategory.OPERATIONS]: [...INVENTORY_FIELDS, ...SALES_FIELDS],
  [ReportCategory.CUSTOM]: [...INVENTORY_FIELDS, ...SALES_FIELDS, ...CUSTOMER_FIELDS],
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getFieldById(fieldId: string, category: ReportCategory): ReportField | undefined {
  return ALL_FIELDS[category]?.find((f) => f.id === fieldId);
}

export function getFieldsByCategory(category: ReportCategory): ReportField[] {
  return ALL_FIELDS[category] || [];
}

export function getFilterableFields(category: ReportCategory): ReportField[] {
  return getFieldsByCategory(category).filter((f) => f.filterable);
}

export function getSortableFields(category: ReportCategory): ReportField[] {
  return getFieldsByCategory(category).filter((f) => f.sortable);
}

export function getGroupableFields(category: ReportCategory): ReportField[] {
  return getFieldsByCategory(category).filter((f) => f.groupable);
}

export function getAggregatableFields(category: ReportCategory): ReportField[] {
  return getFieldsByCategory(category).filter((f) => f.aggregatable);
}

// ============================================================================
// Filter Operator Helpers
// ============================================================================

export function getOperatorsForFieldType(fieldType: FieldType): FilterOperator[] {
  switch (fieldType) {
    case FieldType.STRING:
      return [
        FilterOperator.EQUALS,
        FilterOperator.NOT_EQUALS,
        FilterOperator.CONTAINS,
        FilterOperator.NOT_CONTAINS,
        FilterOperator.STARTS_WITH,
        FilterOperator.ENDS_WITH,
        FilterOperator.IS_NULL,
        FilterOperator.IS_NOT_NULL,
      ];

    case FieldType.NUMBER:
    case FieldType.CURRENCY:
    case FieldType.PERCENTAGE:
      return [
        FilterOperator.EQUALS,
        FilterOperator.NOT_EQUALS,
        FilterOperator.GREATER_THAN,
        FilterOperator.LESS_THAN,
        FilterOperator.GREATER_OR_EQUAL,
        FilterOperator.LESS_OR_EQUAL,
        FilterOperator.BETWEEN,
        FilterOperator.IS_NULL,
        FilterOperator.IS_NOT_NULL,
      ];

    case FieldType.DATE:
    case FieldType.DATETIME:
      return [
        FilterOperator.EQUALS,
        FilterOperator.NOT_EQUALS,
        FilterOperator.GREATER_THAN,
        FilterOperator.LESS_THAN,
        FilterOperator.GREATER_OR_EQUAL,
        FilterOperator.LESS_OR_EQUAL,
        FilterOperator.BETWEEN,
        FilterOperator.IS_NULL,
        FilterOperator.IS_NOT_NULL,
      ];

    case FieldType.BOOLEAN:
      return [FilterOperator.EQUALS, FilterOperator.NOT_EQUALS];

    case FieldType.ENUM:
      return [
        FilterOperator.EQUALS,
        FilterOperator.NOT_EQUALS,
        FilterOperator.IN,
        FilterOperator.NOT_IN,
      ];

    default:
      return [FilterOperator.EQUALS, FilterOperator.NOT_EQUALS];
  }
}

export function getOperatorLabel(operator: FilterOperator): string {
  const labels: Record<FilterOperator, string> = {
    [FilterOperator.EQUALS]: 'Equals',
    [FilterOperator.NOT_EQUALS]: 'Not Equals',
    [FilterOperator.GREATER_THAN]: 'Greater Than',
    [FilterOperator.LESS_THAN]: 'Less Than',
    [FilterOperator.GREATER_OR_EQUAL]: 'Greater or Equal',
    [FilterOperator.LESS_OR_EQUAL]: 'Less or Equal',
    [FilterOperator.CONTAINS]: 'Contains',
    [FilterOperator.NOT_CONTAINS]: 'Not Contains',
    [FilterOperator.STARTS_WITH]: 'Starts With',
    [FilterOperator.ENDS_WITH]: 'Ends With',
    [FilterOperator.IN]: 'In',
    [FilterOperator.NOT_IN]: 'Not In',
    [FilterOperator.BETWEEN]: 'Between',
    [FilterOperator.IS_NULL]: 'Is Null',
    [FilterOperator.IS_NOT_NULL]: 'Is Not Null',
  };

  return labels[operator];
}
