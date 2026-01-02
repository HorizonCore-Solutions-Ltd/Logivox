# 🚚 Cross-Docking Operations Module - Part 1: Core Dock-to-Dock Workflows

**Module**: 14A - Cross-Docking Operations (Core)  
**Status**: ✅ Complete Specification - Part 1 of 2  
**Part**: Core Cross-Dock Operations (Enterprise Features)

---

## 📋 Overview

Part 1 delivers enterprise-grade cross-docking execution: inbound pre-advice, dock receiving, rapid sorting/consolidation, staging, and immediate outbound shipping with strict time windows.

Cross-docking reduces storage and handling by moving goods directly from receiving to shipping.

### Core Capabilities
- **Cross-Dock Modes**: Pre-planned, opportunistic, and hybrid
- **Dock-to-Dock Allocation**: Match inbound supply to outbound demand in real time
- **Rapid Receiving**: ASN-driven scan, exception handling, minimal putaway
- **Sort/Consolidate**: Flow-through sorting by customer/order/route
- **Staging & Departure Control**: Lane/door assignment, cutoffs, load readiness
- **Inventory Integrity**: Traceability (lot/serial), short/over, damage detection
- **SLA & Visibility**: Dwell time monitoring, cross-dock KPI dashboards

---

## 🧩 1. Cross-Dock Strategy & Workflows

