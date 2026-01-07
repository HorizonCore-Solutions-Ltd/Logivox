# Quality Assurance API Reference

## Overview

The QA module provides RESTful API endpoints for all quality management functions. All endpoints follow standard HTTP methods (GET, POST, PUT, PATCH, DELETE) and return JSON responses.

## Base URL

```
/api/qc/
```

## Authentication

All endpoints require authentication. Include JWT token in Authorization header:

```http
Authorization: Bearer <token>
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## NCR Endpoints

### List NCRs

```http
GET /api/qc/ncr
```

**Query Parameters:**

- `status` (string): Filter by status (OPEN, INVESTIGATING, RESOLVED, CLOSED)
- `severity` (string): Filter by severity (CRITICAL, MAJOR, MINOR)
- `category` (string): Filter by category
- `claimStatus` (string): Filter by supplier claim status
- `startDate` (date): Filter by date range start
- `endDate` (date): Filter by date range end
- `search` (string): Search in description, NCR number, supplier
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 50)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ncrNumber": "NCR-20260105-001",
      "description": "Packaging damage during transit",
      "category": "PACKAGING",
      "severity": "MAJOR",
      "status": "OPEN",
      "detectedAt": "2026-01-05T10:00:00Z",
      "detectedBy": "John Smith",
      "affectedQuantity": 150,
      "costImpact": 2250.0,
      "supplier": {
        "id": "uuid",
        "name": "Acme Corp",
        "code": "SUP-001"
      },
      "product": {
        "id": "uuid",
        "name": "Widget A",
        "sku": "W-001"
      },
      "supplierClaimStatus": "PENDING",
      "supplierClaimAmount": 2250.0,
      "createdAt": "2026-01-05T10:05:00Z",
      "updatedAt": "2026-01-05T10:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 143,
    "pages": 3
  }
}
```

### Get NCR by ID

```http
GET /api/qc/ncr/:id
```

**Response:** Single NCR object (same structure as list item)

### Create NCR

```http
POST /api/qc/ncr
```

**Request Body:**

```json
{
  "description": "Packaging damage during transit",
  "category": "PACKAGING",
  "severity": "MAJOR",
  "detectedAt": "2026-01-05T10:00:00Z",
  "detectedBy": "John Smith",
  "affectedQuantity": 150,
  "costImpact": 2250.0,
  "supplierId": "uuid",
  "productId": "uuid",
  "inspectionId": "uuid" // optional
}
```

**Response:** Created NCR object with auto-generated ncrNumber

### Update NCR

```http
PATCH /api/qc/ncr/:id
```

**Request Body:** Partial NCR object (any fields)

**Response:** Updated NCR object

### Delete NCR

```http
DELETE /api/qc/ncr/:id
```

**Response:**

```json
{
  "success": true,
  "message": "NCR deleted successfully"
}
```

### Get NCR Statistics

```http
GET /api/qc/ncr/stats
```

**Query Parameters:** Same filters as list endpoint

**Response:**

```json
{
  "success": true,
  "data": {
    "totalNCRs": 143,
    "openIssues": 23,
    "supplierClaims": 15,
    "avgResolutionTime": 8.5,
    "bySeverity": {
      "CRITICAL": 5,
      "MAJOR": 34,
      "MINOR": 104
    },
    "byCategory": {
      "MATERIAL_DEFECT": 45,
      "PACKAGING": 32,
      "LABELING": 18,
      "DOCUMENTATION": 12,
      "PROCESS": 23,
      "SHIPPING": 13
    },
    "costImpact": {
      "total": 245678.9,
      "byMonth": [{ "month": "2026-01", "amount": 45678.9 }]
    }
  }
}
```

## CAPA Endpoints

### List CAPAs

```http
GET /api/qc/capa
```

**Query Parameters:**

- `status` (string): OPEN, IN_PROGRESS, PENDING_VERIFICATION, VERIFIED, CLOSED
- `type` (string): CORRECTIVE, PREVENTIVE, BOTH
- `priority` (string): CRITICAL, HIGH, MEDIUM, LOW
- `overdue` (boolean): Show only overdue CAPAs
- `assignedTo` (string): Filter by assignee
- `startDate`, `endDate`, `search`, `page`, `limit`

**Response:** Similar structure to NCR list

### Get Overdue CAPAs

