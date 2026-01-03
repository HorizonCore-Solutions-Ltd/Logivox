-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'BOOKING', 'RELEASE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'CRITICAL_STOCK', 'OVERSTOCK');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED', 'AUTO_RESOLVED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'FULFILLED', 'PARTIALLY_FULFILLED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "GRNStatus" AS ENUM ('DRAFT', 'PENDING', 'QUALITY_CHECK', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PICKING', 'PICKED', 'PACKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('STANDARD', 'EXPRESS', 'OVERNIGHT', 'PICKUP', 'FREIGHT');

-- CreateEnum
CREATE TYPE "PickListStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PICKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PACKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'FAILED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "CarrierType" AS ENUM ('UPS', 'FEDEX', 'DHL', 'USPS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('ERP', 'ECOMMERCE', 'ACCOUNTING', 'CRM', 'WAREHOUSE', 'SHIPPING', 'ANALYTICS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'ZONE', 'AISLE', 'RACK', 'SHELF', 'BIN', 'STAGING', 'SHIPPING', 'RECEIVING', 'QUARANTINE');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('DAMAGE', 'LOSS', 'FOUND', 'CORRECTION', 'RECOUNT', 'RETURN_TO_VENDOR', 'SAMPLE', 'THEFT', 'EXPIRY', 'OTHER');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CycleCountType" AS ENUM ('SCHEDULED', 'ADHOC', 'FULL', 'SPOT');

-- CreateEnum
CREATE TYPE "CycleCountStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RMAStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IN_TRANSIT', 'RECEIVED', 'INSPECTING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnAction" AS ENUM ('REFUND', 'EXCHANGE', 'STORE_CREDIT', 'REPAIR', 'DISPOSE');

-- CreateEnum
CREATE TYPE "ReturnCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'DAMAGED', 'DEFECTIVE', 'DESTROYED');

-- CreateEnum
CREATE TYPE "QCStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'QUARANTINED', 'EXPIRED', 'RECALLED', 'DEPLETED');

-- CreateEnum
CREATE TYPE "SerialStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'IN_SERVICE', 'RETURNED', 'DEFECTIVE', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "InspectionCategory" AS ENUM ('INCOMING', 'IN_PROCESS', 'FINAL', 'RANDOM', 'COMPLAINT');

-- CreateEnum
CREATE TYPE "SamplingType" AS ENUM ('FULL', 'STATISTICAL', 'PERCENTAGE', 'RANDOM');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('PASS', 'PASS_WITH_NOTES', 'FAIL', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "CheckpointType" AS ENUM ('VISUAL', 'MEASUREMENT', 'FUNCTIONAL', 'DOCUMENTATION', 'PACKAGING', 'LABELING');

-- CreateEnum
CREATE TYPE "CheckpointStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "CheckpointResult" AS ENUM ('PASS', 'FAIL', 'NA');

-- CreateEnum
CREATE TYPE "DefectSeverity" AS ENUM ('CRITICAL', 'MAJOR', 'MINOR');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_REWORK', 'ESCALATE');

-- CreateEnum
CREATE TYPE "BOMType" AS ENUM ('ASSEMBLY', 'DISASSEMBLY', 'KIT', 'RECIPE', 'CONFIGURATION');

-- CreateEnum
CREATE TYPE "BOMStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'OBSOLETE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssemblyStatus" AS ENUM ('PENDING', 'READY', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('ISSUED', 'PARTIALLY_CONSUMED', 'FULLY_CONSUMED', 'PARTIALLY_RETURNED', 'RETURNED', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "ProductionEventType" AS ENUM ('START', 'PRODUCTION', 'SCRAP', 'PAUSE', 'RESUME', 'COMPLETE', 'QC_CHECK', 'REWORK', 'EQUIPMENT_CHANGE', 'MATERIAL_CHANGE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('TABULAR', 'SUMMARY', 'CHART', 'COMBINED', 'PIVOT', 'MATRIX');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('INVENTORY', 'SALES', 'PURCHASING', 'WAREHOUSE', 'FINANCIAL', 'QUALITY', 'PRODUCTION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ChartType" AS ENUM ('BAR', 'LINE', 'PIE', 'DONUT', 'AREA', 'SCATTER', 'GAUGE', 'FUNNEL', 'HEATMAP', 'TABLE');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DashboardType" AS ENUM ('OVERVIEW', 'INVENTORY', 'SALES', 'WAREHOUSE', 'ANALYTICS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MetricCategory" AS ENUM ('SALES', 'INVENTORY', 'WAREHOUSE', 'FINANCIAL', 'OPERATIONAL', 'QUALITY', 'PRODUCTIVITY');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('UP', 'DOWN', 'STABLE');

-- CreateEnum
CREATE TYPE "MetricStatus" AS ENUM ('NORMAL', 'WARNING', 'CRITICAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('ORDER_UPDATES', 'INVENTORY_ALERTS', 'SHIPMENT_UPDATES', 'PAYMENT_UPDATES', 'QUALITY_ALERTS', 'SYSTEM_ALERTS', 'USER_ACTIONS', 'REPORTS', 'APPROVALS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'SMS', 'WEBHOOK', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WEBHOOK', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('USER', 'ROLE', 'CUSTOM', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SCHEDULED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "AlertCategory" AS ENUM ('INVENTORY', 'SALES', 'PURCHASING', 'WAREHOUSE', 'QUALITY', 'FINANCIAL', 'SYSTEM', 'SECURITY', 'PERFORMANCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationAlertType" AS ENUM ('THRESHOLD', 'ANOMALY', 'STATUS_CHANGE', 'SCHEDULE', 'EVENT');

-- CreateEnum
CREATE TYPE "NotificationAlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "TriggerFrequency" AS ENUM ('REALTIME', 'EVERY_MINUTE', 'EVERY_5_MINUTES', 'EVERY_15_MINUTES', 'HOURLY', 'DAILY');

-- CreateEnum
CREATE TYPE "ThresholdOperator" AS ENUM ('GT', 'LT', 'GTE', 'LTE', 'EQ', 'NE');

-- CreateEnum
CREATE TYPE "DigestFrequency" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('QUICKBOOKS_ONLINE', 'QUICKBOOKS_DESKTOP', 'XERO', 'SAGE', 'NETSUITE', 'SAP', 'MICROSOFT_DYNAMICS', 'SHOPIFY', 'WOOCOMMERCE', 'MAGENTO', 'BIGCOMMERCE', 'AMAZON', 'EBAY', 'ETSY', 'FEDEX', 'UPS', 'DHL', 'USPS', 'SHIPSTATION', 'EASYPOST', 'SHIPPO', 'STRIPE', 'PAYPAL', 'SQUARE', 'BRAINTREE', 'AUTHORIZE_NET', 'SALESFORCE', 'HUBSPOT', 'ZOHO_CRM', 'TWILIO', 'SENDGRID', 'MAILCHIMP', 'CUSTOM', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "IntegrationCategory" AS ENUM ('ACCOUNTING', 'ECOMMERCE', 'SHIPPING', 'PAYMENT', 'CRM', 'MARKETING', 'COMMUNICATION', 'ANALYTICS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('OAUTH2', 'API_KEY', 'BASIC', 'BEARER_TOKEN', 'CUSTOM', 'NONE');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('IMPORT', 'EXPORT', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "SyncFrequency" AS ENUM ('REALTIME', 'EVERY_5_MINUTES', 'EVERY_15_MINUTES', 'EVERY_30_MINUTES', 'HOURLY', 'EVERY_6_HOURS', 'DAILY', 'WEEKLY', 'MANUAL');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'CONFIGURING', 'TESTING', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('OAUTH', 'API_KEY', 'CREDENTIALS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('PRODUCTION', 'SANDBOX', 'DEVELOPMENT');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'CONNECTING', 'ERROR', 'EXPIRED', 'INVALID');

-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('PRODUCTS', 'ORDERS', 'CUSTOMERS', 'INVENTORY', 'INVOICES', 'PAYMENTS', 'SHIPMENTS', 'RETURNS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SyncMode" AS ENUM ('FULL', 'INCREMENTAL', 'DELTA');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL', 'CANCELLED', 'RETRYING');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('MANUAL', 'SCHEDULED', 'WEBHOOK', 'EVENT', 'API');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'PAUSED');

-- CreateEnum
CREATE TYPE "WaveType" AS ENUM ('SINGLE_ORDER', 'BATCH', 'ZONE', 'CARRIER', 'PRIORITY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "WavePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "WaveStrategy" AS ENUM ('FIFO', 'LIFO', 'ZONE_BASED', 'CARRIER_BASED', 'SHIP_DATE', 'PRIORITY', 'SHORTEST_PATH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "WaveStatus" AS ENUM ('PLANNED', 'RELEASED', 'IN_PROGRESS', 'PICKED', 'VERIFIED', 'PACKED', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "PickLineStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PICKED', 'SHORT', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('PICK', 'PUT', 'MOVE', 'COUNT', 'REPLENISH', 'RESTOCK', 'PACK', 'INSPECT', 'LABEL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD', 'FAILED');

-- CreateEnum
CREATE TYPE "RouteType" AS ENUM ('STANDARD', 'EXPRESS', 'ZONE', 'BATCH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "OptimizationMethod" AS ENUM ('SHORTEST_PATH', 'NEAREST_NEIGHBOR', 'GENETIC_ALGORITHM', 'SIMULATED_ANNEALING', 'MANUAL');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TriggerEvent" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'ORDER_CREATED', 'ORDER_RELEASED', 'SHIPMENT_DUE', 'WAVE_RELEASED', 'LOCATION_FULL', 'LOCATION_EMPTY', 'SCHEDULE', 'MANUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AssignmentRule" AS ENUM ('ROUND_ROBIN', 'LEAST_BUSY', 'SKILL_BASED', 'ZONE_BASED', 'RANDOM', 'MANUAL');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" TEXT DEFAULT 'active',
    "billingEmail" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "categoryId" TEXT,
    "supplierId" TEXT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "barcode" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "availableQty" INTEGER NOT NULL DEFAULT 0,
    "minStockLevel" INTEGER NOT NULL DEFAULT 0,
    "maxStockLevel" INTEGER,
    "reorderPoint" INTEGER,
    "reorderQuantity" INTEGER DEFAULT 0,
    "leadTimeDays" INTEGER DEFAULT 7,
    "lastReorderDate" TIMESTAMP(3),
    "autoReorder" BOOLEAN NOT NULL DEFAULT false,
    "costPrice" DECIMAL(10,2),
    "sellingPrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "InventoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "fromWarehouse" TEXT,
    "toWarehouse" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reorder_alerts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL DEFAULT 'LOW_STOCK',
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "currentStock" INTEGER NOT NULL,
    "reorderPoint" INTEGER NOT NULL,
    "reorderQuantity" INTEGER NOT NULL,
    "estimatedStockoutDate" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "slackSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reorder_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "bookingNumber" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(10,2),
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredBy" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "notes" TEXT,
    "internalNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantityBooked" INTEGER NOT NULL,
    "quantityFulfilled" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(10,2),
    "totalPrice" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "approvedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "cancelledDate" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2),
    "tax" DECIMAL(10,2),
    "shipping" DECIMAL(10,2),
    "totalAmount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deliveryAddress" TEXT,
    "deliveryCity" TEXT,
    "deliveryCountry" TEXT,
    "deliveryNotes" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "approvedById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "sku" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantityOrdered" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2),
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "grnNumber" TEXT NOT NULL,
    "status" "GRNStatus" NOT NULL DEFAULT 'DRAFT',
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" TEXT NOT NULL,
    "qcStatus" TEXT,
    "qcNotes" TEXT,
    "qcById" TEXT,
    "qcDate" TIMESTAMP(3),
    "hasDiscrepancy" BOOLEAN NOT NULL DEFAULT false,
    "discrepancyNotes" TEXT,
    "totalReceived" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "receivingDock" TEXT,
    "putAwayCompleted" BOOLEAN NOT NULL DEFAULT false,
    "putAwayDate" TIMESTAMP(3),
    "notes" TEXT,
    "internalNotes" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_receipt_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grn_items" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "purchaseOrderItemId" TEXT,
    "inventoryItemId" TEXT NOT NULL,
    "orderedQuantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL,
    "acceptedQuantity" INTEGER NOT NULL,
    "rejectedQuantity" INTEGER NOT NULL DEFAULT 0,
    "qcStatus" TEXT,
    "qcNotes" TEXT,
    "hasDefects" BOOLEAN NOT NULL DEFAULT false,
    "defectDescription" TEXT,
    "binLocation" TEXT,
    "putAwayCompleted" BOOLEAN NOT NULL DEFAULT false,
    "batchNumber" TEXT,
    "serialNumbers" JSONB,
    "expiryDate" TIMESTAMP(3),
    "unitCost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grn_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "soNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedDate" TIMESTAMP(3),
    "promisedDate" TIMESTAMP(3),
    "warehouseId" TEXT,
    "shippingMethod" "ShippingMethod",
    "shippingAddress" TEXT,
    "shippingCity" TEXT,
    "shippingState" TEXT,
    "shippingZip" TEXT,
    "shippingCountry" TEXT,
    "trackingNumber" TEXT,
    "carrierName" TEXT,
    "shippedDate" TIMESTAMP(3),
    "deliveredDate" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" TEXT,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "approvedById" TEXT,
    "approvedDate" TIMESTAMP(3),
    "pickedById" TEXT,
    "pickedDate" TIMESTAMP(3),
    "packedById" TEXT,
    "packedDate" TIMESTAMP(3),
    "notes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_items" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantityPicked" INTEGER NOT NULL DEFAULT 0,
    "quantityPacked" INTEGER NOT NULL DEFAULT 0,
    "quantityShipped" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "binLocation" TEXT,
    "batchNumber" TEXT,
    "serialNumbers" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pick_lists" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pickListNumber" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "PickListStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assignedToId" TEXT,
    "assignedDate" TIMESTAMP(3),
    "startedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "pick_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pick_list_items" (
    "id" TEXT NOT NULL,
    "pickListId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantityToPick" INTEGER NOT NULL,
    "quantityPicked" INTEGER NOT NULL DEFAULT 0,
    "binLocation" TEXT,
    "batchNumber" TEXT,
    "serialNumbers" JSONB,
    "pickedAt" TIMESTAMP(3),

    CONSTRAINT "pick_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "packNumber" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "pickListId" TEXT,
    "warehouseId" TEXT NOT NULL,
    "status" "PackingStatus" NOT NULL DEFAULT 'PENDING',
    "packedById" TEXT,
    "startedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "totalPackages" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DECIMAL(10,2),
    "weightUnit" TEXT DEFAULT 'kg',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "packageNumber" TEXT NOT NULL,
    "packageType" TEXT,
    "weight" DECIMAL(10,2),
    "weightUnit" TEXT DEFAULT 'kg',
    "dimensions" JSONB,
    "trackingNumber" TEXT,
    "labelUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_items" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "binLocation" TEXT,
    "batchNumber" TEXT,
    "serialNumbers" JSONB,

    CONSTRAINT "package_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "packId" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "carrierCode" TEXT,
    "carrierName" TEXT,
    "carrierService" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "labelUrl" TEXT,
    "labelFormat" TEXT,
    "recipientName" TEXT,
    "recipientPhone" TEXT,
    "recipientEmail" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "weight" DECIMAL(10,2),
    "weightUnit" TEXT DEFAULT 'kg',
    "dimensions" JSONB,
    "shippedDate" TIMESTAMP(3),
    "estimatedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "shippingCost" DECIMAL(10,2),
    "insuranceAmount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "signatureRequired" BOOLEAN NOT NULL DEFAULT false,
    "saturdayDelivery" BOOLEAN NOT NULL DEFAULT false,
    "trackingEvents" JSONB,
    "lastTrackingUpdate" TIMESTAMP(3),
    "exceptionReason" TEXT,
    "exceptionDate" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "carrierType" "CarrierType" NOT NULL,
    "carrierName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "accountNumber" TEXT,
    "config" JSONB,
    "defaultService" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carrier_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "parentId" TEXT,
    "warehouseId" TEXT,
    "zoneId" TEXT,
    "aisleId" TEXT,
    "rackId" TEXT,
    "shelfId" TEXT,
    "barcode" TEXT,
    "qrCode" TEXT,
    "capacity" DOUBLE PRECISION,
    "maxWeight" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPickable" BOOLEAN NOT NULL DEFAULT true,
    "isPutaway" BOOLEAN NOT NULL DEFAULT true,
    "temperature" DOUBLE PRECISION,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_transfers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "priority" TEXT,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "completedById" TEXT,
    "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" TIMESTAMP(3),
    "approvedDate" TIMESTAMP(3),
    "startedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "adjustmentNumber" TEXT NOT NULL,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "inventoryId" TEXT NOT NULL,
    "locationId" TEXT,
    "quantityBefore" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "reason" "AdjustmentReason" NOT NULL,
    "reasonNotes" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "approvedById" TEXT,
    "rejectionReason" TEXT,
    "createdById" TEXT NOT NULL,
    "completedById" TEXT,
    "adjustmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "unitCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "attachments" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_counts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "countNumber" TEXT NOT NULL,
    "type" "CycleCountType" NOT NULL,
    "status" "CycleCountStatus" NOT NULL DEFAULT 'PLANNED',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "approvedDate" TIMESTAMP(3),
    "locationId" TEXT,
    "categoryId" TEXT,
    "includeZeroQty" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "approvedById" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "countedItems" INTEGER NOT NULL DEFAULT 0,
    "varianceItems" INTEGER NOT NULL DEFAULT 0,
    "totalVariance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "autoAdjust" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_count_items" (
    "id" TEXT NOT NULL,
    "cycleCountId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "locationId" TEXT,
    "expectedQty" INTEGER NOT NULL,
    "countedQty" INTEGER,
    "variance" INTEGER,
    "variancePercent" DECIMAL(5,2),
    "unitCost" DECIMAL(15,2),
    "varianceValue" DECIMAL(15,2),
    "isCounted" BOOLEAN NOT NULL DEFAULT false,
    "countedById" TEXT,
    "countedAt" TIMESTAMP(3),
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledById" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "adjustmentId" TEXT,
    "notes" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_count_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_reasons" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "requiresQC" BOOLEAN NOT NULL DEFAULT true,
    "defaultAction" "ReturnAction",
    "allowedDays" INTEGER,
    "restockable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rmas" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rmaNumber" TEXT NOT NULL,
    "status" "RMAStatus" NOT NULL DEFAULT 'PENDING',
    "salesOrderId" TEXT,
    "customerId" TEXT NOT NULL,
    "returnReasonId" TEXT NOT NULL,
    "customerNotes" TEXT,
    "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectionReason" TEXT,
    "returnTrackingNumber" TEXT,
    "returnCarrier" TEXT,
    "returnShippingCost" DECIMAL(10,2),
    "totalRefundAmount" DECIMAL(10,2),
    "restockingFee" DECIMAL(10,2),
    "inspectedById" TEXT,
    "inspectedDate" TIMESTAMP(3),
    "qcNotes" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "notifyCustomer" BOOLEAN NOT NULL DEFAULT true,
    "attachments" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rma_items" (
    "id" TEXT NOT NULL,
    "rmaId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "salesOrderItemId" TEXT,
    "quantityRequested" INTEGER NOT NULL,
    "quantityReceived" INTEGER,
    "quantityAccepted" INTEGER,
    "quantityRejected" INTEGER,
    "condition" "ReturnCondition",
    "action" "ReturnAction" NOT NULL DEFAULT 'REFUND',
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "refundAmount" DECIMAL(10,2),
    "restockingFee" DECIMAL(10,2),
    "isInspected" BOOLEAN NOT NULL DEFAULT false,
    "inspectionNotes" TEXT,
    "isRestocked" BOOLEAN NOT NULL DEFAULT false,
    "restockLocationId" TEXT,
    "restockedDate" TIMESTAMP(3),
    "restockedById" TEXT,
    "exchangeInventoryId" TEXT,
    "exchangeQuantity" INTEGER,
    "serialNumbers" JSONB,
    "batchNumbers" JSONB,
    "photos" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rma_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "supplierLotNumber" TEXT,
    "manufacturingDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initialQuantity" INTEGER NOT NULL,
    "currentQuantity" INTEGER NOT NULL,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "availableQuantity" INTEGER NOT NULL DEFAULT 0,
    "qcStatus" "QCStatus" NOT NULL DEFAULT 'PENDING',
    "qcDate" TIMESTAMP(3),
    "qcNotes" TEXT,
    "certificateNumber" TEXT,
    "grnId" TEXT,
    "purchaseOrderId" TEXT,
    "supplierId" TEXT,
    "status" "LotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isQuarantined" BOOLEAN NOT NULL DEFAULT false,
    "quarantineReason" TEXT,
    "quarantineDate" TIMESTAMP(3),
    "isRecalled" BOOLEAN NOT NULL DEFAULT false,
    "recallDate" TIMESTAMP(3),
    "recallReason" TEXT,
    "recallNotes" TEXT,
    "locationId" TEXT,
    "storageConditions" TEXT,
    "customFields" JSONB,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serial_numbers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "lotId" TEXT,
    "serialNumber" TEXT NOT NULL,
    "status" "SerialStatus" NOT NULL DEFAULT 'AVAILABLE',
    "grnId" TEXT,
    "grnItemId" TEXT,
    "salesOrderId" TEXT,
    "salesOrderItemId" TEXT,
    "customerId" TEXT,
    "receivedDate" TIMESTAMP(3),
    "soldDate" TIMESTAMP(3),
    "returnedDate" TIMESTAMP(3),
    "locationId" TEXT,
    "warrantyStartDate" TIMESTAMP(3),
    "warrantyEndDate" TIMESTAMP(3),
    "warrantyPeriodDays" INTEGER,
    "serviceHistory" JSONB,
    "customFields" JSONB,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serial_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_movements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "notes" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lot_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serial_movements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serialNumberId" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "notes" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serial_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_genealogy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "parentLotId" TEXT NOT NULL,
    "childLotId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lot_genealogy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" "InspectionCategory" NOT NULL,
    "inventoryIds" JSONB,
    "supplierIds" JSONB,
    "samplingType" "SamplingType" NOT NULL DEFAULT 'FULL',
    "sampleSize" INTEGER,
    "samplePercentage" DECIMAL(5,2),
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "approvalLevels" INTEGER NOT NULL DEFAULT 1,
    "autoQuarantine" BOOLEAN NOT NULL DEFAULT false,
    "checkpoints" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_inspections" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "inspectionNumber" TEXT NOT NULL,
    "category" "InspectionCategory" NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "grnId" TEXT,
    "salesOrderId" TEXT,
    "lotId" TEXT,
    "inventoryId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sampleSize" INTEGER,
    "status" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
    "result" "InspectionResult",
    "passedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "defectCount" INTEGER NOT NULL DEFAULT 0,
    "majorDefects" INTEGER NOT NULL DEFAULT 0,
    "minorDefects" INTEGER NOT NULL DEFAULT 0,
    "criticalDefects" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DECIMAL(5,2),
    "aqlLevel" TEXT,
    "inspectedById" TEXT NOT NULL,
    "inspectedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentApprovalLevel" INTEGER NOT NULL DEFAULT 1,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "isQuarantined" BOOLEAN NOT NULL DEFAULT false,
    "quarantineReason" TEXT,
    "certificateNumber" TEXT,
    "certificateUrl" TEXT,
    "photos" JSONB,
    "attachments" JSONB,
    "notes" TEXT,
    "inspectorNotes" TEXT,
    "metadata" JSONB,
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_checkpoints" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CheckpointType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "expectedValue" TEXT,
    "tolerance" TEXT,
    "unit" TEXT,
    "status" "CheckpointStatus" NOT NULL DEFAULT 'PENDING',
    "actualValue" TEXT,
    "result" "CheckpointResult",
    "defectType" "DefectSeverity",
    "defectDescription" TEXT,
    "photos" JSONB,
    "notes" TEXT,
    "performedById" TEXT,
    "performedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_approvals" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "decision" "ApprovalDecision",
    "approverId" TEXT,
    "approvedDate" TIMESTAMP(3),
    "comments" TEXT,
    "rejectionReason" TEXT,
    "notifiedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills_of_materials" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bomNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "productId" TEXT NOT NULL,
    "productQuantity" INTEGER NOT NULL DEFAULT 1,
    "bomType" "BOMType" NOT NULL DEFAULT 'ASSEMBLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "estimatedTime" INTEGER,
    "laborCost" DECIMAL(10,2),
    "overheadCost" DECIMAL(10,2),
    "totalCost" DECIMAL(10,2),
    "standardYield" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "scrapRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "status" "BOMStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedDate" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "notes" TEXT,
    "attachments" JSONB,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_of_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_components" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "unit" TEXT,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isSubstitutable" BOOLEAN NOT NULL DEFAULT false,
    "substituteIds" JSONB,
    "unitCost" DECIMAL(10,2),
    "totalCost" DECIMAL(10,2),
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "assemblyNotes" TEXT,
    "position" TEXT,
    "scrapFactor" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assembly_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "plannedQuantity" INTEGER NOT NULL,
    "producedQuantity" INTEGER NOT NULL DEFAULT 0,
    "scrapQuantity" INTEGER NOT NULL DEFAULT 0,
    "actualYield" DECIMAL(5,2),
    "yieldVariance" DECIMAL(5,2),
    "status" "AssemblyStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "warehouseId" TEXT,
    "workstationId" TEXT,
    "assignedToId" TEXT,
    "componentsReserved" BOOLEAN NOT NULL DEFAULT false,
    "componentsIssued" BOOLEAN NOT NULL DEFAULT false,
    "autoDeduct" BOOLEAN NOT NULL DEFAULT true,
    "totalComponentCost" DECIMAL(10,2),
    "laborCost" DECIMAL(10,2),
    "overheadCost" DECIMAL(10,2),
    "totalCost" DECIMAL(10,2),
    "qcRequired" BOOLEAN NOT NULL DEFAULT false,
    "qcStatus" TEXT,
    "qcNotes" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "salesOrderId" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "assembly_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assembly_component_issues" (
    "id" TEXT NOT NULL,
    "assemblyOrderId" TEXT NOT NULL,
    "bomComponentId" TEXT,
    "componentId" TEXT NOT NULL,
    "requiredQuantity" DECIMAL(10,4) NOT NULL,
    "issuedQuantity" DECIMAL(10,4) NOT NULL,
    "consumedQuantity" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "returnedQuantity" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "scrapQuantity" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "lotId" TEXT,
    "serialNumbers" JSONB,
    "status" "IssueStatus" NOT NULL DEFAULT 'ISSUED',
    "issuedById" TEXT NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedById" TEXT,
    "returnedDate" TIMESTAMP(3),
    "fromLocationId" TEXT,
    "unitCost" DECIMAL(10,2),
    "totalCost" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assembly_component_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assembly_production_logs" (
    "id" TEXT NOT NULL,
    "assemblyOrderId" TEXT NOT NULL,
    "eventType" "ProductionEventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantityProduced" INTEGER,
    "quantityScrapped" INTEGER,
    "yieldPercentage" DECIMAL(5,2),
    "operatorId" TEXT NOT NULL,
    "scrapReason" TEXT,
    "defectType" TEXT,
    "defectDescription" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "qcCheckpoint" TEXT,
    "qcResult" TEXT,
    "notes" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assembly_production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "dataSource" TEXT NOT NULL,
    "filters" JSONB,
    "groupBy" JSONB,
    "sortBy" JSONB,
    "columns" JSONB NOT NULL,
    "chartType" "ChartType",
    "chartConfig" JSONB,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleType" "ScheduleType",
    "scheduleConfig" JSONB,
    "emailRecipients" JSONB,
    "webhookUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "allowedRoles" JSONB,
    "allowedUserIds" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "tags" JSONB,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_executions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "executionNumber" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "resultData" JSONB,
    "resultUrl" TEXT,
    "parameters" JSONB,
    "filters" JSONB,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "webhookSent" BOOLEAN NOT NULL DEFAULT false,
    "webhookSentAt" TIMESTAMP(3),
    "error" TEXT,
    "errorStack" TEXT,
    "fileSize" INTEGER,
    "fileFormat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedById" TEXT,

    CONSTRAINT "report_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboards" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "widgets" JSONB NOT NULL,
    "dashboardType" "DashboardType" NOT NULL DEFAULT 'CUSTOM',
    "category" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "allowedRoles" JSONB,
    "allowedUserIds" JSONB,
    "autoRefresh" BOOLEAN NOT NULL DEFAULT false,
    "refreshInterval" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT,
    "color" TEXT,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "category" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "properties" JSONB,
    "metadata" JSONB,
    "duration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metricCode" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "description" TEXT,
    "category" "MetricCategory" NOT NULL,
    "currentValue" DECIMAL(18,4) NOT NULL,
    "previousValue" DECIMAL(18,4),
    "targetValue" DECIMAL(18,4),
    "unit" TEXT,
    "changeAmount" DECIMAL(18,4),
    "changePercent" DECIMAL(8,2),
    "trend" "TrendDirection",
    "periodType" "PeriodType" NOT NULL DEFAULT 'DAILY',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "MetricStatus" NOT NULL DEFAULT 'NORMAL',
    "alertThreshold" DECIMAL(18,4),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT,
    "color" TEXT,
    "metadata" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "htmlBody" TEXT,
    "smsBody" TEXT,
    "channels" JSONB NOT NULL,
    "deliveryRules" JSONB,
    "recipientType" "RecipientType" NOT NULL,
    "defaultRecipients" JSONB,
    "triggerEvent" TEXT NOT NULL,
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "notificationNumber" TEXT NOT NULL,
    "templateId" TEXT,
    "category" "NotificationCategory" NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "htmlBody" TEXT,
    "data" JSONB,
    "recipientType" "RecipientType" NOT NULL,
    "recipientId" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "recipientPushToken" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "channels" JSONB NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "error" TEXT,
    "errorStack" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "provider" TEXT,
    "providerId" TEXT,
    "providerResponse" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "error" TEXT,
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "category" "AlertCategory" NOT NULL,
    "alertType" "NotificationAlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "triggerEntity" TEXT NOT NULL,
    "triggerConditions" JSONB NOT NULL,
    "triggerFrequency" "TriggerFrequency" NOT NULL DEFAULT 'REALTIME',
    "metricCode" TEXT,
    "threshold" DECIMAL(18,4),
    "thresholdOperator" "ThresholdOperator",
    "templateId" TEXT,
    "notificationChannels" JSONB NOT NULL,
    "recipientType" "RecipientType" NOT NULL,
    "recipients" JSONB NOT NULL,
    "activeHoursStart" TEXT,
    "activeHoursEnd" TEXT,
    "activeDays" JSONB,
    "throttlePeriod" INTEGER,
    "maxAlertsPerDay" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requireAcknowledgment" BOOLEAN NOT NULL DEFAULT false,
    "autoResolve" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "triggeredCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "alertNumber" TEXT NOT NULL,
    "ruleId" TEXT,
    "category" "AlertCategory" NOT NULL,
    "alertType" "NotificationAlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "status" "NotificationAlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolution" TEXT,
    "resolutionAction" TEXT,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "escalatedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "webhookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "categoryPreferences" JSONB,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestFrequency" "DigestFrequency",
    "digestTime" TEXT,
    "alertEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alertSmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alertPushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "criticalOnlyMode" BOOLEAN NOT NULL DEFAULT false,
    "preferredEmail" TEXT,
    "preferredPhone" TEXT,
    "pushTokens" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalIntegration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "provider" "IntegrationProvider" NOT NULL,
    "category" "IntegrationCategory" NOT NULL,
    "config" JSONB NOT NULL,
    "authType" "AuthType" NOT NULL,
    "credentials" JSONB,
    "webhookSecret" TEXT,
    "features" JSONB NOT NULL,
    "syncDirection" "SyncDirection" NOT NULL,
    "syncFrequency" "SyncFrequency" NOT NULL,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "fieldMappings" JSONB NOT NULL,
    "defaultMappings" JSONB,
    "rateLimitPerMinute" INTEGER,
    "rateLimitPerHour" INTEGER,
    "rateLimitPerDay" INTEGER,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'INACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastError" TEXT,
    "syncCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "healthStatus" "HealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "healthCheckedAt" TIMESTAMP(3),
    "healthMessage" TEXT,
    "uptime" DECIMAL(5,2),
    "version" TEXT,
    "apiVersion" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ExternalIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "connectionType" "ConnectionType" NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenType" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "username" TEXT,
    "password" TEXT,
    "baseUrl" TEXT,
    "webhookUrl" TEXT,
    "environment" "Environment" NOT NULL DEFAULT 'PRODUCTION',
    "status" "ConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3),
    "lastConnectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "lastValidatedAt" TIMESTAMP(3),
    "validationError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSync" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "syncNumber" TEXT NOT NULL,
    "syncType" "SyncType" NOT NULL,
    "direction" "SyncDirection" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "mode" "SyncMode" NOT NULL DEFAULT 'INCREMENTAL',
    "filters" JSONB,
    "includeFields" TEXT[],
    "excludeFields" TEXT[],
    "batchSize" INTEGER NOT NULL DEFAULT 100,
    "batchNumber" INTEGER NOT NULL DEFAULT 1,
    "totalBatches" INTEGER NOT NULL DEFAULT 1,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "successfulRecords" INTEGER NOT NULL DEFAULT 0,
    "failedRecords" INTEGER NOT NULL DEFAULT 0,
    "skippedRecords" INTEGER NOT NULL DEFAULT 0,
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "errors" JSONB,
    "errorSummary" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastRetryAt" TIMESTAMP(3),
    "result" JSONB,
    "changes" JSONB,
    "triggeredBy" "TriggerType" NOT NULL DEFAULT 'MANUAL',
    "triggeredByUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationMapping" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "direction" "SyncDirection" NOT NULL,
    "mappings" JSONB NOT NULL,
    "transformations" JSONB,
    "defaultValues" JSONB,
    "validationRules" JSONB,
    "requiredFields" TEXT[],
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "IntegrationMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "syncId" TEXT,
    "level" "LogLevel" NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "request" JSONB,
    "response" JSONB,
    "statusCode" INTEGER,
    "error" TEXT,
    "errorCode" TEXT,
    "errorStack" TEXT,
    "duration" INTEGER,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationWebhook" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" "HttpMethod" NOT NULL DEFAULT 'POST',
    "secret" TEXT,
    "signatureHeader" TEXT,
    "signatureAlgorithm" TEXT,
    "headers" JSONB,
    "payloadTemplate" TEXT,
    "includeMetadata" BOOLEAN NOT NULL DEFAULT true,
    "filters" JSONB,
    "retryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryDelay" INTEGER NOT NULL DEFAULT 60,
    "status" "WebhookStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastError" TEXT,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "IntegrationWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WavePick" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "waveNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "waveType" "WaveType" NOT NULL,
    "priority" "WavePriority" NOT NULL DEFAULT 'NORMAL',
    "strategy" "WaveStrategy" NOT NULL,
    "groupingCriteria" JSONB NOT NULL,
    "maxLines" INTEGER,
    "maxOrders" INTEGER,
    "maxWeight" DECIMAL(10,2),
    "maxVolume" DECIMAL(10,2),
    "scheduledFor" TIMESTAMP(3),
    "releaseTime" TIMESTAMP(3),
    "pickDeadline" TIMESTAMP(3),
    "shipDate" TIMESTAMP(3),
    "status" "WaveStatus" NOT NULL DEFAULT 'PLANNED',
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalLines" INTEGER NOT NULL DEFAULT 0,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DECIMAL(10,2),
    "totalVolume" DECIMAL(10,2),
    "pickedLines" INTEGER NOT NULL DEFAULT 0,
    "packedOrders" INTEGER NOT NULL DEFAULT 0,
    "shippedOrders" INTEGER NOT NULL DEFAULT 0,
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "pickRate" DECIMAL(8,2),
    "accuracy" DECIMAL(5,2),
    "tags" TEXT[],
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "WavePick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WavePickLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "wavePickId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "pickListId" TEXT,
    "inventoryItemId" TEXT NOT NULL,
    "locationId" TEXT,
    "orderedQuantity" INTEGER NOT NULL,
    "pickedQuantity" INTEGER NOT NULL DEFAULT 0,
    "shortQuantity" INTEGER NOT NULL DEFAULT 0,
    "lotId" TEXT,
    "serialNumbers" TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "pickSequence" INTEGER,
    "zoneSequence" INTEGER,
    "status" "PickLineStatus" NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "pickedAt" TIMESTAMP(3),
    "pickedById" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "notes" TEXT,
    "issues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WavePickLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickingTask" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "taskNumber" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "wavePickId" TEXT,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "inventoryItemId" TEXT,
    "quantity" INTEGER,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "dueBy" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "completedById" TEXT,
    "completionNotes" TEXT,
    "dependsOn" TEXT[],
    "blockedBy" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "PickingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickingRoute" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "routeNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "wavePickId" TEXT,
    "routeType" "RouteType" NOT NULL DEFAULT 'STANDARD',
    "optimizationMethod" "OptimizationMethod" NOT NULL DEFAULT 'SHORTEST_PATH',
    "startLocationId" TEXT,
    "endLocationId" TEXT,
    "waypoints" JSONB NOT NULL,
    "totalStops" INTEGER NOT NULL DEFAULT 0,
    "totalDistance" DECIMAL(10,2),
    "estimatedDuration" INTEGER,
    "actualDuration" INTEGER,
    "status" "RouteStatus" NOT NULL DEFAULT 'PLANNED',
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "efficiency" DECIMAL(5,2),
    "deviations" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "PickingRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAutomation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "triggerEvent" "TriggerEvent" NOT NULL,
    "triggerConditions" JSONB NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "taskPriority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "taskTemplate" JSONB NOT NULL,
    "assignmentRule" "AssignmentRule" NOT NULL DEFAULT 'ROUND_ROBIN',
    "assignToRole" TEXT,
    "assignToUserId" TEXT,
    "scheduleType" "ScheduleType" NOT NULL DEFAULT 'HOURLY',
    "scheduleTime" TEXT,
    "scheduleDays" TEXT[],
    "delay" INTEGER,
    "maxExecutionsPerDay" INTEGER,
    "maxExecutionsPerHour" INTEGER,
    "cooldownPeriod" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "lastExecutionAt" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "retryOnFailure" BOOLEAN NOT NULL DEFAULT true,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "TaskAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskExecution" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "executionNumber" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "triggerData" JSONB NOT NULL,
    "triggeredBy" TEXT,
    "taskId" TEXT,
    "taskNumber" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "result" JSONB,
    "error" TEXT,
    "errorStack" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_domain_key" ON "organizations"("domain");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_createdById_idx" ON "organizations"("createdById");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_idx" ON "organization_members"("organizationId");

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "warehouses_organizationId_idx" ON "warehouses"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_organizationId_code_key" ON "warehouses"("organizationId", "code");

-- CreateIndex
CREATE INDEX "categories_organizationId_idx" ON "categories"("organizationId");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_organizationId_slug_key" ON "categories"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "inventory_items_organizationId_idx" ON "inventory_items"("organizationId");

-- CreateIndex
CREATE INDEX "inventory_items_warehouseId_idx" ON "inventory_items"("warehouseId");

-- CreateIndex
CREATE INDEX "inventory_items_categoryId_idx" ON "inventory_items"("categoryId");

-- CreateIndex
CREATE INDEX "inventory_items_supplierId_idx" ON "inventory_items"("supplierId");

-- CreateIndex
CREATE INDEX "inventory_items_sku_idx" ON "inventory_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_organizationId_sku_key" ON "inventory_items"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "inventory_movements_inventoryItemId_idx" ON "inventory_movements"("inventoryItemId");

-- CreateIndex
CREATE INDEX "inventory_movements_createdAt_idx" ON "inventory_movements"("createdAt");

-- CreateIndex
CREATE INDEX "reorder_alerts_organizationId_idx" ON "reorder_alerts"("organizationId");

-- CreateIndex
CREATE INDEX "reorder_alerts_inventoryItemId_idx" ON "reorder_alerts"("inventoryItemId");

-- CreateIndex
CREATE INDEX "reorder_alerts_status_idx" ON "reorder_alerts"("status");

-- CreateIndex
CREATE INDEX "reorder_alerts_createdAt_idx" ON "reorder_alerts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingNumber_key" ON "bookings"("bookingNumber");

-- CreateIndex
CREATE INDEX "bookings_organizationId_idx" ON "bookings"("organizationId");

-- CreateIndex
CREATE INDEX "bookings_customerId_idx" ON "bookings"("customerId");

-- CreateIndex
CREATE INDEX "bookings_bookingNumber_idx" ON "bookings"("bookingNumber");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "booking_items_bookingId_idx" ON "booking_items"("bookingId");

-- CreateIndex
CREATE INDEX "booking_items_inventoryItemId_idx" ON "booking_items"("inventoryItemId");

-- CreateIndex
CREATE INDEX "suppliers_organizationId_idx" ON "suppliers"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_organizationId_code_key" ON "suppliers"("organizationId", "code");

-- CreateIndex
CREATE INDEX "customers_organizationId_idx" ON "customers"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_organizationId_code_key" ON "customers"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_organizationId_idx" ON "purchase_orders"("organizationId");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_orders_poNumber_idx" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_createdAt_idx" ON "purchase_orders"("createdAt");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchaseOrderId_idx" ON "purchase_order_items"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "purchase_order_items_inventoryItemId_idx" ON "purchase_order_items"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipt_notes_grnNumber_key" ON "goods_receipt_notes"("grnNumber");

-- CreateIndex
CREATE INDEX "goods_receipt_notes_organizationId_idx" ON "goods_receipt_notes"("organizationId");

-- CreateIndex
CREATE INDEX "goods_receipt_notes_purchaseOrderId_idx" ON "goods_receipt_notes"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "goods_receipt_notes_warehouseId_idx" ON "goods_receipt_notes"("warehouseId");

-- CreateIndex
CREATE INDEX "goods_receipt_notes_status_idx" ON "goods_receipt_notes"("status");

-- CreateIndex
CREATE INDEX "goods_receipt_notes_receivedDate_idx" ON "goods_receipt_notes"("receivedDate");

-- CreateIndex
CREATE INDEX "grn_items_grnId_idx" ON "grn_items"("grnId");

-- CreateIndex
CREATE INDEX "grn_items_inventoryItemId_idx" ON "grn_items"("inventoryItemId");

-- CreateIndex
CREATE INDEX "grn_items_purchaseOrderItemId_idx" ON "grn_items"("purchaseOrderItemId");

-- CreateIndex
CREATE INDEX "sales_orders_organizationId_idx" ON "sales_orders"("organizationId");

-- CreateIndex
CREATE INDEX "sales_orders_customerId_idx" ON "sales_orders"("customerId");

-- CreateIndex
CREATE INDEX "sales_orders_warehouseId_idx" ON "sales_orders"("warehouseId");

-- CreateIndex
CREATE INDEX "sales_orders_status_idx" ON "sales_orders"("status");

-- CreateIndex
CREATE INDEX "sales_orders_orderDate_idx" ON "sales_orders"("orderDate");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_organizationId_soNumber_key" ON "sales_orders"("organizationId", "soNumber");

-- CreateIndex
CREATE INDEX "sales_order_items_salesOrderId_idx" ON "sales_order_items"("salesOrderId");

-- CreateIndex
CREATE INDEX "sales_order_items_inventoryItemId_idx" ON "sales_order_items"("inventoryItemId");

-- CreateIndex
CREATE INDEX "pick_lists_organizationId_idx" ON "pick_lists"("organizationId");

-- CreateIndex
CREATE INDEX "pick_lists_salesOrderId_idx" ON "pick_lists"("salesOrderId");

-- CreateIndex
CREATE INDEX "pick_lists_warehouseId_idx" ON "pick_lists"("warehouseId");

-- CreateIndex
CREATE INDEX "pick_lists_status_idx" ON "pick_lists"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pick_lists_organizationId_pickListNumber_key" ON "pick_lists"("organizationId", "pickListNumber");

-- CreateIndex
CREATE INDEX "pick_list_items_pickListId_idx" ON "pick_list_items"("pickListId");

-- CreateIndex
CREATE INDEX "pick_list_items_salesOrderItemId_idx" ON "pick_list_items"("salesOrderItemId");

-- CreateIndex
CREATE INDEX "pick_list_items_inventoryItemId_idx" ON "pick_list_items"("inventoryItemId");

-- CreateIndex
CREATE INDEX "packs_organizationId_idx" ON "packs"("organizationId");

-- CreateIndex
CREATE INDEX "packs_salesOrderId_idx" ON "packs"("salesOrderId");

-- CreateIndex
CREATE INDEX "packs_pickListId_idx" ON "packs"("pickListId");

-- CreateIndex
CREATE INDEX "packs_warehouseId_idx" ON "packs"("warehouseId");

-- CreateIndex
CREATE INDEX "packs_status_idx" ON "packs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "packs_organizationId_packNumber_key" ON "packs"("organizationId", "packNumber");

-- CreateIndex
CREATE INDEX "packages_packId_idx" ON "packages"("packId");

-- CreateIndex
CREATE INDEX "packages_trackingNumber_idx" ON "packages"("trackingNumber");

-- CreateIndex
CREATE INDEX "package_items_packageId_idx" ON "package_items"("packageId");

-- CreateIndex
CREATE INDEX "package_items_salesOrderItemId_idx" ON "package_items"("salesOrderItemId");

-- CreateIndex
CREATE INDEX "package_items_inventoryItemId_idx" ON "package_items"("inventoryItemId");

-- CreateIndex
CREATE INDEX "shipments_organizationId_idx" ON "shipments"("organizationId");

-- CreateIndex
CREATE INDEX "shipments_salesOrderId_idx" ON "shipments"("salesOrderId");

-- CreateIndex
CREATE INDEX "shipments_packId_idx" ON "shipments"("packId");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_trackingNumber_idx" ON "shipments"("trackingNumber");

-- CreateIndex
CREATE INDEX "shipments_carrierCode_idx" ON "shipments"("carrierCode");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_organizationId_shipmentNumber_key" ON "shipments"("organizationId", "shipmentNumber");

-- CreateIndex
CREATE INDEX "carrier_configs_organizationId_idx" ON "carrier_configs"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "carrier_configs_organizationId_carrierType_key" ON "carrier_configs"("organizationId", "carrierType");

-- CreateIndex
CREATE INDEX "integrations_organizationId_idx" ON "integrations"("organizationId");

-- CreateIndex
CREATE INDEX "integrations_type_idx" ON "integrations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "locations_barcode_key" ON "locations"("barcode");

-- CreateIndex
CREATE INDEX "locations_organizationId_idx" ON "locations"("organizationId");

-- CreateIndex
CREATE INDEX "locations_locationCode_idx" ON "locations"("locationCode");

-- CreateIndex
CREATE INDEX "locations_barcode_idx" ON "locations"("barcode");

-- CreateIndex
CREATE INDEX "locations_type_idx" ON "locations"("type");

-- CreateIndex
CREATE INDEX "locations_parentId_idx" ON "locations"("parentId");

-- CreateIndex
CREATE INDEX "locations_warehouseId_idx" ON "locations"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "locations_organizationId_locationCode_key" ON "locations"("organizationId", "locationCode");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_transfers_transferNumber_key" ON "warehouse_transfers"("transferNumber");

-- CreateIndex
CREATE INDEX "warehouse_transfers_organizationId_idx" ON "warehouse_transfers"("organizationId");

-- CreateIndex
CREATE INDEX "warehouse_transfers_transferNumber_idx" ON "warehouse_transfers"("transferNumber");

-- CreateIndex
CREATE INDEX "warehouse_transfers_status_idx" ON "warehouse_transfers"("status");

-- CreateIndex
CREATE INDEX "warehouse_transfers_fromLocationId_idx" ON "warehouse_transfers"("fromLocationId");

-- CreateIndex
CREATE INDEX "warehouse_transfers_toLocationId_idx" ON "warehouse_transfers"("toLocationId");

-- CreateIndex
CREATE INDEX "warehouse_transfers_inventoryId_idx" ON "warehouse_transfers"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_adjustments_adjustmentNumber_key" ON "stock_adjustments"("adjustmentNumber");

-- CreateIndex
CREATE INDEX "stock_adjustments_organizationId_idx" ON "stock_adjustments"("organizationId");

-- CreateIndex
CREATE INDEX "stock_adjustments_adjustmentNumber_idx" ON "stock_adjustments"("adjustmentNumber");

-- CreateIndex
CREATE INDEX "stock_adjustments_status_idx" ON "stock_adjustments"("status");

-- CreateIndex
CREATE INDEX "stock_adjustments_inventoryId_idx" ON "stock_adjustments"("inventoryId");

-- CreateIndex
CREATE INDEX "stock_adjustments_locationId_idx" ON "stock_adjustments"("locationId");

-- CreateIndex
CREATE INDEX "stock_adjustments_reason_idx" ON "stock_adjustments"("reason");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_organizationId_idx" ON "api_keys"("organizationId");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "activity_logs_organizationId_idx" ON "activity_logs"("organizationId");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_counts_countNumber_key" ON "cycle_counts"("countNumber");

-- CreateIndex
CREATE INDEX "cycle_counts_organizationId_idx" ON "cycle_counts"("organizationId");

-- CreateIndex
CREATE INDEX "cycle_counts_countNumber_idx" ON "cycle_counts"("countNumber");

-- CreateIndex
CREATE INDEX "cycle_counts_status_idx" ON "cycle_counts"("status");

-- CreateIndex
CREATE INDEX "cycle_counts_locationId_idx" ON "cycle_counts"("locationId");

-- CreateIndex
CREATE INDEX "cycle_counts_categoryId_idx" ON "cycle_counts"("categoryId");

-- CreateIndex
CREATE INDEX "cycle_counts_assignedToId_idx" ON "cycle_counts"("assignedToId");

-- CreateIndex
CREATE INDEX "cycle_counts_scheduledDate_idx" ON "cycle_counts"("scheduledDate");

-- CreateIndex
CREATE INDEX "cycle_count_items_cycleCountId_idx" ON "cycle_count_items"("cycleCountId");

-- CreateIndex
CREATE INDEX "cycle_count_items_inventoryId_idx" ON "cycle_count_items"("inventoryId");

-- CreateIndex
CREATE INDEX "cycle_count_items_locationId_idx" ON "cycle_count_items"("locationId");

-- CreateIndex
CREATE INDEX "cycle_count_items_isCounted_idx" ON "cycle_count_items"("isCounted");

-- CreateIndex
CREATE INDEX "cycle_count_items_isReconciled_idx" ON "cycle_count_items"("isReconciled");

-- CreateIndex
CREATE INDEX "return_reasons_organizationId_idx" ON "return_reasons"("organizationId");

-- CreateIndex
CREATE INDEX "return_reasons_isActive_idx" ON "return_reasons"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "return_reasons_organizationId_code_key" ON "return_reasons"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "rmas_rmaNumber_key" ON "rmas"("rmaNumber");

-- CreateIndex
CREATE INDEX "rmas_organizationId_idx" ON "rmas"("organizationId");

-- CreateIndex
CREATE INDEX "rmas_rmaNumber_idx" ON "rmas"("rmaNumber");

-- CreateIndex
CREATE INDEX "rmas_status_idx" ON "rmas"("status");

-- CreateIndex
CREATE INDEX "rmas_salesOrderId_idx" ON "rmas"("salesOrderId");

-- CreateIndex
CREATE INDEX "rmas_customerId_idx" ON "rmas"("customerId");

-- CreateIndex
CREATE INDEX "rmas_returnReasonId_idx" ON "rmas"("returnReasonId");

-- CreateIndex
CREATE INDEX "rma_items_rmaId_idx" ON "rma_items"("rmaId");

-- CreateIndex
CREATE INDEX "rma_items_inventoryId_idx" ON "rma_items"("inventoryId");

-- CreateIndex
CREATE INDEX "rma_items_salesOrderItemId_idx" ON "rma_items"("salesOrderItemId");

-- CreateIndex
CREATE INDEX "rma_items_isInspected_idx" ON "rma_items"("isInspected");

-- CreateIndex
CREATE INDEX "rma_items_isRestocked_idx" ON "rma_items"("isRestocked");

-- CreateIndex
CREATE INDEX "lots_organizationId_idx" ON "lots"("organizationId");

-- CreateIndex
CREATE INDEX "lots_inventoryId_idx" ON "lots"("inventoryId");

-- CreateIndex
CREATE INDEX "lots_lotNumber_idx" ON "lots"("lotNumber");

-- CreateIndex
CREATE INDEX "lots_expiryDate_idx" ON "lots"("expiryDate");

-- CreateIndex
CREATE INDEX "lots_status_idx" ON "lots"("status");

-- CreateIndex
CREATE INDEX "lots_qcStatus_idx" ON "lots"("qcStatus");

-- CreateIndex
CREATE INDEX "lots_isRecalled_idx" ON "lots"("isRecalled");

-- CreateIndex
CREATE INDEX "lots_grnId_idx" ON "lots"("grnId");

-- CreateIndex
CREATE UNIQUE INDEX "lots_organizationId_lotNumber_key" ON "lots"("organizationId", "lotNumber");

-- CreateIndex
CREATE INDEX "serial_numbers_organizationId_idx" ON "serial_numbers"("organizationId");

-- CreateIndex
CREATE INDEX "serial_numbers_inventoryId_idx" ON "serial_numbers"("inventoryId");

-- CreateIndex
CREATE INDEX "serial_numbers_lotId_idx" ON "serial_numbers"("lotId");

-- CreateIndex
CREATE INDEX "serial_numbers_serialNumber_idx" ON "serial_numbers"("serialNumber");

-- CreateIndex
CREATE INDEX "serial_numbers_status_idx" ON "serial_numbers"("status");

-- CreateIndex
CREATE INDEX "serial_numbers_salesOrderId_idx" ON "serial_numbers"("salesOrderId");

-- CreateIndex
CREATE INDEX "serial_numbers_customerId_idx" ON "serial_numbers"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "serial_numbers_organizationId_serialNumber_key" ON "serial_numbers"("organizationId", "serialNumber");

-- CreateIndex
CREATE INDEX "lot_movements_organizationId_idx" ON "lot_movements"("organizationId");

-- CreateIndex
CREATE INDEX "lot_movements_lotId_idx" ON "lot_movements"("lotId");

-- CreateIndex
CREATE INDEX "lot_movements_movementType_idx" ON "lot_movements"("movementType");

-- CreateIndex
CREATE INDEX "lot_movements_createdAt_idx" ON "lot_movements"("createdAt");

-- CreateIndex
CREATE INDEX "serial_movements_organizationId_idx" ON "serial_movements"("organizationId");

-- CreateIndex
CREATE INDEX "serial_movements_serialNumberId_idx" ON "serial_movements"("serialNumberId");

-- CreateIndex
CREATE INDEX "serial_movements_movementType_idx" ON "serial_movements"("movementType");

-- CreateIndex
CREATE INDEX "serial_movements_createdAt_idx" ON "serial_movements"("createdAt");

-- CreateIndex
CREATE INDEX "lot_genealogy_organizationId_idx" ON "lot_genealogy"("organizationId");

-- CreateIndex
CREATE INDEX "lot_genealogy_parentLotId_idx" ON "lot_genealogy"("parentLotId");

-- CreateIndex
CREATE INDEX "lot_genealogy_childLotId_idx" ON "lot_genealogy"("childLotId");

-- CreateIndex
CREATE INDEX "inspection_templates_organizationId_idx" ON "inspection_templates"("organizationId");

-- CreateIndex
CREATE INDEX "inspection_templates_category_idx" ON "inspection_templates"("category");

-- CreateIndex
CREATE INDEX "inspection_templates_isActive_idx" ON "inspection_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_templates_organizationId_code_key" ON "inspection_templates"("organizationId", "code");

-- CreateIndex
CREATE INDEX "qc_inspections_organizationId_idx" ON "qc_inspections"("organizationId");

-- CreateIndex
CREATE INDEX "qc_inspections_templateId_idx" ON "qc_inspections"("templateId");

-- CreateIndex
CREATE INDEX "qc_inspections_inventoryId_idx" ON "qc_inspections"("inventoryId");

-- CreateIndex
CREATE INDEX "qc_inspections_status_idx" ON "qc_inspections"("status");

-- CreateIndex
CREATE INDEX "qc_inspections_result_idx" ON "qc_inspections"("result");

-- CreateIndex
CREATE INDEX "qc_inspections_grnId_idx" ON "qc_inspections"("grnId");

-- CreateIndex
CREATE INDEX "qc_inspections_salesOrderId_idx" ON "qc_inspections"("salesOrderId");

-- CreateIndex
CREATE INDEX "qc_inspections_lotId_idx" ON "qc_inspections"("lotId");

-- CreateIndex
CREATE INDEX "qc_inspections_inspectedDate_idx" ON "qc_inspections"("inspectedDate");

-- CreateIndex
CREATE UNIQUE INDEX "qc_inspections_organizationId_inspectionNumber_key" ON "qc_inspections"("organizationId", "inspectionNumber");

-- CreateIndex
CREATE INDEX "qc_checkpoints_inspectionId_idx" ON "qc_checkpoints"("inspectionId");

-- CreateIndex
CREATE INDEX "qc_checkpoints_type_idx" ON "qc_checkpoints"("type");

-- CreateIndex
CREATE INDEX "qc_checkpoints_status_idx" ON "qc_checkpoints"("status");

-- CreateIndex
CREATE INDEX "qc_checkpoints_result_idx" ON "qc_checkpoints"("result");

-- CreateIndex
CREATE INDEX "qc_approvals_inspectionId_idx" ON "qc_approvals"("inspectionId");

-- CreateIndex
CREATE INDEX "qc_approvals_level_idx" ON "qc_approvals"("level");

-- CreateIndex
CREATE INDEX "qc_approvals_status_idx" ON "qc_approvals"("status");

-- CreateIndex
CREATE INDEX "qc_approvals_approverId_idx" ON "qc_approvals"("approverId");

-- CreateIndex
CREATE INDEX "bills_of_materials_organizationId_idx" ON "bills_of_materials"("organizationId");

-- CreateIndex
CREATE INDEX "bills_of_materials_productId_idx" ON "bills_of_materials"("productId");

-- CreateIndex
CREATE INDEX "bills_of_materials_status_idx" ON "bills_of_materials"("status");

-- CreateIndex
CREATE INDEX "bills_of_materials_isActive_idx" ON "bills_of_materials"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "bills_of_materials_organizationId_bomNumber_key" ON "bills_of_materials"("organizationId", "bomNumber");

-- CreateIndex
CREATE INDEX "bom_components_bomId_idx" ON "bom_components"("bomId");

-- CreateIndex
CREATE INDEX "bom_components_componentId_idx" ON "bom_components"("componentId");

-- CreateIndex
CREATE INDEX "bom_components_sequence_idx" ON "bom_components"("sequence");

-- CreateIndex
CREATE INDEX "assembly_orders_organizationId_idx" ON "assembly_orders"("organizationId");

-- CreateIndex
CREATE INDEX "assembly_orders_bomId_idx" ON "assembly_orders"("bomId");

-- CreateIndex
CREATE INDEX "assembly_orders_productId_idx" ON "assembly_orders"("productId");

-- CreateIndex
CREATE INDEX "assembly_orders_status_idx" ON "assembly_orders"("status");

-- CreateIndex
CREATE INDEX "assembly_orders_scheduledStart_idx" ON "assembly_orders"("scheduledStart");

-- CreateIndex
CREATE UNIQUE INDEX "assembly_orders_organizationId_orderNumber_key" ON "assembly_orders"("organizationId", "orderNumber");

-- CreateIndex
CREATE INDEX "assembly_component_issues_assemblyOrderId_idx" ON "assembly_component_issues"("assemblyOrderId");

-- CreateIndex
CREATE INDEX "assembly_component_issues_componentId_idx" ON "assembly_component_issues"("componentId");

-- CreateIndex
CREATE INDEX "assembly_component_issues_lotId_idx" ON "assembly_component_issues"("lotId");

-- CreateIndex
CREATE INDEX "assembly_component_issues_status_idx" ON "assembly_component_issues"("status");

-- CreateIndex
CREATE INDEX "assembly_production_logs_assemblyOrderId_idx" ON "assembly_production_logs"("assemblyOrderId");

-- CreateIndex
CREATE INDEX "assembly_production_logs_eventType_idx" ON "assembly_production_logs"("eventType");

-- CreateIndex
CREATE INDEX "assembly_production_logs_eventDate_idx" ON "assembly_production_logs"("eventDate");

-- CreateIndex
CREATE INDEX "reports_organizationId_idx" ON "reports"("organizationId");

-- CreateIndex
CREATE INDEX "reports_reportType_idx" ON "reports"("reportType");

-- CreateIndex
CREATE INDEX "reports_category_idx" ON "reports"("category");

-- CreateIndex
CREATE INDEX "reports_isActive_idx" ON "reports"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "reports_organizationId_code_key" ON "reports"("organizationId", "code");

-- CreateIndex
CREATE INDEX "report_executions_reportId_idx" ON "report_executions"("reportId");

-- CreateIndex
CREATE INDEX "report_executions_organizationId_idx" ON "report_executions"("organizationId");

-- CreateIndex
CREATE INDEX "report_executions_status_idx" ON "report_executions"("status");

-- CreateIndex
CREATE INDEX "report_executions_startedAt_idx" ON "report_executions"("startedAt");

-- CreateIndex
CREATE INDEX "dashboards_organizationId_idx" ON "dashboards"("organizationId");

-- CreateIndex
CREATE INDEX "dashboards_dashboardType_idx" ON "dashboards"("dashboardType");

-- CreateIndex
CREATE INDEX "dashboards_isActive_idx" ON "dashboards"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "dashboards_organizationId_slug_key" ON "dashboards"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "analytics_events_organizationId_idx" ON "analytics_events"("organizationId");

-- CreateIndex
CREATE INDEX "analytics_events_eventType_idx" ON "analytics_events"("eventType");

-- CreateIndex
CREATE INDEX "analytics_events_eventName_idx" ON "analytics_events"("eventName");

-- CreateIndex
CREATE INDEX "analytics_events_category_idx" ON "analytics_events"("category");

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_timestamp_idx" ON "analytics_events"("timestamp");

-- CreateIndex
CREATE INDEX "kpi_metrics_organizationId_idx" ON "kpi_metrics"("organizationId");

-- CreateIndex
CREATE INDEX "kpi_metrics_category_idx" ON "kpi_metrics"("category");

-- CreateIndex
CREATE INDEX "kpi_metrics_periodType_idx" ON "kpi_metrics"("periodType");

-- CreateIndex
CREATE INDEX "kpi_metrics_periodStart_idx" ON "kpi_metrics"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_metrics_organizationId_metricCode_periodStart_key" ON "kpi_metrics"("organizationId", "metricCode", "periodStart");

-- CreateIndex
CREATE INDEX "NotificationTemplate_organizationId_category_idx" ON "NotificationTemplate"("organizationId", "category");

-- CreateIndex
CREATE INDEX "NotificationTemplate_organizationId_isActive_idx" ON "NotificationTemplate"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_organizationId_code_key" ON "NotificationTemplate"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_notificationNumber_key" ON "Notification"("notificationNumber");

-- CreateIndex
CREATE INDEX "Notification_organizationId_recipientId_status_idx" ON "Notification"("organizationId", "recipientId", "status");

-- CreateIndex
CREATE INDEX "Notification_organizationId_category_status_idx" ON "Notification"("organizationId", "category", "status");

-- CreateIndex
CREATE INDEX "Notification_organizationId_createdAt_idx" ON "Notification"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_idx" ON "Notification"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_scheduledFor_idx" ON "Notification"("scheduledFor");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationId_channel_idx" ON "NotificationDelivery"("notificationId", "channel");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_sentAt_idx" ON "NotificationDelivery"("status", "sentAt");

-- CreateIndex
CREATE INDEX "AlertRule_organizationId_isActive_idx" ON "AlertRule"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "AlertRule_organizationId_category_idx" ON "AlertRule"("organizationId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "AlertRule_organizationId_code_key" ON "AlertRule"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_alertNumber_key" ON "Alert"("alertNumber");

-- CreateIndex
CREATE INDEX "Alert_organizationId_status_severity_idx" ON "Alert"("organizationId", "status", "severity");

-- CreateIndex
CREATE INDEX "Alert_organizationId_category_status_idx" ON "Alert"("organizationId", "category", "status");

-- CreateIndex
CREATE INDEX "Alert_ruleId_triggeredAt_idx" ON "Alert"("ruleId", "triggeredAt");

-- CreateIndex
CREATE INDEX "Alert_acknowledgedById_idx" ON "Alert"("acknowledgedById");

-- CreateIndex
CREATE INDEX "Alert_resolvedById_idx" ON "Alert"("resolvedById");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "ExternalIntegration_organizationId_provider_idx" ON "ExternalIntegration"("organizationId", "provider");

-- CreateIndex
CREATE INDEX "ExternalIntegration_organizationId_category_idx" ON "ExternalIntegration"("organizationId", "category");

-- CreateIndex
CREATE INDEX "ExternalIntegration_status_idx" ON "ExternalIntegration"("status");

-- CreateIndex
CREATE INDEX "ExternalIntegration_healthStatus_idx" ON "ExternalIntegration"("healthStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIntegration_organizationId_code_key" ON "ExternalIntegration"("organizationId", "code");

-- CreateIndex
CREATE INDEX "IntegrationConnection_organizationId_integrationId_idx" ON "IntegrationConnection"("organizationId", "integrationId");

-- CreateIndex
CREATE INDEX "IntegrationConnection_status_idx" ON "IntegrationConnection"("status");

-- CreateIndex
CREATE INDEX "IntegrationConnection_expiresAt_idx" ON "IntegrationConnection"("expiresAt");

-- CreateIndex
CREATE INDEX "IntegrationSync_organizationId_integrationId_idx" ON "IntegrationSync"("organizationId", "integrationId");

-- CreateIndex
CREATE INDEX "IntegrationSync_syncType_entityType_idx" ON "IntegrationSync"("syncType", "entityType");

-- CreateIndex
CREATE INDEX "IntegrationSync_status_idx" ON "IntegrationSync"("status");

-- CreateIndex
CREATE INDEX "IntegrationSync_scheduledFor_idx" ON "IntegrationSync"("scheduledFor");

-- CreateIndex
CREATE INDEX "IntegrationSync_createdAt_idx" ON "IntegrationSync"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationSync_organizationId_syncNumber_key" ON "IntegrationSync"("organizationId", "syncNumber");

-- CreateIndex
CREATE INDEX "IntegrationMapping_organizationId_integrationId_idx" ON "IntegrationMapping"("organizationId", "integrationId");

-- CreateIndex
CREATE INDEX "IntegrationMapping_entityType_idx" ON "IntegrationMapping"("entityType");

-- CreateIndex
CREATE INDEX "IntegrationMapping_isActive_idx" ON "IntegrationMapping"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationMapping_organizationId_integrationId_entityType__key" ON "IntegrationMapping"("organizationId", "integrationId", "entityType", "direction");

-- CreateIndex
CREATE INDEX "IntegrationLog_organizationId_integrationId_idx" ON "IntegrationLog"("organizationId", "integrationId");

-- CreateIndex
CREATE INDEX "IntegrationLog_syncId_idx" ON "IntegrationLog"("syncId");

-- CreateIndex
CREATE INDEX "IntegrationLog_level_idx" ON "IntegrationLog"("level");

-- CreateIndex
CREATE INDEX "IntegrationLog_action_idx" ON "IntegrationLog"("action");

-- CreateIndex
CREATE INDEX "IntegrationLog_createdAt_idx" ON "IntegrationLog"("createdAt");

-- CreateIndex
CREATE INDEX "IntegrationLog_entityType_entityId_idx" ON "IntegrationLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "IntegrationWebhook_organizationId_integrationId_idx" ON "IntegrationWebhook"("organizationId", "integrationId");

-- CreateIndex
CREATE INDEX "IntegrationWebhook_event_idx" ON "IntegrationWebhook"("event");

-- CreateIndex
CREATE INDEX "IntegrationWebhook_status_idx" ON "IntegrationWebhook"("status");

-- CreateIndex
CREATE INDEX "IntegrationWebhook_isActive_idx" ON "IntegrationWebhook"("isActive");

-- CreateIndex
CREATE INDEX "WavePick_organizationId_warehouseId_idx" ON "WavePick"("organizationId", "warehouseId");

-- CreateIndex
CREATE INDEX "WavePick_status_idx" ON "WavePick"("status");

-- CreateIndex
CREATE INDEX "WavePick_scheduledFor_idx" ON "WavePick"("scheduledFor");

-- CreateIndex
CREATE INDEX "WavePick_assignedToId_idx" ON "WavePick"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "WavePick_organizationId_waveNumber_key" ON "WavePick"("organizationId", "waveNumber");

-- CreateIndex
CREATE INDEX "WavePickLine_organizationId_wavePickId_idx" ON "WavePickLine"("organizationId", "wavePickId");

-- CreateIndex
CREATE INDEX "WavePickLine_salesOrderId_idx" ON "WavePickLine"("salesOrderId");

-- CreateIndex
CREATE INDEX "WavePickLine_inventoryItemId_idx" ON "WavePickLine"("inventoryItemId");

-- CreateIndex
CREATE INDEX "WavePickLine_status_idx" ON "WavePickLine"("status");

-- CreateIndex
CREATE INDEX "WavePickLine_assignedToId_idx" ON "WavePickLine"("assignedToId");

-- CreateIndex
CREATE INDEX "PickingTask_organizationId_warehouseId_idx" ON "PickingTask"("organizationId", "warehouseId");

-- CreateIndex
CREATE INDEX "PickingTask_taskType_idx" ON "PickingTask"("taskType");

-- CreateIndex
CREATE INDEX "PickingTask_status_idx" ON "PickingTask"("status");

-- CreateIndex
CREATE INDEX "PickingTask_assignedToId_idx" ON "PickingTask"("assignedToId");

-- CreateIndex
CREATE INDEX "PickingTask_scheduledFor_idx" ON "PickingTask"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "PickingTask_organizationId_taskNumber_key" ON "PickingTask"("organizationId", "taskNumber");

-- CreateIndex
CREATE INDEX "PickingRoute_organizationId_warehouseId_idx" ON "PickingRoute"("organizationId", "warehouseId");

-- CreateIndex
CREATE INDEX "PickingRoute_wavePickId_idx" ON "PickingRoute"("wavePickId");

-- CreateIndex
CREATE INDEX "PickingRoute_status_idx" ON "PickingRoute"("status");

-- CreateIndex
CREATE INDEX "PickingRoute_assignedToId_idx" ON "PickingRoute"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "PickingRoute_organizationId_routeNumber_key" ON "PickingRoute"("organizationId", "routeNumber");

-- CreateIndex
CREATE INDEX "TaskAutomation_organizationId_idx" ON "TaskAutomation"("organizationId");

-- CreateIndex
CREATE INDEX "TaskAutomation_triggerEvent_idx" ON "TaskAutomation"("triggerEvent");

-- CreateIndex
CREATE INDEX "TaskAutomation_isActive_idx" ON "TaskAutomation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAutomation_organizationId_code_key" ON "TaskAutomation"("organizationId", "code");

-- CreateIndex
CREATE INDEX "TaskExecution_organizationId_automationId_idx" ON "TaskExecution"("organizationId", "automationId");

-- CreateIndex
CREATE INDEX "TaskExecution_status_idx" ON "TaskExecution"("status");

-- CreateIndex
CREATE INDEX "TaskExecution_createdAt_idx" ON "TaskExecution"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaskExecution_organizationId_executionNumber_key" ON "TaskExecution"("organizationId", "executionNumber");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_alerts" ADD CONSTRAINT "reorder_alerts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_alerts" ADD CONSTRAINT "reorder_alerts_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_qcById_fkey" FOREIGN KEY ("qcById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "goods_receipt_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "purchase_order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_pickedById_fkey" FOREIGN KEY ("pickedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_packedById_fkey" FOREIGN KEY ("packedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_lists" ADD CONSTRAINT "pick_lists_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_lists" ADD CONSTRAINT "pick_lists_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_lists" ADD CONSTRAINT "pick_lists_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_lists" ADD CONSTRAINT "pick_lists_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_lists" ADD CONSTRAINT "pick_lists_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_list_items" ADD CONSTRAINT "pick_list_items_pickListId_fkey" FOREIGN KEY ("pickListId") REFERENCES "pick_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_list_items" ADD CONSTRAINT "pick_list_items_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "sales_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_list_items" ADD CONSTRAINT "pick_list_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packs" ADD CONSTRAINT "packs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packs" ADD CONSTRAINT "packs_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packs" ADD CONSTRAINT "packs_pickListId_fkey" FOREIGN KEY ("pickListId") REFERENCES "pick_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packs" ADD CONSTRAINT "packs_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packs" ADD CONSTRAINT "packs_packedById_fkey" FOREIGN KEY ("packedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packs" ADD CONSTRAINT "packs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_packId_fkey" FOREIGN KEY ("packId") REFERENCES "packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "sales_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_packId_fkey" FOREIGN KEY ("packId") REFERENCES "packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_configs" ADD CONSTRAINT "carrier_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_counts" ADD CONSTRAINT "cycle_counts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_counts" ADD CONSTRAINT "cycle_counts_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_counts" ADD CONSTRAINT "cycle_counts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_counts" ADD CONSTRAINT "cycle_counts_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_counts" ADD CONSTRAINT "cycle_counts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_cycleCountId_fkey" FOREIGN KEY ("cycleCountId") REFERENCES "cycle_counts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_countedById_fkey" FOREIGN KEY ("countedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_reconciledById_fkey" FOREIGN KEY ("reconciledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "stock_adjustments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_reasons" ADD CONSTRAINT "return_reasons_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rmas" ADD CONSTRAINT "rmas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rmas" ADD CONSTRAINT "rmas_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rmas" ADD CONSTRAINT "rmas_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rmas" ADD CONSTRAINT "rmas_returnReasonId_fkey" FOREIGN KEY ("returnReasonId") REFERENCES "return_reasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rmas" ADD CONSTRAINT "rmas_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rmas" ADD CONSTRAINT "rmas_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rma_items" ADD CONSTRAINT "rma_items_rmaId_fkey" FOREIGN KEY ("rmaId") REFERENCES "rmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rma_items" ADD CONSTRAINT "rma_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rma_items" ADD CONSTRAINT "rma_items_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "sales_order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rma_items" ADD CONSTRAINT "rma_items_restockLocationId_fkey" FOREIGN KEY ("restockLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rma_items" ADD CONSTRAINT "rma_items_restockedById_fkey" FOREIGN KEY ("restockedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rma_items" ADD CONSTRAINT "rma_items_exchangeInventoryId_fkey" FOREIGN KEY ("exchangeInventoryId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "goods_receipt_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "goods_receipt_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_movements" ADD CONSTRAINT "lot_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_movements" ADD CONSTRAINT "lot_movements_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_movements" ADD CONSTRAINT "serial_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_movements" ADD CONSTRAINT "serial_movements_serialNumberId_fkey" FOREIGN KEY ("serialNumberId") REFERENCES "serial_numbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_genealogy" ADD CONSTRAINT "lot_genealogy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_genealogy" ADD CONSTRAINT "lot_genealogy_parentLotId_fkey" FOREIGN KEY ("parentLotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_genealogy" ADD CONSTRAINT "lot_genealogy_childLotId_fkey" FOREIGN KEY ("childLotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_templates" ADD CONSTRAINT "inspection_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "inspection_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "goods_receipt_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_checkpoints" ADD CONSTRAINT "qc_checkpoints_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "qc_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_checkpoints" ADD CONSTRAINT "qc_checkpoints_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_approvals" ADD CONSTRAINT "qc_approvals_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "qc_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_approvals" ADD CONSTRAINT "qc_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills_of_materials" ADD CONSTRAINT "bills_of_materials_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills_of_materials" ADD CONSTRAINT "bills_of_materials_productId_fkey" FOREIGN KEY ("productId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills_of_materials" ADD CONSTRAINT "bills_of_materials_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_components" ADD CONSTRAINT "bom_components_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bills_of_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_components" ADD CONSTRAINT "bom_components_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_orders" ADD CONSTRAINT "assembly_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_orders" ADD CONSTRAINT "assembly_orders_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bills_of_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_orders" ADD CONSTRAINT "assembly_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_orders" ADD CONSTRAINT "assembly_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_orders" ADD CONSTRAINT "assembly_orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_orders" ADD CONSTRAINT "assembly_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_orders" ADD CONSTRAINT "assembly_orders_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_component_issues" ADD CONSTRAINT "assembly_component_issues_assemblyOrderId_fkey" FOREIGN KEY ("assemblyOrderId") REFERENCES "assembly_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_component_issues" ADD CONSTRAINT "assembly_component_issues_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_component_issues" ADD CONSTRAINT "assembly_component_issues_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_component_issues" ADD CONSTRAINT "assembly_component_issues_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_component_issues" ADD CONSTRAINT "assembly_component_issues_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_component_issues" ADD CONSTRAINT "assembly_component_issues_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_production_logs" ADD CONSTRAINT "assembly_production_logs_assemblyOrderId_fkey" FOREIGN KEY ("assemblyOrderId") REFERENCES "assembly_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_production_logs" ADD CONSTRAINT "assembly_production_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_metrics" ADD CONSTRAINT "kpi_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalIntegration" ADD CONSTRAINT "ExternalIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalIntegration" ADD CONSTRAINT "ExternalIntegration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSync" ADD CONSTRAINT "IntegrationSync_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSync" ADD CONSTRAINT "IntegrationSync_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSync" ADD CONSTRAINT "IntegrationSync_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationMapping" ADD CONSTRAINT "IntegrationMapping_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationMapping" ADD CONSTRAINT "IntegrationMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationMapping" ADD CONSTRAINT "IntegrationMapping_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_syncId_fkey" FOREIGN KEY ("syncId") REFERENCES "IntegrationSync"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhook" ADD CONSTRAINT "IntegrationWebhook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhook" ADD CONSTRAINT "IntegrationWebhook_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhook" ADD CONSTRAINT "IntegrationWebhook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePick" ADD CONSTRAINT "WavePick_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePick" ADD CONSTRAINT "WavePick_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePick" ADD CONSTRAINT "WavePick_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePick" ADD CONSTRAINT "WavePick_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePickLine" ADD CONSTRAINT "WavePickLine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePickLine" ADD CONSTRAINT "WavePickLine_wavePickId_fkey" FOREIGN KEY ("wavePickId") REFERENCES "WavePick"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePickLine" ADD CONSTRAINT "WavePickLine_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePickLine" ADD CONSTRAINT "WavePickLine_pickListId_fkey" FOREIGN KEY ("pickListId") REFERENCES "pick_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePickLine" ADD CONSTRAINT "WavePickLine_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePickLine" ADD CONSTRAINT "WavePickLine_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePickLine" ADD CONSTRAINT "WavePickLine_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePickLine" ADD CONSTRAINT "WavePickLine_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePickLine" ADD CONSTRAINT "WavePickLine_pickedById_fkey" FOREIGN KEY ("pickedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WavePickLine" ADD CONSTRAINT "WavePickLine_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingTask" ADD CONSTRAINT "PickingTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingTask" ADD CONSTRAINT "PickingTask_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingTask" ADD CONSTRAINT "PickingTask_wavePickId_fkey" FOREIGN KEY ("wavePickId") REFERENCES "WavePick"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingTask" ADD CONSTRAINT "PickingTask_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingTask" ADD CONSTRAINT "PickingTask_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingTask" ADD CONSTRAINT "PickingTask_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingTask" ADD CONSTRAINT "PickingTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingTask" ADD CONSTRAINT "PickingTask_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingTask" ADD CONSTRAINT "PickingTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingRoute" ADD CONSTRAINT "PickingRoute_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingRoute" ADD CONSTRAINT "PickingRoute_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingRoute" ADD CONSTRAINT "PickingRoute_wavePickId_fkey" FOREIGN KEY ("wavePickId") REFERENCES "WavePick"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingRoute" ADD CONSTRAINT "PickingRoute_startLocationId_fkey" FOREIGN KEY ("startLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingRoute" ADD CONSTRAINT "PickingRoute_endLocationId_fkey" FOREIGN KEY ("endLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingRoute" ADD CONSTRAINT "PickingRoute_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingRoute" ADD CONSTRAINT "PickingRoute_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAutomation" ADD CONSTRAINT "TaskAutomation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAutomation" ADD CONSTRAINT "TaskAutomation_assignToUserId_fkey" FOREIGN KEY ("assignToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAutomation" ADD CONSTRAINT "TaskAutomation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecution" ADD CONSTRAINT "TaskExecution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskExecution" ADD CONSTRAINT "TaskExecution_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "TaskAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
