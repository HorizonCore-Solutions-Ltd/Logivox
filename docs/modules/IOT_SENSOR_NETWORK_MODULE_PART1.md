# 📡 IoT & Sensor Network Module - Part 1: Core Enterprise Infrastructure

**Module**: 19A - IoT & Sensor Network (Core)  
**Status**: ✅ Complete Specification - Part 1 of 2  
**Part**: Device Management, Telemetry, Event Processing, Environmental Monitoring, Asset Tracking

---

## 📋 Overview

Part 1 establishes LogiVox's core IoT and sensor infrastructure: device provisioning, real-time telemetry collection, event stream processing, environmental monitoring (temperature, humidity, air quality), asset tracking (RFID, BLE, GPS), and fleet sensor integration.

This foundation enables real-time operational visibility, predictive maintenance, compliance monitoring, and data-driven optimization across the warehouse.

### Core Capabilities
- **Device Management**: Provision, configure, and monitor IoT devices at scale
- **Telemetry Collection**: Real-time data ingestion from sensors, RFID, beacons, equipment
- **Event Stream Processing**: Process, filter, aggregate, and route sensor events
- **Environmental Monitoring**: Temperature, humidity, air quality, light, noise
- **Asset Tracking**: Real-time location tracking via RFID, BLE, GPS, UWB
- **Fleet Sensors**: Monitor forklifts, AGVs, conveyors, dock equipment

---

## 🏗️ 1. IoT Device Management

### Goal
Centralized lifecycle management for all IoT devices: sensors, beacons, RFID readers, gateways, edge devices.

```typescript
type DeviceType =
  | 'TEMPERATURE_SENSOR'
  | 'HUMIDITY_SENSOR'
  | 'AIR_QUALITY_SENSOR'
  | 'MOTION_SENSOR'
  | 'RFID_READER'
  | 'BLE_BEACON'
  | 'GPS_TRACKER'
  | 'UWB_ANCHOR'
  | 'GATEWAY'
  | 'EDGE_DEVICE'
  | 'SCALE'
  | 'LIGHT_SENSOR'
  | 'NOISE_SENSOR'
  | 'VIBRATION_SENSOR';

type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR' | 'DECOMMISSIONED';

type ConnectivityProtocol = 'MQTT' | 'HTTP' | 'COAP' | 'LORAWAN' | 'ZIGBEE' | 'BLUETOOTH' | 'WIFI' | 'ETHERNET';

interface IoTDeviceManagement {
  // Device lifecycle
  registerDevice: (device: DeviceRegistration) => Promise<string>; // device ID
  updateDevice: (deviceId: string, updates: Partial<IoTDevice>) => Promise<void>;
  decommissionDevice: (deviceId: string, reason?: string) => Promise<void>;
  
  // Configuration
  configureDevice: (deviceId: string, config: DeviceConfig) => Promise<void>;
  getDeviceConfig: (deviceId: string) => Promise<DeviceConfig>;
  
  // Monitoring
  getDevice: (deviceId: string) => Promise<IoTDevice>;
  listDevices: (filters?: DeviceFilters) => Promise<IoTDevice[]>;
  getDeviceHealth: (deviceId: string) => Promise<DeviceHealth>;
  
  // Bulk operations
  bulkUpdateDevices: (deviceIds: string[], updates: Partial<IoTDevice>) => Promise<void>;
  
  // Firmware
  updateFirmware: (deviceId: string, firmwareVersion: string) => Promise<string>; // job ID
}

interface DeviceRegistration {
  name: string;
  type: DeviceType;
  
  // Connectivity
  protocol: ConnectivityProtocol;
  connectionString?: string;
  
  // Location
  warehouseId: string;
  zone?: string;
  location?: {
    x: number;
    y: number;
    z?: number;
  };
  
  // Hardware
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  
  // Configuration
  config?: DeviceConfig;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

interface IoTDevice {
  id: string;
  name: string;
  type: DeviceType;
  
  status: DeviceStatus;
  
  // Connectivity
  protocol: ConnectivityProtocol;
  connectionString?: string;
  lastSeen?: Date;
  
  // Location
  warehouseId: string;
  zone?: string;
  location?: {
    x: number;
    y: number;
    z?: number;
  };
  
  // Hardware
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  
  // Configuration
  config: DeviceConfig;
  
  // Lifecycle
  registeredAt: Date;
  lastMaintenanceAt?: Date;
  nextMaintenanceDue?: Date;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

interface DeviceConfig {
  // Sampling
  samplingIntervalSeconds?: number;
  
  // Thresholds
  thresholds?: {
    metric: string;
    min?: number;
    max?: number;
    alertOnViolation: boolean;
  }[];
  
  // Data retention
  localBufferSize?: number;
  localRetentionHours?: number;
  
  // Power management
  powerMode?: 'ALWAYS_ON' | 'LOW_POWER' | 'SCHEDULED';
  scheduleActive?: {
    start: string; // HH:MM
    end: string;
  }[];
  
  // Advanced
  customSettings?: Record<string, unknown>;
}

interface DeviceFilters {
  warehouseId?: string;
  zone?: string;
  type?: DeviceType;
  status?: DeviceStatus;
  manufacturer?: string;
}

interface DeviceHealth {
  deviceId: string;
  
  overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  
  metrics: {
    batteryLevel?: number; // %
    signalStrength?: number; // dBm
    uptime?: number; // seconds
    
    messagesSent: number;
    messagesLost: number;
    errorRate: number; // %
    
    lastSuccessfulMessage?: Date;
    consecutiveFailures: number;
  };
  
  issues: {
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    detectedAt: Date;
  }[];
}

const DEVICE_MANAGEMENT_VOICE_COMMANDS = [
  "Register new sensor",
  "Show device status",
  "Configure device {name}",
  "Check device health",
  "Update firmware",
];
```

