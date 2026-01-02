# 🔄 Returns Management Module - Part 1: Core RMA, Receiving, Triage & Disposition

**Module**: 13A - Returns Management (Core)  
**Status**: ✅ Complete Specification - Part 1 of 2  
**Part**: Core Returns Operations (Enterprise Features)

---

## 📋 Overview

Part 1 delivers enterprise-grade returns operations: RMA creation, return authorization, receiving, inspection/triage, disposition, restocking, and return-to-vendor workflows. It integrates tightly with inventory, QC/quarantine, customer service, and finance.

### Core Capabilities
- **RMA Lifecycle**: Create/approve RMAs, labels, tracking, expected contents
- **Returns Receiving**: Scan inbound returns, match against RMA/order/serial/lot
- **Triage & Inspection**: Condition grading, reason codes, photo evidence
- **Disposition Engine**: Restock, refurbish, scrap, quarantine, RTV, donate, resale
- **Credit/Replacement Support**: Policy-driven eligibility + decision traceability
- **RTV (Return-To-Vendor)**: Vendor claim, authorization, packing, shipping
- **Fraud Controls**: Serial/lot validation, time-window checks, anomaly flags

---

## 🧾 1. RMA Lifecycle Management

### End-to-end return authorization and tracking
```typescript
type ReturnChannel = 'CUSTOMER' | '3PL_CLIENT' | 'RETAIL' | 'MARKETPLACE' | 'INTERNAL';

type ReturnType =
  | 'UNWANTED'
  | 'DAMAGED'
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'MISSING_PARTS'
  | 'EXPIRED'
  | 'RECALL'
  | 'WARRANTY'
  | 'CARRIER_DAMAGE'
  | 'OTHER';

type RMAStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'LABEL_ISSUED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'UNDER_INSPECTION'
  | 'DISPOSITIONED'
  | 'CLOSED'
  | 'CANCELLED';

type ReturnEligibilityDecision = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_REVIEW';

type ReturnLabelType = 'PREPAID' | 'CUSTOMER_PAID' | 'CARRIER_COLLECT' | 'NONE';

interface ReturnsManagementSystem {
  // RMA
  createRMA: (request: CreateRMARequest) => Promise<RMA>;
  updateRMA: (rmaId: string, updates: Partial<RMA>) => Promise<void>;
  approveRMA: (rmaId: string, approval: RMAApproval) => Promise<void>;
  rejectRMA: (rmaId: string, rejection: RMARejection) => Promise<void>;

  // Labels / tracking
  generateReturnLabel: (rmaId: string, config: ReturnLabelConfig) => Promise<ReturnLabel>;
  recordTrackingUpdate: (rmaId: string, update: ReturnTrackingUpdate) => Promise<void>;

  // Policy
  evaluateEligibility: (request: EligibilityRequest) => Promise<EligibilityResult>;
  getReturnPolicy: (customerId?: string, clientId?: string) => Promise<ReturnPolicy>;

  // Visibility
  getRMA: (rmaId: string) => Promise<RMA>;
  searchRMAs: (filters: RMAFilters) => Promise<RMA[]>;
  getRMAHistory: (rmaId: string) => Promise<RMAEvent[]>;
}

interface CreateRMARequest {
  channel: ReturnChannel;
  customerId?: string;
  clientId?: string; // for 3PL multi-client

  // Source order
  orderId?: string;
  shipmentId?: string;

  // Return details
  returnType: ReturnType;
  reasonCode: string;
  customerNotes?: string;

  // Items expected
  lines: {
    sku: string;
    description?: string;
    quantity: number;
    unit: string;

    // Traceability
    lot?: string;
    serials?: string[];

    // Pricing (for credit estimation)
    unitPrice?: number;

    // Claim
    claim: {
      damaged?: boolean;
      defective?: boolean;
      wrongItem?: boolean;
      missingParts?: boolean;
      other?: string;
    };
  }[];

  // Logistics
  returnMethod?: 'MAIL' | 'PICKUP' | 'DROP_OFF' | 'IN_STORE';
  returnLabelRequested: boolean;

  // Photos/documents
  attachments?: string[];
}

interface RMA {
  id: string;
  rmaNumber: string;

  channel: ReturnChannel;
  customerId?: string;
  clientId?: string;

  orderId?: string;
  shipmentId?: string;

  returnType: ReturnType;
  reasonCode: string;
  status: RMAStatus;

  // Policy evaluation
  eligibility: {
    decision: ReturnEligibilityDecision;
    reason: string;
    evaluatedAt: Date;
    evaluatedBy: 'SYSTEM' | 'AGENT' | 'MANAGER';
  };

  // Lines
  lines: RMALine[];

  // Labels
  label?: ReturnLabel;

  // Tracking
  tracking: {
    carrier?: string;
    trackingNumber?: string;
    status?: string;
    lastUpdated?: Date;
  };

  // Deadlines
  createdAt: Date;
  approvedAt?: Date;
  returnByDate?: Date;
  receivedByDate?: Date;

  // Notes
  customerNotes?: string;
  internalNotes?: string;

  // Financial
  financial: {
    estimatedCredit?: number;
    actualCredit?: number;
    currency: string;
    creditStatus: 'NONE' | 'PENDING' | 'ISSUED' | 'DENIED';
  };

  // Audit
  events: RMAEvent[];
  updatedAt: Date;
}

interface RMALine {
  lineId: string;
  sku: string;
  description?: string;
  quantityExpected: number;
  quantityReceived: number;
  unit: string;

  lot?: string;
  serialsExpected?: string[];
  serialsReceived?: string[];

  // Condition & disposition after receiving
  conditionGrade?: ConditionGrade;
  disposition?: DispositionDecision;
  dispositionNotes?: string;

  // Evidence
  photos?: string[];
  inspectionId?: string;
}

interface EligibilityRequest {
  customerId?: string;
  clientId?: string;
  orderId?: string;
  shipmentId?: string;
  sku: string;
  quantity: number;

  // Timing
  deliveredAt?: Date;
  requestedAt: Date;

  // Claim
  returnType: ReturnType;
  reasonCode: string;
}

interface EligibilityResult {
  decision: ReturnEligibilityDecision;
  reason: string;

  // Policy
  policyId: string;
  windowDays?: number;
  requiresRMA: boolean;
  requiresPhotos: boolean;

  // Controls
  requiresSerialValidation: boolean;
  requiresLotValidation: boolean;

  // Suggested path
  recommendedAction:
    | 'APPROVE'
    | 'REJECT'
    | 'MANAGER_REVIEW'
    | 'ROUTE_TO_QC'
    | 'ROUTE_TO_VENDOR_CLAIM';
}

interface ReturnPolicy {
  id: string;
  name: string;
  appliesTo: {
    customerId?: string;
    clientId?: string;
    productCategories?: string[];
    brands?: string[];
  };

  // Window
  returnWindowDays: number;

  // Eligibility rules
  rules: {
    allowedReturnTypes: ReturnType[];
    excludedSKUs?: string[];
    requiredReasons?: string[];

    // High-risk items
    hazmatRestricted?: boolean;
    temperatureSensitiveRestricted?: boolean;
    highValueRequiresApproval?: boolean;

    // Packaging
    requiresOriginalPackaging?: boolean;

    // Evidence
    requiresPhotosForDamage?: boolean;
    requiresSerialForWarranty?: boolean;
  };

  // Refund rules
  refunds: {
    allowRefund: boolean;
    allowReplacement: boolean;
    allowStoreCredit: boolean;

    restockingFeePercent?: number;
    deductShipping?: boolean;

    // Condition mapping
    conditionPayoutMultipliers: Map<ConditionGrade, number>; // e.g., A=1.0, B=0.7, C=0.4
  };

  // Logistics
  labels: {
    defaultLabelType: ReturnLabelType;
    prepaidForEligible: boolean;
    carrier?: string;
    serviceLevel?: string;
  };

  // Compliance
  compliance: {
    requireMSDSForHazmat?: boolean;
    quarantineOnRecall?: boolean;
    quarantineOnUnknownLot?: boolean;
  };

  createdAt: Date;
  active: boolean;
}

interface ReturnLabelConfig {
  labelType: ReturnLabelType;
  carrier?: string;
  serviceLevel?: string;

  // Packaging guidance
  packagingInstructions?: string;

  // Destination
  returnFacilityId: string;
  returnDockDoor?: string;
}

interface ReturnLabel {
  id: string;
  rmaId: string;
  type: ReturnLabelType;

  carrier?: string;
  serviceLevel?: string;
  trackingNumber?: string;

  // Media
  labelUrl?: string;
  qrCodeData?: string;

  issuedAt: Date;
  expiresAt?: Date;
}

interface ReturnTrackingUpdate {
  at: Date;
  status: string;
  location?: string;
  details?: string;
}

interface RMAApproval {
  approvedBy: string;
  approvedAt: Date;
  notes?: string;
  returnByDate?: Date;
}

interface RMARejection {
  rejectedBy: string;
  rejectedAt: Date;
  reason: string;
  notes?: string;
}

interface RMAFilters {
  channel?: ReturnChannel;
  status?: RMAStatus[];
  customerId?: string;
  clientId?: string;
  orderId?: string;
  sku?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

interface RMAEvent {
  id: string;
  at: Date;
  actor: {
    actorId: string;
    actorType: 'USER' | 'SYSTEM' | 'DEVICE';
    role?: string;
  };
  type: string;
  message: string;
  metadata?: Record<string, any>;
}

// Voice Commands
const RMA_VOICE_COMMANDS = [
  "Create RMA for order {order}",
  "Approve RMA {rma}",
  "Reject RMA {rma}",
  "Generate return label",
  "Show RMA status {rma}",
  "Search RMAs for customer {customer}",
];
```

