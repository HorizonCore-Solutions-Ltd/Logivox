# Quality Control (QC) Receiving Module - Complete Documentation

## Overview

The QC Receiving Module is a comprehensive quality control system integrated into Flowstock WMS that enables organizations to:

- Perform structured receiving inspections with AQL-based sampling
- Track defects with photo/video evidence
- Manage Return to Vendor (RTV) workflows
- Monitor supplier quality performance with scoring algorithms
- Maintain audit trails for compliance

This module was built as a **separate, production-ready system** with full database models, business logic services, REST APIs, and user interfaces.

---

## Architecture

### Technology Stack

- **Backend**: Next.js 14 App Router, TypeScript, Server Actions
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Frontend**: React, shadcn/ui, Tailwind CSS
- **Email**: Nodemailer with SMTP (SendGrid/AWS SES/custom)
- **File Storage**: AWS S3 / Azure Blob / Google Cloud Storage
- **Standards**: ISO 2859-1 / ANSI/ASQ Z1.4 for AQL sampling

### Database Schema

**9 Core Models Created:**

1. **QCReceivingInspection** - Main inspection records
   - Fields: inspection_number, type, sample_size, totals, status, result
   - Relations: Organization, Warehouse, Supplier, PO, GRN, User, Items

2. **QCInspectionItem** - Individual inspected items
   - Fields: quantity_inspected, quantity_passed/failed/rejected, checklist_data, photos
   - Relations: Inspection, InventoryItem

3. **QCDefect** - Defect tracking with evidence
   - Fields: defect_type, category, quantity_affected, description, severity, photos, videos
   - Relations: Inspection, Item, RTV

4. **RTV** - Return to Vendor records
   - Fields: rtv_number, vendor_rma_number, carrier, tracking_number, resolution_type, credit_amount
   - Relations: Organization, Supplier, Defect, PO, Activities

5. **RTVActivity** - RTV audit trail
   - Fields: action, description, performed_by, performed_at
   - Relations: RTV, User

6. **VendorQualityScore** - Supplier quality metrics
   - Fields: lifetime stats, 90-day stats, quality_score, reliability_score, response_score, overall_score, tier, status
   - Relations: Organization, Supplier

7. **QCInspectionTemplate** - Reusable inspection checklists
   - Fields: template_name, checklist_items, aql_levels, sampling_rules
   - Relations: Organization

8. **QCInspectionActivity** - Inspection audit trail
   - Fields: action, description, performed_by, performed_at
   - Relations: Inspection, User

9. **QCSettings** - Organization QC configuration
   - Fields: aql_levels, auto_notify_vendor, require_photos, sampling_level
   - Relations: Organization

### Service Layer

**3 Production-Ready Services (1,276 total lines):**

1. **QCInspectionService** (`/lib/services/qc/inspection-service.ts` - 449 lines)
   - AQL-based sample size calculation
   - Inspection lifecycle management
   - Defect recording with vendor quality updates
   - Statistical aggregations

2. **RTVService** (`/lib/services/qc/rtv-service.ts` - 442 lines)
   - RTV creation from defects
   - Vendor email notifications with HTML templates
   - Shipping tracking
   - Credit memo recording
   - Lifecycle management (pending → notified → approved → shipped → credited → closed)

3. **SupplierQualityService** (`/lib/services/qc/supplier-quality-service.ts` - 385 lines)
   - Multi-factor quality scoring (quality, reliability, response)
   - Tier assignment (PREMIUM/STANDARD/BASIC/POOR)
   - Status management (APPROVED/PROBATION/SUSPENDED/BLOCKED)
   - Trend analysis and supplier comparisons

### API Layer

**6 RESTful Endpoint Files:**

