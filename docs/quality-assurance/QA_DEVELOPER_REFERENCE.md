# Enterprise QA System - Developer Quick Reference

## Service Imports

```typescript
import {
  NCRService,
  CAPAService,
  QualityHoldService,
  SamplingPlanService,
  QualityMeasurementService,
  QualityReportService,
} from "@/lib/services/qc";
```

## API Endpoints Reference

### NCR APIs

```
GET    /api/qc/ncr?organizationId={id}&status={status}
POST   /api/qc/ncr
GET    /api/qc/ncr/{id}
PATCH  /api/qc/ncr/{id}  (actions: completeRCA, submitClaim, updateClaim, linkCAPA, close)
GET    /api/qc/ncr/stats?organizationId={id}
```

### CAPA APIs

```
GET    /api/qc/capa?organizationId={id}&status={status}
POST   /api/qc/capa
GET    /api/qc/capa/{id}
PATCH  /api/qc/capa/{id}  (actions: updateStatus, completeContainment, completeCorrectiveActions, completePreventiveActions, verify, managementReview, close, completeTraining)
GET    /api/qc/capa/overdue?organizationId={id}
```

### Quality Hold APIs

```
GET    /api/qc/quality-holds?organizationId={id}&status={status}
POST   /api/qc/quality-holds
GET    /api/qc/quality-holds/{id}
PATCH  /api/qc/quality-holds/{id}  (actions: requestRelease, approveRelease, updateInvestigation, escalate, cancel)
GET    /api/qc/quality-holds/stats?organizationId={id}
```

### Sampling Plan APIs

```
GET    /api/qc/sampling-plans?organizationId={id}
POST   /api/qc/sampling-plans
GET    /api/qc/sampling-plans/{id}
PATCH  /api/qc/sampling-plans/{id}  (actions: recordUsage, supersede)
POST   /api/qc/sampling-plans/calculate
```

### Measurement APIs

```
GET    /api/qc/measurements?organizationId={id}&referenceType={type}
POST   /api/qc/measurements
GET    /api/qc/measurements/stats?organizationId={id}
GET    /api/qc/measurements/spc?organizationId={id}&referenceType={type}&referenceId={id}&measurementName={name}
POST   /api/qc/measurements/cpk
```

### Report APIs

```
GET    /api/qc/reports?organizationId={id}
POST   /api/qc/reports
GET    /api/qc/reports/{id}
```

## Common Workflows

### 1. NCR Workflow

```typescript
// Step 1: Create NCR
const ncr = await NCRService.createNCR({
  organizationId: 'org-123',
  reportDate: new Date(),
  sourceType: 'RECEIVING',
  sourceId: 'inspection-456',
  supplierId: 'supplier-789',
  description: 'Parts out of tolerance',
  quantity: 100,
  severity: 'MAJOR',
  category: 'DEFECTIVE_MATERIAL',
  estimatedCost: 5000,
  reportedBy: 'user-123',
});

// Step 2: Complete RCA
await NCRService.completeRCA(
  ncr.id,
  'Insufficient cooling during molding process',
  ['Old equipment', 'Inadequate maintenance schedule']
);

// Step 3: Submit claim
await NCRService.submitClaim(
  ncr.id,
  5000,
  'Replacement parts and rework costs'
);

// Step 4: Link to CAPA
const capa = await CAPAService.createCAPA({...});
await NCRService.linkCAPA(ncr.id, capa.id);

// Step 5: Close NCR
await NCRService.closeNCR(
  ncr.id,
  'user-123',
  'Issue resolved, CAPA implemented',
  'manager-456'
);
```

### 2. CAPA Workflow