### Define how cross-docking runs per customer, SKU, and lane
```typescript
type CrossDockMode = 'PRE_PLANNED' | 'OPPORTUNISTIC' | 'HYBRID';

type CrossDockTrigger =
  | 'ASN_MATCH'
  | 'PO_MATCH'
  | 'ORDER_MATCH'
  | 'WAVE_DEMAND'
  | 'ROUTE_PLAN'
  | 'MANUAL';

type CrossDockStatus =
  | 'PLANNED'
  | 'INBOUND_ARRIVED'
  | 'RECEIVING'
  | 'SORTING'
  | 'STAGED'
  | 'LOADING'
  | 'SHIPPED'
  | 'EXCEPTION'
  | 'CANCELLED';

interface CrossDockSystem {
  // Policy
  createCrossDockPolicy: (policy: CrossDockPolicy) => Promise<string>;
  getCrossDockPolicy: (policyId: string) => Promise<CrossDockPolicy>;
  evaluateEligibility: (input: CrossDockEligibilityInput) => Promise<CrossDockEligibilityResult>;

  // Execution
  createCrossDockPlan: (input: CreateCrossDockPlanInput) => Promise<CrossDockPlan>;
  updatePlanStatus: (planId: string, status: CrossDockStatus) => Promise<void>;

  // Visibility
  getPlan: (planId: string) => Promise<CrossDockPlan>;
  searchPlans: (filters: CrossDockPlanFilters) => Promise<CrossDockPlan[]>;
  getKPIs: (period: DateRange) => Promise<CrossDockKPIs>;
}

interface CrossDockPolicy {
  id: string;
  name: string;

  mode: CrossDockMode;

  // Applicability
  appliesTo: {
    warehouseId?: string;
    clientId?: string; // 3PL
    customerId?: string;
    suppliers?: string[];
    carriers?: string[];
    skuAllowList?: string[];
    skuBlockList?: string[];
    categories?: string[];
  };

  // Triggers
  triggers: {
    allowed: CrossDockTrigger[];
    requireASN?: boolean;
    requireOutboundAllocation?: boolean;
  };

  // Time windows
  timeWindows: {
    maxDwellMinutes: number; // total allowed time on floor
    receivingToStageMaxMinutes: number;
    stageToLoadMaxMinutes: number;
  };

  // Controls
  controls: {
    allowLotless?: boolean;
    requireLotForControlled?: boolean;
    requireSerialForSerialized?: boolean;

    allowPartialCrossDock: boolean;
    splitBehavior: 'SPLIT_BY_ORDER' | 'SPLIT_BY_ROUTE' | 'SPLIT_BY_CUSTOMER' | 'NO_SPLIT';

    quarantineOnDamage: boolean;
    quarantineOnMismatch: boolean;

    autoCreateExceptions: boolean;
  };

  // SLA
  sla: {
    onTimePercentTarget: number;
    maxExceptionRatePercent: number;
  };

  createdAt: Date;
  active: boolean;
}

interface CrossDockEligibilityInput {
  warehouseId: string;
  clientId?: string;

  inbound: {
    asnId?: string;
    poNumber?: string;
    supplierId?: string;
    carrier?: string;
    expectedArrival?: Date;

    lines: {
      sku: string;
      quantity: number;
      lot?: string;
      serials?: string[];
    }[];
  };

  outboundDemand?: {
    orderIds?: string[];
    routeId?: string;
    waveId?: string;

    lines?: {
      sku: string;
      quantity: number;
      lot?: string;
    }[];
  };
}

interface CrossDockEligibilityResult {
  eligible: boolean;
  policyId?: string;

  mode?: CrossDockMode;
  reason: string;

  // Requirements
  requirements: {
    needsASN: boolean;
    needsOutboundAllocation: boolean;
    needsLot: boolean;
    needsSerial: boolean;
  };

  // If eligible, suggested plan
  suggestedPlan?: {
    allocationStrategy: 'FIFO' | 'FEFO' | 'ORDER_PRIORITY' | 'ROUTE_PRIORITY';
    stagingLanePreference?: string;
    dockDoorPreference?: string;
  };
}

interface CreateCrossDockPlanInput {
  warehouseId: string;
  clientId?: string;

  trigger: CrossDockTrigger;
  policyId: string;

  inbound: {
    asnId?: string;
    receiptId?: string;
    supplierId?: string;
    carrier?: string;
    trailerId?: string;

    dockDoorId?: string;
    unloadStartAt?: Date;

    lines: {
      sku: string;
      quantityExpected: number;
      lot?: string;
      serials?: string[];
    }[];
  };

  outbound: {
    // can be orders, routes, waves
    orderIds?: string[];
    routeId?: string;
    waveId?: string;

    dockDoorId?: string;

    // if not known upfront, allow creation of placeholder shipments
    allowCreateShipments: boolean;
  };
}

interface CrossDockPlan {
  id: string;
  planNumber: string;

  warehouseId: string;
  clientId?: string;

  policyId: string;
  mode: CrossDockMode;
  trigger: CrossDockTrigger;

  status: CrossDockStatus;

  // Inbound
  inbound: {
    asnId?: string;
    receiptId?: string;
    supplierId?: string;
    carrier?: string;
    trailerId?: string;

    doorId?: string;

    eta?: Date;
    arrivedAt?: Date;

    lines: CrossDockInboundLine[];
  };

  // Outbound
  outbound: {
    orderIds?: string[];
    routeId?: string;
    waveId?: string;

    doorId?: string;

    shipments: CrossDockOutboundShipment[];
  };

  // Execution
  tasks: {
    receivingTaskId?: string;
    sortingTaskId?: string;
    stagingTaskId?: string;
    loadingTaskId?: string;
  };

  // Timing metrics
  timing: {
    receivingStartedAt?: Date;
    receivingCompletedAt?: Date;
    sortingStartedAt?: Date;
    sortingCompletedAt?: Date;
    stagedAt?: Date;
    loadedAt?: Date;
    shippedAt?: Date;

    dwellMinutes?: number;
  };

  // Exceptions
  exceptions: CrossDockException[];

  createdAt: Date;
  updatedAt: Date;
}

interface CrossDockInboundLine {
  sku: string;
  quantityExpected: number;
  quantityReceived: number;

  lot?: string;
  serialsExpected?: string[];
  serialsReceived?: string[];

  // Allocation
  allocated: {
    shipmentId: string;
    quantity: number;
  }[];

  // Status
  status: 'PENDING' | 'RECEIVED' | 'SHORT' | 'OVER' | 'DAMAGED' | 'MISMATCH';

  // Evidence
  photos?: string[];
  notes?: string;
}

interface CrossDockOutboundShipment {
  shipmentId: string;
  orderId?: string;
  routeId?: string;

  doorId?: string;
  stagingLaneId?: string;

  status: 'CREATED' | 'ALLOCATED' | 'STAGED' | 'LOADING' | 'SHIPPED' | 'HELD';

  // Required contents
  requiredLines: {
    sku: string;
    quantity: number;
    lot?: string;
  }[];

  // Staged contents
  stagedLines: {
    sku: string;
    quantity: number;
    lot?: string;
  }[];

  // Cutoff
  cutoffAt?: Date;
  mustDepartAt?: Date;
}

interface CrossDockException {
  id: string;
  at: Date;

  type:
    | 'SHORT_RECEIPT'
    | 'OVER_RECEIPT'
    | 'DAMAGE'
    | 'MISSING_LOT'
    | 'MISSING_SERIAL'
    | 'NO_OUTBOUND_DEMAND'
    | 'MISROUTE'
    | 'DOOR_CHANGE_REQUIRED'
    | 'CUTOFF_RISK'
    | 'OTHER';

  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  message: string;
  recommendedAction:
    | 'QUARANTINE'
    | 'MOVE_TO_STORAGE'
    | 'CREATE_BACKORDER'
    | 'REASSIGN_SHIPMENT'
    | 'CHANGE_DOOR'
    | 'EXPEDITE'
    | 'MANAGER_REVIEW';

  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

interface CrossDockPlanFilters {
  warehouseId?: string;
  clientId?: string;
  status?: CrossDockStatus[];
  supplierId?: string;
  carrier?: string;
  from?: Date;
  to?: Date;
}

interface CrossDockKPIs {
  period: DateRange;

  plans: number;
  shipped: number;
  exceptionRatePercent: number;

  // Dwell
  avgDwellMinutes: number;
  p95DwellMinutes: number;

  // SLA
  onTimeDeparturesPercent: number;
  cutoffMisses: number;

  // Efficiency
  touchesPerUnit: number;
  laborMinutesPerPallet: number;

  // Top issues
  topExceptions: {
    type: string;
    count: number;
    impact: string;
  }[];
}

const CROSS_DOCK_VOICE_COMMANDS = [
  "Create cross dock plan",
  "Show cross dock queue",
  "Start cross dock receiving",
  "Allocate inbound to outbound",
  "Show dwell time",
  "Escalate cross dock exception",
];
```

