# LogiVox TypeScript Types Reference

> **✅ COMPLETED**: Comprehensive TypeScript types documentation and shared package implementation

## Overview

This document provides comprehensive TypeScript type definitions for LogiVox. These types are centralized in the `packages/shared` package to ensure consistency across all applications. The package includes types, constants, validators, and utilities.

## Package Structure

```
packages/shared/
├── src/
│   ├── types.ts          # Core type definitions and interfaces  
│   ├── constants.ts      # Application constants and configuration
│   ├── validators.ts     # Validation functions and rules
│   ├── utils.ts          # Utility functions and helpers
│   └── index.ts          # Main export file
├── package.json          # Package configuration
└── tsconfig.json         # TypeScript configuration
```

## Installation & Usage

### Import Shared Types
```typescript
// Import specific types
import { User, Organization, InventoryItem } from '@logivox/shared';

// Import constants  
import { API_VERSION, VALIDATION_LIMITS } from '@logivox/shared';

// Import validators
import { userValidators, validateInventoryItem } from '@logivox/shared';

// Import utilities
import { stringUtils, dateUtils, numberUtils } from '@logivox/shared';
```

## Core Entity Types

### Organization & User Types

```typescript
// Organization entity
export interface Organization {
  id: string;
  name: string;
  domain: string;
  plan: SubscriptionPlan;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface OrganizationSettings {
  timezone: string;
  currency: Currency;
  dateFormat: string;
  lowStockThreshold: number;
  autoReorderEnabled: boolean;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  lowStock: boolean;
  orderUpdates: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

// User entity and related types
export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt: Date | null;
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  organization?: Organization;
  createdInventoryItems?: InventoryItem[];
  stockMovements?: StockMovement[];
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER'
}

export enum Permission {
  // Inventory permissions
  INVENTORY_READ = 'inventory:read',
  INVENTORY_WRITE = 'inventory:write',
  INVENTORY_DELETE = 'inventory:delete',
  INVENTORY_ADJUST = 'inventory:adjust',
  
  // Warehouse permissions
  WAREHOUSE_READ = 'warehouse:read',
  WAREHOUSE_WRITE = 'warehouse:write',
  WAREHOUSE_DELETE = 'warehouse:delete',
  WAREHOUSE_MANAGE = 'warehouse:manage',
  
  // Purchase Order permissions
  PO_READ = 'po:read',
  PO_WRITE = 'po:write',
  PO_APPROVE = 'po:approve',
  PO_DELETE = 'po:delete',
  
  // User management permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_INVITE = 'user:invite',
  
  // Administrative permissions
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write',
  ADMIN_BILLING = 'admin:billing',
  ADMIN_AUDIT = 'admin:audit'
}
```

### Warehouse & Location Types

```typescript
// Warehouse entity
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  organizationId: string;
  isActive: boolean;
  settings: WarehouseSettings;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  organization?: Organization;
  inventoryItems?: InventoryItem[];
  stockMovements?: StockMovement[];
  locations?: Location[];
}

export interface WarehouseSettings {
  allowNegativeStock: boolean;
  requireBarcodes: boolean;
  enableLocationTracking: boolean;
  defaultLocationId?: string;
  autoReorderEnabled: boolean;
  stockCountFrequency: StockCountFrequency;
}

export enum StockCountFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY'
}

// Location within warehouse
export interface Location {
  id: string;
  name: string;
  code: string;
  description?: string;
  warehouseId: string;
  parentLocationId?: string;
  locationType: LocationType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  warehouse?: Warehouse;
  parentLocation?: Location;
  childLocations?: Location[];
  inventoryItems?: InventoryItem[];
}

export enum LocationType {
  ZONE = 'ZONE',
  AISLE = 'AISLE',
  RACK = 'RACK',
  SHELF = 'SHELF',
  BIN = 'BIN'
}
```

### Inventory & Product Types