---

## 📊 2. Real-Time Telemetry Collection

### Goal
Ingest, validate, and store sensor data at scale with low latency.

```typescript
type TelemetryDataType = 'NUMERIC' | 'BOOLEAN' | 'STRING' | 'JSON' | 'BINARY';

interface TelemetryService {
  // Publish telemetry
  publishTelemetry: (data: TelemetryMessage) => Promise<void>;
  publishBatch: (messages: TelemetryMessage[]) => Promise<void>;
  
  // Query telemetry
  queryTelemetry: (query: TelemetryQuery) => Promise<TelemetryResult>;
  
  // Real-time streaming
  subscribeTelemetry: (subscription: TelemetrySubscription, callback: (data: TelemetryMessage) => void) => Promise<string>; // subscription ID
  unsubscribe: (subscriptionId: string) => Promise<void>;
  
  // Aggregations
  getAggregatedData: (query: AggregationQuery) => Promise<AggregatedData>;
}

interface TelemetryMessage {
  // Source
  deviceId: string;
  
  // Timestamp
  timestamp: Date;
  
  // Data
  measurements: {
    metric: string;
    value: number | boolean | string | Record<string, unknown>;
    unit?: string;
    dataType: TelemetryDataType;
  }[];
  
  // Context
  location?: {
    warehouseId: string;
    zone?: string;
    coordinates?: { x: number; y: number; z?: number };
  };
  
  // Quality
  quality?: 'GOOD' | 'UNCERTAIN' | 'BAD';
  
  // Metadata
  metadata?: Record<string, unknown>;
}

interface TelemetryQuery {
  // Devices
  deviceIds?: string[];
  deviceTypes?: DeviceType[];
  
  // Time range
  startTime: Date;
  endTime: Date;
  
  // Metrics
  metrics?: string[];
  
  // Location
  warehouseId?: string;
  zone?: string;
  
  // Pagination
  limit?: number;
  offset?: number;
  
  // Sorting
  orderBy?: 'timestamp' | 'deviceId' | 'metric';
  orderDirection?: 'ASC' | 'DESC';
}

interface TelemetryResult {
  data: TelemetryMessage[];
  
  totalCount: number;
  
  // Pagination
  hasMore: boolean;
  nextOffset?: number;
}

interface TelemetrySubscription {
  // Filter
  deviceIds?: string[];
  deviceTypes?: DeviceType[];
  metrics?: string[];
  
  warehouseId?: string;
  zone?: string;
  
  // Conditions
  conditions?: {
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
    value: number | boolean | string;
  }[];
}

interface AggregationQuery {
  deviceIds?: string[];
  metrics: string[];
  
  startTime: Date;
  endTime: Date;
  
  // Aggregation
  aggregation: 'AVG' | 'MIN' | 'MAX' | 'SUM' | 'COUNT' | 'STDDEV';
  groupBy: 'DEVICE' | 'METRIC' | 'HOUR' | 'DAY' | 'ZONE';
  
  // Interval
  intervalMinutes?: number;
}

interface AggregatedData {
  groups: {
    groupKey: string; // deviceId, metric, hour, day, or zone
    
    aggregates: {
      metric: string;
      value: number;
      count: number;
    }[];
  }[];
}

const TELEMETRY_VOICE_COMMANDS = [
  "Show telemetry for {device}",
  "Query sensor data",
  "Subscribe to temperature alerts",
  "Show average humidity",
];
```