---

## 📦 2. Returns Receiving & Verification

### Scan, match, validate: stop fraud and misroutes
```typescript
type ReturnReceiveStatus = 'PENDING' | 'RECEIVED' | 'PARTIAL' | 'MISMATCH' | 'UNKNOWN' | 'CLOSED';

type VerificationOutcome = 'MATCH' | 'MISMATCH' | 'UNKNOWN_ITEM' | 'EXCESS_QUANTITY' | 'MISSING_SERIAL' | 'INVALID_LOT';

interface ReturnsReceiving {
  startReturnReceipt: (rmaNumber: string) => Promise<ReturnReceipt>;
  receiveLine: (receiptId: string, input: ReceiveReturnLineInput) => Promise<ReturnReceipt>;
  closeReturnReceipt: (receiptId: string) => Promise<void>;

  // Verification
  verifySerial: (sku: string, serial: string) => Promise<boolean>;
  verifyLot: (sku: string, lot: string) => Promise<boolean>;
  detectFraudSignals: (receiptId: string) => Promise<FraudSignal[]>;
}

interface ReturnReceipt {
  id: string;
  receiptNumber: string;

  rmaId: string;
  rmaNumber: string;

  // Source
  channel: ReturnChannel;
  customerId?: string;
  clientId?: string;

  // Logistics
  carrier?: string;
  trackingNumber?: string;
  receivedAt?: Date;
  receivedBy?: string;
  receivedDock?: string;

  // Contents
  lines: ReturnReceiptLine[];

  status: ReturnReceiveStatus;

  // Controls
  holdForReview: boolean;
  holdReason?: string;

  // Totals
  totals: {
    lines: number;
    unitsExpected: number;
    unitsReceived: number;
    mismatchUnits: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

interface ReceiveReturnLineInput {
  sku: string;
  quantity: number;

  // Traceability
  lot?: string;
  serials?: string[];

  // Evidence
  photos?: string[];

  // Quick notes
  notes?: string;
}

interface ReturnReceiptLine {
  id: string;
  sku: string;
  quantityReceived: number;

  // Matching
  expectedOnRMA: boolean;
  expectedQuantity?: number;

  // Traceability verification
  lot?: {
    value?: string;
    verified: boolean;
  };

  serials?: {
    value: string;
    verified: boolean;
  }[];

  verificationOutcome: VerificationOutcome;
  verificationNotes?: string;

  // Routing
  routedTo: 'RETURNS_STAGING' | 'QC_INSPECTION' | 'QUARANTINE' | 'REFURB' | 'SCRAP' | 'RTV_STAGING';

  // Evidence
  photos?: string[];
  notes?: string;
}

interface FraudSignal {
  id: string;
  at: Date;

  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  signal:
    | 'SERIAL_NOT_FOUND'
    | 'LOT_NOT_FOUND'
    | 'SKU_NOT_ON_ORDER'
    | 'EXCESS_QUANTITY'
    | 'RETURN_WINDOW_EXCEEDED'
    | 'MULTIPLE_RETURNS_SAME_SERIAL'
    | 'SUSPICIOUS_DAMAGE_PATTERN';

  description: string;
  recommendedAction: 'HOLD_FOR_REVIEW' | 'REJECT_RETURN' | 'ROUTE_TO_SECURITY' | 'ROUTE_TO_QC';
}

const RETURNS_RECEIVING_VOICE_COMMANDS = [
  "Start returns receiving for RMA {rma}",
  "Scan returned item",
  "Record serial {serial}",
  "Record lot {lot}",
  "Hold this return for review",
  "Close returns receipt",
];
```