```http
GET /api/qc/capa/overdue
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "capaNumber": "CAPA-20260101-005",
      "title": "Implement barcode scanning",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "rpn": 280,
      "assignedTo": "Sarah Chen",
      "targetDate": "2026-01-10T00:00:00Z",
      "daysOverdue": 5,
      "createdAt": "2026-01-01T08:00:00Z"
    }
  ]
}
```

### Get CAPA Statistics

```http
GET /api/qc/capa/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalCAPAs": 89,
    "averageRPN": 156.3,
    "overdueCount": 3,
    "avgCompletionTime": 32.5,
    "byStatus": {
      "OPEN": 12,
      "IN_PROGRESS": 23,
      "PENDING_VERIFICATION": 8,
      "VERIFIED": 15,
      "CLOSED": 31
    },
    "byPriority": {
      "CRITICAL": 5,
      "HIGH": 18,
      "MEDIUM": 34,
      "LOW": 32
    },
    "effectivenessRate": 89.5
  }
}
```

### Create CAPA

```http
POST /api/qc/capa
```

**Request Body:**

```json
{
  "title": "Implement barcode scanning for shipping labels",
  "description": "Current manual entry causing label errors",
  "type": "CORRECTIVE",
  "priority": "HIGH",
  "severity": 8,
  "occurrence": 5,
  "detection": 7,
  "assignedTo": "Sarah Chen",
  "targetDate": "2026-02-01T00:00:00Z",
  "ncrId": "uuid" // optional
}
```

**Response:** Created CAPA with auto-calculated RPN (280 in this example)

### Update CAPA

```http
PATCH /api/qc/capa/:id
```

**Request Body:** Partial CAPA object

### Verify CAPA Effectiveness

```http
POST /api/qc/capa/:id/verify
```

**Request Body:**

```json
{
  "verificationResult": "EFFECTIVE",
  "verificationNotes": "Monitored for 30 days, zero errors",
  "verifiedBy": "Jane Wilson"
}
```

## Quality Holds Endpoints

### List Quality Holds

```http
GET /api/qc/quality-holds
```

**Query Parameters:**

- `status`: ACTIVE, RELEASED, REJECTED, PARTIAL
- `holdType`: PRODUCT, LOT, LOCATION, VENDOR, ORDER
- `severity`: CRITICAL, HIGH, MEDIUM, LOW
- `startDate`, `endDate`, `search`, `page`, `limit`

### Get Quality Holds Statistics

```http
GET /api/qc/quality-holds/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "activeHolds": 12,
    "quantityOnHold": 4567,
    "totalValueAtRisk": 123456.78,
    "releaseRate": 78.5,
    "byType": {
      "PRODUCT": 5,
      "LOT": 3,
      "LOCATION": 2,
      "VENDOR": 1,
      "ORDER": 1
    },
    "bySeverity": {
      "CRITICAL": 2,
      "HIGH": 4,
      "MEDIUM": 4,
      "LOW": 2
    }
  }
}
```

### Create Quality Hold

```http
POST /api/qc/quality-holds
```

**Request Body:**

```json
{
  "holdType": "PRODUCT",
  "severity": "HIGH",
  "reason": "Failed dimensional inspection",
  "quantityOnHold": 500,
  "estimatedValue": 7500.0,
  "productId": "uuid",
  "lotId": "uuid",
  "inspectionId": "uuid",
  "ncrId": "uuid"
}
```

### Release Quality Hold

```http
POST /api/qc/quality-holds/:id/release
```

**Request Body:**

```json
{
  "quantityToRelease": 450,
  "releaseNotes": "Engineering approved use-as-is waiver",
  "releasedBy": "John Smith"
}
```

### Reject Quality Hold

```http
POST /api/qc/quality-holds/:id/reject
```

**Request Body:**

```json
{
  "quantityToReject": 50,
  "dispositionMethod": "SCRAP",
  "rejectionReason": "Dimensions out of tolerance, cannot rework",
  "rejectedBy": "John Smith"
}
```

## Sampling Plans Endpoints

### List Sampling Plans

```http
GET /api/qc/sampling-plans
```

**Query Parameters:**

- `status`: ACTIVE, INACTIVE, EXPIRED, DRAFT
- `inspectionLevel`: I, II, III, S1, S2, S3, S4
- `inspectionType`: NORMAL, TIGHTENED, REDUCED
- `productCategory`, `search`, `page`, `limit`

### Get Sampling Plan Statistics