---

## ⚡ 3. Event Stream Processing

### Goal
Process, filter, aggregate, and route sensor events in real-time for alerts, analytics, and integrations.

```typescript
type EventType =
  | 'THRESHOLD_VIOLATION'
  | 'DEVICE_OFFLINE'
  | 'BATTERY_LOW'
  | 'ENVIRONMENTAL_ALERT'
  | 'ASSET_MOVED'
  | 'GEOFENCE_BREACH'
  | 'ANOMALY_DETECTED'
  | 'MAINTENANCE_DUE';

interface EventStreamProcessing {
  // Stream management
  createStream: (config: StreamConfig) => Promise<string>; // stream ID
  updateStream: (streamId: string, config: Partial<StreamConfig>) => Promise<void>;
  deleteStream: (streamId: string) => Promise<void>;
  
  // Processing rules
  createRule: (streamId: string, rule: ProcessingRule) => Promise<string>; // rule ID
  updateRule: (ruleId: string, rule: Partial<ProcessingRule>) => Promise<void>;
  deleteRule: (ruleId: string) => Promise<void>;
  
  // Monitoring
  getStreamStatus: (streamId: string) => Promise<StreamStatus>;
  listStreams: () => Promise<EventStream[]>;
}

interface StreamConfig {
  name: string;
  description?: string;
  
  // Input sources
  sources: {
    deviceIds?: string[];
    deviceTypes?: DeviceType[];
    metrics?: string[];
  };
  
  // Processing
  bufferSizeMessages?: number;
  processingIntervalSeconds?: number;
  
  // Output
  outputs: {
    type: 'WEBHOOK' | 'MQTT' | 'DATABASE' | 'EMAIL' | 'SMS' | 'INTERNAL_EVENT';
    config: Record<string, unknown>;
  }[];
  
  // Retention
  retentionDays?: number;
}

interface ProcessingRule {
  name: string;
  enabled: boolean;
  
  // Trigger
  trigger: {
    eventType?: EventType;
    
    // Conditions
    conditions: {
      field: string; // e.g., 'measurements.temperature.value'
      operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'IN' | 'NOT_IN';
      value: unknown;
    }[];
    
    // All conditions must match (AND) or any (OR)?
    matchAll: boolean;
  };
  
  // Actions
  actions: {
    type: 'ALERT' | 'AGGREGATE' | 'TRANSFORM' | 'ROUTE' | 'SUPPRESS';
    config: Record<string, unknown>;
  }[];
  
  // Rate limiting
  rateLimitPerMinute?: number;
  
  // Priority
  priority: number; // 1-10, higher = first
}

interface EventStream {
  id: string;
  name: string;
  config: StreamConfig;
  
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  
  // Statistics
  stats: {
    messagesProcessed: number;
    messagesFiltered: number;
    rulesTriggered: number;
    
    avgProcessingTimeMs: number;
    lastProcessedAt?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

interface StreamStatus {
  streamId: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  
  // Real-time metrics
  currentThroughput: number; // messages/sec
  avgLatencyMs: number;
  errorRate: number; // %
  
  // Buffer
  bufferUsage: number; // %
  
  // Recent errors
  recentErrors: {
    timestamp: Date;
    error: string;
  }[];
}

const EVENT_STREAM_VOICE_COMMANDS = [
  "Create alert stream",
  "Show stream status",
  "Add processing rule",
  "Pause event stream",
];
```

---

## 🌡️ 4. Environmental Monitoring

### Goal
Monitor warehouse environmental conditions for compliance, worker comfort, and inventory preservation.

