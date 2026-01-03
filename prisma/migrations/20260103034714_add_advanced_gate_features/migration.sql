-- CreateEnum
CREATE TYPE "BlacklistSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'PERMANENT');

-- CreateEnum
CREATE TYPE "WhitelistType" AS ENUM ('CARRIER', 'VEHICLE', 'DRIVER');

-- CreateEnum
CREATE TYPE "GatePhotoType" AS ENUM ('DRIVER_ID', 'DRIVER_FACE', 'TRUCK_FRONT', 'TRUCK_REAR', 'TRUCK_SIDE', 'LICENSE_PLATE', 'CARGO', 'SEAL', 'DAMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "GateDocumentType" AS ENUM ('BILL_OF_LADING', 'MANIFEST', 'DELIVERY_ORDER', 'PERMIT', 'INSURANCE', 'DRIVER_LICENSE', 'VEHICLE_REGISTRATION', 'CUSTOMS_DOCS', 'HAZMAT_PERMIT', 'OTHER');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'CALLED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GateType" AS ENUM ('INBOUND', 'OUTBOUND', 'BOTH', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "GateStatus" AS ENUM ('OPEN', 'CLOSED', 'MAINTENANCE', 'EMERGENCY_CLOSED');

-- CreateEnum
CREATE TYPE "ParkingSpotType" AS ENUM ('STANDARD', 'OVERSIZED', 'REFRIGERATED', 'HAZMAT', 'STAGING', 'LOADING');

-- CreateEnum
CREATE TYPE "ParkingStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TempUnit" AS ENUM ('CELSIUS', 'FAHRENHEIT');

-- CreateTable
CREATE TABLE "vehicle_blacklist" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "vehicleNumber" TEXT,
    "carrierName" TEXT,
    "driverName" TEXT,
    "reason" TEXT NOT NULL,
    "severity" "BlacklistSeverity" NOT NULL DEFAULT 'MEDIUM',
    "bannedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bannedUntil" TIMESTAMP(3),
    "bannedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "vehicle_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_whitelist" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "licensePlate" TEXT,
    "carrierName" TEXT,
    "whitelistType" "WhitelistType" NOT NULL DEFAULT 'CARRIER',
    "autoApprove" BOOLEAN NOT NULL DEFAULT true,
    "skipInspection" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "vehicle_whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_weigh_bridges" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "gateEntryId" TEXT NOT NULL,
    "direction" "EntryDirection" NOT NULL,
    "weight" DECIMAL(10,2) NOT NULL,
    "weightUnit" TEXT NOT NULL DEFAULT 'KG',
    "bridgeId" TEXT NOT NULL,
    "bridgeName" TEXT,
    "weighTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" TEXT,
    "operatorName" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "verificationNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_weigh_bridges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_photos" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "gateEntryId" TEXT NOT NULL,
    "photoType" "GatePhotoType" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedBy" TEXT,
    "cameraId" TEXT,
    "aiAnalysis" JSONB,

    CONSTRAINT "gate_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "gateEntryId" TEXT NOT NULL,
    "documentType" "GateDocumentType" NOT NULL,
    "documentNumber" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,

    CONSTRAINT "gate_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_queue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "carrierName" TEXT,
    "vehicleType" "VehicleType",
    "position" INTEGER NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedWaitMinutes" INTEGER,
    "gateId" TEXT,
    "calledForward" BOOLEAN NOT NULL DEFAULT false,
    "calledAt" TIMESTAMP(3),
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "processedAt" TIMESTAMP(3),
    "gateEntryId" TEXT,

    CONSTRAINT "gate_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "gateName" TEXT NOT NULL,
    "gateNumber" TEXT NOT NULL,
    "gateType" "GateType" NOT NULL DEFAULT 'BOTH',
    "warehouseId" TEXT,
    "location" TEXT,
    "hasLPR" BOOLEAN NOT NULL DEFAULT false,
    "hasWeighBridge" BOOLEAN NOT NULL DEFAULT false,
    "hasBarrier" BOOLEAN NOT NULL DEFAULT true,
    "status" "GateStatus" NOT NULL DEFAULT 'OPEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentQueue" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3),
    "assignedGuards" JSONB,

    CONSTRAINT "gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_spots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "spotNumber" TEXT NOT NULL,
    "spotName" TEXT,
    "zone" TEXT,
    "spotType" "ParkingSpotType" NOT NULL DEFAULT 'STANDARD',
    "maxLength" INTEGER,
    "maxWeight" INTEGER,
    "refrigerated" BOOLEAN NOT NULL DEFAULT false,
    "covered" BOOLEAN NOT NULL DEFAULT false,
    "hazmatApproved" BOOLEAN NOT NULL DEFAULT false,
    "status" "ParkingStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentVehicle" TEXT,
    "occupiedSince" TIMESTAMP(3),
    "gateEntryId" TEXT,
    "mapCoordinates" JSONB,

    CONSTRAINT "parking_spots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temperature_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "gateEntryId" TEXT NOT NULL,
    "temperature" DECIMAL(5,2) NOT NULL,
    "unit" "TempUnit" NOT NULL DEFAULT 'CELSIUS',
    "location" TEXT NOT NULL,
    "sensorId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "outOfRange" BOOLEAN NOT NULL DEFAULT false,
    "minThreshold" DECIMAL(5,2),
    "maxThreshold" DECIMAL(5,2),

    CONSTRAINT "temperature_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hazmat_records" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "gateEntryId" TEXT NOT NULL,
    "hazmatClass" TEXT NOT NULL,
    "unNumber" TEXT NOT NULL,
    "properShippingName" TEXT NOT NULL,
    "permitNumber" TEXT,
    "permitExpiry" TIMESTAMP(3),
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT NOT NULL,
    "spillProcedure" TEXT,
    "specialParkingZone" TEXT,
    "specialInstructions" TEXT,
    "segregationRequired" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "hazmat_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_blacklist_organizationId_idx" ON "vehicle_blacklist"("organizationId");

-- CreateIndex
CREATE INDEX "vehicle_blacklist_licensePlate_idx" ON "vehicle_blacklist"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicle_blacklist_isActive_idx" ON "vehicle_blacklist"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_blacklist_organizationId_licensePlate_key" ON "vehicle_blacklist"("organizationId", "licensePlate");

-- CreateIndex
CREATE INDEX "vehicle_whitelist_organizationId_idx" ON "vehicle_whitelist"("organizationId");

-- CreateIndex
CREATE INDEX "vehicle_whitelist_licensePlate_idx" ON "vehicle_whitelist"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicle_whitelist_carrierName_idx" ON "vehicle_whitelist"("carrierName");

-- CreateIndex
CREATE INDEX "vehicle_whitelist_isActive_idx" ON "vehicle_whitelist"("isActive");

-- CreateIndex
CREATE INDEX "gate_weigh_bridges_organizationId_idx" ON "gate_weigh_bridges"("organizationId");

-- CreateIndex
CREATE INDEX "gate_weigh_bridges_gateEntryId_idx" ON "gate_weigh_bridges"("gateEntryId");

-- CreateIndex
CREATE INDEX "gate_weigh_bridges_direction_idx" ON "gate_weigh_bridges"("direction");

-- CreateIndex
CREATE INDEX "gate_photos_organizationId_idx" ON "gate_photos"("organizationId");

-- CreateIndex
CREATE INDEX "gate_photos_gateEntryId_idx" ON "gate_photos"("gateEntryId");

-- CreateIndex
CREATE INDEX "gate_photos_photoType_idx" ON "gate_photos"("photoType");

-- CreateIndex
CREATE INDEX "gate_documents_organizationId_idx" ON "gate_documents"("organizationId");

-- CreateIndex
CREATE INDEX "gate_documents_gateEntryId_idx" ON "gate_documents"("gateEntryId");

-- CreateIndex
CREATE INDEX "gate_documents_documentType_idx" ON "gate_documents"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "gate_queue_gateEntryId_key" ON "gate_queue"("gateEntryId");

-- CreateIndex
CREATE INDEX "gate_queue_organizationId_idx" ON "gate_queue"("organizationId");

-- CreateIndex
CREATE INDEX "gate_queue_status_idx" ON "gate_queue"("status");

-- CreateIndex
CREATE INDEX "gate_queue_position_idx" ON "gate_queue"("position");

-- CreateIndex
CREATE INDEX "gates_organizationId_idx" ON "gates"("organizationId");

-- CreateIndex
CREATE INDEX "gates_status_idx" ON "gates"("status");

-- CreateIndex
CREATE UNIQUE INDEX "gates_organizationId_gateNumber_key" ON "gates"("organizationId", "gateNumber");

-- CreateIndex
CREATE INDEX "parking_spots_organizationId_idx" ON "parking_spots"("organizationId");

-- CreateIndex
CREATE INDEX "parking_spots_status_idx" ON "parking_spots"("status");

-- CreateIndex
CREATE INDEX "parking_spots_zone_idx" ON "parking_spots"("zone");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spots_organizationId_spotNumber_key" ON "parking_spots"("organizationId", "spotNumber");

-- CreateIndex
CREATE INDEX "temperature_logs_organizationId_idx" ON "temperature_logs"("organizationId");

-- CreateIndex
CREATE INDEX "temperature_logs_gateEntryId_idx" ON "temperature_logs"("gateEntryId");

-- CreateIndex
CREATE INDEX "temperature_logs_recordedAt_idx" ON "temperature_logs"("recordedAt");

-- CreateIndex
CREATE INDEX "hazmat_records_organizationId_idx" ON "hazmat_records"("organizationId");

-- CreateIndex
CREATE INDEX "hazmat_records_gateEntryId_idx" ON "hazmat_records"("gateEntryId");

-- CreateIndex
CREATE INDEX "hazmat_records_hazmatClass_idx" ON "hazmat_records"("hazmatClass");

-- AddForeignKey
ALTER TABLE "vehicle_blacklist" ADD CONSTRAINT "vehicle_blacklist_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_whitelist" ADD CONSTRAINT "vehicle_whitelist_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_weigh_bridges" ADD CONSTRAINT "gate_weigh_bridges_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_weigh_bridges" ADD CONSTRAINT "gate_weigh_bridges_gateEntryId_fkey" FOREIGN KEY ("gateEntryId") REFERENCES "gate_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_photos" ADD CONSTRAINT "gate_photos_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_photos" ADD CONSTRAINT "gate_photos_gateEntryId_fkey" FOREIGN KEY ("gateEntryId") REFERENCES "gate_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_documents" ADD CONSTRAINT "gate_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_documents" ADD CONSTRAINT "gate_documents_gateEntryId_fkey" FOREIGN KEY ("gateEntryId") REFERENCES "gate_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_queue" ADD CONSTRAINT "gate_queue_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "gates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_queue" ADD CONSTRAINT "gate_queue_gateEntryId_fkey" FOREIGN KEY ("gateEntryId") REFERENCES "gate_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_queue" ADD CONSTRAINT "gate_queue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gates" ADD CONSTRAINT "gates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_gateEntryId_fkey" FOREIGN KEY ("gateEntryId") REFERENCES "gate_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hazmat_records" ADD CONSTRAINT "hazmat_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hazmat_records" ADD CONSTRAINT "hazmat_records_gateEntryId_fkey" FOREIGN KEY ("gateEntryId") REFERENCES "gate_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
