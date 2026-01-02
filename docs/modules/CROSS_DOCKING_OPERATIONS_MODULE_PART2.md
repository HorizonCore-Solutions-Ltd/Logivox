# 🚚 Cross-Docking Operations Module - Part 2: Advanced Optimization (5–10 Years Ahead)

**Module**: 14B - Cross-Docking Operations (Advanced)  
**Status**: ✅ Complete Specification - Part 2 of 2  
**Part**: AI Optimization, Resilience, Automation, and Autonomous Flow-Through

---

## 📋 Overview

Part 2 adds “5–10 years ahead” cross-docking: predictive inbound/outbound matching, disruption-aware scheduling, automated compliance enforcement, CV/IoT validation at the dock, and robotics-ready orchestration.

This part assumes Part 1’s core execution exists (receiving, allocation, sorting, staging, departure control).

### Advanced Capabilities
- **Predictive & Adaptive Matching**: AI suggests (and can auto-approve) cross-dock plans
- **Disruption-Aware Routing**: Weather/traffic/carrier alerts automatically re-plan doors/lanes
- **Computer Vision Validation**: Pallet/carton counts, label OCR, damage detection
- **IoT Cold-Chain Enforcement**: Trailer telemetry drives automatic holds/releases
- **Autonomous Exception Resolution**: Policy-driven actions + approvals + audit trail
- **Robotics-Ready Orchestration**: AMR/AGV task hooks for high-throughput flow

---

## 🧠 1. Predictive Cross-Dock Planner (AI Suggestions)

### Goal
Proactively identify cross-dock candidates and build plans before inbound arrives.

```typescript
type PredictionHorizon = 'NEXT_2_HOURS' | 'NEXT_8_HOURS' | 'NEXT_24_HOURS' | 'NEXT_72_HOURS';

type PlanConfidenceBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

type AutonomyMode = 'SUGGEST_ONLY' | 'AUTO_PLAN' | 'AUTO_PLAN_WITH_GUARDRAILS' | 'FULL_AUTONOMY';

interface PredictiveCrossDockPlanner {
  generateCandidates: (input: CandidateGenerationInput) => Promise<CrossDockCandidate[]>;
  proposePlan: (candidateId: string) => Promise<CrossDockPlanProposal>;

  // Optional autonomous execution (with approvals)
  setAutonomyMode: (warehouseId: string, mode: AutonomyMode) => Promise<void>;
  autoPlanLoop: (warehouseId: string) => Promise<void>; // background process
}

interface CandidateGenerationInput {
  warehouseId: string;
  clientId?: string;

  horizon: PredictionHorizon;

  signals: {
    // inbound signals
    asnFeedEnabled: boolean;
    carrierETAEnabled: boolean;
    supplierReliabilityEnabled: boolean;

    // outbound signals
    ordersEnabled: boolean;
    routePlansEnabled: boolean;
    wavesEnabled: boolean;

    // disruption signals
    trafficEnabled?: boolean;
    weatherEnabled?: boolean;
    dockCongestionEnabled?: boolean;
  };

  constraints: {
    maxPlansToPropose: number;
    minValueScore: number; // 0-100
  };
}

interface CrossDockCandidate {
  id: string;
  createdAt: Date;

  inboundRef: {
    asnId?: string;
    supplierId?: string;
    carrier?: string;
    eta?: Date;
  };

  outboundRef: {
    routeId?: string;
    waveId?: string;
    orderIds?: string[];
    cutoffAt?: Date;
  };

  // AI scoring
  score: {
    valueScore: number; // expected cost/time savings
    feasibilityScore: number; // data completeness, constraints
    riskScore: number; // exceptions likelihood

    confidenceBand: PlanConfidenceBand;
    explanation: {
      topReasons: string[];
      risks: string[];
      missingData: string[];
    };
  };
}

interface CrossDockPlanProposal {
  proposalId: string;
  candidateId: string;

  recommendedPolicyId: string;
  recommendedMode: 'PRE_PLANNED' | 'HYBRID';

  recommendedDoors: {
    inboundDoorId?: string;
    outboundDoorId?: string;
    reason: string;
    expectedMinutesSaved: number;
  };

  recommendedLanes: {
    laneId: string;
    reason: string;
  }[];

  laborPlan: {
    suggestedHeadcount: number;
    suggestedEquipment: {
      type: 'FORKLIFT' | 'PALLET_JACK' | 'CONVEYOR' | 'AMR' | 'WRAP_STATION';
      count: number;
    }[];
  };

  guardrails: {
    maxAutoPlanExceptions: number;
    requireApprovalAboveValue?: number;
    requireApprovalIfRiskBand?: PlanConfidenceBand[];
  };

  createdAt: Date;
}

const PREDICTIVE_PLANNER_VOICE_COMMANDS = [
  "Show cross dock candidates",
  "Explain candidate score",
  "Propose cross dock plan",
  "Approve cross dock proposal",
  "Enable auto planning",
  "Disable auto planning",
];
```

