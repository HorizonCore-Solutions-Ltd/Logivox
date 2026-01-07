# Guard Management API Quick Reference

**Version:** 1.0  
**Base URL:** `/api/security`  
**Authentication:** NextAuth session required  
**Date:** January 3, 2026

---

## 📋 Table of Contents

1. [Patrol System](#1-patrol-system)
2. [Panic Button](#2-panic-button)
3. [GPS Tracking](#3-gps-tracking)
4. [Daily Reports](#4-daily-activity-reports)
5. [Equipment](#5-equipment-tracking)
6. [Shift Handover](#6-shift-handover)
7. [Training & Certifications](#7-training--certifications)
8. [Manifests](#8-manifest-tracking)
9. [Weather](#9-weather-integration)

---

## 1. Patrol System

### Create Patrol Route

```http
POST /api/security/patrol-routes
Content-Type: application/json

{
  "name": "Perimeter Patrol",
  "description": "Hourly perimeter check",
  "warehouseId": "wh_123",
  "frequency": "HOURLY",
  "estimatedMinutes": 30,
  "checkpoints": [
    {
      "name": "North Gate",
      "location": "Building A - North Entrance",
      "checkpointNumber": 1,
      "checkpointType": "QR_CODE",
      "qrCode": "QR_NG_001",
      "instructions": "Check gate is locked",
      "photoRequired": true
    }
  ]
}
```

### Start Patrol

```http
POST /api/security/patrols/start

{
  "routeId": "route_123",
  "guardId": "guard_456"
}
```

### Scan Checkpoint

```http
POST /api/security/patrols/{patrolId}/scans

{
  "checkpointId": "cp_789",
  "guardId": "guard_456",
  "scanMethod": "QR_CODE",
  "gpsLat": 51.5074,
  "gpsLng": -0.1278,
  "photoUrl": "https://cdn.example.com/photo.jpg",
  "notes": "Gate secure",
  "issueReported": false
}
```

### Complete Patrol

```http
POST /api/security/patrols/{patrolId}/complete

{
  "notes": "All checkpoints clear"
}
```

---

## 2. Panic Button

### Trigger Panic Alert

```http
POST /api/security/panic

{
  "guardId": "guard_456",
  "guardName": "John Smith",
  "location": "Loading Dock 3",
  "gpsLat": 51.5074,
  "gpsLng": -0.1278,
  "audioUrl": "https://cdn.example.com/audio.mp3"
}
```

**Response:** Includes nearest 3 guards by GPS proximity

### Respond to Alert

```http
POST /api/security/panic/{alertId}/respond

{
  "responderId": "guard_789",
  "responderName": "Jane Doe",
  "responseType": "EN_ROUTE",
  "notes": "On my way"
}
```

### Resolve Alert

```http
PATCH /api/security/panic/{alertId}/resolve

{
  "resolvedBy": "guard_789",
  "resolution": "False alarm - accidental trigger",
  "isFalseAlarm": true
}
```

---

## 3. GPS Tracking

### Update Guard Location

```http
POST /api/security/location

{
  "guardId": "guard_456",
  "gpsLat": 51.5074,
  "gpsLng": -0.1278,
  "accuracy": 5.0,
  "speed": 1.2,
  "heading": 180,
  "batteryLevel": 85
}
```

**Response:** Includes any geofence violations detected

### Get All Guard Locations

```http
GET /api/security/location?since=15
```

### Create Geofence

```http
POST /api/security/geofences

{
  "name": "Restricted Area",
  "description": "No unauthorized access",
  "zoneType": "RESTRICTED",
  "centerLat": 51.5074,
  "centerLng": -0.1278,
  "radius": 50,
  "alertOnEntry": true,
  "allowedGuards": ["guard_123"]
}
```

### List Geofence Violations

```http
GET /api/security/geofences/violations?acknowledged=false
```

---

## 4. Daily Activity Reports

### Create Report

```http
POST /api/security/daily-reports

{
  "reportDate": "2026-01-03",
  "shiftType": "NIGHT",
  "guardId": "guard_456",
  "guardName": "John Smith",
  "supervisorId": "sup_123",
  "supervisorName": "Manager Name",
  "shiftStart": "2026-01-03T22:00:00Z",
  "shiftEnd": "2026-01-04T06:00:00Z",
  "weatherConditions": "Clear",
  "temperature": 15.5,
  "observations": "All quiet tonight",
  "significantEvents": "None",
  "handoverNotes": "Gate 3 light needs replacement"
}
```

**Auto-populated:**

- `gateEntries`, `gateExits`, `visitorsCheckIns`
- `incidentsReported`, `patrolsCompleted`, `checkpointsScanned`

### Submit Report

```http
POST /api/security/daily-reports/{reportId}/submit

{
  "guardSignature": "base64_encoded_signature"
}
```

### Approve Report

```http
POST /api/security/daily-reports/{reportId}/approve

{
  "supervisorSignature": "base64_encoded_signature"
}
```

---

## 5. Equipment Tracking

### Create Equipment

```http
POST /api/security/equipment

{
  "equipmentType": "RADIO",
  "equipmentNumber": "RADIO-01",
  "name": "Motorola XPR7550",
  "serialNumber": "SN123456",
  "purchaseDate": "2025-01-15",
  "condition": "GOOD"
}
```

### Checkout Equipment

```http
POST /api/security/equipment/{equipmentId}/checkout

{
  "guardId": "guard_456",
  "guardName": "John Smith",
  "expectedReturn": "2026-01-04T06:00:00Z",
  "notes": "Night shift"
}
```

### Checkin Equipment

```http
POST /api/security/equipment/{equipmentId}/checkin

{
  "returnedBy": "guard_456",
  "condition": "GOOD",
  "notes": "Working properly"
}
```

### Log Maintenance

```http
POST /api/security/equipment/{equipmentId}/maintenance

{
  "maintenanceType": "BATTERY_REPLACEMENT",
  "performedBy": "tech_123",
  "nextDueDate": "2026-07-01",
  "cost": 25.50,
  "description": "Replaced battery pack",
  "partsReplaced": "Battery BP7550"
}
```

### Get Available Equipment

```http
GET /api/security/equipment/available?type=RADIO
```

---

## 6. Shift Handover

### Create Handover

```http
POST /api/security/handover

{
  "outgoingGuardId": "guard_456",
  "outgoingGuardName": "John Smith",
  "outgoingShift": "NIGHT",
  "incomingGuardId": "guard_789",
  "incomingGuardName": "Jane Doe",
  "incomingShift": "DAY",
  "keyEvents": [
    {
      "time": "2026-01-04T02:30:00Z",
      "event": "Suspicious vehicle at Gate 2"
    }
  ],
  "ongoingIssues": "Gate 3 light not working",
  "equipmentStatus": {
    "radio": "working",
    "torch": "low battery"
  },
  "notesForNextShift": "Expecting large delivery at 10am"
}
```

**Auto-populated:**

- `gateEntriesCount`, `gateExitsCount`, `currentVehiclesOnSite`
- `visitorsCount`, `incidentsCount`, `patrolsCompleted`

### Approve Handover

```http
POST /api/security/handover/{handoverId}/approve

{
  "incomingSignature": "base64_encoded_signature"
}
```

---

## 7. Training & Certifications

### Add Certification

```http
POST /api/security/certifications

{
  "guardId": "guard_456",
  "guardName": "John Smith",
  "certificationType": "SIA_LICENSE",
  "certificationName": "SIA Door Supervisor License",
  "certificationNumber": "SIA-12345678",
  "issuer": "Security Industry Authority",
  "issueDate": "2024-01-01",
  "expiryDate": "2027-01-01",
  "documentUrl": "https://cdn.example.com/cert.pdf"
}
```

**Auto-calculated:** Status based on expiry date

### Get Expiring Certifications

```http
GET /api/security/certifications/expiring?days=30
```

### Create Training Course

```http
POST /api/security/training-courses

{
  "courseName": "Fire Safety Awareness",
  "description": "Annual fire safety training",
  "courseType": "SAFETY",
  "duration": 60,
  "validityPeriod": 12,
  "isRequired": true,
  "contentUrl": "https://training.example.com/fire-safety",
  "passingScore": 80
}
```

### Complete Training

```http
POST /api/security/training-courses/{courseId}/complete

{
  "guardId": "guard_456",
  "guardName": "John Smith",
  "score": 95,
  "certificateUrl": "https://cdn.example.com/certificate.pdf",
  "instructorId": "instructor_123"
}
```

**Auto-calculated:**

- `passed` based on passing score
- `expiryDate` based on validity period

---

## 8. Manifest Tracking

### Create Manifest

```http
POST /api/security/manifests

{
  "gateEntryId": "entry_123",
  "manifestNumber": "MAN-2026-001",
  "manifestPhoto": "https://cdn.example.com/manifest.jpg",
  "ocrText": "Extracted text from OCR...",
  "supplier": "Acme Corp",
  "poNumbers": ["PO-12345", "PO-12346"],
  "expectedUnits": 500,
  "actualUnits": 500
}
```

**Auto-calculated:** `hasDiscrepancy` if expected ≠ actual

### Verify Manifest

```http
PATCH /api/security/manifests/{manifestId}/verify

{
  "verifiedBy": "guard_456",
  "verificationStatus": "VERIFIED"
}
```

### List Manifests with Discrepancies

```http
GET /api/security/manifests?hasDiscrepancy=true
```

---

## 9. Weather Integration

### Get Current Weather

```http
GET /api/security/weather?warehouseId=wh_123
```

### Log Weather (Webhook)

```http
POST /api/security/weather

{
  "organizationId": "org_123",
  "warehouseId": "wh_123",
  "temperature": 15.5,
  "feelsLike": 13.2,
  "humidity": 65,
  "windSpeed": 12.5,
  "windDirection": "NW",
  "conditions": "Cloudy",
  "visibility": 10.0,
  "pressure": 1013,
  "hasAlert": true,
  "alertType": "STORM",
  "alertSeverity": "HIGH",
  "alertMessage": "Severe thunderstorm warning until 8pm",
  "source": "OpenWeather"
}
```

---

## 📊 Response Formats

### Success Response

```json
{
  "id": "resource_123",
  "organizationId": "org_123",
  ...
  "createdAt": "2026-01-03T12:00:00Z",
  "updatedAt": "2026-01-03T12:00:00Z"
}
```

### Error Response

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "field": "guardId",
      "message": "Required"
    }
  ]
}
```

### Validation Errors (400)

```json
{
  "error": "Invalid request data",
  "details": [...] // Zod validation errors
}
```

### Authentication Errors (401)

```json
{
  "error": "Unauthorized"
}
```

### Not Found (404)

```json
{
  "error": "Resource not found"
}
```

---

## 🔧 Query Parameters

### Common Filters

**Pagination:**

```
?page=1&limit=50
```

**Date Ranges:**

```
?from=2026-01-01&to=2026-01-31
```

**Status Filters:**

```
?status=ACTIVE
?isActive=true
```

**Entity Filters:**

```
?guardId=guard_456
?warehouseId=wh_123
?organizationId=org_123
```

---

## 🚀 Rate Limits

- **Standard:** 100 requests/minute
- **GPS Location Updates:** 1 request/second per guard
- **Panic Alerts:** No limit (safety critical)

---

## 📱 Mobile App Integration

### Recommended Flow:

1. **Login** → Get session token
2. **Start GPS tracking** → POST `/api/security/location` every 30 seconds
3. **Start patrol** → POST `/api/security/patrols/start`
4. **Scan checkpoints** → POST `/api/security/patrols/{id}/scans`
5. **Complete patrol** → POST `/api/security/patrols/{id}/complete`
6. **Create DAR** → POST `/api/security/daily-reports` at end of shift
7. **Submit DAR** → POST `/api/security/daily-reports/{id}/submit`

### Background Services:

- GPS tracking (every 30 seconds)
- Panic button (always available)
- Geofence monitoring (continuous)

---

## 🔐 Security Best Practices

1. **Always validate session** - Check `session.user.organizationId`
2. **Use Zod schemas** - Validate all inputs
3. **Filter by organizationId** - Prevent cross-organization data access
4. **Sanitize file uploads** - Validate image/document types
5. **Rate limit sensitive endpoints** - Prevent abuse

---

## 📚 Related Documentation

- [Gate Security System](/docs/GATE_SECURITY_SYSTEM.md)
- [Gate Security API](/docs/GATE_SECURITY_API.md)
- [Complete Implementation](/docs/GUARD_MANAGEMENT_COMPLETE.md)
- [Authentication Guide](/docs/AUTHENTICATION.md)

---

**Last Updated:** January 3, 2026  
**API Version:** 1.0  
**Support:** Contact development team for assistance