---

## 🧪 3. Triage, Condition Grading & Inspection

### Standardized return condition grading
```typescript
type ConditionGrade = 'A' | 'B' | 'C' | 'D' | 'F';

type InspectionTrigger = 'ALL_RETURNS' | 'RISK_BASED' | 'VALUE_BASED' | 'RANDOM' | 'CATEGORY_BASED' | 'MANUAL';

interface ReturnsTriage {
  triageItem: (input: TriageInput) => Promise<TriageResult>;
  createReturnInspection: (receiptLineId: string, templateId?: string) => Promise<string>;

  // Rules
  getTriageRules: (clientId?: string) => Promise<TriageRules>;
  evaluateTrigger: (receiptId: string) => Promise<InspectionTriggerDecision>;
}

interface TriageInput {
  receiptId: string;
  receiptLineId: string;

  // Observation
  conditionGrade: ConditionGrade;
  packagingIntact: boolean;
  accessoriesIncluded: boolean;

  // Notes
  notes?: string;

  // Evidence
  photos?: string[];

  // Optional measurement
  measurements?: {
    name: string;
    measured: number;
    unit: string;
    withinSpec?: boolean;
  }[];
}

interface TriageResult {
  triagedAt: Date;
  triagedBy: string;

  conditionGrade: ConditionGrade;
  notes?: string;
  photos?: string[];

  // Decision
  suggestedDisposition: DispositionDecision;
  confidence: number; // 0-1

  // Flags
  flags: {
    type:
      | 'POSSIBLE_FRAUD'
      | 'SAFETY_RISK'
      | 'RECALL_RELATED'
      | 'MISSING_SERIAL'
      | 'MISSING_PARTS'
      | 'COUNTERFEIT_RISK'
      | 'QUARANTINE_REQUIRED';
    message: string;
  }[];
}

interface TriageRules {
  inspectionTrigger: InspectionTrigger;

  // Default actions by grade
  defaultDispositionByGrade: Map<ConditionGrade, DispositionDecision>;

  // Category rules
  categoryOverrides?: {
    category: string;
    dispositionByGrade: Map<ConditionGrade, DispositionDecision>;
    alwaysInspect: boolean;
  }[];

  // Fraud controls
  fraudControls: {
    requireSerialForWarranty: boolean;
    holdIfSerialMissing: boolean;
    holdIfOrderMismatch: boolean;
  };

  // Quarantine rules
  quarantine: {
    quarantineIfRecall: boolean;
    quarantineIfUnknownLot: boolean;
    quarantineIfSafetyRisk: boolean;
  };
}

interface InspectionTriggerDecision {
  decidedAt: Date;
  trigger: InspectionTrigger;
  reason: string;
  itemsToInspect: string[]; // receiptLineIds
}

const RETURNS_TRIAGE_VOICE_COMMANDS = [
  "Grade return as A",
  "Grade return as B",
  "Grade return as C",
  "Route to quarantine",
  "Route to refurbishment",
  "Create inspection",
];
```