---

## 📥 2. ASN-Driven Cross-Dock Receiving

### Fast receiving focused on verification and flow-through
```typescript
type ReceivingOutcome = 'ACCEPT' | 'HOLD' | 'QUARANTINE' | 'REJECT';

type ReceivingExceptionType = 'DAMAGE' | 'SHORT' | 'OVER' | 'LOT_MISSING' | 'SERIAL_MISSING' | 'SKU_MISMATCH';

interface CrossDockReceiving {
  startReceiving: (planId: string, userId: string) => Promise<void>;
  scanInboundUnit: (planId: string, input: InboundScanInput) => Promise<InboundScanResult>;
  completeReceiving: (planId: string) => Promise<void>;

  // Exceptions
  recordReceivingException: (planId: string, exception: ReceivingException) => Promise<string>;
  resolveReceivingException: (exceptionId: string, resolution: ExceptionResolution) => Promise<void>;
}

interface InboundScanInput {
  scanType: 'PALLET' | 'CARTON' | 'EACH' | 'LABEL' | 'BARCODE';
  barcode: string;

  // Optional manual entry
  sku?: string;
  quantity?: number;
  lot?: string;
  serial?: string;

  // Evidence
  photos?: string[];
  notes?: string;
}

interface InboundScanResult {
  scannedAt: Date;

  sku: string;
  quantity: number;
  lot?: string;
  serial?: string;

  // Match
  expected: boolean;
  expectedQuantityRemaining?: number;

  // Routing
  allocatedToShipment?: string;
  routeTo:
    | 'DIRECT_TO_STAGE'
    | 'SORT_AREA'
    | 'QC_INSPECTION'
    | 'QUARANTINE'
    | 'PUTAWAY_TO_STORAGE';

  outcome: ReceivingOutcome;
  reason?: string;
}

interface ReceivingException {
  type: ReceivingExceptionType;
  sku?: string;
  lot?: string;
  serial?: string;

  quantity?: number;

  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  description: string;
  photos?: string[];

  recommendedAction:
    | 'QUARANTINE'
    | 'REJECT'
    | 'ACCEPT_AS_IS'
    | 'MOVE_TO_STORAGE'
    | 'MANAGER_REVIEW';

  createdAt: Date;
  createdBy: string;
}

interface ExceptionResolution {
  resolvedAt: Date;
  resolvedBy: string;
  action: 'QUARANTINE' | 'ACCEPT' | 'REJECT' | 'MOVE_TO_STORAGE' | 'BACKORDER' | 'ADJUST';
  notes?: string;
}

const CROSS_DOCK_RECEIVING_VOICE_COMMANDS = [
  "Start cross dock receiving",
  "Scan inbound carton",
  "Record damage exception",
  "Route to staging",
  "Complete receiving",
];
```