```typescript
// Inventory item entity
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number; // Computed: currentStock - reservedStock
  minimumStock: number;
  maximumStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  unitPrice: number;
  weight?: number;
  dimensions?: ProductDimensions;
  organizationId: string;
  warehouseId: string;
  categoryId?: string;
  supplierId?: string;
  locationId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  organization?: Organization;
  warehouse?: Warehouse;
  category?: Category;
  supplier?: Supplier;
  location?: Location;
  stockMovements?: StockMovement[];
  purchaseOrderItems?: PurchaseOrderItem[];
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: DimensionUnit;
}

export enum DimensionUnit {
  CM = 'CM',
  INCH = 'INCH',
  M = 'M',
  FT = 'FT'
}

// Product category
export interface Category {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  parentCategoryId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  organization?: Organization;
  parentCategory?: Category;
  childCategories?: Category[];
  inventoryItems?: InventoryItem[];
}
```

### Stock Movement & Audit Types

```typescript
// Stock movement tracking
export interface StockMovement {
  id: string;
  inventoryItemId: string;
  warehouseId: string;
  movementType: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId?: string; // PO ID, Transfer ID, etc.
  referenceType?: ReferenceType;
  userId?: string;
  notes?: string;
  timestamp: Date;
  
  // Relations
  inventoryItem?: InventoryItem;
  warehouse?: Warehouse;
  user?: User;
}

export enum MovementType {
  IN = 'IN',           // Stock increase
  OUT = 'OUT',         // Stock decrease
  TRANSFER = 'TRANSFER', // Inter-warehouse transfer
  ADJUSTMENT = 'ADJUSTMENT', // Manual adjustment
  RETURN = 'RETURN',   // Return from customer
  DAMAGE = 'DAMAGE',   // Damaged goods
  COUNT = 'COUNT'      // Cycle count adjustment
}

export enum ReferenceType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  TRANSFER_ORDER = 'TRANSFER_ORDER',
  SALE_ORDER = 'SALE_ORDER',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  CYCLE_COUNT = 'CYCLE_COUNT',
  RETURN = 'RETURN'
}

// Stock adjustment
export interface StockAdjustment {
  id: string;
  inventoryItemId: string;
  adjustmentQuantity: number;
  reason: AdjustmentReason;
  notes?: string;
  userId: string;
  approvedBy?: string;
  approvedAt?: Date;
  status: AdjustmentStatus;
  createdAt: Date;
  
  // Relations
  inventoryItem?: InventoryItem;
  user?: User;
  approver?: User;
}

export enum AdjustmentReason {
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  LOST = 'LOST',
  FOUND = 'FOUND',
  CORRECTION = 'CORRECTION',
  THEFT = 'THEFT',
  OTHER = 'OTHER'
}

export enum AdjustmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
```

### Supplier & Purchase Order Types

```typescript
// Supplier entity
export interface Supplier {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  website?: string;
  contactPerson?: string;
  address: Address;
  organizationId: string;
  isActive: boolean;
  rating: number; // 1-5 scale
  paymentTerms: PaymentTerms;
  settings: SupplierSettings;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  organization?: Organization;
  inventoryItems?: InventoryItem[];
  purchaseOrders?: PurchaseOrder[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentTerms {
  termsDays: number; // e.g., Net 30
  discountDays?: number;
  discountPercent?: number;
  currency: Currency;
}

export interface SupplierSettings {
  autoCreatePO: boolean;
  defaultLeadTime: number; // days
  minimumOrderValue?: number;
  preferredPaymentMethod: PaymentMethod;
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  CASH = 'CASH',
  NET_TERMS = 'NET_TERMS'
}

// Purchase Order entity
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  organizationId: string;
  warehouseId: string;
  status: PurchaseOrderStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  currency: Currency;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  supplier?: Supplier;
  organization?: Organization;
  warehouse?: Warehouse;
  creator?: User;
  approver?: User;
  items?: PurchaseOrderItem[];
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT_TO_SUPPLIER = 'SENT_TO_SUPPLIER',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED'
}

// Purchase Order Item
export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  inventoryItemId: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
  
  // Relations
  purchaseOrder?: PurchaseOrder;
  inventoryItem?: InventoryItem;
}
```

### Transfer & Integration Types