---

## 🧭 4. Disposition Engine

### Policy-driven disposition with full traceability
```typescript
type DispositionDecision =
  | 'RESTOCK'
  | 'REFURBISH'
  | 'REWORK'
  | 'SCRAP'
  | 'QUARANTINE'
  | 'RETURN_TO_VENDOR'
  | 'DONATE'
  | 'RESALE_SECONDARY'
  | 'CUSTOMER_RETURN_BACK'
  | 'HOLD_FOR_REVIEW';

interface DispositionEngine {
  decideDisposition: (input: DispositionInput) => Promise<DispositionRecommendation>;
  applyDisposition: (receiptLineId: string, decision: ApplyDispositionInput) => Promise<void>;

  // Work queues
  getWorkQueue: (queue: DispositionDecision) => Promise<ReturnWorkItem[]>;
}

interface DispositionInput {
  sku: string;
  lot?: string;
  serial?: string;

  // Condition
  conditionGrade: ConditionGrade;
  packagingIntact: boolean;
  accessoriesIncluded: boolean;

  // Risk
  fraudSignals?: string[];
  safetyFlags?: string[];

  // Policy
  clientId?: string;
  customerId?: string;
  returnType?: ReturnType;
}

interface DispositionRecommendation {
  recommended: DispositionDecision;
  alternatives: {
    decision: DispositionDecision;
    score: number; // 0-100
    reason: string;
  }[];

  // Notes
  reason: string;
  confidence: number; // 0-1

  // Required actions
  requiredActions: {
    action: string;
    ownerRole: string;
    required: boolean;
  }[];

  // Inventory impact
  inventoryImpact: {
    returnToAvailable: boolean;
    quarantine: boolean;
    createsWorkOrder?: boolean;
    rtvRequired?: boolean;
  };
}

interface ApplyDispositionInput {
  decision: DispositionDecision;
  appliedBy: string;
  appliedAt: Date;

  notes?: string;
  photos?: string[];

  // Controls
  requiresApproval?: boolean;
  approvedBy?: string;

  // Routing
  routeToLocation?: string;

  // Financial
  salvageValue?: number;
  scrapCost?: number;
}

interface ReturnWorkItem {
  id: string;
  receiptLineId: string;
  rmaNumber: string;
  sku: string;

  decision: DispositionDecision;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  assignedTo?: string;
  createdAt: Date;
  dueAt?: Date;
}

const DISPOSITION_VOICE_COMMANDS = [
  "Recommend disposition",
  "Restock this return",
  "Quarantine this return",
  "Scrap this item",
  "Send to vendor return",
  "Show returns work queue",
];
```