1. `/app/api/qc/inspections/route.ts` - GET list, POST create
2. `/app/api/qc/inspections/[id]/route.ts` - GET details, PATCH actions
3. `/app/api/qc/rtv/route.ts` - GET list, POST create
4. `/app/api/qc/rtv/[id]/route.ts` - GET details, PATCH actions
5. `/app/api/qc/supplier-quality/route.ts` - GET/list/trends/compare, POST update
6. `/app/api/qc/stats/route.ts` - GET combined statistics

### UI Layer

**4 Main Pages:**

1. **QC Dashboard** (`/app/dashboard/qc/page.tsx` - 274 lines)
   - 4 stat cards (inspections, pass rate, defect rate, active RTVs)
   - Quick action navigation cards
   - Recent inspections list with status badges

2. **RTV Management** (`/app/dashboard/qc/rtv/page.tsx` - 207 lines)
   - RTV list with filters (status, supplier)
   - Stats summary (pending, shipped, credited, total value)
   - Status/priority badges

3. **RTV Detail** (`/app/dashboard/qc/rtv/[id]/page.tsx` - 414 lines)
   - Defect information with photos
   - Vendor contact details
   - Action forms (ship, record response, record credit)
   - Activity timeline
   - Quick actions sidebar

4. **Supplier Quality Scorecard** (`/app/dashboard/qc/supplier-quality/page.tsx` - 314 lines)
   - Supplier cards with score breakdowns
   - Overall/quality/reliability/response scores
   - Lifetime vs 90-day metrics comparison
   - Tier/status badges
   - Trend indicators (improving/declining)
   - Filters by tier and status

**3 Shared Components:**

1. **DefectRecordingForm** (`/components/qc/DefectRecordingForm.tsx` - 189 lines)
   - Defect type/category/severity selection
   - Photo/video upload with preview
   - Root cause and corrective action fields

2. **InspectionChecklist** (`/components/qc/InspectionChecklist.tsx` - 195 lines)
   - Dynamic checklist rendering
   - Progress tracking (completed/passed/failed)
   - Pass/Fail buttons with notes
   - Multiple input types (checkbox, text, number, measurement)

3. **QualityBadge** (`/components/qc/QualityBadge.tsx` - 143 lines)
   - Score visualization with color coding
   - Circular progress indicator (QualityScoreCircle)
   - Horizontal bar chart (QualityScoreBar)
   - Trend indicators (up/down/stable)

---

## Features

### 1. Receiving Inspection

**Inspection Types:**
- RECEIVING - Standard receiving inspection (most common)
- IN_PROCESS - In-process quality checks
- FINAL - Final inspection before shipment
- AUDIT - Periodic quality audits
- BATCH - Batch-specific inspections

**Workflow:**

```
1. Create Inspection
   ↓ (auto-calculate sample size using AQL)
2. Start Inspection
   ↓ (status: PENDING → IN_PROGRESS)
3. Add Inspection Items
   ↓ (record quantity_passed, quantity_failed, checklist_data)
4. Record Defects (if any)
   ↓ (upload photos, categorize, link to items)
5. Complete Inspection
   ↓ (calculate overall result: PASS/FAIL/CONDITIONAL)
6. Auto-update Vendor Quality Score
```

**AQL Sampling Logic:**

```typescript
// ISO 2859-1 standard implementation
const sampleSize = calculateSampleSize({
  lotSize: 1000,
  inspectionLevel: 'II',  // General inspection level II
  aqlCritical: 0.0,       // 0% critical defects allowed
  aqlMajor: 2.5,          // 2.5% major defects allowed
  aqlMinor: 4.0           // 4.0% minor defects allowed
});
// Returns: { sampleSize: 80, acceptanceCritical: 0, acceptanceMajor: 2, acceptanceMinor: 3 }
```

**Inspection Results:**
- **PASS**: No defects or within acceptable limits
- **FAIL**: Critical defects or exceeds AQL thresholds
- **CONDITIONAL**: Minor issues requiring follow-up

### 2. Defect Management

