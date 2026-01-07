# Gate Security API Quick Reference

## Authentication

All endpoints require authentication via NextAuth session, except LPR webhook which uses API key.

## 🚗 Vehicle Check & Management

### Check Vehicle Status

```http
POST /api/security/check-vehicle
Content-Type: application/json

{
  "licensePlate": "ABC123"
}
```

**Response**:

```json
{
  "status": "APPROVED" | "BLOCKED" | "PENDING",
  "reason": "WHITELISTED" | "BLACKLISTED" | "NOT_LISTED",
  "autoApprove": true,
  "skipWeighBridge": false,
  "skipInspection": false
}
```

### Add to Blacklist

```http
POST /api/security/blacklist

{
  "licensePlate": "XYZ789",
  "reason": "Repeated safety violations",
  "severity": "HIGH",
  "bannedUntil": "2026-12-31T23:59:59Z"
}
```

### Add to Whitelist

```http
POST /api/security/whitelist

{
  "type": "VEHICLE",
  "identifier": "ABC123",
  "carrierName": "Trusted Logistics Inc",
  "autoApprove": true,
  "skipWeighBridge": false,
  "validUntil": "2027-01-01T00:00:00Z"
}
```

## ⚖️ Weight Bridge

### Record Weight

```http
POST /api/security/gate-entries/[id]/weigh

{
  "direction": "IN",
  "weight": 18500,
  "bridgeId": "WB-01",
  "verified": true
}
```

**Response**:

```json
{
  "weighRecord": { ... },
  "summary": {
    "inWeight": 18500,
    "outWeight": 17200,
    "variance": -1300,
    "variancePercentage": 7.03,
    "alert": {
      "type": "WEIGHT_VARIANCE",
      "severity": "MEDIUM",
      "message": "Significant weight variance detected..."
    }
  }
}
```

## 📸 Photo Capture

### Upload Photo

```http
POST /api/security/gate-entries/[id]/photos
Content-Type: multipart/form-data

file: [image file]
photoType: "DRIVER_ID"
description: "Driver's license photo"
```

### List Photos

```http
GET /api/security/gate-entries/[id]/photos?photoType=TRUCK_FRONT
```

## 📄 Document Management

### Upload Document

```http
POST /api/security/gate-entries/[id]/documents
Content-Type: multipart/form-data

file: [PDF file]
documentType: "BILL_OF_LADING"
documentNumber: "BOL-12345"
expiryDate: "2026-12-31T23:59:59Z"
```

### Verify Document

```http
PATCH /api/security/gate-entries/[id]/documents/[docId]/verify

{
  "verified": true,
  "notes": "All details verified"
}
```

## 🚦 Queue Management

### Add to Queue

```http
POST /api/security/gate-queue

{
  "licensePlate": "ABC123",
  "driverName": "John Doe",
  "driverPhone": "+1234567890",
  "priority": 5,
  "gateId": "gate-123"
}
```

### Call Next Vehicle

```http
POST /api/security/gate-queue/call-next?gateId=gate-123
```

### Update Queue Status

```http
PATCH /api/security/gate-queue/[id]

{
  "status": "IN_PROGRESS",
  "gateEntryId": "entry-123"
}
```

### Get Queue

```http
GET /api/security/gate-queue?gateId=gate-123&status=WAITING
```

## 🚪 Gate Management

### Create Gate

```http
POST /api/security/gates

{
  "name": "Main Entry Gate",
  "gateNumber": "G-01",
  "type": "INBOUND",
  "warehouseId": "wh-123",
  "hasLPRCamera": true,
  "hasWeighBridge": true,
  "maxVehicleHeight": 4.5,
  "operatingHours": {
    "start": "06:00",
    "end": "22:00"
  }
}
```

### Update Gate Status

```http
PATCH /api/security/gates/[id]

{
  "status": "CLOSED"
}
```

### List Gates

```http
GET /api/security/gates?warehouseId=wh-123&status=OPEN
```

## 🅿️ Parking Management

### Create Parking Spot

```http
POST /api/security/parking-spots

{
  "spotNumber": "P-101",
  "zone": "Zone A",
  "type": "REFRIGERATED",
  "warehouseId": "wh-123",
  "maxVehicleLength": 16.5,
  "hasElectricity": true,
  "refrigeratedApproved": true
}
```

### Find Available Spots

```http
POST /api/security/parking-spots/find-available?warehouseId=wh-123&requiresRefrigeration=true&vehicleLength=14.5
```

### Assign Parking

```http
POST /api/security/gate-entries/[id]/assign-parking

{
  "autoAssign": true
}
```

## 🌡️ Temperature Monitoring

### Log Temperature