```typescript
interface EnvironmentalMonitoring {
  // Zone configuration
  configureZone: (config: ZoneEnvironmentalConfig) => Promise<string>; // zone config ID
  
  // Current conditions
  getCurrentConditions: (warehouseId: string, zone?: string) => Promise<EnvironmentalConditions>;
  
  // Historical data
  getConditionsHistory: (query: ConditionsQuery) => Promise<ConditionsHistory>;
  
  // Alerts
  getEnvironmentalAlerts: (filters: AlertFilters) => Promise<EnvironmentalAlert[]>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
}

interface ZoneEnvironmentalConfig {
  warehouseId: string;
  zone: string;
  
  // Requirements
  requirements: {
    temperature?: {
      min: number;
      max: number;
      unit: 'C' | 'F';
      critical: boolean; // trigger critical alert?
    };
    
    humidity?: {
      min: number;
      max: number;
      critical: boolean;
    };
    
    airQuality?: {
      maxCO2ppm?: number;
      maxVOCppb?: number;
      minAirQualityIndex?: number;
    };
    
    light?: {
      minLux: number;
      maxLux: number;
    };
    
    noise?: {
      maxDecibels: number;
    };
  };
  
  // Monitoring
  checkIntervalSeconds: number;
  
  // Alerts
  alertContacts: string[];
  escalationDelayMinutes?: number;
}

interface EnvironmentalConditions {
  warehouseId: string;
  zone?: string;
  timestamp: Date;
  
  // Measurements
  temperature?: {
    value: number;
    unit: 'C' | 'F';
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  };
  
  humidity?: {
    value: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  };
  
  airQuality?: {
    co2ppm?: number;
    vocppb?: number;
    pm25?: number;
    pm10?: number;
    airQualityIndex?: number;
    status: 'GOOD' | 'MODERATE' | 'UNHEALTHY' | 'HAZARDOUS';
  };
  
  light?: {
    lux: number;
    status: 'NORMAL' | 'TOO_DARK' | 'TOO_BRIGHT';
  };
  
  noise?: {
    decibels: number;
    status: 'NORMAL' | 'LOUD';
  };
  
  // Overall
  overallStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

interface ConditionsQuery {
  warehouseId: string;
  zone?: string;
  
  startTime: Date;
  endTime: Date;
  
  metrics?: ('temperature' | 'humidity' | 'airQuality' | 'light' | 'noise')[];
  
  // Aggregation
  intervalMinutes?: number;
}

interface ConditionsHistory {
  dataPoints: {
    timestamp: Date;
    conditions: EnvironmentalConditions;
  }[];
  
  // Summary
  summary: {
    metric: string;
    avg: number;
    min: number;
    max: number;
    stdDev: number;
  }[];
}

interface EnvironmentalAlert {
  id: string;
  timestamp: Date;
  
  warehouseId: string;
  zone: string;
  
  alertType: 'TEMPERATURE' | 'HUMIDITY' | 'AIR_QUALITY' | 'LIGHT' | 'NOISE';
  severity: 'WARNING' | 'CRITICAL';
  
  description: string;
  
  // Measured value
  metric: string;
  value: number;
  threshold: number;
  
  // Status
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  
  resolved: boolean;
  resolvedAt?: Date;
}

interface AlertFilters {
  warehouseId?: string;
  zone?: string;
  alertType?: string;
  severity?: string;
  
  startTime?: Date;
  endTime?: Date;
  
  acknowledged?: boolean;
  resolved?: boolean;
}

const ENVIRONMENTAL_VOICE_COMMANDS = [
  "Check temperature in {zone}",
  "Show environmental conditions",
  "Show air quality",
  "Show environmental alerts",
  "Acknowledge alert {id}",
];
```

---

## 📍 5. Real-Time Asset Tracking

### Goal
Track location and movement of assets, equipment, and inventory using RFID, BLE, GPS, and UWB.