**Defect Types:**
- COSMETIC - Appearance issues (scratches, dents)
- FUNCTIONAL - Performance issues
- PACKAGING - Packaging damage or errors
- DIMENSION - Size/measurement out of spec
- MATERIAL - Material defects or contamination
- ASSEMBLY - Assembly errors or missing parts
- LABELING - Labeling errors or missing labels
- DOCUMENTATION - Missing or incorrect documentation
- OTHER - Custom defect types

**Defect Categories:**
- **CRITICAL**: Product safety or legal compliance issues
- **MAJOR**: Significant quality issues affecting usability
- **MINOR**: Cosmetic or non-functional defects

**Evidence Collection:**
- Multiple photos per defect (up to 10)
- Video recordings (up to 3 per defect)
- Cloud storage integration (S3/Azure/GCS)
- Auto-thumbnail generation

**Defect Resolution:**
- PENDING - Awaiting decision
- RTV - Return to vendor
- REWORK - Internal rework/repair
- SCRAP - Dispose/scrap
- ACCEPT_AS_IS - Accept with concession

### 3. Return to Vendor (RTV)

**RTV Lifecycle:**

```
1. Create RTV (from defect)
   ↓
2. Notify Vendor (email with photos)
   ↓
3. Await Vendor Response (RMA number)
   ↓
4. Approve/Reject RTV
   ↓ (if approved)
5. Ship RTV (record carrier/tracking)
   ↓
6. Vendor Resolution (credit/replacement/refused)
   ↓ (if credit)
7. Record Credit (credit memo number/amount)
   ↓
8. Close RTV
```

**RTV Statuses:**
- PENDING - Created, awaiting action
- VENDOR_NOTIFIED - Email sent to vendor
- APPROVED - Approved for return
- REJECTED - Return rejected
- SHIPPED - Package shipped to vendor
- CREDITED - Credit memo received
- CLOSED - RTV completed

**RTV Priority:**
- URGENT - High value or critical defects
- HIGH - Significant impact
- MEDIUM - Standard priority
- LOW - Minor issues

**Vendor Notification Email:**

Automatically generated HTML email includes:
- RTV number and defect details
- Product information (SKU, name, qty)
- Defect photos (embedded)
- Request for RMA number
- Expected resolution timeframe
- Contact information

### 4. Supplier Quality Scoring

**Multi-Factor Scoring Algorithm:**

```typescript
// Quality Score (0-100)
// Based on defect rate with weighted thresholds
qualityScore = calculateQualityScore({
  defectRate: 2.3,      // 2.3% defect rate
  thresholds: {
    excellent: 1.0,     // < 1% = 100 points
    good: 3.0,          // < 3% = 75-99 points
    fair: 5.0,          // < 5% = 50-74 points
    poor: 10.0          // > 10% = 0-49 points
  }
});
// Returns: 85.2

// Reliability Score (0-100)
// Based on inspection frequency and sample size
reliabilityScore = calculateReliabilityScore({
  inspectionCount: 15,
  totalUnits: 5000,
  daysActive: 90
});
// Returns: 92.1

// Response Score (0-100)
// Based on RTV resolution time
responseScore = calculateResponseScore({
  avgResolutionDays: 7,
  targetDays: 10
});
// Returns: 88.5

// Overall Score (weighted average)
overallScore = (qualityScore + reliabilityScore + responseScore) / 3;
// Returns: 88.6
```

**Supplier Tiers:**
- **PREMIUM** (90+): Top-tier suppliers, priority treatment
- **STANDARD** (75-89): Reliable suppliers, standard process
- **BASIC** (60-74): Acceptable suppliers, increased monitoring
- **POOR** (<60): Problem suppliers, corrective action required

**Supplier Status:**
- **APPROVED**: Good standing, no restrictions
- **PROBATION**: Warning status, increased inspection frequency
- **SUSPENDED**: Temporarily restricted, no new orders
- **BLOCKED**: Permanently blocked, all business ceased