---

## 🏭 5. Restock & Inventory Reintegration

### Controlled restock with QC gates
```typescript
interface RestockSystem {
  // Restock
  createRestockPutawayTask: (receiptLineId: string) => Promise<string>;
  restockToLocation: (taskId: string, location: string) => Promise<void>;

  // Controls
  requireQCApproval: (sku: string) => Promise<boolean>;
  ensureQuarantineCleared: (receiptLineId: string) => Promise<boolean>;

  // Accounting
  recordInventoryAdjustment: (adjustment: InventoryAdjustment) => Promise<void>;
}

interface InventoryAdjustment {
  at: Date;
  sku: string;
  lot?: string;
  serial?: string;
  quantity: number;
  unit: string;

  reasonCode: 'RETURN_RESTOCK' | 'RETURN_SCRAP' | 'RETURN_REFURB' | 'RETURN_RTV';
  referenceId: string; // receiptLineId or workOrderId

  performedBy: string;
  notes?: string;
}

const RESTOCK_VOICE_COMMANDS = [
  "Create restock putaway",
  "Put away return to location {location}",
  "Show restock tasks",
];
```

---

## 🚚 6. Return-To-Vendor (RTV)

### Vendor claims + authorization + shipping
```typescript
type RTVStatus = 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PACKING' | 'SHIPPED' | 'CLOSED';

interface RTVSystem {
  createRTV: (input: CreateRTVRequest) => Promise<RTV>;
  requestAuthorization: (rtvId: string) => Promise<void>;
  approveRTV: (rtvId: string, approvedBy: string) => Promise<void>;
  shipRTV: (rtvId: string, shipment: RTVShipment) => Promise<void>;

  getRTV: (rtvId: string) => Promise<RTV>;
  searchRTVs: (filters: RTVFilters) => Promise<RTV[]>;
}

interface CreateRTVRequest {
  supplierId: string;
  supplierName?: string;

  reason: string;
  relatedRMA?: string;

  lines: {
    sku: string;
    lot?: string;
    serials?: string[];
    quantity: number;
    unit: string;

    defectReasonCode?: string;
    evidence?: string[];
  }[];
}

interface RTV {
  id: string;
  rtvNumber: string;

  supplierId: string;
  supplierName?: string;

  status: RTVStatus;
  reason: string;

  lines: {
    sku: string;
    lot?: string;
    serials?: string[];
    quantity: number;
    unit: string;
    evidence?: string[];
  }[];

  // Authorization
  authorization: {
    requestedAt?: Date;
    requestedBy?: string;
    vendorRA?: string;
    approvedAt?: Date;
    approvedBy?: string;
    notes?: string;
  };

  // Shipment
  shipment?: RTVShipment;

  createdAt: Date;
  updatedAt: Date;
}

interface RTVShipment {
  shippedAt: Date;
  shippedBy: string;

  carrier: string;
  serviceLevel?: string;
  trackingNumber?: string;

  // Docs
  packingListUrl?: string;
  labels?: string[];
}

interface RTVFilters {
  supplierId?: string;
  status?: RTVStatus[];
  createdFrom?: Date;
  createdTo?: Date;
}

const RTV_VOICE_COMMANDS = [
  "Create RTV",
  "Request vendor authorization",
  "Ship RTV",
  "Show RTV status",
];
```

---

## 📊 Part 1 Summary

### Core Features Covered
✅ RMA lifecycle + eligibility policy  
✅ Returns receiving + serial/lot verification + fraud signals  
✅ Triage + condition grading + inspection triggers  
✅ Disposition engine + queues  
✅ Restock + inventory reintegration controls  
✅ Return-to-vendor workflows

**Voice Commands in Part 1**: 30+ commands

**Coming in Part 2 (Advanced)**:
- Predictive returns forecasting + staffing
- Automated credit decisioning + dispute workflows
- Advanced refurbishment work orders + QA gates
- Marketplace resale automation + grading
- Customer self-service portal flows + AI agent
- Fraud detection ML + network signals

---

## 🎯 Success Metrics (Part 1)

- 40%+ faster returns receiving with voice workflows
- 50%+ reduction in “unknown return” processing time
- 25%+ higher restock recovery rate via standardized grading
- 30%+ reduction in fraudulent returns via traceability checks
- Full disposition traceability for audits and customer disputes

**Module 13 Part 1: Returns Management - Production Ready** ✅
```