```http
GET /api/qc/sampling-plans/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalPlans": 34,
    "activePlans": 28,
    "expiredPlans": 2,
    "averageAQL": 1.5,
    "byInspectionLevel": {
      "I": 5,
      "II": 20,
      "III": 7,
      "S1": 1,
      "S2": 1
    },
    "mostUsedAQL": 1.0
  }
}
```

### Calculate Sample Size

```http
POST /api/qc/sampling-plans/calculate
```

**Request Body:**

```json
{
  "lotSize": 5000,
  "aql": 1.0,
  "inspectionLevel": "II"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sampleSize": 80,
    "acceptanceNumber": 7,
    "rejectionNumber": 8,
    "letterCode": "L",
    "aql": 1.0,
    "inspectionLevel": "II"
  }
}
```

### Create Sampling Plan

```http
POST /api/qc/sampling-plans
```

**Request Body:**

```json
{
  "planName": "General Receiving Inspection",
  "description": "Standard AQL 1.0 plan for incoming goods",
  "productCategory": "ELECTRONICS",
  "inspectionLevel": "II",
  "aql": 1.0,
  "sampleSize": 80,
  "acceptanceNumber": 7,
  "rejectionNumber": 8,
  "inspectionType": "NORMAL",
  "effectiveDate": "2026-01-01T00:00:00Z",
  "expiryDate": "2026-12-31T23:59:59Z",
  "createdBy": "Jane Wilson"
}
```

## Quality Measurements Endpoints

### List Measurements

```http
GET /api/qc/measurements
```

**Query Parameters:**

- `measurementType`: DIMENSION, WEIGHT, TEMPERATURE, PRESSURE, HARDNESS, VISCOSITY, pH, OTHER
- `conformanceStatus`: CONFORMING, NON_CONFORMING, MARGINAL
- `productId`, `lotId`, `startDate`, `endDate`, `search`, `page`, `limit`

### Get Measurement Statistics

```http
GET /api/qc/measurements/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalMeasurements": 1543,
    "conforming": 1456,
    "nonConforming": 67,
    "marginal": 20,
    "conformanceRate": 94.4,
    "byType": {
      "DIMENSION": 892,
      "WEIGHT": 345,
      "TEMPERATURE": 178,
      "PRESSURE": 89,
      "HARDNESS": 23,
      "VISCOSITY": 12,
      "pH": 4,
      "OTHER": 0
    },
    "averageCPK": 1.52
  }
}
```

### Create Measurement

```http
POST /api/qc/measurements
```

**Request Body:**

```json
{
  "measurementType": "DIMENSION",
  "characteristic": "Shaft Diameter",
  "measuredValue": 25.02,
  "unit": "mm",
  "specMin": 24.95,
  "specMax": 25.05,
  "targetValue": 25.0,
  "measurementDate": "2026-01-05T14:30:00Z",
  "measuredBy": "Robert Johnson",
  "equipmentUsed": "CMM-001",
  "calibrationDate": "2025-12-15T00:00:00Z",
  "productId": "uuid",
  "lotId": "uuid",
  "inspectionId": "uuid"
}
```

**Response:** Created measurement with auto-calculated:

- `deviation`: 0.02
- `conformanceStatus`: CONFORMING
- `cpk`: 1.67 (if enough historical data)

### Get SPC Data

```http
GET /api/qc/measurements/spc
```

**Query Parameters:**

- `productId` (required)
- `characteristic` (required)
- `startDate`, `endDate`
- `limit`: Number of data points (default: 100)

**Response:**

```json
{
  "success": true,
  "data": {
    "characteristic": "Shaft Diameter",
    "unit": "mm",
    "targetValue": 25.0,
    "specMin": 24.95,
    "specMax": 25.05,
    "controlLimits": {
      "ucl": 25.03,
      "centerLine": 25.0,
      "lcl": 24.97
    },
    "processCapability": {
      "cpk": 1.67,
      "cp": 1.85,
      "pp": 1.72,
      "ppk": 1.65
    },
    "dataPoints": [
      {
        "date": "2026-01-05T14:30:00Z",
        "value": 25.02,
        "conforming": true
      }
    ],
    "outOfControlPoints": []
  }
}
```

## Quality Reports Endpoints

### List Reports

```http
GET /api/qc/reports
```

**Query Parameters:**

