/**
 * Vehicle Fleet Types
 *
 * Type definitions for vehicle fleet management, transport operations,
 * and customer vehicle visibility.
 */

// ============================================================================
// VEHICLE TYPES
// ============================================================================

export type VehicleCategory =
  | "ARTIC_TRAILER" // Articulated lorry
  | "RIGID_TRUCK" // Rigid box truck
  | "BOX_TRUCK" // 7.5T and similar
  | "LUTON_VAN" // Large box van
  | "VAN" // Panel vans
  | "SPRINTER" // Mercedes Sprinter type
  | "TRANSIT" // Ford Transit type
  | "REEFER" // Refrigerated
  | "FLATBED" // Open flatbed
  | "CURTAIN_SIDE" // Curtain sider
  | "PICKUP" // Pick-up truck
  | "ELECTRIC" // Electric vehicles
  | "SPECIALITY"; // Special purpose

export type VehicleStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "LOADING"
  | "UNLOADING"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE"
  | "RETIRED";

export type FuelType =
  | "DIESEL"
  | "PETROL"
  | "ELECTRIC"
  | "HYBRID"
  | "LPG"
  | "CNG";

export type LicenseClass =
  | "CAR_LICENSE" // UK: Category B (can drive 7.5T with old license)
  | "CLASS_2" // UK: Category C (Rigid trucks up to 32T)
  | "CLASS_1" // UK: Category C+E (Articulated)
  | "CLASS_1_HAZMAT"; // Class 1 + Hazmat certification

// ============================================================================
// VEHICLE INTERFACE
// ============================================================================

export interface Vehicle {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Basic info
  name: string;
  registrationNumber: string; // UK: Registration plate
  vehicleType: string; // ARTIC_53, RIGID_7.5T, LWB_VAN, etc.
  category: VehicleCategory;

  // Specifications
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  maxWeightLbs: number;
  volumeCubicFeet: number;
  palletCapacity: number;

  // Features
  hasLiftGate: boolean;
  hasTemperatureControl: boolean;
  tempRangeMin?: number; // Fahrenheit
  tempRangeMax?: number;
  hasSideLoading: boolean;
  hasRearLoading: boolean;

  // Licensing & Compliance
  requiresLicense: LicenseClass;
  tollClass: string; // Toll road classification
  emissionClass?: string; // EURO 6, etc.
  congestionChargeExempt: boolean;

  // Fuel & Operating
  fuelType: FuelType;
  tankCapacityLiters?: number;
  typicalMPG?: number;
  typicalRange?: number; // Miles (for electric)
  costPerMile: number;

  // Status
  status: VehicleStatus;
  isActive: boolean;
  customerVisible: boolean; // Show to customers?

  // Ownership
  ownedOrLeased: "OWNED" | "LEASED" | "CONTRACTED";
  leaseExpiry?: Date;

  // Assignment
  assignedWarehouseId?: string;
  assignedWarehouse?: any;
  currentDriverId?: string;
  currentDriver?: any;
  currentLocationId?: string;
  currentLocation?: VehicleLocation;

  // Insurance & Compliance
  insuranceExpiry: Date;
  motExpiry: Date; // MOT test (UK)
  roadTaxExpiry: Date;
  tachoCalibration?: Date; // Tachograph calibration

  // Maintenance
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  serviceMileageInterval?: number;
  currentMileage: number;

  // Tracking
  hasGPSTracker: boolean;
  trackerIMEI?: string;
  lastSeenAt?: Date;

  // Assignments
  assignments?: VehicleAssignment[];
  maintenanceSchedule?: MaintenanceSchedule[];

  // Documents
  documents?: VehicleDocument[];

  // Notes
  notes?: string;

  // Metadata
  tenantId: string;
}

// ============================================================================
// VEHICLE ASSIGNMENT
// ============================================================================

export interface VehicleAssignment {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Vehicle
  vehicleId: string;
  vehicle?: Vehicle;

  // Driver
  driverId?: string;
  driver?: any;

  // Orders
  orderIds: string[];
  orders?: any[];

  // Route
  routeId?: string;
  route?: any;

  // Schedule
  scheduledDate: Date;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;

  // Actual times
  actualStartTime?: Date;
  actualEndTime?: Date;

  // Status
  status: AssignmentStatus;

  // Metrics
  estimatedDistance?: number; // miles
  actualDistance?: number;
  estimatedDuration?: number; // minutes
  actualDuration?: number;
  estimatedCost?: number;
  actualCost?: number;

  // Stops
  totalStops: number;
  completedStops: number;

  // Load
  loadPlanId?: string;
  loadedWeight?: number; // lbs
  loadedVolume?: number; // cubic feet

  // Notes
  notes?: string;

  // Metadata
  tenantId: string;
}

export type AssignmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

// ============================================================================
// VEHICLE LOCATION
// ============================================================================

export interface VehicleLocation {
  id: string;
  createdAt: Date;

  // Vehicle
  vehicleId: string;
  vehicle?: Vehicle;

  // Location
  latitude: number;
  longitude: number;
  address?: string;

  // Motion
  speed?: number; // mph
  heading?: number; // degrees (0-360)

  // Status
  engineOn?: boolean;
  moving?: boolean;

  // Timestamp
  timestamp: Date;

  // Source
  source: "GPS" | "MANUAL" | "CHECKIN" | "CHECKOUT";
}

// ============================================================================
// MAINTENANCE
// ============================================================================

export interface MaintenanceSchedule {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Vehicle
  vehicleId: string;
  vehicle?: Vehicle;