---

## 🧮 3. Real-Time Allocation (Inbound → Outbound)

### Match supply to demand in seconds
```typescript
type AllocationStrategy = 'FIFO' | 'FEFO' | 'ORDER_PRIORITY' | 'ROUTE_PRIORITY' | 'CUSTOMER_PRIORITY';

type AllocationStatus = 'PENDING' | 'ALLOCATED' | 'PARTIAL' | 'UNALLOCATED' | 'REALLOCATED';

interface CrossDockAllocationEngine {
  allocate: (input: AllocationRequest) => Promise<AllocationResult>;
  reallocate: (planId: string, reason: string) => Promise<AllocationResult>;

  // Shortage handling
  createBackorder: (orderId: string, sku: string, quantity: number) => Promise<void>;
  suggestSubstitutions: (sku: string, quantity: number) => Promise<SubstitutionSuggestion[]>;
}

interface AllocationRequest {
  planId: string;
  strategy: AllocationStrategy;

  inboundLines: {
    sku: string;
    quantityAvailable: number;
    lot?: string;
  }[];

  outboundDemand: {
    shipmentId: string;
    priority: number; // 1-10
    cutoffAt?: Date;

    lines: {
      sku: string;
      quantityNeeded: number;
      lot?: string;
    }[];
  }[];

  constraints: {
    requireLotMatch: boolean;
    allowSplitAcrossShipments: boolean;
    reservePercent?: number; // keep buffer
  };
}

interface AllocationResult {
  allocatedAt: Date;
  planId: string;

  status: AllocationStatus;

  allocations: {
    sku: string;
    lot?: string;

    fromInboundQuantity: number;

    toShipments: {
      shipmentId: string;
      quantity: number;
    }[];
  }[];

  shortages: {
    shipmentId: string;
    sku: string;
    quantityShort: number;
    recommendedAction: 'BACKORDER' | 'SUBSTITUTE' | 'EXPEDITE' | 'SPLIT_SHIPMENT';
  }[];

  notes?: string;
}

interface SubstitutionSuggestion {
  substituteSku: string;
  confidence: number; // 0-1
  reason: string;
  impact: string;
}

const CROSS_DOCK_ALLOCATION_VOICE_COMMANDS = [
  "Allocate inbound to outbound",
  "Reallocate cross dock plan",
  "Show shortages",
  "Create backorder",
  "Show cutoff risks",
];
```

---

## 🧱 4. Sorting, Consolidation & Staging Lanes