```http
POST /api/security/gate-entries/[id]/temperature

{
  "temperature": -18.5,
  "unit": "CELSIUS",
  "sensorId": "TEMP-FRONT",
  "location": "FRONT",
  "targetMin": -20,
  "targetMax": -15
}
```

**Response**:

```json
{
  "tempLog": { ... },
  "alert": {
    "type": "OUT_OF_RANGE",
    "message": "Temperature -18.5°C is outside target range -20--15"
  }
}
```

### Get Temperature History

```http
GET /api/security/gate-entries/[id]/temperature
```

## ☢️ Hazmat Management

### Record Hazmat Details

```http
POST /api/security/gate-entries/[id]/hazmat

{
  "unNumber": "1203",
  "hazmatClass": "3",
  "properShippingName": "Gasoline",
  "packingGroup": "II",
  "quantity": 15000,
  "quantityUnit": "liters",
  "permitNumber": "HAZMAT-2026-001",
  "permitExpiryDate": "2026-12-31T23:59:59Z",
  "emergencyContact": "Emergency Response Team",
  "emergencyPhone": "+1-800-HAZMAT",
  "requiresSpecialParking": true
}
```

**Response**:

```json
{
  "hazmatRecord": { ... },
  "recommendedParking": {
    "id": "spot-hazmat-01",
    "spotNumber": "H-01",
    "zone": "Hazmat Zone"
  }
}
```

## 🤖 LPR Integration (Webhook)

### LPR Camera Capture

```http
POST /api/security/lpr/capture
x-api-key: your-api-key
Content-Type: application/json

{
  "licensePlate": "ABC123",
  "confidence": 95,
  "gateId": "gate-01",
  "imageUrl": "https://...",
  "timestamp": "2026-01-03T10:30:00Z",
  "direction": "IN",
  "cameraId": "CAM-GATE-01"
}
```

**Responses**:

**Auto-Approved (Whitelisted)**:

```json
{
  "status": "AUTO_APPROVED",
  "reason": "WHITELISTED",
  "gateEntry": { ... },
  "skipWeighBridge": false,
  "skipInspection": false
}
```

**Blocked (Blacklisted)**:

```json
{
  "status": "BLOCKED",
  "reason": "BLACKLISTED",
  "severity": "HIGH",
  "message": "Safety violations",
  "alert": true
}
```

**Pending Manual Review**:

```json
{
  "status": "PENDING_MANUAL_REVIEW",
  "reason": "NOT_WHITELISTED",
  "queueEntry": { ... },
  "requiresApproval": true
}
```

## 🔄 Automation

### Run Automation Checks

```http
GET /api/security/automation/run
Authorization: Bearer your-cron-secret
```

**Response**:

```json
{
  "success": true,
  "results": {
    "dwellTime": {
      "checked": 45,
      "alertsCreated": 3
    },
    "temperature": {
      "monitored": 12,
      "criticalAlerts": 1
    },
    "permits": {
      "expiredPermits": 0
    },
    "queue": {
      "queuesUpdated": 8
    },
    "weightTheft": {
      "suspiciousVehicles": 0
    }
  },
  "timestamp": "2026-01-03T10:15:00Z"
}
```

## 🔔 Common Response Codes

- **200 OK** - Success
- **201 Created** - Resource created
- **400 Bad Request** - Invalid data
- **401 Unauthorized** - Authentication required
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

## 📋 Enums Reference

### BlacklistSeverity

- `LOW` - Minor violations
- `MEDIUM` - Repeated issues
- `HIGH` - Serious violations
- `CRITICAL` - Safety hazards
- `PERMANENT` - Indefinite ban

### GatePhotoType

- `DRIVER_ID`
- `DRIVER_FACE`
- `TRUCK_FRONT`
- `TRUCK_SIDE`
- `TRUCK_REAR`
- `CARGO`
- `SEAL`
- `DAMAGE`
- `LICENSE_PLATE`
- `OTHER`

### GateDocumentType

- `BILL_OF_LADING`
- `MANIFEST`
- `PERMIT`
- `INSURANCE`
- `CUSTOMS`
- `INSPECTION`
- `OTHER`

### QueueStatus

- `WAITING` - In queue
- `CALLED` - Called to gate
- `IN_PROGRESS` - Being processed
- `COMPLETED` - Done
- `CANCELLED` - Removed from queue

### GateType

- `INBOUND` - Entry only
- `OUTBOUND` - Exit only
- `BOTH` - Bidirectional

### GateStatus

- `OPEN` - Operational
- `CLOSED` - Not accepting vehicles
- `MAINTENANCE` - Under repair

### ParkingSpotType

- `STANDARD` - Regular vehicles
- `OVERSIZED` - Large trucks
- `REFRIGERATED` - Reefer-approved
- `HAZMAT` - Dangerous goods

---

**Need Help?** Check the full documentation at `/docs/GATE_SECURITY_SYSTEM.md`
