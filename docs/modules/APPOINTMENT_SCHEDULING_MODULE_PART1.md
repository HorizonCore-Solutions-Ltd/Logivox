# 📅 Appointment Scheduling Module - Part 1: Core Dock Appointments (Enterprise)

**Module**: 15A - Appointment Scheduling (Core)  
**Status**: ✅ Complete Specification - Part 1 of 2  
**Part**: Dock Appointment Booking, Capacity, Check-In, and Yard/Dock Handoffs

---

## 📋 Overview

Appointment Scheduling coordinates inbound receiving and outbound shipping by managing carrier booking, dock capacity, labor/equipment constraints, and time-window compliance.

Part 1 provides the enterprise baseline: appointment requests, confirmations, reschedules, dock door assignment, check-in, and operational exceptions.

### Core Capabilities

- **Inbound & Outbound Appointments** (receipts, ASNs, POs, shipments, transfers)
- **Capacity & Slotting** (doors, lanes, shifts, constraints)
- **Carrier Self-Scheduling** (portal/API) with approvals
- **Check-In / Check-Out** (arrival, dock-in, dock-out, departure)
- **Exceptions** (late, no-show, early arrival, wrong trailer, paperwork missing)
- **Integration Hooks** (Yard, Receiving, Shipping, Wave Planning)

---

## 🧱 1. Core Data Model

```typescript
type AppointmentDirection = "INBOUND" | "OUTBOUND" | "TRANSFER" | "OTHER";

type AppointmentStatus =
  | "REQUESTED"
  | "PENDING_APPROVAL"
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "AT_DOOR"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED"
  | "EXCEPTION";

type AppointmentPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

type AppointmentSource = "UI" | "CARRIER_PORTAL" | "API" | "EDI" | "SYSTEM";

type TimeWindowType = "FIXED" | "FLEX" | "OPEN";

interface AppointmentSystem {
  // Policies & capacity
  createDockSchedule: (schedule: DockSchedule) => Promise<string>;
  upsertCapacityRule: (rule: CapacityRule) => Promise<string>;
  getAvailableSlots: (query: AvailableSlotsQuery) => Promise<AvailableSlot[]>;

  // Appointment lifecycle
  requestAppointment: (request: AppointmentRequest) => Promise<Appointment>;
  approveAppointment: (
    appointmentId: string,
    approverId: string,
  ) => Promise<void>;
  confirmAppointment: (appointmentId: string) => Promise<void>;
  rescheduleAppointment: (
    appointmentId: string,
    input: RescheduleInput,
  ) => Promise<void>;
  cancelAppointment: (appointmentId: string, reason: string) => Promise<void>;

  // Arrival & execution
  checkIn: (appointmentId: string, input: CheckInInput) => Promise<void>;
  assignDoor: (
    appointmentId: string,
    doorId: string,
    userId: string,
  ) => Promise<void>;
  startService: (appointmentId: string, userId: string) => Promise<void>;
  completeService: (appointmentId: string, userId: string) => Promise<void>;
  checkOut: (appointmentId: string, input: CheckOutInput) => Promise<void>;

  // Visibility
  getAppointment: (appointmentId: string) => Promise<Appointment>;
  searchAppointments: (
    filters: AppointmentSearchFilters,
  ) => Promise<Appointment[]>;
  getKPIs: (period: DateRange) => Promise<AppointmentKPIs>;
}

interface DockSchedule {
  id: string;
  warehouseId: string;

  timezone: string;

  // Doors and lanes that can be booked
  resources: {
    doors: DockDoor[];
    lanes?: DockLane[];
  };

  // Operating hours
  shifts: {
    name: string;
    daysOfWeek: number[]; // 0-6
    startTime: string; // HH:mm
    endTime: string; // HH:mm

    // optional rules by shift
    defaultSlotMinutes: number;
  }[];

  holidays?: { date: string; reason?: string }[];

  createdAt: Date;
  active: boolean;
}

interface DockDoor {
  doorId: string;
  name: string;

  capabilities: {
    trailerTypes?: string[];
    maxTrailerLengthFt?: number;
    refrigerated?: boolean;
    hazmatAllowed?: boolean;
  };

  // Optional restrictions
  allowedCarriers?: string[];
  allowedSuppliers?: string[];
}

interface DockLane {
  laneId: string;
  name: string;
  nearDoorIds?: string[];
}

interface CapacityRule {
  id: string;
  warehouseId: string;

  appliesTo: {
    direction?: AppointmentDirection;
    clientId?: string; // 3PL
    carrier?: string;
    supplierId?: string;
    customerId?: string;
    skuCategory?: string;
  };

  constraints: {
    // How much can be scheduled
    maxAppointmentsPerHour?: number;
    maxTrailersPerHour?: number;

    // Resource constraints
    requiredDoorCapabilities?: Partial<DockDoor["capabilities"]>;

    // Labor/equipment
    minForklifts?: number;
    minDockTeams?: number;

    // Slotting
    minSlotMinutes?: number;
    maxSlotMinutes?: number;
    defaultSlotMinutes?: number;

    // Time windows
    allowEarlyArrivalMinutes?: number;
    allowLateArrivalMinutes?: number;
  };

  priority: number; // higher wins
  active: boolean;
}

interface Appointment {
  id: string;
  appointmentNumber: string;

  warehouseId: string;
  clientId?: string;

  direction: AppointmentDirection;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  source: AppointmentSource;

  reference: {
    asnId?: string;
    receiptId?: string;
    poNumber?: string;

    shipmentId?: string;
    orderIds?: string[];
    routeId?: string;

    transferId?: string;
  };

  carrier: {
    carrierId?: string;
    carrierName?: string;
    scac?: string;

    driverName?: string;
    driverPhone?: string;
  };

  trailer: {
    trailerId?: string;
    trailerType?: string;
    trailerLengthFt?: number;
    sealNumber?: string;
    temperatureSetPointC?: number;
  };

  timeWindow: {
    type: TimeWindowType;
    // requested
    requestedStart?: Date;
    requestedEnd?: Date;

    // scheduled
    scheduledStart: Date;
    scheduledEnd: Date;

    // actual
    checkedInAt?: Date;
    atDoorAt?: Date;
    serviceStartAt?: Date;
    serviceEndAt?: Date;
    checkedOutAt?: Date;
  };

  resources: {
    assignedDoorId?: string;
    stagingLaneId?: string;
    yardSpotId?: string;
  };

  notes?: string;

  exceptions: AppointmentException[];

  createdAt: Date;
  updatedAt: Date;
}

interface AppointmentException {
  id: string;
  at: Date;

  type:
    | "EARLY_ARRIVAL"
    | "LATE_ARRIVAL"
    | "NO_SHOW"
    | "WRONG_TRAILER"
    | "PAPERWORK_MISSING"
    | "DOOR_UNAVAILABLE"
    | "CAPACITY_OVERBOOK"
    | "SECURITY_HOLD"
    | "QC_HOLD"
    | "OTHER";

  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;

  recommendedAction:
    | "RESCHEDULE"
    | "HOLD_IN_YARD"
    | "CHANGE_DOOR"
    | "ESCALATE"
    | "ALLOW_EXCEPTION"
    | "CANCEL";

  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}
```