---

## 🌐 2. Disruption-Aware Dock & Lane Re-Planning

### Goal
Keep cutoffs safe when conditions change (late inbound, door congestion, equipment outage).

```typescript
type DisruptionType =
  | 'LATE_ETA'
  | 'DOOR_CONGESTION'
  | 'LABOR_SHORTAGE'
  | 'EQUIPMENT_OUTAGE'
  | 'CARRIER_CHANGE'
  | 'WEATHER'
  | 'TRAFFIC'
  | 'QC_HOLD'
  | 'SECURITY_HOLD'
  | 'SYSTEM_DEGRADED';

interface DisruptionSignal {
  id: string;
  type: DisruptionType;
  detectedAt: Date;

  warehouseId: string;
  planId?: string;
  shipmentId?: string;

  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;

  evidence?: {
    source: 'WMS' | 'TMS' | 'CARRIER_API' | 'WEATHER_API' | 'IOT' | 'CV' | 'USER';
    payloadRef?: string;
  };
}

interface CrossDockResilienceEngine {
  ingestSignal: (signal: DisruptionSignal) => Promise<void>;

  replanDoorsAndLanes: (input: ReplanRequest) => Promise<ReplanResult>;
  simulateReplan: (input: ReplanRequest) => Promise<ReplanSimulation>; // safe preview

  // Escalations
  openIncident: (input: CrossDockIncidentInput) => Promise<string>;
}

interface ReplanRequest {
  warehouseId: string;
  planId: string;

  objectives: {
    minimizeCutoffMisses: boolean;
    minimizeDoorChanges: boolean;
    minimizeLaborMinutes: boolean;
    maintainColdChain: boolean;
  };

  constraints: {
    allowedDoorIds?: string[];
    allowedLaneIds?: string[];
    maxDoorSwaps: number;
    approvalsRequiredAboveSeverity: 'HIGH' | 'CRITICAL';
  };
}

interface ReplanSimulation {
  currentRisk: {
    cutoffRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    minutesToCutoff: number;
  };

  proposedRisk: {
    cutoffRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    minutesToCutoff: number;
  };

  changes: {
    doorSwap?: { fromDoorId: string; toDoorId: string; }
    laneMoves?: { shipmentId: string; fromLaneId: string; toLaneId: string; }[];
  };

  tradeoffs: string[];
}

interface ReplanResult {
  applied: boolean;
  appliedAt?: Date;

  approvals: {
    required: boolean;
    approvedBy?: string;
    approvedAt?: Date;
  };

  changes: {
    doorSwap?: { fromDoorId: string; toDoorId: string; }
    laneMoves?: { shipmentId: string; fromLaneId: string; toLaneId: string; }[];
  };

  notes?: string;
}

interface CrossDockIncidentInput {
  warehouseId: string;
  planId?: string;
  title: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals: string[]; // disruption signal ids
}

const RESILIENCE_VOICE_COMMANDS = [
  "Show disruptions",
  "Simulate door replan",
  "Apply replan",
  "Open cross dock incident",
  "Escalate to manager",
];
```

---

## 👁️ 3. Computer Vision at Cross-Dock Stations

### Goal
Reduce errors and speed processing with camera-assisted validation.