```typescript
// Step 1: Create CAPA
const capa = await CAPAService.createCAPA({
  organizationId: "org-123",
  capaType: "BOTH",
  title: "Improve molding process",
  description: "Cooling system upgrades",
  severity: 8,
  occurrence: 6,
  detection: 4,
  targetCompletionDate: new Date("2025-02-01"),
  createdBy: "user-123",
});
// RPN = 8 × 6 × 4 = 192

// Step 2: Complete containment
await CAPAService.completeContainment(
  capa.id,
  "user-123",
  "Quarantined all affected lots",
);

// Step 3: Complete corrective actions
await CAPAService.completeCorrectiveActions(
  capa.id,
  "user-123",
  "Installed new cooling system",
);

// Step 4: Complete preventive actions
await CAPAService.completePreventiveActions(
  capa.id,
  "user-123",
  "Implemented preventive maintenance schedule",
);

// Step 5: Verify effectiveness
await CAPAService.verifyCAPI(
  capa.id,
  "qc-manager",
  "No issues in 100 consecutive parts",
  95,
);

// Step 6: Management review
await CAPAService.managementReview(
  capa.id,
  "plant-manager",
  "Approved, significant improvement observed",
  true,
);

// Step 7: Close CAPA
await CAPAService.closeCAPI(
  capa.id,
  "qc-manager",
  "CAPA successfully completed",
  "plant-manager",
);
```

### 3. Quality Hold Workflow

```typescript
// Step 1: Create hold
const hold = await QualityHoldService.createHold({
  organizationId: "org-123",
  holdType: "LOT",
  holdLevel: "LOT",
  lotNumber: "LOT-2025-001",
  quantityOnHold: 500,
  reason: "Dimensional out of spec",
  severity: "HIGH",
  createdBy: "qc-user",
});

// Step 2: Update investigation
await QualityHoldService.updateInvestigation(
  hold.id,
  "IN_PROGRESS",
  "Root cause: tool wear",
  "qc-engineer",
);

// Step 3: Request release
await QualityHoldService.requestRelease(
  hold.id,
  "production-manager",
  "Tool replaced, sample parts verified",
  "RELEASE",
  ["Tool replacement complete", "Sample inspection passed"],
);

// Step 4: Approve release
await QualityHoldService.approveRelease(
  hold.id,
  true,
  "qc-manager",
  "Approved for release",
  "RELEASE",
  500,
  0,
);
```

### 4. Sampling Plan Usage

```typescript
// Find applicable plan
const plan = await SamplingPlanService.findApplicablePlan({
  organizationId: "org-123",
  targetType: "SUPPLIER",
  targetId: "supplier-456",
  inspectionType: "RECEIVING",
});

// Calculate sample size for lot
const sampleSize = SamplingPlanService.calculateSampleSizeForLot({
  lotSize: 1000,
  inspectionLevel: "II",
  usePercentage: false,
});

// Determine accept/reject numbers
const { acceptNumber, rejectNumber } =
  SamplingPlanService.determineAcceptRejectNumbers(
    sampleSize,
    1.5, // AQL 1.5%
  );

// Record usage
await SamplingPlanService.recordUsage(plan.id);
```

### 5. Measurement & SPC

```typescript
// Record measurement
await QualityMeasurementService.recordMeasurement({
  organizationId: "org-123",
  referenceType: "PRODUCT",
  referenceId: "product-456",
  measurementType: "DIMENSIONAL",
  measurementName: "Diameter",
  measurementValue: 10.02,
  unitOfMeasure: "mm",
  lowerSpecLimit: 10.0,
  upperSpecLimit: 10.05,
  nominalValue: 10.025,
  measurementDate: new Date(),
  measuredBy: "qc-tech",
});

// Calculate CPK
const cpk = await QualityMeasurementService.calculateCPK({
  organizationId: "org-123",
  referenceType: "PRODUCT",
  referenceId: "product-456",
  measurementName: "Diameter",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-01-31"),
});
console.log(`CPK: ${cpk.cpk}, Mean: ${cpk.mean}, Sigma: ${cpk.sigma}`);

// Get SPC data
const spcData = await QualityMeasurementService.getSPCData({
  organizationId: "org-123",
  referenceType: "PRODUCT",
  referenceId: "product-456",
  measurementName: "Diameter",
  limit: 50,
});
```

### 6. Report Generation

