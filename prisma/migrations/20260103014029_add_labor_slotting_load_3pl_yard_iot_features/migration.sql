-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'SEASONAL');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('DAY', 'EVENING', 'NIGHT', 'ROTATING', 'SPLIT', 'ON_CALL');

-- CreateEnum
CREATE TYPE "ShiftAssignmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TimeEntryType" AS ENUM ('CLOCK_IN_OUT', 'MANUAL_ENTRY', 'ADJUSTED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "SlottingStrategy" AS ENUM ('ABC_ANALYSIS', 'VELOCITY_BASED', 'SIZE_BASED', 'FAMILY_GROUPING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LoadOptimizationGoal" AS ENUM ('MAXIMIZE_UTILIZATION', 'MINIMIZE_STOPS', 'MINIMIZE_COST', 'MINIMIZE_TIME', 'BALANCE_LOAD');

-- CreateEnum
CREATE TYPE "LoadPlanStatus" AS ENUM ('DRAFT', 'OPTIMIZING', 'OPTIMIZED', 'APPROVED', 'IN_PROGRESS', 'LOADED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryRouteStatus" AS ENUM ('PLANNED', 'OPTIMIZED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED');

-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('PICKUP', 'DELIVERY', 'BOTH');

-- CreateEnum
CREATE TYPE "StopDeliveryStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'FAILED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ONBOARDING', 'OFFBOARDING');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ON_DEMAND');

-- CreateEnum
CREATE TYPE "BillingTransactionType" AS ENUM ('STORAGE', 'INBOUND_HANDLING', 'OUTBOUND_HANDLING', 'ORDER_PROCESSING', 'VALUE_ADDED_SERVICE', 'LABOR', 'TRANSPORTATION', 'EQUIPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'INVOICED', 'PAID', 'DISPUTED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "YardLocationType" AS ENUM ('LOADING_DOCK', 'UNLOADING_DOCK', 'STAGING_AREA', 'PARKING_SPOT', 'MAINTENANCE_BAY', 'HOLDING_AREA');

-- CreateEnum
CREATE TYPE "DockAppointmentType" AS ENUM ('INBOUND', 'OUTBOUND', 'CROSS_DOCK', 'MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'DELAYED');

-- CreateEnum
CREATE TYPE "IoTDeviceType" AS ENUM ('BARCODE_SCANNER', 'RFID_READER', 'TEMPERATURE_SENSOR', 'HUMIDITY_SENSOR', 'WEIGHT_SCALE', 'FORKLIFT_TRACKER', 'DOOR_SENSOR', 'MOTION_DETECTOR', 'CAMERA', 'GPS_TRACKER', 'OTHER');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR', 'LOW_BATTERY');

-- CreateEnum
CREATE TYPE "IoTAlertType" AS ENUM ('TEMPERATURE_THRESHOLD', 'HUMIDITY_THRESHOLD', 'DEVICE_OFFLINE', 'LOW_BATTERY', 'SENSOR_ERROR', 'UNAUTHORIZED_ACCESS', 'GEOFENCE_BREACH', 'CUSTOM');

-- AlterTable
ALTER TABLE "PickingTask" ADD COLUMN     "employeeId" TEXT;

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3) NOT NULL,
    "terminationDate" TIMESTAMP(3),
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "department" TEXT,
    "position" TEXT,
    "hourlyRate" DECIMAL(10,2),
    "warehouseId" TEXT,
    "defaultZoneId" TEXT,
    "skills" JSONB,
    "certifications" JSONB,
    "preferredShiftType" "ShiftType",
    "maxHoursPerWeek" DOUBLE PRECISION DEFAULT 40,
    "notes" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shiftCode" TEXT NOT NULL,
    "shiftName" TEXT NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "warehouseId" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "breakDuration" DOUBLE PRECISION DEFAULT 0,
    "daysOfWeek" JSONB NOT NULL,
    "maxEmployees" INTEGER,
    "minEmployees" INTEGER,
    "overtimeAfter" DOUBLE PRECISION DEFAULT 8,
    "payMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_assignments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "status" "ShiftAssignmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "actualHours" DOUBLE PRECISION,
    "overtimeHours" DOUBLE PRECISION,
    "tasksCompleted" INTEGER,
    "linesProcessed" INTEGER,
    "accuracy" DOUBLE PRECISION,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "breakDuration" DOUBLE PRECISION DEFAULT 0,
    "entryType" "TimeEntryType" NOT NULL,
    "category" TEXT,
    "warehouseId" TEXT,
    "zoneId" TEXT,
    "taskType" TEXT,
    "status" "TimeEntryStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "hourlyRate" DECIMAL(10,2),
    "payMultiplier" DOUBLE PRECISION DEFAULT 1.0,
    "totalPay" DECIMAL(10,2),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productivity_records" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "shiftId" TEXT,
    "tasksAssigned" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "linesProcessed" INTEGER NOT NULL DEFAULT 0,
    "unitsPicked" INTEGER NOT NULL DEFAULT 0,
    "unitsPacked" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION,
    "errorRate" DOUBLE PRECISION,
    "shortPicks" INTEGER NOT NULL DEFAULT 0,
    "damagedUnits" INTEGER NOT NULL DEFAULT 0,
    "hoursWorked" DOUBLE PRECISION,
    "unitsPerHour" DOUBLE PRECISION,
    "linesPerHour" DOUBLE PRECISION,
    "utilization" DOUBLE PRECISION,
    "performanceScore" DOUBLE PRECISION,
    "ranking" INTEGER,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productivity_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slotting_rules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "ruleName" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "criteria" JSONB NOT NULL,
    "targetZoneType" TEXT,
    "targetLevel" TEXT,
    "maxDistance" DOUBLE PRECISION,
    "strategy" "SlottingStrategy" NOT NULL,
    "minPickFrequency" INTEGER,
    "maxPickFrequency" INTEGER,
    "minVelocity" DOUBLE PRECISION,
    "maxVelocity" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "slotting_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slotting_recommendations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ruleId" TEXT,
    "itemId" TEXT NOT NULL,
    "currentLocationId" TEXT,
    "recommendedLocationId" TEXT NOT NULL,
    "currentPickFrequency" INTEGER,
    "currentTravelDistance" DOUBLE PRECISION,
    "projectedPickFrequency" INTEGER,
    "projectedTravelDistance" DOUBLE PRECISION,
    "estimatedTimeSaving" DOUBLE PRECISION,
    "estimatedCostSaving" DECIMAL(10,2),
    "priorityScore" DOUBLE PRECISION,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "implementedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slotting_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planNumber" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "shipmentDate" TIMESTAMP(3) NOT NULL,
    "warehouseId" TEXT,
    "vehicleType" TEXT,
    "maxWeight" DOUBLE PRECISION,
    "maxVolume" DOUBLE PRECISION,
    "maxPallets" INTEGER,
    "optimizationGoal" "LoadOptimizationGoal" NOT NULL DEFAULT 'MAXIMIZE_UTILIZATION',
    "algorithm" TEXT,
    "totalWeight" DOUBLE PRECISION,
    "totalVolume" DOUBLE PRECISION,
    "totalPallets" INTEGER,
    "utilization" DOUBLE PRECISION,
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "status" "LoadPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "loadedBy" TEXT,
    "loadedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "load_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_plan_items" (
    "id" TEXT NOT NULL,
    "loadPlanId" TEXT NOT NULL,
    "salesOrderId" TEXT,
    "shipmentId" TEXT,
    "packId" TEXT,
    "itemSKU" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "palletNumber" INTEGER,
    "loadSequence" INTEGER,
    "stackPosition" INTEGER,
    "isFragile" BOOLEAN NOT NULL DEFAULT false,
    "requiresCooling" BOOLEAN NOT NULL DEFAULT false,
    "stackLimit" INTEGER,
    "isLoaded" BOOLEAN NOT NULL DEFAULT false,
    "loadedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "load_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_routes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "routeNumber" TEXT NOT NULL,
    "loadPlanId" TEXT,
    "routeName" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "warehouseId" TEXT,
    "vehicleId" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "optimizationMethod" "OptimizationMethod" NOT NULL DEFAULT 'SHORTEST_PATH',
    "totalDistance" DOUBLE PRECISION,
    "estimatedDuration" DOUBLE PRECISION,
    "status" "DeliveryRouteStatus" NOT NULL DEFAULT 'PLANNED',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "actualDistance" DOUBLE PRECISION,
    "actualDuration" DOUBLE PRECISION,
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "fuelCost" DECIMAL(10,2),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "delivery_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_stops" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopSequence" INTEGER NOT NULL,
    "stopType" "StopType" NOT NULL DEFAULT 'DELIVERY',
    "customerName" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "scheduledArrival" TIMESTAMP(3),
    "scheduledDeparture" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "actualDeparture" TIMESTAMP(3),
    "serviceTime" DOUBLE PRECISION,
    "salesOrderIds" JSONB,
    "deliveryStatus" "StopDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "signedBy" TEXT,
    "signedAt" TIMESTAMP(3),
    "signatureImage" TEXT,
    "proofOfDelivery" TEXT,
    "instructions" TEXT,
    "specialRequirements" JSONB,
    "distanceFromPrevious" DOUBLE PRECISION,
    "travelTime" DOUBLE PRECISION,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientCode" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT,
    "primaryContact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "onboardingDate" TIMESTAMP(3) NOT NULL,
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "slaTarget" DOUBLE PRECISION,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_rate_cards" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "rateCardName" TEXT NOT NULL,
    "rateCardCode" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "storageRates" JSONB,
    "handlingRates" JSONB,
    "orderRates" JSONB,
    "valueAddedServices" JSONB,
    "minimumMonthly" DECIMAL(10,2),
    "minimumTransaction" DECIMAL(10,2),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "billing_rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_transactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "transactionType" "BillingTransactionType" NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitRate" DECIMAL(10,4) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "referenceNumber" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "invoiceId" TEXT,
    "billingStatus" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_invoices" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentMethod" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paymentRef" TEXT,
    "invoicePDF" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "client_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yard_locations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "locationCode" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "locationType" "YardLocationType" NOT NULL,
    "capacity" INTEGER,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yard_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dock_appointments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "appointmentNumber" TEXT NOT NULL,
    "appointmentType" "DockAppointmentType" NOT NULL,
    "warehouseId" TEXT,
    "yardLocationId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "actualArrival" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "actualDuration" DOUBLE PRECISION,
    "carrierName" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehicleNumber" TEXT,
    "trailerNumber" TEXT,
    "sealNumber" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "referenceNumber" TEXT,
    "expectedPallets" INTEGER,
    "actualPallets" INTEGER,
    "expectedWeight" DOUBLE PRECISION,
    "actualWeight" DOUBLE PRECISION,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "checkedInBy" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutBy" TEXT,
    "checkedOutAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "specialInstructions" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "dock_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_devices" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" "IoTDeviceType" NOT NULL,
    "manufacturer" TEXT,
    "modelNumber" TEXT,
    "serialNumber" TEXT,
    "warehouseId" TEXT,
    "locationId" TEXT,
    "zoneId" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'OFFLINE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "firmwareVersion" TEXT,
    "lastHeartbeat" TIMESTAMP(3),
    "configuration" JSONB,
    "thresholds" JSONB,
    "batteryLevel" DOUBLE PRECISION,
    "isCharging" BOOLEAN,
    "notes" TEXT,
    "metadata" JSONB,
    "installedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "iot_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_sensor_readings" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "readingType" TEXT NOT NULL,
    "readingValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseId" TEXT,
    "locationId" TEXT,
    "inventoryId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "iot_sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_alerts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "alertType" "IoTAlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "readingType" TEXT,
    "readingValue" DOUBLE PRECISION,
    "thresholdValue" DOUBLE PRECISION,
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iot_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_organizationId_idx" ON "employees"("organizationId");

-- CreateIndex
CREATE INDEX "employees_userId_idx" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_warehouseId_idx" ON "employees"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organizationId_employeeNumber_key" ON "employees"("organizationId", "employeeNumber");

-- CreateIndex
CREATE INDEX "shifts_organizationId_idx" ON "shifts"("organizationId");

-- CreateIndex
CREATE INDEX "shifts_warehouseId_idx" ON "shifts"("warehouseId");

-- CreateIndex
CREATE INDEX "shifts_shiftType_idx" ON "shifts"("shiftType");

-- CreateIndex
CREATE INDEX "shifts_effectiveFrom_effectiveTo_idx" ON "shifts"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_organizationId_shiftCode_key" ON "shifts"("organizationId", "shiftCode");

-- CreateIndex
CREATE INDEX "shift_assignments_organizationId_idx" ON "shift_assignments"("organizationId");

-- CreateIndex
CREATE INDEX "shift_assignments_employeeId_idx" ON "shift_assignments"("employeeId");

-- CreateIndex
CREATE INDEX "shift_assignments_shiftId_idx" ON "shift_assignments"("shiftId");

-- CreateIndex
CREATE INDEX "shift_assignments_assignedDate_idx" ON "shift_assignments"("assignedDate");

-- CreateIndex
CREATE INDEX "shift_assignments_status_idx" ON "shift_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "shift_assignments_employeeId_shiftId_assignedDate_key" ON "shift_assignments"("employeeId", "shiftId", "assignedDate");

-- CreateIndex
CREATE INDEX "time_entries_organizationId_idx" ON "time_entries"("organizationId");

-- CreateIndex
CREATE INDEX "time_entries_employeeId_idx" ON "time_entries"("employeeId");

-- CreateIndex
CREATE INDEX "time_entries_startTime_idx" ON "time_entries"("startTime");

-- CreateIndex
CREATE INDEX "time_entries_status_idx" ON "time_entries"("status");

-- CreateIndex
CREATE INDEX "time_entries_entryType_idx" ON "time_entries"("entryType");

-- CreateIndex
CREATE INDEX "productivity_records_organizationId_idx" ON "productivity_records"("organizationId");

-- CreateIndex
CREATE INDEX "productivity_records_employeeId_idx" ON "productivity_records"("employeeId");

-- CreateIndex
CREATE INDEX "productivity_records_recordDate_idx" ON "productivity_records"("recordDate");

-- CreateIndex
CREATE INDEX "productivity_records_performanceScore_idx" ON "productivity_records"("performanceScore");

-- CreateIndex
CREATE UNIQUE INDEX "productivity_records_employeeId_recordDate_key" ON "productivity_records"("employeeId", "recordDate");

-- CreateIndex
CREATE INDEX "slotting_rules_organizationId_idx" ON "slotting_rules"("organizationId");

-- CreateIndex
CREATE INDEX "slotting_rules_warehouseId_idx" ON "slotting_rules"("warehouseId");

-- CreateIndex
CREATE INDEX "slotting_rules_priority_idx" ON "slotting_rules"("priority");

-- CreateIndex
CREATE INDEX "slotting_rules_isActive_idx" ON "slotting_rules"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "slotting_rules_organizationId_ruleCode_key" ON "slotting_rules"("organizationId", "ruleCode");

-- CreateIndex
CREATE INDEX "slotting_recommendations_organizationId_idx" ON "slotting_recommendations"("organizationId");

-- CreateIndex
CREATE INDEX "slotting_recommendations_ruleId_idx" ON "slotting_recommendations"("ruleId");

-- CreateIndex
CREATE INDEX "slotting_recommendations_itemId_idx" ON "slotting_recommendations"("itemId");

-- CreateIndex
CREATE INDEX "slotting_recommendations_status_idx" ON "slotting_recommendations"("status");

-- CreateIndex
CREATE INDEX "slotting_recommendations_priorityScore_idx" ON "slotting_recommendations"("priorityScore");

-- CreateIndex
CREATE INDEX "load_plans_organizationId_idx" ON "load_plans"("organizationId");

-- CreateIndex
CREATE INDEX "load_plans_shipmentDate_idx" ON "load_plans"("shipmentDate");

-- CreateIndex
CREATE INDEX "load_plans_status_idx" ON "load_plans"("status");

-- CreateIndex
CREATE INDEX "load_plans_warehouseId_idx" ON "load_plans"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "load_plans_organizationId_planNumber_key" ON "load_plans"("organizationId", "planNumber");

-- CreateIndex
CREATE INDEX "load_plan_items_loadPlanId_idx" ON "load_plan_items"("loadPlanId");

-- CreateIndex
CREATE INDEX "load_plan_items_salesOrderId_idx" ON "load_plan_items"("salesOrderId");

-- CreateIndex
CREATE INDEX "load_plan_items_shipmentId_idx" ON "load_plan_items"("shipmentId");

-- CreateIndex
CREATE INDEX "load_plan_items_palletNumber_idx" ON "load_plan_items"("palletNumber");

-- CreateIndex
CREATE INDEX "delivery_routes_organizationId_idx" ON "delivery_routes"("organizationId");

-- CreateIndex
CREATE INDEX "delivery_routes_loadPlanId_idx" ON "delivery_routes"("loadPlanId");

-- CreateIndex
CREATE INDEX "delivery_routes_deliveryDate_idx" ON "delivery_routes"("deliveryDate");

-- CreateIndex
CREATE INDEX "delivery_routes_status_idx" ON "delivery_routes"("status");

-- CreateIndex
CREATE INDEX "delivery_routes_warehouseId_idx" ON "delivery_routes"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_routes_organizationId_routeNumber_key" ON "delivery_routes"("organizationId", "routeNumber");

-- CreateIndex
CREATE INDEX "delivery_stops_routeId_idx" ON "delivery_stops"("routeId");

-- CreateIndex
CREATE INDEX "delivery_stops_stopSequence_idx" ON "delivery_stops"("stopSequence");

-- CreateIndex
CREATE INDEX "delivery_stops_deliveryStatus_idx" ON "delivery_stops"("deliveryStatus");

-- CreateIndex
CREATE INDEX "clients_organizationId_idx" ON "clients"("organizationId");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE UNIQUE INDEX "clients_organizationId_clientCode_key" ON "clients"("organizationId", "clientCode");

-- CreateIndex
CREATE INDEX "billing_rate_cards_organizationId_idx" ON "billing_rate_cards"("organizationId");

-- CreateIndex
CREATE INDEX "billing_rate_cards_clientId_idx" ON "billing_rate_cards"("clientId");

-- CreateIndex
CREATE INDEX "billing_rate_cards_effectiveFrom_effectiveTo_idx" ON "billing_rate_cards"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "billing_rate_cards_isActive_idx" ON "billing_rate_cards"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "billing_rate_cards_organizationId_rateCardCode_key" ON "billing_rate_cards"("organizationId", "rateCardCode");

-- CreateIndex
CREATE INDEX "billing_transactions_organizationId_idx" ON "billing_transactions"("organizationId");

-- CreateIndex
CREATE INDEX "billing_transactions_clientId_idx" ON "billing_transactions"("clientId");

-- CreateIndex
CREATE INDEX "billing_transactions_invoiceId_idx" ON "billing_transactions"("invoiceId");

-- CreateIndex
CREATE INDEX "billing_transactions_transactionDate_idx" ON "billing_transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "billing_transactions_billingStatus_idx" ON "billing_transactions"("billingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "billing_transactions_organizationId_transactionNumber_key" ON "billing_transactions"("organizationId", "transactionNumber");

-- CreateIndex
CREATE INDEX "client_invoices_organizationId_idx" ON "client_invoices"("organizationId");

-- CreateIndex
CREATE INDEX "client_invoices_clientId_idx" ON "client_invoices"("clientId");

-- CreateIndex
CREATE INDEX "client_invoices_invoiceDate_idx" ON "client_invoices"("invoiceDate");

-- CreateIndex
CREATE INDEX "client_invoices_dueDate_idx" ON "client_invoices"("dueDate");

-- CreateIndex
CREATE INDEX "client_invoices_status_idx" ON "client_invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "client_invoices_organizationId_invoiceNumber_key" ON "client_invoices"("organizationId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "yard_locations_organizationId_idx" ON "yard_locations"("organizationId");

-- CreateIndex
CREATE INDEX "yard_locations_warehouseId_idx" ON "yard_locations"("warehouseId");

-- CreateIndex
CREATE INDEX "yard_locations_locationType_idx" ON "yard_locations"("locationType");

-- CreateIndex
CREATE INDEX "yard_locations_isActive_isOccupied_idx" ON "yard_locations"("isActive", "isOccupied");

-- CreateIndex
CREATE UNIQUE INDEX "yard_locations_organizationId_locationCode_key" ON "yard_locations"("organizationId", "locationCode");

-- CreateIndex
CREATE INDEX "dock_appointments_organizationId_idx" ON "dock_appointments"("organizationId");

-- CreateIndex
CREATE INDEX "dock_appointments_yardLocationId_idx" ON "dock_appointments"("yardLocationId");

-- CreateIndex
CREATE INDEX "dock_appointments_scheduledDate_idx" ON "dock_appointments"("scheduledDate");

-- CreateIndex
CREATE INDEX "dock_appointments_status_idx" ON "dock_appointments"("status");

-- CreateIndex
CREATE INDEX "dock_appointments_carrierName_idx" ON "dock_appointments"("carrierName");

-- CreateIndex
CREATE UNIQUE INDEX "dock_appointments_organizationId_appointmentNumber_key" ON "dock_appointments"("organizationId", "appointmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "iot_devices_deviceId_key" ON "iot_devices"("deviceId");

-- CreateIndex
CREATE INDEX "iot_devices_organizationId_idx" ON "iot_devices"("organizationId");

-- CreateIndex
CREATE INDEX "iot_devices_deviceType_idx" ON "iot_devices"("deviceType");

-- CreateIndex
CREATE INDEX "iot_devices_status_idx" ON "iot_devices"("status");

-- CreateIndex
CREATE INDEX "iot_devices_warehouseId_idx" ON "iot_devices"("warehouseId");

-- CreateIndex
CREATE INDEX "iot_sensor_readings_deviceId_idx" ON "iot_sensor_readings"("deviceId");

-- CreateIndex
CREATE INDEX "iot_sensor_readings_timestamp_idx" ON "iot_sensor_readings"("timestamp");

-- CreateIndex
CREATE INDEX "iot_sensor_readings_readingType_idx" ON "iot_sensor_readings"("readingType");

-- CreateIndex
CREATE INDEX "iot_alerts_organizationId_idx" ON "iot_alerts"("organizationId");

-- CreateIndex
CREATE INDEX "iot_alerts_deviceId_idx" ON "iot_alerts"("deviceId");

-- CreateIndex
CREATE INDEX "iot_alerts_status_idx" ON "iot_alerts"("status");

-- CreateIndex
CREATE INDEX "iot_alerts_severity_idx" ON "iot_alerts"("severity");

-- CreateIndex
CREATE INDEX "iot_alerts_createdAt_idx" ON "iot_alerts"("createdAt");

-- AddForeignKey
ALTER TABLE "PickingTask" ADD CONSTRAINT "PickingTask_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productivity_records" ADD CONSTRAINT "productivity_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productivity_records" ADD CONSTRAINT "productivity_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slotting_rules" ADD CONSTRAINT "slotting_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slotting_recommendations" ADD CONSTRAINT "slotting_recommendations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slotting_recommendations" ADD CONSTRAINT "slotting_recommendations_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "slotting_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slotting_recommendations" ADD CONSTRAINT "slotting_recommendations_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_plans" ADD CONSTRAINT "load_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_plan_items" ADD CONSTRAINT "load_plan_items_loadPlanId_fkey" FOREIGN KEY ("loadPlanId") REFERENCES "load_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_plan_items" ADD CONSTRAINT "load_plan_items_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_plan_items" ADD CONSTRAINT "load_plan_items_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_loadPlanId_fkey" FOREIGN KEY ("loadPlanId") REFERENCES "load_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_stops" ADD CONSTRAINT "delivery_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "delivery_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_rate_cards" ADD CONSTRAINT "billing_rate_cards_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_rate_cards" ADD CONSTRAINT "billing_rate_cards_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "client_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_invoices" ADD CONSTRAINT "client_invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_invoices" ADD CONSTRAINT "client_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_locations" ADD CONSTRAINT "yard_locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dock_appointments" ADD CONSTRAINT "dock_appointments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dock_appointments" ADD CONSTRAINT "dock_appointments_yardLocationId_fkey" FOREIGN KEY ("yardLocationId") REFERENCES "yard_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_sensor_readings" ADD CONSTRAINT "iot_sensor_readings_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "iot_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_alerts" ADD CONSTRAINT "iot_alerts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iot_alerts" ADD CONSTRAINT "iot_alerts_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "iot_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