---

## 🗓️ 2. Slot Search & Booking

```typescript
interface AvailableSlotsQuery {
  warehouseId: string;
  clientId?: string;

  direction: AppointmentDirection;

  // desired window
  from: Date;
  to: Date;

  // constraints
  carrier?: string;
  supplierId?: string;
  customerId?: string;

  trailerType?: string;
  trailerLengthFt?: number;
  refrigerated?: boolean;
  hazmat?: boolean;

  // load profile
  expectedPallets?: number;
  expectedCartons?: number;
  expectedDurationMinutes?: number;

  // resource preference
  preferredDoorIds?: string[];
  preferredShiftName?: string;
}

interface AvailableSlot {
  start: Date;
  end: Date;

  // optional pre-selection
  doorId?: string;

  // reason codes for ranking
  score: {
    fit: number; // 0-100
    congestion: number; // 0-100 (lower is better)
    notes?: string[];
  };
}

interface AppointmentRequest {
  warehouseId: string;
  clientId?: string;

  direction: AppointmentDirection;
  priority?: AppointmentPriority;
  source: AppointmentSource;

  reference: Appointment["reference"];

  carrier: Appointment["carrier"];
  trailer: Appointment["trailer"];

  requested: {
    windowType: TimeWindowType;
    requestedStart?: Date;
    requestedEnd?: Date;
    from?: Date;
    to?: Date;

    // if open/flex, desired duration
    durationMinutes?: number;
  };

  loadProfile?: {
    expectedPallets?: number;
    expectedCartons?: number;
    expectedWeightKg?: number;
  };

  notes?: string;
}

interface RescheduleInput {
  newStart: Date;
  newEnd: Date;
  reason: string;
  requestedBy: string;
}

const APPOINTMENT_BOOKING_VOICE_COMMANDS = [
  "Show available dock slots",
  "Request appointment",
  "Approve appointment",
  "Confirm appointment",
  "Reschedule appointment",
  "Cancel appointment",
];
```

