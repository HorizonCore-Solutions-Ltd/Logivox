/**
 * Load Optimization Types
 * 
 * Type definitions for load planning, trailer management,
 * and 3D bin packing operations.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type TrailerType = 
  | 'DRY_VAN'
  | 'REEFER'
  | 'BOX_TRUCK'
  | 'CONTAINER'
  | 'FLATBED'
  | 'STEP_DECK'
  | 'LOWBOY';

export type DoorType = 
  | 'REAR'
  | 'SIDE'
  | 'REAR_ROLLUP'
  | 'SWING'
  | 'OPEN';

export type LoadPlanStatus =
  | 'DRAFT'
  | 'OPTIMIZED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

// ============================================================================
// TRAILER INTERFACES
// ============================================================================

export interface Trailer {
  id: string;
  name: string;
  type: TrailerType;
  
  // Dimensions (inches)
  length: number;
  width: number;
  height: number;
  
  // Weight (lbs)
  maxWeight: number;
  axleWeights?: {
    front: number;
    rear: number;
  };
  
  // Configuration
  doorType: DoorType;
  doorWidth?: number;
  doorHeight?: number;
  
  // Features
  features?: TrailerFeature[];
  temperatureRange?: {
    min: number; // Fahrenheit
    max: number;
  };
  liftGateCapacity?: number; // lbs
  
  // Status
  status?: 'AVAILABLE' | 'AT_DOCK' | 'LOADING' | 'IN_TRANSIT' | 'MAINTENANCE';
  currentDockDoorId?: string;
  warehouseId?: string;
  
  // Metadata
  licensePlate?: string;
  registrationExpiry?: Date;
  lastInspection?: Date;
  notes?: string;
}

export type TrailerFeature =
  | 'STANDARD'
  | 'TEMPERATURE_CONTROLLED'
  | 'MULTI_ZONE'
  | 'LIFT_GATE'
  | 'STACKABLE'
  | 'WEATHERPROOF'
  | 'TARPING'
  | 'OVERSIZED'
  | 'HAZMAT_CERTIFIED'
  | 'FOOD_GRADE'
  | 'AIR_RIDE'
  | 'E_TRACK'
  | 'LOAD_LOCKS';

// ============================================================================
// LOAD ITEM INTERFACES
// ============================================================================

export interface LoadItem {
  id: string;
  orderId: string;
  productId: string;
  sku: string;
  name: string;
  
  // Physical properties
  dimensions: {
    length: number; // inches
    width: number;
    height: number;
  };
  weight: number; // lbs
  
  // Loading properties
  stackable: boolean;
  maxStackHeight?: number; // how many can stack
  fragile: boolean;
  hazmat: boolean;
  requiresTemp: boolean;
  tempRange?: { min: number; max: number };
  
  // Multi-stop delivery
  deliveryStop?: number;
  deliverySequence?: number;
  
  // Special handling
  orientation?: 'UPRIGHT_ONLY' | 'ANY';
  loadingInstructions?: string;
}

export interface Container {
  id: string;
  type: 'PALLET' | 'CRATE' | 'BOX' | 'BAG' | 'DRUM' | 'GAYLORD';
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  maxWeight: number;
  stackable: boolean;
  items: LoadItem[];
}

// ============================================================================
// LOAD PLAN INTERFACES
// ============================================================================

export interface LoadPlan {
  id: string;
  trailerId: string;
  warehouseId: string;
  
  // Orders
  orderIds: string[];
  
  // Status
  status: LoadPlanStatus;
  createdAt: Date;
  updatedAt: Date;
  loadingStartedAt?: Date;
  loadingCompletedAt?: Date;
  
  // Planning data
  totalItems: number;
  totalWeight: number; // lbs
  utilization: {
    volumePercent: number;
    weightPercent: number;
    floorPercent: number;
  };
  
  // Load sequence (for multi-stop)
  stops?: DeliveryStop[];
  
  // Assignments
  dockDoorId?: string;
  assignedLoaders?: string[]; // user IDs
  
  // Notes
  loadingInstructions?: string;
  specialRequirements?: string[];
  
  // Metadata
  estimatedLoadTime?: number; // minutes
  actualLoadTime?: number;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface DeliveryStop {
  stopNumber: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Items for this stop
  orderIds: string[];
  itemIds: string[];
  totalWeight: number;
  
  // Loading position
  loadPosition: {
    startZ: number; // position in trailer
    endZ: number;
  };
  
  // Access
  accessLane: boolean; // space for unloading this stop
  
  // Timing
  estimatedUnloadTime?: number; // minutes
  deliveryWindow?: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// OPTIMIZATION INTERFACES
// ============================================================================

export interface LoadOptimizationResult {
  success: boolean;
  loadPlan: LoadPlan | null;
  
  // Utilization metrics
  utilization: {
    volumePercent: number;
    weightPercent: number;
    floorPercent: number;
  };
  
  // Weight distribution
  weightDistribution?: WeightDistribution;
  
  // Issues and recommendations
  issues: string[];
  recommendations: string[];
  
  // Items that didn't fit
  unloadedItems?: LoadItem[];
  
  // Alternative plans
  alternatives?: LoadPlan[];
}

export interface WeightDistribution {
  front: number; // lbs
  rear: number;
  total: number;
  
  // Percentages
  frontPercent: number;
  rearPercent: number;
  
  // Validation
  balanced: boolean;
  warnings: string[];
}

export interface LoadConstraints {
  // Weight constraints
  maxTotalWeight?: number;
  maxItemWeight?: number;
  
  // Dimension constraints
  maxItemLength?: number;
  maxItemWidth?: number;
  maxItemHeight?: number;
  
  // Stacking constraints
  maxStackHeight?: number; // max height of stacked items
  maxStackWeight?: number; // max weight on bottom item
  
  // Special requirements
  separateHazmat?: boolean;
  separateFragile?: boolean;
  temperatureZones?: number; // number of temp zones needed
  
  // Loading constraints
  loadFromRear?: boolean;
  loadFromSide?: boolean;
  accessLaneWidth?: number; // inches between stops
  
  // Time constraints
  maxLoadTime?: number; // minutes
  
  // Priority
  priorityOrderIds?: string[]; // orders to load first
}

export interface LoadSequence {
  stops: Array<{
    stopNumber: number;
    items: LoadItem[];
    loadOrder: number; // 1 = load first (last to unload)
  }>;
  accessLanes: Array<{
    afterStop: number;
    width: number; // inches
  }>;
}

// ============================================================================
// VISUALIZATION INTERFACES
// ============================================================================

export interface LoadVisualization {
  trailer: Trailer;
  items: Array<{
    item: LoadItem;
    position: {
      x: number; // inches from left wall
      y: number; // inches from floor
      z: number; // inches from front
    };
    rotation: number; // degrees
    stop: number; // delivery stop
    color: string; // for rendering
  }>;
  
  // Visual aids
  accessLanes: Array<{
    z: number;
    width: number;
  }>;
  
  // Metrics for display
  metrics: {
    volumeUsed: number;
    volumeAvailable: number;
    weightUsed: number;
    weightAvailable: number;
    itemsLoaded: number;
    itemsUnloaded: number;
  };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateLoadPlanRequest {
  orderIds: string[];
  trailerId?: string;
  trailerType?: string;
  warehouseId: string;
  dockDoorId?: string;
  constraints?: LoadConstraints;
  autoOptimize?: boolean;
}

export interface CreateLoadPlanResponse {
  success: boolean;
  loadPlan?: LoadPlan;
  utilization?: {
    volumePercent: number;
    weightPercent: number;
    floorPercent: number;
  };
  errors?: string[];
  warnings?: string[];
  recommendations?: string[];
}

export interface OptimizeLoadRequest {
  loadPlanId: string;
  constraints?: LoadConstraints;
  algorithm?: '3D_BIN_PACKING' | 'WEIGHT_BALANCED' | 'MULTI_STOP';
}

export interface OptimizeLoadResponse {
  success: boolean;
  originalUtilization: any;
  optimizedUtilization: any;
  improvement: {
    volumeGain: number; // percent
    weightBalanceGain: number;
    loadTimeReduction: number; // minutes
  };
  changes: string[];
}

export interface AutoAssignOrdersRequest {
  orderIds: string[];
  warehouseId: string;
  dockDoorIds?: string[];
  preferredTrailerTypes?: TrailerType[];
}

export interface AutoAssignOrdersResponse {
  success: boolean;
  assignments: Array<{
    trailerId: string;
    trailerType: TrailerType;
    orderIds: string[];
    utilization: any;
  }>;
  unassignedOrderIds: string[];
  recommendations: string[];
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export interface LoadPlanStatistics {
  totalLoadPlans: number;
  averageUtilization: {
    volume: number;
    weight: number;
    floor: number;
  };
  averageLoadTime: number; // minutes
  
  // By trailer type
  byTrailerType: Record<TrailerType, {
    count: number;
    avgUtilization: number;
    avgLoadTime: number;
  }>;
  
  // Trends
  trends: {
    date: Date;
    loadPlans: number;
    avgUtilization: number;
  }[];
  
  // Issues
  commonIssues: Array<{
    issue: string;
    count: number;
    percent: number;
  }>;
}

export interface LoaderPerformance {
  userId: string;
  userName: string;
  
  // Counts
  totalLoads: number;
  completedLoads: number;
  
  // Time metrics
  averageLoadTime: number; // minutes
  fastestLoadTime: number;
  slowestLoadTime: number;
  
  // Quality metrics
  accuracy: number; // percent
  damageRate: number; // percent
  
  // Efficiency
  itemsPerHour: number;
  palletsPerHour: number;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface LoadPlanEvent {
  id: string;
  loadPlanId: string;
  type: LoadPlanEventType;
  timestamp: Date;
  userId: string;
  data?: any;
  notes?: string;
}

export type LoadPlanEventType =
  | 'CREATED'
  | 'OPTIMIZED'
  | 'ASSIGNED'
  | 'LOADING_STARTED'
  | 'ITEM_LOADED'
  | 'STOP_COMPLETED'
  | 'LOADING_PAUSED'
  | 'LOADING_RESUMED'
  | 'LOADING_COMPLETED'
  | 'ISSUE_REPORTED'
  | 'MODIFIED'
  | 'CANCELLED';
