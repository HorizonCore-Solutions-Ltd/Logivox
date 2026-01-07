# 🚀 QUICK START - Phase 2 Quality Operating System

## For Developers

### Start Development Server

```bash
cd /workspaces/Flowstock
npm run dev
# Open http://localhost:3000
```

### Access New Features

- **SPC Dashboard**: `/dashboard/qc/spc`
- **Risk Management**: `/dashboard/qc/risk`
- **FMEA**: `/dashboard/qc/fmea`
- **Audits**: `/dashboard/qc/audits`
- **Documents**: `/dashboard/qc/documents`
- **Analytics**: `/dashboard/qc/analytics`
- **Supplier Portal**: `/supplier/login`

### Test Credentials

```
User: test@flowstock.com
Password: test123

Supplier Portal: (create via API or UI)
```

---

## For Quality Managers

### Daily Workflow

1. **Check Analytics** → `/dashboard/qc/analytics`
   - Review quality KPIs
   - Check cost of quality
   - Monitor supplier performance

2. **Review SPC Charts** → `/dashboard/qc/spc`
   - Look for out-of-control conditions
   - Check Western Electric violations
   - Review CPK/PPK values

3. **Manage NCRs** → `/dashboard/qc/ncr`
   - Create new NCRs
   - Follow up on supplier responses
   - Link to CAPAs

4. **Track Risks** → `/dashboard/qc/risk`
   - Review high RPN risks (≥200)
   - Update mitigation status
   - Track residual risk

### Weekly Tasks

- Schedule audits (`/dashboard/qc/audits/create`)
- Review supplier scorecards
- Update FMEAs
- Approve quality documents

---

## For Suppliers

### Accessing Your Portal

1. Go to `/supplier/login`
2. Enter your credentials (provided by quality team)
3. View your quality dashboard

### Responding to NCRs

1. Click on NCR from dashboard
2. Complete 8D methodology form:
   - D1: Team
   - D2: Problem Description (5W2H)
   - D3: Containment
   - D4: Root Cause
   - D5: Corrective Actions
   - D6: Validation
   - D7: Prevention
   - D8: Recognition
3. Upload photos as evidence
4. Add digital signature
5. Submit

---

## API Quick Reference

### Create Risk

```typescript
POST /api/qc/risk
{
  "title": "Process Risk",
  "description": "Risk description",
  "category": "PROCESS",
  "severity": 8,
  "occurrence": 6,
  "detection": 4,
  "owner": "Quality Manager",
  "organizationId": "org-id"
}
// RPN auto-calculated: 192
```

### Calculate SPC

```typescript
POST /api/qc/spc/calculate
{
  "data": [45, 46, 45, 47, 44, 46, 45],
  "lsl": 40,
  "usl": 50
}
// Returns: UCL, LCL, CPK, PPK, violations
```

### Create FMEA

```typescript
POST /api/qc/fmea
{
  "title": "Receiving Process FMEA",
  "type": "PROCESS_FMEA",
  "scope": "Receiving inspection process",
  "teamLead": "Quality Engineer",
  "failureModes": [...]
}
```

---

## Troubleshooting

### SPC not calculating correctly

```bash
# Check measurements exist
npx prisma studio
# Navigate to QualityMeasurement table
```

### Supplier can't login

```bash
# Create supplier user
POST /api/supplier/auth
{
  "email": "supplier@company.com",
  "password": "tempPass123",
  "supplierId": "sup-id",
  "role": "RESPONDER"
}
```

### Auto-escalation not running

```bash
# Run manually
npx ts-node -e "import('./lib/engines/escalation.engine').then(m => m.EscalationEngine.runAllRules())"
```

### File uploads failing

```bash
# Create upload directories
mkdir -p public/uploads/qc
mkdir -p public/uploads/documents
chmod 755 public/uploads/*
```

---

## Key Metrics to Monitor

### Daily

- [ ] Total open NCRs
- [ ] Critical risks (RPN ≥ 200)
- [ ] SPC out-of-control points
- [ ] Overdue CAPAs

### Weekly

- [ ] NCR trend (increasing/decreasing)
- [ ] Supplier quality scores
- [ ] Audit completion rate
- [ ] Document approval status

### Monthly

- [ ] Cost of quality
- [ ] CAPA effectiveness rate
- [ ] Supplier audit triggers
- [ ] ISO 9001 compliance %

---

## Support

### Documentation

- Full details: `/docs/quality-assurance/PHASE_2_BUILD_COMPLETION_REPORT.md`
- Deployment guide: `/docs/quality-assurance/DEPLOYMENT_READY.md`
- Roadmap: `/docs/quality-assurance/PHASE_2_ROADMAP.md`

### Scripts

- **Seed test data**: `npx ts-node scripts/seed-phase2-test-data.ts`
- **Run integration tests**: `npx ts-node scripts/verify-phase2-integration.ts`
- **Database migration**: `npx prisma migrate dev`
- **Prisma Studio**: `npx prisma studio`

---

**System Version**: v2.0-phase2  
**Status**: ✅ Production Ready  
**Last Updated**: January 5, 2026