```typescript
type TrackingTechnology = 'RFID' | 'BLE' | 'GPS' | 'UWB' | 'WIFI' | 'BARCODE';

interface AssetTracking {
  // Asset registration
  registerAsset: (asset: AssetRegistration) => Promise<string>; // asset ID
  updateAsset: (assetId: string, updates: Partial<TrackedAsset>) => Promise<void>;
  
  // Location
  getCurrentLocation: (assetId: string) => Promise<AssetLocation>;
  getLocationHistory: (assetId: string, query: LocationHistoryQuery) => Promise<LocationHistory>;
  
  // Geofencing
  createGeofence: (geofence: Geofence) => Promise<string>; // geofence ID
  getGeofenceEvents: (geofenceId: string, filters?: GeofenceEventFilters) => Promise<GeofenceEvent[]>;
  
  // Search
  findAssets: (filters: AssetSearchFilters) => Promise<TrackedAsset[]>;
  findAssetsInZone: (warehouseId: string, zone: string) => Promise<TrackedAsset[]>;
}

interface AssetRegistration {
  name: string;
  type: 'PALLET' | 'CARTON' | 'EQUIPMENT' | 'TOOL' | 'CONTAINER' | 'VEHICLE' | 'OTHER';
  
  // Tracking
  trackingTechnology: TrackingTechnology;
  trackingId: string; // RFID tag ID, BLE MAC, GPS device ID, etc.
  
  // Location
  warehouseId: string;
  initialZone?: string;
  
  // Attributes
  attributes?: {
    sku?: string;
    lot?: string;
    serialNumber?: string;
    owner?: string;
    value?: number;
  };
  
  // Metadata
  metadata?: Record<string, unknown>;
}

interface TrackedAsset {
  id: string;
  name: string;
  type: string;
  
  trackingTechnology: TrackingTechnology;
  trackingId: string;
  
  // Current state
  currentLocation: AssetLocation;
  
  status: 'ACTIVE' | 'INACTIVE' | 'LOST' | 'DECOMMISSIONED';
  
  // Attributes
  attributes?: Record<string, unknown>;
  
  // Lifecycle
  registeredAt: Date;
  lastSeenAt?: Date;
  
  metadata?: Record<string, unknown>;
}

interface AssetLocation {
  assetId: string;
  timestamp: Date;
  
  // Location
  warehouseId: string;
  zone?: string;
  
  coordinates?: {
    x: number;
    y: number;
    z?: number;
    accuracy: number; // meters
  };
  
  // Additional context
  nearbyAssets?: string[];
  nearbyBeacons?: string[];
  
  // Movement
  velocity?: {
    speedMps: number;
    direction?: number; // degrees
  };
}

interface LocationHistoryQuery {
  startTime: Date;
  endTime: Date;
  
  // Sampling
  maxPoints?: number;
  intervalSeconds?: number;
}

interface LocationHistory {
  assetId: string;
  
  points: {
    timestamp: Date;
    location: AssetLocation;
  }[];
  
  // Summary
  summary: {
    totalDistanceM: number;
    avgSpeedMps: number;
    zonesVisited: string[];
    durationSeconds: number;
  };
}

interface Geofence {
  name: string;
  
  warehouseId: string;
  zone?: string;
  
  // Shape
  shape: 'CIRCLE' | 'RECTANGLE' | 'POLYGON';
  coordinates: {
    x: number;
    y: number;
  }[];
  radius?: number; // for circle
  
  // Rules
  rules: {
    assetTypes?: string[];
    assetIds?: string[];
    
    triggerOn: 'ENTER' | 'EXIT' | 'DWELL';
    dwellTimeSeconds?: number; // for DWELL trigger
    
    action: 'ALERT' | 'LOG' | 'WEBHOOK';
    actionConfig: Record<string, unknown>;
  }[];
  
  enabled: boolean;
}

interface GeofenceEvent {
  id: string;
  timestamp: Date;
  
  geofenceId: string;
  geofenceName: string;
  
  assetId: string;
  assetName: string;
  
  eventType: 'ENTER' | 'EXIT' | 'DWELL';
  
  location: {
    x: number;
    y: number;
  };
}

interface GeofenceEventFilters {
  startTime?: Date;
  endTime?: Date;
  assetId?: string;
  eventType?: 'ENTER' | 'EXIT' | 'DWELL';
}

interface AssetSearchFilters {
  warehouseId?: string;
  zone?: string;
  type?: string;
  status?: string;
  trackingTechnology?: TrackingTechnology;
  
  // Attributes
  attributes?: Record<string, unknown>;
}

const ASSET_TRACKING_VOICE_COMMANDS = [
  "Locate asset {name}",
  "Track asset {id}",
  "Show assets in {zone}",
  "Show asset history",
  "Create geofence for {zone}",
  "Show geofence alerts",
];
```

---

## 🚜 6. Fleet Sensor Integration

### Goal
Monitor equipment health, utilization, and location for forklifts, AGVs, conveyors, and dock equipment.