**90-Day Rolling Metrics:**
- Continuously updated with recent performance
- Weighted more heavily in tier/status decisions
- Enables quick identification of declining suppliers

**Consecutive Good Orders Tracking:**
- Reward streak for defect-free shipments
- Badge display for suppliers with 5+ consecutive good orders
- Automatic tier upgrade consideration

### 5. Audit Trail & Compliance

**Activity Logging:**
- All inspection actions logged with user/timestamp
- All RTV actions logged with user/timestamp
- Immutable audit trail for compliance
- Filterable activity history

**Compliance Features:**
- ISO 2859-1 standard AQL sampling
- Photo evidence retention
- Email notification records
- Quality score calculations documented
- Exportable reports (future: PDF generation)

---

## API Reference

### Inspections

**Create Inspection**
```
POST /api/qc/inspections
Body: {
  organizationId, warehouseId, supplierId, purchaseOrderId,
  grnId, inspectionType, lotSize, notes
}
Response: { inspection }
```

**List Inspections**
```
GET /api/qc/inspections?organizationId=xxx&status=IN_PROGRESS
Response: { inspections: [...], count }
```

**Get Inspection**
```
GET /api/qc/inspections/[id]
Response: { inspection (with items, defects, activities) }
```

**Start Inspection**
```
PATCH /api/qc/inspections/[id]
Body: { action: "start" }
Response: { inspection }
```

**Add Inspection Item**
```
PATCH /api/qc/inspections/[id]
Body: {
  action: "addItem",
  itemId, quantityInspected, quantityPassed, quantityFailed,
  quantityRejected, checklistData, photos
}
Response: { item }
```

**Record Defect**
```
PATCH /api/qc/inspections/[id]
Body: {
  action: "recordDefect",
  itemId, defectType, category, quantityAffected, severity,
  description, photos, videos, rootCause, correctiveAction
}
Response: { defect }
```

**Complete Inspection**
```
PATCH /api/qc/inspections/[id]
Body: { action: "complete", notes }
Response: { inspection }
```

### RTVs

**Create RTV**
```
POST /api/qc/rtv
Body: {
  organizationId, defectId, quantity, value, priority, reason, notes
}
Response: { rtv }
```

**List RTVs**
```
GET /api/qc/rtv?organizationId=xxx&status=PENDING
Response: { rtvs: [...], count }
```

**Get RTV**
```
GET /api/qc/rtv/[id]
Response: { rtv (with defect, supplier, activities) }
```

**Notify Vendor**
```
PATCH /api/qc/rtv/[id]
Body: { action: "notifyVendor" }
Response: { rtv, emailSent: true }
```

**Approve RTV**
```
PATCH /api/qc/rtv/[id]
Body: { action: "approve" }
Response: { rtv }
```

**Reject RTV**
```
PATCH /api/qc/rtv/[id]
Body: { action: "reject", reason }
Response: { rtv }
```

**Ship RTV**
```
PATCH /api/qc/rtv/[id]
Body: {
  action: "ship",
  carrier, trackingNumber, shippingCost, shippingLabelUrl
}
Response: { rtv }
```

**Record Vendor Response**
```
PATCH /api/qc/rtv/[id]
Body: {
  action: "recordVendorResponse",
  vendorRmaNumber, resolutionType, expectedResolutionDate
}
Response: { rtv }
```

**Record Credit**
```
PATCH /api/qc/rtv/[id]
Body: {
  action: "recordCredit",
  creditAmount, creditMemoNumber
}
Response: { rtv }
```

**Close RTV**
```
PATCH /api/qc/rtv/[id]
Body: { action: "close", notes }
Response: { rtv }
```

### Supplier Quality

**Get Supplier Quality**
```
GET /api/qc/supplier-quality?supplierId=xxx
Response: { quality }
```