```typescript
// Generate executive summary
const report = await QualityReportService.createReport({
  organizationId: "org-123",
  reportType: "MONTHLY",
  reportCategory: "EXECUTIVE",
  reportName: "January 2025 Quality Summary",
  reportDescription: "Monthly executive quality metrics",
  periodStart: new Date("2025-01-01"),
  periodEnd: new Date("2025-01-31"),
  generatedBy: "system",
});

// Access report metrics
console.log(report.metrics.summary);
console.log(report.metrics.inspections);
console.log(report.metrics.defects);
console.log(report.metrics.ncr);
console.log(report.metrics.capa);
console.log(report.metrics.suppliers);
```

## Database Schema Reference

### NCR Fields

```typescript
{
  ncrNumber: string;          // NCR-YYYYMM-####
  reportDate: Date;
  sourceType: string;         // RECEIVING, PRODUCTION, etc.
  sourceId: string;
  supplierId: string;
  description: string;
  quantity: number;
  severity: string;           // CRITICAL, MAJOR, MINOR
  category: string;           // DEFECTIVE_MATERIAL, etc.
  disposition: string;        // REWORK, SCRAP, RETURN_TO_VENDOR, etc.

  // RCA
  suspectedRootCause: string;
  confirmedRootCause: string;
  contributingFactors: string[];

  // Claims
  claimAmount: Decimal;
  claimStatus: string;        // PENDING, SUBMITTED, APPROVED, PAID
  claimSubmittedDate: Date;

  // Status
  status: string;             // OPEN, IN_INVESTIGATION, IN_PROGRESS, CLOSED
}
```

### CAPA Fields

```typescript
{
  capaNumber: string;         // CAPA-YYYYMM-####
  capaType: string;           // CORRECTIVE, PREVENTIVE, BOTH
  title: string;
  description: string;

  // Risk Assessment
  severity: number;           // 1-10
  occurrence: number;         // 1-10
  detection: number;          // 1-10
  riskPriorityNumber: number; // severity × occurrence × detection

  // Actions
  immediateCont ainmentAction: string;
  correctiveActions: string;
  preventiveActions: string;

  // Verification
  effectivenessScore: number; // 0-100
  verifiedDate: Date;

  // Status
  status: string;             // OPEN, IN_PROGRESS, COMPLETED, VERIFIED, CLOSED
}
```

### Quality Hold Fields

```typescript
{
  holdNumber: string; // QH-YYYYMM-####
  holdType: string; // PRODUCT, LOT, LOCATION, VENDOR, ORDER
  quantityOnHold: number;
  quantityReleased: number;
  quantityRejected: number;
  quantityRemaining: number;

  // Release
  releaseStatus: string; // PENDING, REQUESTED, APPROVED, REJECTED, RELEASED
  disposition: string; // RELEASE, REWORK, RETURN_TO_VENDOR, SCRAP, etc.

  // Investigation
  investigationStatus: string; // NOT_STARTED, IN_PROGRESS, COMPLETED

  status: string; // ACTIVE, RELEASED, CANCELLED, EXPIRED
}
```

### Sampling Plan Fields

```typescript
{
  planNumber: string; // SP-YYYY-####
  inspectionLevel: string; // S1, S2, S3, S4, I, II, III
  aqlCritical: Decimal;
  aqlMajor: Decimal;
  aqlMinor: Decimal;
  samplingType: string; // SINGLE, DOUBLE, MULTIPLE, SEQUENTIAL
  sampleSizeCode: string; // A-R
  sampleSize: number;
  acceptNumber: number;
  rejectNumber: number;
  status: string; // DRAFT, ACTIVE, INACTIVE, SUPERSEDED
}
```

### Quality Measurement Fields

```typescript
{
  measurementNumber: string; // QM-YYYYMM-#####
  measurementType: string; // DIMENSIONAL, WEIGHT, TEMPERATURE, etc.
  measurementValue: Decimal;
  unitOfMeasure: string;

  // Spec Limits
  lowerSpecLimit: Decimal;
  upperSpecLimit: Decimal;
  nominalValue: Decimal;

  // Control Limits
  lowerControlLimit: Decimal;
  upperControlLimit: Decimal;

  // Analysis
  isConforming: boolean;
  deviation: Decimal;
  deviationPercentage: Decimal;
  cpk: Decimal;
  ppk: Decimal;
}
```