### Minimal touches with strict lane control
```typescript
type SortMethod = 'BY_SHIPMENT' | 'BY_ROUTE' | 'BY_CUSTOMER' | 'BY_ZONE' | 'BY_CARRIER';

type LaneStatus = 'OPEN' | 'FULL' | 'HOLD' | 'CLOSED';

interface CrossDockSorting {
  configureSortPlan: (planId: string, config: SortPlanConfig) => Promise<void>;
  scanToLane: (planId: string, scan: SortScanInput) => Promise<SortScanResult>;
  closeLane: (laneId: string) => Promise<void>;

  // Staging
  assignStagingLane: (shipmentId: string) => Promise<string>;
  sealShipmentLane: (shipmentId: string) => Promise<void>;
}

interface SortPlanConfig {
  method: SortMethod;
  laneStrategy: 'DEDICATED_PER_SHIPMENT' | 'SHARED_PER_ROUTE' | 'SHARED_PER_CUSTOMER';

  lanes: {
    laneId: string;
    name: string;
    capacityUnits: number;
    allowedShipments?: string[];
  }[];

  // Controls
  requireScanEveryUnit: boolean;
  allowLaneOverflow: boolean;
  overflowLaneId?: string;
}

interface SortScanInput {
  barcode: string;
  sku?: string;
  quantity?: number;
  lot?: string;

  // Operator
  userId: string;
}

interface SortScanResult {
  scannedAt: Date;
  sku: string;
  quantity: number;

  // Determination
  shipmentId: string;
  laneId: string;

  // Status
  laneStatus: LaneStatus;

  // Guidance
  instruction: string;
}

interface StagingLane {
  laneId: string;
  name: string;

  doorId?: string;
  status: LaneStatus;

  shipments: {
    shipmentId: string;
    status: 'STAGING' | 'READY' | 'HELD';
    cutoffAt?: Date;
  }[];

  utilizationPercent: number;
}

const CROSS_DOCK_SORTING_VOICE_COMMANDS = [
  "Scan to staging lane",
  "Assign lane for shipment {id}",
  "Close staging lane",
  "Seal shipment lane",
  "Show staging lane utilization",
];
```

---

## 🚪 5. Dock Door & Departure Control

### Ensure cutoffs are met and loads leave on time
```typescript
type DepartureRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface DepartureControl {
  evaluateCutoffRisk: (shipmentId: string) => Promise<CutoffRiskResult>;
  recommendDoorSwap: (shipmentId: string) => Promise<DoorSwapRecommendation>;

  markReadyToLoad: (shipmentId: string) => Promise<void>;
  startLoading: (shipmentId: string) => Promise<void>;
  completeLoading: (shipmentId: string) => Promise<void>;

  // Exceptions
  holdShipment: (shipmentId: string, reason: string) => Promise<void>;
  releaseHold: (shipmentId: string, approvedBy: string) => Promise<void>;
}

interface CutoffRiskResult {
  evaluatedAt: Date;
  shipmentId: string;

  risk: DepartureRisk;
  minutesToCutoff: number;

  blockers: {
    blocker: 'MISSING_UNITS' | 'LANE_NOT_SEALED' | 'DOOR_CONGESTION' | 'EQUIPMENT_SHORTAGE' | 'QC_HOLD' | 'PAPERWORK_MISSING';
    details: string;
  }[];

  recommendedActions: {
    action: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
}

interface DoorSwapRecommendation {
  shipmentId: string;
  recommendedDoorId: string;
  reason: string;
  expectedMinutesSaved: number;
  requiresApproval: boolean;
}

const DEPARTURE_CONTROL_VOICE_COMMANDS = [
  "Show cutoff risks",
  "Mark shipment ready to load",
  "Start loading",
  "Complete loading",
  "Hold shipment",
  "Release hold",
];
```

---

## 📊 Part 1 Summary

### Core Features Covered
✅ Cross-dock policies + eligibility  
✅ ASN-driven rapid receiving + exceptions  
✅ Real-time allocation inbound→outbound  
✅ Sorting/consolidation + staging lanes  
✅ Dock departure control + cutoff risk

**Voice Commands in Part 1**: 30+ commands

**Coming in Part 2 (Advanced)**:
- AI cross-dock optimization (door, lane, labor)
- Computer vision at cross-dock stations
- IoT trailer monitoring + cold-chain enforcement
- Autonomous cross-dock routing + robotics integration
- Predictive cutoffs and disruption management

---

## 🎯 Success Metrics (Part 1)

- 20–40% reduction in dwell time for cross-docked freight
- 25%+ reduction in touches per unit
- 98%+ allocation accuracy (inbound to outbound)
- 30%+ fewer missed cutoffs with departure risk scoring
- Real-time visibility of cross-dock throughput and exceptions

**Module 14 Part 1: Cross-Docking Operations - Production Ready** ✅