  // Type
  type: MaintenanceType;

  // Schedule
  scheduledDate: Date;
  completedDate?: Date;

  // Details
  description: string;
  workRequired?: string[];

  // Cost
  estimatedCost?: number;
  actualCost?: number;

  // Time
  estimatedDuration?: number; // hours
  actualDuration?: number;

  // Service provider
  serviceProvider?: string;
  location?: string;

  // Status
  status: MaintenanceStatus;

  // Results
  passed?: boolean;
  certificateNumber?: string;
  expiryDate?: Date;
  issues?: string[];

  // Notes
  notes?: string;

  // Metadata
  tenantId: string;
}

export type MaintenanceType =
  | "SERVICE" // Regular service
  | "MOT" // MOT test (UK)
  | "REPAIR" // Repair work
  | "INSPECTION" // Safety inspection
  | "TACHO" // Tachograph calibration
  | "TYRES" // Tyre replacement
  | "BRAKES" // Brake service
  | "OIL_CHANGE" // Oil change
  | "BODYWORK" // Body repairs
  | "OTHER";

export type MaintenanceStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "OVERDUE";

// ============================================================================
// DOCUMENTS
// ============================================================================

export interface VehicleDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Vehicle
  vehicleId: string;
  vehicle?: Vehicle;

  // Document
  type: DocumentType;
  name: string;
  description?: string;

  // File
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;

  // Dates
  issueDate?: Date;
  expiryDate?: Date;

  // Status
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;

  // Metadata
  tenantId: string;
}

export type DocumentType =
  | "V5C" // Vehicle registration (UK)
  | "INSURANCE"
  | "MOT_CERTIFICATE"
  | "ROAD_TAX"
  | "OPERATORS_LICENSE"
  | "TACHO_CALIBRATION"
  | "SERVICE_RECORD"
  | "INSPECTION_REPORT"
  | "PHOTO"
  | "OTHER";

// ============================================================================
// AVAILABILITY
// ============================================================================

export interface VehicleAvailability {
  vehicle: Vehicle;
  available: boolean;
  reason?: string;
  nextAvailableTime?: Date;
  currentAssignment?: VehicleAssignment;
  upcomingMainten?: MaintenanceSchedule;
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface VehicleStatistics {
  vehicleId: string;

  // Usage
  totalAssignments: number;
  completedAssignments: number;
  cancelledAssignments: number;

  // Distance
  totalMileage: number;
  averageMileagePerDay: number;

  // Utilization
  utilizationRate: number; // percent
  averageLoadWeight: number; // lbs
  averageLoadVolume: number; // cubic feet

  // Time
  totalDrivingHours: number;
  totalIdleHours: number;
  averageHoursPerDay: number;

  // Cost
  totalFuelCost: number;
  totalMaintenanceCost: number;
  averageCostPerMile: number;

  // Efficiency
  averageMPG: number;
  onTimeDeliveryRate: number; // percent

  // Maintenance
  maintenanceCount: number;
  averageDaysBetweenService: number;
  breakdownCount: number;

  // Period
  periodStart: Date;
  periodEnd: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GetVehiclesRequest {
  warehouseId?: string;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
  vehicleTypes?: string[];
  customerVisible?: boolean;
  status?: VehicleStatus[];
}

export interface GetVehiclesResponse {
  vehicles: Vehicle[];
  total: number;
  available: number;
  inUse: number;
}

export interface SearchVehiclesRequest {
  minCapacity?: number;
  maxWeight?: number;
  palletCount?: number;
  requiresTemperature?: boolean;
  requiresLiftGate?: boolean;
  location?: string;
  radius?: number;
  fuelType?: string[];
  categories?: VehicleCategory[];
}

export interface RecommendVehicleRequest {
  orderIds: string[];
}

export interface RecommendVehicleResponse {
  recommendations: Array<{
    vehicle: Vehicle;
    score: number;
    reasoning: string[];
    utilization: {
      volume: number;
      weight: number;
    };
    estimatedCost: number;
  }>;
}

export interface AssignVehicleRequest {
  vehicleId: string;
  orderIds: string[];
  driverId?: string;
  scheduledDate: Date;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  notes?: string;
}

export interface TransportDailySchedule {
  date: Date;
  warehouseId: string;
  vehicles: Array<{
    vehicle: Vehicle;
    assignments: VehicleAssignment[];
    driver: any;
    status: VehicleStatus;
    route: any;
    estimatedCost: number;
  }>;
  summary: {
    totalVehicles: number;
    inUse: number;
    available: number;
    maintenance: number;
    totalOrders: number;
    totalStops: number;
    estimatedMiles: number;
    estimatedCost: number;
  };
}

// ============================================================================
// CUSTOMER PORTAL TYPES
// ============================================================================

export interface CustomerVehicleView {
  // Limited info for customer visibility
  vehicleId: string;
  vehicleType: string;
  category: VehicleCategory;
  name: string;

  // Current status
  status: "On Route" | "Loading" | "Arriving Soon" | "Delivered";
  eta?: Date;

  // Location (if allowed)
  currentLocation?: {
    address: string;
    city: string;
    lastUpdate: Date;
  };

  // Driver (limited info)
  driverName?: string;
  driverPhoto?: string;
  driverPhone?: string;

  // Orders
  yourOrders: string[]; // Order numbers
  estimatedDeliveryTime?: Date;

  // Tracking
  trackingUrl?: string;
  canTrackRealTime: boolean;
}