- `reportType`: DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUAL, AD_HOC
- `category`: INSPECTION_SUMMARY, NCR_ANALYSIS, CAPA_EFFECTIVENESS, SUPPLIER_PERFORMANCE, QUALITY_TRENDS, COMPLIANCE, EXECUTIVE_SUMMARY
- `status`: DRAFT, PENDING_REVIEW, APPROVED, PUBLISHED
- `startDate`, `endDate`, `search`, `page`, `limit`

### Create Report

```http
POST /api/qc/reports
```

**Request Body:**

```json
{
  "reportType": "MONTHLY",
  "category": "EXECUTIVE_SUMMARY",
  "reportName": "January 2026 Quality Summary",
  "description": "Monthly quality performance review",
  "periodStart": "2026-01-01T00:00:00Z",
  "periodEnd": "2026-01-31T23:59:59Z",
  "generatedBy": "Jane Wilson"
}
```

**Response:** Report with auto-generated:

- `reportNumber`: REPORT-20260201-001
- `summary`: Auto-generated executive summary
- `keyFindings`: Auto-analyzed findings
- `metricsData`: Aggregated metrics
- `status`: DRAFT

### Export Report to PDF

```http
POST /api/qc/reports/:id/export
```

**Request Body:**

```json
{
  "format": "PDF",
  "includeCharts": true,
  "includeRawData": false
}
```

**Response:** Binary PDF file

### Email Report

```http
POST /api/qc/reports/:id/email
```

**Request Body:**

```json
{
  "recipients": ["manager@company.com", "director@company.com"],
  "subject": "January 2026 Quality Report",
  "message": "Please review the attached quality report",
  "includePDF": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Report emailed successfully",
  "emailsSent": 2
}
```

## Webhooks

### Available Webhooks

Subscribe to real-time events:

```javascript
// NCR Events
-ncr.created -
  ncr.updated -
  ncr.status_changed -
  ncr.claim_submitted -
  // CAPA Events
  capa.created -
  capa.assigned -
  capa.overdue -
  capa.verified -
  capa.closed -
  // Quality Hold Events
  hold.created -
  hold.released -
  hold.rejected -
  // Measurement Events
  measurement.non_conforming -
  measurement.cpk_below_threshold;
```

### Webhook Payload Example

```json
{
  "event": "capa.overdue",
  "timestamp": "2026-01-05T10:00:00Z",
  "data": {
    "capaId": "uuid",
    "capaNumber": "CAPA-20260101-005",
    "title": "Implement barcode scanning",
    "assignedTo": "Sarah Chen",
    "targetDate": "2026-01-10T00:00:00Z",
    "daysOverdue": 5
  }
}
```

## Rate Limiting

- **Standard Users**: 100 requests/minute
- **System Integration**: 500 requests/minute
- **Admin**: 1000 requests/minute

## Error Codes

| Code               | Description              |
| ------------------ | ------------------------ |
| `AUTH_REQUIRED`    | Authentication required  |
| `AUTH_INVALID`     | Invalid token            |
| `FORBIDDEN`        | Insufficient permissions |
| `NOT_FOUND`        | Resource not found       |
| `VALIDATION_ERROR` | Invalid request data     |
| `DUPLICATE`        | Resource already exists  |
| `CONFLICT`         | Operation conflict       |
| `RATE_LIMIT`       | Too many requests        |
| `SERVER_ERROR`     | Internal server error    |

## Code Examples

### JavaScript/Node.js

```javascript
// Fetch NCRs
const response = await fetch("/api/qc/ncr?status=OPEN", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
const data = await response.json();

// Create CAPA
const capa = await fetch("/api/qc/capa", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Fix packaging issues",
    type: "CORRECTIVE",
    priority: "HIGH",
    severity: 8,
    occurrence: 5,
    detection: 7,
    assignedTo: "John Smith",
    targetDate: "2026-02-01",
  }),
});
```

### Python

```python
import requests

# List NCRs
response = requests.get(
    'http://localhost:3000/api/qc/ncr',
    headers={'Authorization': f'Bearer {token}'},
    params={'status': 'OPEN', 'severity': 'CRITICAL'}
)
ncrs = response.json()['data']

# Create Quality Hold
hold = requests.post(
    'http://localhost:3000/api/qc/quality-holds',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'holdType': 'PRODUCT',
        'severity': 'HIGH',
        'reason': 'Failed inspection',
        'quantityOnHold': 500,
        'estimatedValue': 7500.00,
        'productId': product_id
    }
)
```

---

**Last Updated**: January 5, 2026  
**API Version**: 1.0.0