```typescript
// Inter-warehouse transfer
export interface Transfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  organizationId: string;
  status: TransferStatus;
  requestedBy: string;
  approvedBy?: string;
  shippedBy?: string;
  receivedBy?: string;
  requestDate: Date;
  approvedDate?: Date;
  shippedDate?: Date;
  receivedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  organization?: Organization;
  requester?: User;
  approver?: User;
  shipper?: User;
  receiver?: User;
  items?: TransferItem[];
}

export enum TransferStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface TransferItem {
  id: string;
  transferId: string;
  inventoryItemId: string;
  requestedQuantity: number;
  shippedQuantity: number;
  receivedQuantity: number;
  notes?: string;
  
  // Relations
  transfer?: Transfer;
  inventoryItem?: InventoryItem;
}

// ERP Integration types
export interface ERPIntegration {
  id: string;
  name: string;
  type: ERPType;
  organizationId: string;
  isActive: boolean;
  configuration: ERPConfiguration;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  syncStatus: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  organization?: Organization;
  syncLogs?: ERPSyncLog[];
}

export enum ERPType {
  SAP = 'SAP',
  ORACLE_NETSUITE = 'ORACLE_NETSUITE',
  MICROSOFT_DYNAMICS = 'MICROSOFT_DYNAMICS',
  QUICKBOOKS = 'QUICKBOOKS',
  CUSTOM = 'CUSTOM'
}

export interface ERPConfiguration {
  endpoint: string;
  apiKey?: string;
  username?: string;
  encryptedPassword?: string;
  syncFrequency: SyncFrequency;
  syncEntities: ERPEntity[];
  fieldMappings: FieldMapping[];
}

export enum SyncFrequency {
  REAL_TIME = 'REAL_TIME',
  EVERY_5_MINUTES = 'EVERY_5_MINUTES',
  EVERY_15_MINUTES = 'EVERY_15_MINUTES',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY'
}

export enum ERPEntity {
  PRODUCTS = 'PRODUCTS',
  INVENTORY = 'INVENTORY',
  SUPPLIERS = 'SUPPLIERS',
  PURCHASE_ORDERS = 'PURCHASE_ORDERS',
  CUSTOMERS = 'CUSTOMERS',
  SALES_ORDERS = 'SALES_ORDERS'
}

export interface FieldMapping {
  flowStockField: string;
  erpField: string;
  transformation?: string;
  isRequired: boolean;
}

export enum SyncStatus {
  CONNECTED = 'CONNECTED',
  SYNCING = 'SYNCING',
  ERROR = 'ERROR',
  DISCONNECTED = 'DISCONNECTED'
}
```

## API Types

### Request & Response Types

```typescript
// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
  metadata?: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organizationName: string;
  domain?: string;
}

export interface JWTPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  permissions: Permission[];
  exp: number;
  iat: number;
}

// Inventory API types
export interface CreateInventoryItemRequest {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  unitPrice: number;
  weight?: number;
  dimensions?: ProductDimensions;
  warehouseId: string;
  categoryId?: string;
  supplierId?: string;
  locationId?: string;
}

export interface UpdateInventoryItemRequest extends Partial<CreateInventoryItemRequest> {}

export interface InventorySearchFilters {
  warehouseId?: string;
  categoryId?: string;
  supplierId?: string;
  locationId?: string;
  lowStock?: boolean;
  search?: string;
  sortBy?: InventorySortField;
  sortOrder?: SortOrder;
}

export enum InventorySortField {
  NAME = 'name',
  SKU = 'sku',
  CURRENT_STOCK = 'currentStock',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// Stock adjustment API types
export interface StockAdjustmentRequest {
  inventoryItemId: string;
  adjustmentQuantity: number;
  reason: AdjustmentReason;
  notes?: string;
}

export interface BulkStockAdjustmentRequest {
  adjustments: StockAdjustmentRequest[];
  reason: string;
  notes?: string;
}
```

### WebSocket Types