### Quality Report Fields

```typescript
{
  reportNumber: string; // QR-YYYYMM-####
  reportType: string; // DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUAL
  reportCategory: string; // INSPECTION, DEFECTS, NCR, CAPA, SUPPLIER, EXECUTIVE
  periodStart: Date;
  periodEnd: Date;
  metrics: Json; // Comprehensive metrics object
  generatedDate: Date;
}
```

## Enums & Constants

### NCR Source Types

- RECEIVING
- PRODUCTION
- PICKING
- PACKING
- CUSTOMER_COMPLAINT
- AUDIT

### NCR Severities

- CRITICAL
- MAJOR
- MINOR

### NCR Categories

- DEFECTIVE_MATERIAL
- QUANTITY_VARIANCE
- LABELING_ERROR
- PACKAGING_DEFECT
- DOCUMENTATION_ERROR
- PROCESS_DEVIATION
- CONTAMINATION
- OTHER

### NCR Dispositions

- REWORK
- SCRAP
- RETURN_TO_VENDOR
- USE_AS_IS
- CREDIT_CLAIM
- QUARANTINE

### Claim Status

- PENDING
- SUBMITTED
- APPROVED
- REJECTED
- PAID
- PARTIALLY_PAID

### CAPA Types

- CORRECTIVE
- PREVENTIVE
- BOTH

### Hold Types

- PRODUCT
- LOT
- LOCATION
- VENDOR
- ORDER

### Measurement Types

- DIMENSIONAL
- WEIGHT
- TEMPERATURE
- PRESSURE
- PH
- HARDNESS
- THICKNESS
- VISCOSITY

## Best Practices

### 1. Always Use Try-Catch

```typescript
try {
  const ncr = await NCRService.createNCR(params);
  return { success: true, data: ncr };
} catch (error) {
  console.error("Failed to create NCR:", error);
  return { success: false, error: error.message };
}
```

### 2. Validate Organization Access

```typescript
// Ensure user has access to organization
if (user.organizationId !== params.organizationId) {
  throw new Error("Unauthorized access");
}
```

### 3. Use Filters for Large Datasets

```typescript
// Good: Use date filters
const ncrs = await NCRService.listNCRs(orgId, {
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-01-31"),
});

// Bad: Loading all NCRs
const allNCRs = await NCRService.listNCRs(orgId);
```

### 4. Link Related Records

```typescript
// Always link NCR to CAPA
await NCRService.linkCAPA(ncrId, capaId);

// Always link NCR to inspection
const ncr = await NCRService.createNCR({
  ...params,
  sourceType: "RECEIVING",
  sourceId: inspection.id,
});
```

### 5. Complete Workflows

```typescript
// Bad: Skipping steps
await NCRService.closeNCR(ncrId, userId, "Closed");

// Good: Complete all steps
await NCRService.completeRCA(ncrId, rootCause, factors);
await NCRService.submitClaim(ncrId, amount, justification);
await NCRService.linkCAPA(ncrId, capaId);
await NCRService.closeNCR(ncrId, userId, notes, approverId);
```

## Performance Tips

1. **Use Indexes:** All major fields are indexed (organizationId, status, dates)
2. **Batch Operations:** Use Promise.all() for parallel operations
3. **Pagination:** Implement pagination for list views
4. **Caching:** Cache frequently accessed plans and reports
5. **Async Processing:** Use background jobs for report generation

## Security Checklist

- [ ] Validate organizationId on all requests
- [ ] Check user permissions
- [ ] Sanitize inputs
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Log all critical operations
- [ ] Implement rate limiting on APIs
- [ ] Encrypt sensitive data
- [ ] Use HTTPS for all requests

---

**Last Updated:** January 5, 2025  
**Version:** 1.0.0