```typescript
type CVModelType =
  | 'PALLET_COUNT'
  | 'CARTON_COUNT'
  | 'LABEL_OCR'
  | 'DAMAGE_DETECTION'
  | 'SEAL_VERIFICATION'
  | 'LOAD_COMPLETENESS';

interface CVStation {
  stationId: string;
  warehouseId: string;

  location: {
    area: 'RECEIVING' | 'SORT' | 'STAGING' | 'DOOR';
    doorId?: string;
    laneId?: string;
  };

  cameras: {
    cameraId: string;
    streamUrlRef: string;
  }[];

  enabledModels: CVModelType[];
}

interface CrossDockComputerVision {
  registerStation: (station: CVStation) => Promise<void>;
  evaluateFrame: (input: CVFrameInput) => Promise<CVFrameResult>;

  // Policy actions
  createCVHold: (shipmentId: string, reason: string, evidenceRef: string) => Promise<void>;
  releaseCVHold: (shipmentId: string, approvedBy: string) => Promise<void>;
}

interface CVFrameInput {
  stationId: string;
  capturedAt: Date;

  // Pointer to blob/object storage
  frameRef: string;

  context: {
    planId?: string;
    shipmentId?: string;
    expectedPalletCount?: number;
    expectedCartonCount?: number;
  };
}

interface CVFrameResult {
  evaluatedAt: Date;
  stationId: string;

  outputs: {
    model: CVModelType;
    confidence: number; // 0-1
    findings: Record<string, unknown>;
  }[];

  decision:
    | { action: 'PASS'; notes?: string }
    | { action: 'FLAG'; severity: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string; evidenceRef: string }
    | { action: 'HOLD'; severity: 'HIGH' | 'CRITICAL'; reason: string; evidenceRef: string };
}

const CV_VOICE_COMMANDS = [
  "Show camera holds",
  "Explain camera flag",
  "Release camera hold",
];
```

---

## 🌡️ 4. IoT & Cold-Chain Enforcement for Flow-Through Freight

### Goal
Automatically enforce temperature and door-open constraints for perishable and controlled freight.

```typescript
type SensorType = 'TEMP' | 'HUMIDITY' | 'DOOR_OPEN' | 'GPS' | 'SHOCK' | 'LIGHT';

type ExcursionAction = 'HOLD' | 'QUARANTINE' | 'ALLOW_WITH_APPROVAL' | 'REJECT';

interface TrailerSensorEvent {
  id: string;
  occurredAt: Date;

  trailerId: string;
  carrier?: string;

  type: SensorType;
  value: number;
  unit?: string;

  // Optional mapping
  planId?: string;
  shipmentId?: string;
}

interface ColdChainPolicy {
  id: string;
  warehouseId: string;

  appliesTo: {
    sku?: string;
    category?: string;
    clientId?: string;
  };

  thresholds: {
    minTempC?: number;
    maxTempC?: number;
    maxDoorOpenSeconds?: number;
    maxShockG?: number;
  };

  actions: {
    onExcursion: ExcursionAction;
    requireEvidencePhotos?: boolean;
    requireQCInspection?: boolean;
  };

  audit: {
    requireSignoff: boolean;
    signoffRole?: 'QC' | 'SUPERVISOR' | 'MANAGER';
  };
}

interface CrossDockIoTEnforcement {
  ingestTrailerEvent: (event: TrailerSensorEvent) => Promise<void>;
  evaluateExcursion: (eventId: string) => Promise<IoTDecision>;
}

interface IoTDecision {
  eventId: string;
  decidedAt: Date;

  action: ExcursionAction;
  reason: string;

  createdHold?: {
    shipmentId: string;
    holdType: 'COLD_CHAIN' | 'SECURITY' | 'DAMAGE_RISK';
  };

  requiredNextSteps: string[];
}

const IOT_VOICE_COMMANDS = [
  "Show cold chain holds",
  "Explain temperature excursion",
  "Escalate cold chain hold",
];
```

---

## 🤖 5. Robotics-Ready Cross-Dock Orchestration

### Goal
Enable AMRs/AGVs and conveyor systems to execute movement tasks.