**List Supplier Quality**
```
GET /api/qc/supplier-quality?organizationId=xxx&tier=PREMIUM&status=APPROVED
Response: { suppliers: [...], count }
```

**Get Quality Trends**
```
GET /api/qc/supplier-quality?action=trends&supplierId=xxx&months=6
Response: { trends: [{ month, defectRate, qualityScore, ... }] }
```

**Compare Suppliers**
```
GET /api/qc/supplier-quality?action=compare&supplierIds=id1,id2,id3
Response: { comparison: [...] }
```

**Update Supplier Quality**
```
POST /api/qc/supplier-quality
Body: { supplierId, organizationId }
Response: { quality }
```

**Update All Suppliers**
```
POST /api/qc/supplier-quality
Body: { action: "updateAll", organizationId }
Response: { updated: count }
```

### Statistics

**Get Inspection Stats**
```
GET /api/qc/stats?type=inspections&organizationId=xxx&days=30
Response: {
  totalInspections, totalUnits, passRate, defectRate,
  avgDefectsPerInspection, inspectionsByStatus, ...
}
```

**Get RTV Stats**
```
GET /api/qc/stats?type=rtv&organizationId=xxx&days=30
Response: {
  totalRtvs, totalValue, avgValue, avgResolutionDays,
  rtvsByStatus, rtvsByPriority, ...
}
```

**Get Combined Stats**
```
GET /api/qc/stats?organizationId=xxx&days=30
Response: {
  inspections: { ... },
  rtvs: { ... }
}
```

---

## Configuration

### Environment Variables

See [QC_ENVIRONMENT_CONFIG.md](./QC_ENVIRONMENT_CONFIG.md) for detailed configuration.

**Required:**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email notifications
- `SMTP_FROM_EMAIL` - Sender email address
- `DATABASE_URL` - PostgreSQL connection string

**Optional:**
- `QC_AQL_CRITICAL`, `QC_AQL_MAJOR`, `QC_AQL_MINOR` - AQL levels
- `QC_MIN_SAMPLE_SIZE`, `QC_MAX_SAMPLE_SIZE` - Sample size limits
- `QC_SCORE_*_THRESHOLD` - Quality score thresholds
- `AWS_*` - S3 configuration for file uploads
- `SLACK_WEBHOOK_URL` - Slack notifications

### AQL Configuration

Default AQL levels based on ISO 2859-1:

```typescript
{
  critical: 0.0,    // Zero tolerance for critical defects
  major: 2.5,       // 2.5% acceptable quality level for major
  minor: 4.0        // 4.0% acceptable quality level for minor
}
```

Adjust based on your industry standards (e.g., medical devices may use lower AQL).

---

## Usage Examples

### Example 1: Create and Complete Inspection

```typescript
// 1. Create inspection
const inspection = await fetch('/api/qc/inspections', {
  method: 'POST',
  body: JSON.stringify({
    organizationId: 'org_123',
    warehouseId: 'wh_456',
    supplierId: 'sup_789',
    purchaseOrderId: 'po_1011',
    grnId: 'grn_1213',
    inspectionType: 'RECEIVING',
    lotSize: 500
  })
});
// Sample size automatically calculated: 80 units

// 2. Start inspection
await fetch(`/api/qc/inspections/${inspection.id}`, {
  method: 'PATCH',
  body: JSON.stringify({ action: 'start' })
});

// 3. Add items and record defects
await fetch(`/api/qc/inspections/${inspection.id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    action: 'addItem',
    itemId: 'item_123',
    quantityInspected: 10,
    quantityPassed: 8,
    quantityFailed: 2
  })
});