```typescript
// WebSocket event types
export interface WebSocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: Date;
  organizationId: string;
  userId?: string;
}

// Inventory real-time events
export interface InventoryUpdatedEvent {
  type: 'inventory:updated';
  data: {
    inventoryItem: InventoryItem;
    changes: Partial<InventoryItem>;
    updatedBy: string;
  };
}

export interface StockMovementEvent {
  type: 'stock:movement';
  data: {
    stockMovement: StockMovement;
    inventoryItem: InventoryItem;
  };
}

export interface LowStockAlertEvent {
  type: 'alert:low-stock';
  data: {
    inventoryItem: InventoryItem;
    currentStock: number;
    minimumStock: number;
  };
}

// Purchase Order events
export interface PurchaseOrderStatusEvent {
  type: 'po:status-changed';
  data: {
    purchaseOrder: PurchaseOrder;
    previousStatus: PurchaseOrderStatus;
    newStatus: PurchaseOrderStatus;
    updatedBy: string;
  };
}

// Transfer events
export interface TransferStatusEvent {
  type: 'transfer:status-changed';
  data: {
    transfer: Transfer;
    previousStatus: TransferStatus;
    newStatus: TransferStatus;
    updatedBy: string;
  };
}
```

## Utility Types

### Common Utility Types

```typescript
// Common utility types
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

export type SubscriptionPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

// Audit and logging types
export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId?: string;
  organizationId: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  
  // Relations
  user?: User;
  organization?: Organization;
}

export interface SecurityLog {
  id: string;
  event: string;
  severity: SecuritySeverity;
  details: Record<string, any>;
  userId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  
  // Relations
  user?: User;
  organization?: Organization;
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// File upload types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  organizationId: string;
  uploadedBy: string;
  createdAt: Date;
  
  // Relations
  organization?: Organization;
  uploader?: User;
}

// Notification types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  organizationId: string;
  isRead: boolean;
  readAt?: Date;
  data?: Record<string, any>;
  createdAt: Date;
  
  // Relations
  user?: User;
  organization?: Organization;
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  LOW_STOCK = 'LOW_STOCK',
  ORDER_UPDATE = 'ORDER_UPDATE',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}
```

### Error Types

```typescript
// Error handling types
export interface LogiVoxError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  MFA_REQUIRED = 'MFA_REQUIRED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  FOREIGN_KEY_CONSTRAINT = 'FOREIGN_KEY_CONSTRAINT',
  
  // Business logic errors
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_OPERATION = 'INVALID_OPERATION',
  ORGANIZATION_LIMIT_EXCEEDED = 'ORGANIZATION_LIMIT_EXCEEDED',
  
  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}
```

## Frontend-Specific Types

### Component Props Types

```typescript
// Common component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface DataTableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onSort?: (field: string, order: SortOrder) => void;
  onRowClick?: (item: T) => void;
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface FormProps<T> extends BaseComponentProps {
  initialValues?: Partial<T>;
  onSubmit: (values: T) => void | Promise<void>;
  loading?: boolean;
  error?: string;
  validationSchema?: any; // Zod schema
}

// Inventory component props
export interface InventoryListProps extends BaseComponentProps {
  warehouseId?: string;
  filters?: InventorySearchFilters;
  onItemSelect?: (item: InventoryItem) => void;
  onItemEdit?: (item: InventoryItem) => void;
  onItemDelete?: (item: InventoryItem) => void;
}

export interface InventoryFormProps extends FormProps<CreateInventoryItemRequest> {
  warehouses: Warehouse[];
  categories: Category[];
  suppliers: Supplier[];
  locations: Location[];
}

// Barcode scanner props
export interface BarcodeScannerProps extends BaseComponentProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
  enableManualInput?: boolean;
}

// Stock adjustment props
export interface StockAdjustmentProps extends BaseComponentProps {
  inventoryItem: InventoryItem;
  onSubmit: (adjustment: StockAdjustmentRequest) => void;
  onCancel: () => void;
}
```

### Hook Types

```typescript
// Custom hook return types
export interface UseInventoryReturn {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  refetch: () => void;
  createItem: (item: CreateInventoryItemRequest) => Promise<void>;
  updateItem: (id: string, updates: UpdateInventoryItemRequest) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export interface UseRealtimeReturn {
  isConnected: boolean;
  subscribe: (event: string, handler: (data: any) => void) => () => void;
  emit: (event: string, data: any) => void;
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<void>;
  checkPermission: (permission: Permission) => boolean;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  reset: () => void;
  setFieldError: (field: keyof T, error: string) => void;
}
```

## Type Guards and Utilities