```typescript
type AutomationTaskType =
  | 'MOVE_PALLET_RECEIVING_TO_SORT'
  | 'MOVE_CARTON_SORT_TO_LANE'
  | 'MOVE_PALLET_LANE_TO_DOOR'
  | 'WRAP_AND_STAGE'
  | 'AUTONOMOUS_TUGGER_PULL';

type AutomationTaskStatus = 'QUEUED' | 'DISPATCHED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'FAILED';

interface AutomationTask {
  id: string;
  type: AutomationTaskType;

  warehouseId: string;
  planId?: string;
  shipmentId?: string;

  from: { locationType: 'DOOR' | 'LANE' | 'STATION' | 'ZONE'; locationId: string };
  to: { locationType: 'DOOR' | 'LANE' | 'STATION' | 'ZONE'; locationId: string };

  priority: number; // 1-10
  status: AutomationTaskStatus;

  createdAt: Date;
  updatedAt: Date;

  failureReason?: string;
}

interface CrossDockAutomationOrchestrator {
  createTask: (task: Omit<AutomationTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  cancelTask: (taskId: string) => Promise<void>;

  // Integrations
  dispatchToVendor: (taskId: string, vendor: 'Locus' | 'OTTO' | 'GreyOrange' | 'Custom') => Promise<void>;
  updateTaskStatus: (taskId: string, status: AutomationTaskStatus, details?: string) => Promise<void>;

  // Safety
  enforceNoGoZones: (warehouseId: string, zones: string[]) => Promise<void>;
}

const AUTOMATION_VOICE_COMMANDS = [
  "Dispatch robot task",
  "Show robot queue",
  "Cancel robot task",
  "Show blocked robot tasks",
];
```

---

## 🧾 6. Autonomous Exception Resolution (Policy + Audit)

### Goal
Automatically resolve common exceptions within guardrails.

```typescript
type ResolutionPolicy =
  | 'AUTO_QUARANTINE_DAMAGE'
  | 'AUTO_MOVE_TO_STORAGE_NO_DEMAND'
  | 'AUTO_CREATE_BACKORDER_SHORT'
  | 'AUTO_DOOR_SWAP_CONGESTION'
  | 'AUTO_ESCALATE_CUTOFF_CRITICAL';

interface AutoResolutionRule {
  id: string;
  warehouseId: string;

  policy: ResolutionPolicy;
  enabled: boolean;

  conditions: {
    severityAtLeast?: 'MEDIUM' | 'HIGH' | 'CRITICAL';
    maxValueAtRisk?: number;
    requireCVEvidence?: boolean;
    requireIoTEvidence?: boolean;
  };

  action: {
    execute: 'QUARANTINE' | 'MOVE_TO_STORAGE' | 'BACKORDER' | 'CHANGE_DOOR' | 'ESCALATE';
    requireApproval: boolean;
    approverRole?: 'SUPERVISOR' | 'MANAGER' | 'QC';
  };
}

interface CrossDockAutonomy {
  evaluateAndResolve: (planId: string) => Promise<AutonomyRunResult>;
  addRule: (rule: AutoResolutionRule) => Promise<string>;
  setRuleEnabled: (ruleId: string, enabled: boolean) => Promise<void>;
}

interface AutonomyRunResult {
  runId: string;
  planId: string;
  ranAt: Date;

  actionsTaken: {
    ruleId: string;
    action: string;
    approvedBy?: string;
    evidenceRefs?: string[];
  }[];

  actionsProposed: {
    ruleId: string;
    action: string;
    reason: string;
    requiresApproval: boolean;
  }[];

  audit: {
    immutableLogRef: string; // write-once audit log
  };
}

const AUTONOMY_VOICE_COMMANDS = [
  "Run cross dock autonomy",
  "Show autonomy proposals",
  "Approve autonomy action",
  "Explain autonomy decision",
];
```

---

## 📊 Part 2 Summary

### Advanced Features Covered
✅ Predictive cross-dock candidate discovery + auto-planning  
✅ Disruption-aware door/lane re-planning with simulation + approvals  
✅ Computer vision validation (counts, OCR, damage, completeness)  
✅ IoT/cold-chain enforcement and automatic holds/releases  
✅ Robotics-ready orchestration hooks for AMR/AGV/conveyors  
✅ Policy-driven autonomous exception resolution with immutable audit logs

**Voice Commands in Part 2**: 20+ commands

---

## 🎯 Success Metrics (Part 2)

- 50%+ fewer manual replans via predictive planning
- 30–60% fewer cutoff misses through disruption-aware re-routing
- 20–40% reduction in cross-dock exceptions via CV/IoT validation
- 15–30% labor efficiency improvement with automation orchestration
- Measurable audit readiness: 100% exception actions have evidence + approval trail

**Module 14 Part 2: Cross-Docking Operations - 5–10 Years Ahead** ✅