await fetch(`/api/qc/inspections/${inspection.id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    action: 'recordDefect',
    itemId: 'item_123',
    defectType: 'COSMETIC',
    category: 'MINOR',
    quantityAffected: 2,
    severity: 'MINOR',
    description: 'Scratches on surface',
    photos: ['https://s3.../photo1.jpg']
  })
});

// 4. Complete inspection
await fetch(`/api/qc/inspections/${inspection.id}`, {
  method: 'PATCH',
  body: JSON.stringify({ action: 'complete' })
});
// Vendor quality score automatically updated
```

### Example 2: Create and Process RTV

```typescript
// 1. Create RTV from defect
const rtv = await fetch('/api/qc/rtv', {
  method: 'POST',
  body: JSON.stringify({
    organizationId: 'org_123',
    defectId: 'defect_456',
    quantity: 100,
    value: 1500.00,
    priority: 'HIGH',
    reason: 'Significant cosmetic defects affecting saleability'
  })
});
// RTV number auto-generated: RTV-202601-000001

// 2. Notify vendor
await fetch(`/api/qc/rtv/${rtv.id}`, {
  method: 'PATCH',
  body: JSON.stringify({ action: 'notifyVendor' })
});
// Email sent to supplier with defect photos and RTV details

// 3. Approve RTV
await fetch(`/api/qc/rtv/${rtv.id}`, {
  method: 'PATCH',
  body: JSON.stringify({ action: 'approve' })
});

// 4. Ship RTV
await fetch(`/api/qc/rtv/${rtv.id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    action: 'ship',
    carrier: 'UPS',
    trackingNumber: '1Z999AA10123456784',
    shippingCost: 25.50
  })
});

// 5. Record vendor response
await fetch(`/api/qc/rtv/${rtv.id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    action: 'recordVendorResponse',
    vendorRmaNumber: 'RMA-789456',
    resolutionType: 'CREDIT'
  })
});

// 6. Record credit received
await fetch(`/api/qc/rtv/${rtv.id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    action: 'recordCredit',
    creditAmount: 1500.00,
    creditMemoNumber: 'CM-2026-001'
  })
});

// 7. Close RTV
await fetch(`/api/qc/rtv/${rtv.id}`, {
  method: 'PATCH',
  body: JSON.stringify({ action: 'close' })
});
```

### Example 3: Monitor Supplier Quality

```typescript
// Get all suppliers sorted by score
const response = await fetch('/api/qc/supplier-quality?organizationId=org_123');
const { suppliers } = response;

// Find problem suppliers
const problemSuppliers = suppliers.filter(s => 
  s.status === 'PROBATION' || s.tier === 'POOR'
);

// Get trend data for specific supplier
const trends = await fetch(
  '/api/qc/supplier-quality?action=trends&supplierId=sup_789&months=6'
);

// Compare top 3 suppliers
const comparison = await fetch(
  '/api/qc/supplier-quality?action=compare&supplierIds=sup1,sup2,sup3'
);

