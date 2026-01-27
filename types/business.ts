/**
 * Shared Business Types
 * 
 * Centralized type definitions for core business entities
 * to prevent duplication across the application
 */

// ============================================================================
// CORE BUSINESS ENTITIES
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationEntity extends BaseEntity {
  organizationId: string;
  createdBy?: string;
  updatedBy?: string;
}

// ============================================================================
// USER & ORGANIZATION TYPES
// ============================================================================

export type UserRole = 
  | "SUPER_ADMIN" 
  | "ORG_ADMIN" 
  | "MANAGER" 
  | "SUPERVISOR" 
  | "WORKER" 
  | "USER";

export interface User extends BaseEntity {
  email: string;
  name?: string | null;
  image?: string | null;
  role: UserRole;
  isActive: boolean;
  organizationId?: string;
}

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  domain?: string | null;
  logo?: string | null;
  subscriptionTier: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
  isActive: boolean;
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export type InventoryStatus = 
  | "ACTIVE" 
  | "INACTIVE" 
  | "LOW_STOCK" 
  | "OUT_OF_STOCK" 
  | "DISCONTINUED";

export interface InventoryItem extends OrganizationEntity {
  name: string;
  sku: string;
  description?: string;
  quantity: number;
  minStockLevel: number;
  unitCost?: number;
  status: InventoryStatus;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  category: {
    id: string;
    name: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
}

export interface MovementHistory extends OrganizationEntity {
  type: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";
  quantity: number;
  reason?: string;
  reference?: string;
  location?: string;
  user: {
    id: string;
    name: string;
  };
}

// ============================================================================
// WAREHOUSE TYPES
// ============================================================================

export interface Warehouse extends OrganizationEntity {
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  capacity?: {
    maxVolume?: number;
    currentVolume?: number;
    maxWeight?: number;
    currentWeight?: number;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  };
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus = 
  | "DRAFT" 
  | "PENDING" 
  | "CONFIRMED" 
  | "IN_PROGRESS" 
  | "SHIPPED" 
  | "DELIVERED" 
  | "CANCELLED";

export interface BaseOrder extends OrganizationEntity {
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  notes?: string;
}

export interface SalesOrder extends BaseOrder {
  customer: {
    id: string;
    name: string;
    email?: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  items: Array<{
    id: string;
    inventoryItem: {
      id: string;
      name: string;
      sku: string;
    };
    quantity: number;
    unitPrice: number;
  }>;
}

export interface PurchaseOrder extends BaseOrder {
  supplier: {
    id: string;
    name: string;
    email?: string;
  };
  expectedDeliveryDate?: string;
  items: Array<{
    id: string;
    inventoryItem: {
      id: string;
      name: string;
      sku: string;
    };
    quantity: number;
    unitCost: number;
  }>;
}

// ============================================================================
// OPERATIONS TYPES
// ============================================================================

export interface OperationMetrics {
  totalOrders: number;
  pendingOrders: number;
  completedToday: number;
  efficiency: number;
  receiving: {
    scheduled: number;
    inProgress: number;
    completed: number;
  };
  picking: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  shipping: {
    ready: number;
    inTransit: number;
    delivered: number;
  };
}

export interface RecentActivity extends OrganizationEntity {
  type: "ORDER" | "INVENTORY" | "SHIPMENT" | "USER" | "SYSTEM";
  action: string;
  description: string;
  user?: {
    id: string;
    name: string;
  };
  metadata?: Record<string, any>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormState<T> {
  data: Partial<T>;
  errors: Record<keyof T, string>;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type EntityId = string;

export type Timestamp = string; // ISO 8601 format

export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD";

export type CountryCode = "US" | "CA" | "GB" | "AU" | "DE" | "FR" | "ES" | "IT";

// ============================================================================
// SEARCH & FILTERING TYPES
// ============================================================================

export interface SearchFilters {
  query?: string;
  status?: string[];
  category?: string[];
  warehouse?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (value: any, item: T) => React.ReactNode;
}

// ============================================================================
// PERMISSIONS & ROLES
// ============================================================================

export interface Permission {
  resource: string;
  action: string;
  scope?: "organization" | "warehouse" | "team" | "self";
}

export interface OrganizationMember extends BaseEntity {
  userId: string;
  organizationId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  permissions: Record<string, boolean>;
  user: User;
}