```typescript
type EquipmentType = 'FORKLIFT' | 'AGV' | 'CONVEYOR' | 'DOCK_DOOR' | 'PALLET_JACK' | 'TUGGER' | 'CRANE';

interface FleetSensorIntegration {
  // Equipment registration
  registerEquipment: (equipment: EquipmentRegistration) => Promise<string>; // equipment ID
  
  // Telemetry
  publishEquipmentTelemetry: (data: EquipmentTelemetry) => Promise<void>;
  getEquipmentStatus: (equipmentId: string) => Promise<EquipmentStatus>;
  
  // Fleet monitoring
  getFleetOverview: (warehouseId: string) => Promise<FleetOverview>;
  
  // Maintenance
  predictMaintenance: (equipmentId: string) => Promise<MaintenancePrediction>;
}

interface EquipmentRegistration {
  name: string;
  type: EquipmentType;
  
  warehouseId: string;
  
  // Hardware
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  yearOfManufacture?: number;
  
  // Sensors
  sensors: {
    sensorType: string; // 'engine_hours', 'battery_level', 'speed', 'vibration', etc.
    deviceId: string;
  }[];
  
  // Specifications
  specs?: {
    capacity?: number;
    maxSpeed?: number;
    batteryCapacity?: number;
  };
  
  metadata?: Record<string, unknown>;
}

interface EquipmentTelemetry {
  equipmentId: string;
  timestamp: Date;
  
  // Operational metrics
  metrics: {
    engineHours?: number;
    batteryLevel?: number; // %
    fuelLevel?: number; // %
    
    speed?: number; // km/h
    load?: number; // kg
    
    vibration?: number;
    temperature?: number;
    oilPressure?: number;
    
    // Status indicators
    errorCodes?: string[];
    warningLights?: string[];
  };
  
  // Location
  location?: {
    x: number;
    y: number;
    zone?: string;
  };
  
  // Operator
  operatorId?: string;
}

interface EquipmentStatus {
  equipmentId: string;
  name: string;
  type: EquipmentType;
  
  currentStatus: 'OPERATING' | 'IDLE' | 'CHARGING' | 'MAINTENANCE' | 'ERROR' | 'OFFLINE';
  
  // Latest metrics
  latestMetrics: {
    timestamp: Date;
    
    batteryLevel?: number;
    fuelLevel?: number;
    speed?: number;
    load?: number;
  };
  
  // Location
  currentLocation?: {
    x: number;
    y: number;
    zone?: string;
  };
  
  // Health
  health: 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  
  activeAlerts: {
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
  }[];
  
  // Utilization (today)
  utilizationToday: {
    operatingHours: number;
    idleHours: number;
    utilizationPercent: number;
  };
  
  // Operator
  currentOperator?: string;
  
  lastSeenAt: Date;
}

interface FleetOverview {
  warehouseId: string;
  timestamp: Date;
  
  totalEquipment: number;
  
  // By status
  byStatus: {
    status: string;
    count: number;
  }[];
  
  // By type
  byType: {
    type: EquipmentType;
    count: number;
    avgUtilization: number;
  }[];
  
  // Fleet health
  fleetHealth: {
    good: number;
    fair: number;
    poor: number;
    critical: number;
  };
  
  // Alerts
  activeAlerts: number;
  criticalAlerts: number;
  
  // Utilization
  avgUtilization: number;
  
  // Maintenance
  maintenanceDueCount: number;
}

interface MaintenancePrediction {
  equipmentId: string;
  
  predictedMaintenanceDate: Date;
  confidence: number; // 0-1
  
  // Reasoning
  factors: {
    factor: string; // 'engine_hours', 'vibration_trend', etc.
    contribution: number; // %
    description: string;
  }[];
  
  // Recommendations
  recommendations: {
    action: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedCost?: number;
  }[];
  
  // Risk
  failureRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  impactIfNotAddressed: string;
}

const FLEET_SENSOR_VOICE_COMMANDS = [
  "Show equipment status",
  "Check forklift battery",
  "Show fleet overview",
  "Predict maintenance for {equipment}",
  "Show equipment alerts",
];
```

---

## 📊 Part 1 Summary

### Core IoT Infrastructure Covered
✅ Comprehensive IoT device lifecycle management (register, configure, monitor, firmware)  
✅ Real-time telemetry collection with streaming and aggregations  
✅ Event stream processing with rules, filtering, and routing  
✅ Environmental monitoring (temperature, humidity, air quality, light, noise)  
✅ Real-time asset tracking (RFID, BLE, GPS, UWB) with geofencing  
✅ Fleet sensor integration for equipment health and utilization

**Voice Commands in Part 1**: 30+ commands

---

## 🎯 Success Metrics (Part 1)

- Support 10,000+ IoT devices per warehouse with <500ms ingestion latency
- 99.9%+ uptime for telemetry collection
- Process 100,000+ events/second with <1 second end-to-end latency
- 95%+ accuracy in environmental compliance monitoring
- <3 meter accuracy for indoor asset tracking (RFID/BLE/UWB)
- 30–50% reduction in equipment downtime through predictive maintenance
- Real-time fleet visibility with <5 second update intervals

**Module 19 Part 1: IoT & Sensor Network - Core Enterprise** ✅