// Recalculate all scores (nightly batch job)
await fetch('/api/qc/supplier-quality', {
  method: 'POST',
  body: JSON.stringify({
    action: 'updateAll',
    organizationId: 'org_123'
  })
});
```

---

## Integration Points

### With Existing Flowstock Modules

1. **Purchase Orders**
   - QC inspections linked to POs
   - Inspection results can block PO receipt
   - RTV value tracked against PO

2. **Goods Receipt Note (GRN)**
   - Inspections created from GRN
   - GRN completion can require passing inspection
   - Failed inspections prevent inventory putaway

3. **Inventory Management**
   - Defective items quarantined automatically
   - Failed inspection items moved to defect location
   - RTV items removed from available inventory

4. **Supplier Management**
   - Quality scores displayed in supplier profiles
   - Supplier approval status enforced in PO creation
   - Historical quality data available

5. **Warehouse Operations**
   - QC station locations configured per warehouse
   - Inspection tasks routed to QC personnel
   - Mobile app support for handheld inspections

6. **Reporting & Analytics**
   - QC metrics in warehouse dashboards
   - Supplier scorecards in procurement reports
   - Defect trend analysis in quality reports

---

## Mobile Support

The QC module UI is fully responsive and mobile-friendly:

- **Inspection Checklists**: Touch-optimized pass/fail buttons
- **Photo Capture**: Mobile camera integration
- **Defect Recording**: Voice-to-text for descriptions
- **RTV Actions**: Mobile-optimized action buttons

Future enhancements:
- Native mobile app for offline inspections
- Barcode scanning for item identification
- Signature capture for inspection approval

---

## Deployment

### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### Environment Setup

1. Copy `.env.example` to `.env.production`
2. Configure SMTP settings for email notifications
3. Configure S3 (or alternative) for file uploads
4. Set AQL levels and quality thresholds
5. Test email sending with a test RTV

### Post-Deployment Checklist

- [ ] Database migration successful
- [ ] Email notifications working
- [ ] File upload to S3 working
- [ ] Sample inspections created
- [ ] Supplier quality scores calculated
- [ ] RTV workflow tested end-to-end
- [ ] Mobile responsiveness verified
- [ ] User permissions configured

---

## Roadmap & Future Enhancements

### Phase 2 Features

1. **Advanced Analytics**
   - Defect Pareto charts
   - Control charts (X-bar, R charts)
   - Six Sigma metrics (DPMO, Cpk)
   - ML-based defect prediction

2. **Automated Actions**
   - Auto-create RTVs for critical defects
   - Auto-block suppliers with 3+ consecutive failures
   - Auto-escalate high-value RTVs
   - Auto-generate corrective action requests

3. **Enhanced Reporting**
   - PDF inspection reports with photos
   - Monthly supplier scorecards
   - Executive quality dashboards
   - Custom report builder

4. **Integrations**
   - ERP sync (quality scores to ERP)
   - Carrier API for auto-tracking
   - E-signature for inspection approval
   - BI tools (Tableau, Power BI)

5. **Compliance & Standards**
   - ISO 9001 compliance templates
   - FDA 21 CFR Part 11 audit trails
   - PPAP (Production Part Approval Process)
   - APQP (Advanced Product Quality Planning)

### Known Limitations

- **File uploads**: Currently requires manual S3 configuration (no auto-setup)
- **PDF reports**: Not yet implemented (planned for Phase 2)
- **Offline mode**: No offline inspection capability (requires internet)
- **Signature capture**: Not yet implemented
- **Barcode scanning**: Not yet implemented

---

## Support & Maintenance

### Logging

All services include comprehensive logging:
- Inspection actions logged to `QCInspectionActivity`
- RTV actions logged to `RTVActivity`
- Email send attempts logged
- Quality score calculations logged

### Monitoring

Recommended metrics to monitor:
- Inspection completion rate (target: >95%)
- RTV resolution time (target: <14 days)
- Email delivery success rate (target: >99%)
- Supplier quality score distribution
- Defect rate trends

### Troubleshooting

See [QC_ENVIRONMENT_CONFIG.md](./QC_ENVIRONMENT_CONFIG.md#troubleshooting) for common issues.

---

## Conclusion

The QC Receiving Module is a complete, production-ready quality control system with:

✅ **9 database models** integrated with Flowstock schema  
✅ **3 service classes** (1,276 lines) with business logic  
✅ **6 API endpoint files** with full CRUD + actions  
✅ **4 main UI pages** (1,209 lines) with responsive design  
✅ **3 shared components** (527 lines) for reusability  
✅ **Comprehensive documentation** with examples  

**Total Lines of Code: ~3,000+ across backend and frontend**

The module is **fully integrated** with existing Flowstock modules (PO, GRN, Inventory, Suppliers) and follows **industry standards** (ISO 2859-1 AQL sampling).

**Ready for immediate deployment** with proper environment configuration and database migration.

---

**Documentation Version:** 1.0  
**Last Updated:** January 2026  
**Author:** Flowstock Development Team  
**Contact:** qc-support@flowstock.com