```typescript
// Type guard functions
export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}

export function isInventoryItem(obj: any): obj is InventoryItem {
  return obj && typeof obj.id === 'string' && typeof obj.sku === 'string';
}

export function isPurchaseOrder(obj: any): obj is PurchaseOrder {
  return obj && typeof obj.id === 'string' && typeof obj.orderNumber === 'string';
}

// Utility type functions
export function createApiResponse<T>(
  data: T,
  success: boolean = true,
  message?: string
): ApiResponse<T> {
  return {
    success,
    data,
    message
  };
}

export function createErrorResponse(
  error: string,
  statusCode: number = 400
): ApiResponse<never> {
  return {
    success: false,
    error
  };
}

// Enum utility functions
export function getEnumValues<T extends Record<string, string>>(enumObject: T): string[] {
  return Object.values(enumObject);
}

export function isValidEnum<T extends Record<string, string>>(
  enumObject: T,
  value: string
): value is T[keyof T] {
  return Object.values(enumObject).includes(value);
}
```

## Package Implementation Summary

### ✅ Completed Components

1. **Core Types (`types.ts`)**
   - User Management (User, Organization, UserRole, Permission)
   - Inventory Management (InventoryItem, Category, Location, StockMovement)  
   - Warehouse Management (Warehouse, Address)
   - Supplier & Purchase Orders (Supplier, PurchaseOrder, PurchaseOrderItem)
   - API & Response Types (ApiResponse, PaginatedResponse, WebSocketMessage)
   - Subscription & Billing (SubscriptionPlan, PaymentMethod, Invoice)
   - System Types (AuditLog, Notification, SystemSettings)

2. **Constants (`constants.ts`)**
   - Application configuration (APP_NAME, API_VERSION, pagination defaults)
   - Validation limits for all entity fields
   - Permission groups and role mappings
   - Status display names and translations
   - Date/time formats and currency symbols
   - Subscription plan limits and restrictions
   - WebSocket event names
   - Error and success message templates
   - File types and storage keys

3. **Validators (`validators.ts`)**
   - String validators (required, length, email, SKU, phone, etc.)
   - Number validators (range, positive, currency, integer)
   - Date validators (required, future, past, range)
   - Array validators (required, length limits)
   - Entity-specific validators for all major types
   - Composite validation functions
   - File validation utilities

4. **Utilities (`utils.ts`)**
   - String utilities (capitalize, slugify, generate codes)
   - Number utilities (format currency, percentages, file sizes)
   - Date utilities (formatting, relative time, date ranges)
   - Array utilities (chunk, unique, group, sort)
   - Object utilities (pick, omit, deep clone, merge)
   - Status utilities (display names, colors)
   - Inventory utilities (stock calculations, coverage)
   - Search utilities (fuzzy search, highlighting)
   - URL utilities (query strings, path joining)
   - Subscription utilities (limits, feature availability)
   - Storage utilities (localStorage wrapper)
   - Performance utilities (debounce, throttle)

### ✅ Build Success
- Package compiles without errors
- All TypeScript types are properly exported
- No naming conflicts or circular dependencies
- Ready for integration with web and API packages

## Usage Examples

```typescript
// Example: Using types in a React component
interface InventoryPageProps {
  warehouseId: string;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ warehouseId }) => {
  const { items, loading, createItem } = useInventory({ warehouseId });
  
  const handleCreateItem = async (data: CreateInventoryItemRequest) => {
    try {
      await createItem(data);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <div>
      <InventoryList 
        items={items}
        loading={loading}
        onItemCreate={handleCreateItem}
      />
    </div>
  );
};

// Example: Using types in an API handler
export async function POST(request: Request): Promise<ApiResponse<InventoryItem>> {
  try {
    const body: CreateInventoryItemRequest = await request.json();
    
    // Validate request
    const validation = validateInventoryItem(body);
    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 400);
    }
    
    // Create item
    const item = await inventoryService.createItem(body);
    
    return createApiResponse(item, true, 'Item created successfully');
  } catch (error) {
    return createErrorResponse('Failed to create item', 500);
  }
}
```

This comprehensive type system ensures type safety across the entire LogiVox platform and serves as living documentation for all data structures and API contracts.