---

## ✅ 3. Check-In, Door Assignment, and Service Execution

```typescript
interface CheckInInput {
  arrivedAt: Date;
  gateId?: string;

  // verify carrier/trailer
  trailerId?: string;
  sealNumber?: string;
  driverName?: string;

  // paperwork
  paperworkReceived: boolean;
  paperworkRefs?: string[];

  // optional yard spot
  yardSpotId?: string;

  checkedInBy: string;
}

interface CheckOutInput {
  departedAt: Date;
  documentsIssuedRefs?: string[];
  checkedOutBy: string;
}

interface AppointmentOps {
  // Derived operational times
  calculateKPI: (appointmentId: string) => Promise<AppointmentDerivedTimes>;

  // Enforcement
  enforceArrivalWindow: (
    appointmentId: string,
  ) => Promise<ArrivalWindowDecision>;
}

interface AppointmentDerivedTimes {
  appointmentId: string;

  // waiting
  minutesEarly?: number;
  minutesLate?: number;
  minutesWaitToDoor?: number;

  // service
  minutesInService?: number;

  // total
  minutesTotalOnSite?: number;
}

interface ArrivalWindowDecision {
  decisionAt: Date;

  action: "ALLOW" | "HOLD_IN_YARD" | "RESCHEDULE_REQUIRED" | "ESCALATE";
  reason: string;

  // guardrails
  allowIfDoorAvailable?: boolean;
  allowIfLowCongestion?: boolean;
}

const APPOINTMENT_EXECUTION_VOICE_COMMANDS = [
  "Check in appointment",
  "Assign door",
  "Start appointment service",
  "Complete appointment service",
  "Check out appointment",
  "Show appointment exceptions",
];
```

---

## 🔁 4. Integration Touchpoints (Core)

### Receiving

- Appointment linked to `asnId`/`receiptId`
- Check-in can trigger **pre-receiving** and create a receiving task

### Shipping

- Appointment linked to `shipmentId`/`routeId`
- Door assignment informs staging lane priority and cutoff risk

### Yard Management

- Optional `yardSpotId` and gate check-in/out events

### Wave Planning

- Outbound appointment time windows should constrain wave release and pick/pack completion targets

---

## 📊 5. KPIs & Dashboards (Part 1)

```typescript
interface AppointmentKPIs {
  period: DateRange;

  totalAppointments: number;
  inboundAppointments: number;
  outboundAppointments: number;

  onTimeArrivalPercent: number;
  noShowPercent: number;

  avgWaitToDoorMinutes: number;
  p95WaitToDoorMinutes: number;

  avgServiceMinutes: number;
  p95ServiceMinutes: number;

  avgTotalOnSiteMinutes: number;

  // capacity
  utilizationPercent: number; // doors over time
  overbookEvents: number;

  topExceptions: { type: string; count: number; impact: string }[];
}
```

---

## 📌 Part 1 Summary

### Enterprise Features Covered

✅ Dock schedules + doors/lanes + shift hours  
✅ Capacity rules (labor/equipment/resource constraints)  
✅ Slot search + carrier portal/API booking + approvals  
✅ Full appointment lifecycle (request → schedule → execute → complete)  
✅ Check-in/out with exception handling and enforcement  
✅ KPI model for operational dashboards

**Voice Commands in Part 1**: 20+ commands

**Coming in Part 2 (Advanced)**:

- AI slot optimization and dynamic pricing / priority bidding
- Predictive no-show and late arrival scoring
- Disruption-aware auto-reschedules with multi-party negotiation
- IoT/CV-assisted trailer validation at gate and door
- Autonomous orchestration across Yard + Dock + Labor

---

## 🎯 Success Metrics (Part 1)

- 20–35% reduction in average wait-to-door time
- 15–25% improvement in dock utilization
- 30% fewer no-shows with confirmations + enforcement
- 95%+ appointment data completeness at check-in

**Module 15 Part 1: Appointment Scheduling - Production Ready** ✅
