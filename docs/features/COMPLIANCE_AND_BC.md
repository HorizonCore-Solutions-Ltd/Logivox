# Compliance & Business Continuity Plan

## Table of Contents

1. [Audit Logging](#audit-logging)
2. [Data Retention](#data-retention)
3. [Backup Strategy](#backup-strategy)
4. [Disaster Recovery](#disaster-recovery)
5. [Compliance Standards](#compliance-standards)
6. [Business Continuity](#business-continuity)

---

## Audit Logging

### Activity Log System

All user actions are tracked in the `ActivityLog` table with the following information:

```typescript
{
  userId: string; // Who performed the action
  organizationId: string; // Which tenant
  action: string; // What was done (CREATE, UPDATE, DELETE, VIEW, LOGIN, etc.)
  entityType: string; // What was affected (User, Order, Inventory, etc.)
  entityId: string; // Specific record ID
  metadata: JSON; // Additional context (IP, user agent, changes, etc.)
  timestamp: DateTime; // When it occurred
}
```

### Tracked Actions

**Authentication Events:**

- User login/logout
- Failed login attempts
- Password changes
- MFA enrollment/verification
- Session creation/termination
- API key usage

**Data Operations:**

- Create, Read, Update, Delete on all entities
- Bulk operations
- Data exports
- Report generation
- Configuration changes

**Security Events:**

- Permission changes
- Role assignments
- Organization access modifications
- Integration credential updates
- Failed authorization attempts

### Log Retention

- **Standard Logs:** 90 days in primary database
- **Archived Logs:** 7 years in cold storage (S3/Azure Blob)
- **Critical Security Events:** Permanent retention
- **Compliance Logs:** Per regulatory requirement (typically 7 years)

### Log Access

- **Admins:** Full access to their organization's logs
- **Super Admins:** Cross-organization access
- **Auditors:** Read-only access via secure portal
- **API:** Logs accessible via `/api/audit-logs` endpoint

### Implementation

```typescript
// lib/services/audit-logger.ts
export async function logActivity({
  userId,
  organizationId,
  action,
  entityType,
  entityId,
  metadata,
}: ActivityLogInput) {
  await prisma.activityLog.create({
    data: {
      userId,
      organizationId,
      action,
      entityType,
      entityId,
      metadata: JSON.stringify(metadata),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    },
  });
}
```

---

## Data Retention

### Retention Policies

| Data Type                | Retention Period       | Storage Location          | Archive Method    |
| ------------------------ | ---------------------- | ------------------------- | ----------------- |
| User accounts (active)   | Indefinite             | Primary DB                | N/A               |
| User accounts (inactive) | 3 years                | Primary DB                | Soft delete       |
| Orders (completed)       | 7 years                | Primary DB → Cold storage | Annual archive    |
| Inventory transactions   | 5 years                | Primary DB → Cold storage | Quarterly archive |
| Financial records        | 7 years                | Primary DB → Cold storage | Never delete      |
| Activity logs            | 90 days → 7 years      | Primary DB → S3/Azure     | Monthly archive   |
| Session data             | 30 days                | Primary DB                | Auto-purge        |
| Temporary files          | 7 days                 | File storage              | Auto-delete       |
| Shipment tracking        | 3 years                | Primary DB → Cold storage | Annual archive    |
| Customer data (GDPR)     | Until deletion request | Primary DB                | Right to erasure  |

### Automated Archival

```bash
# scripts/archive-old-data.sh
#!/bin/bash

# Archive orders older than 5 years
psql $DATABASE_URL -c "
  INSERT INTO archived_orders
  SELECT * FROM sales_orders
  WHERE completed_at < NOW() - INTERVAL '5 years';

  DELETE FROM sales_orders
  WHERE completed_at < NOW() - INTERVAL '5 years';
"

# Archive activity logs older than 90 days
psql $DATABASE_URL -c "
  COPY (SELECT * FROM activity_logs WHERE created_at < NOW() - INTERVAL '90 days')
  TO '/backup/activity_logs_archive_$(date +%Y%m%d).csv' CSV HEADER;

  DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '90 days';
"

# Upload archives to S3
aws s3 cp /backup/activity_logs_archive_*.csv s3://logivox-archives/activity-logs/
```

### GDPR Compliance (Right to Erasure)

```typescript
// app/api/users/[id]/delete-data/route.ts
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const userId = params.id;

  // 1. Anonymize user data
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${userId}@example.com`,
      name: "Deleted User",
      phone: null,
      address: null,
      deletedAt: new Date(),
    },
  });

  // 2. Remove PII from activity logs
  await prisma.activityLog.updateMany({
    where: { userId },
    data: {
      metadata: JSON.stringify({ redacted: true }),
    },
  });

  // 3. Log the deletion request
  await logActivity({
    userId,
    action: "USER_DATA_DELETED",
    entityType: "User",
    entityId: userId,
    organizationId: null,
    metadata: { reason: "GDPR Right to Erasure" },
  });

  return NextResponse.json({ success: true });
}
```

---

## Backup Strategy

### Database Backups

**Production:**

- **Full backups:** Daily at 2 AM UTC
- **Incremental backups:** Every 6 hours
- **Transaction logs:** Continuous WAL archival
- **Retention:** 30 daily, 12 weekly, 12 monthly

**Staging:**

- **Full backups:** Weekly
- **Retention:** 4 weekly backups

### Backup Script

```bash
# scripts/backup-db.sh (already implemented)
#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="logivox_backup_$TIMESTAMP.sql.gz"
BACKUP_DIR="/backups"

# Create backup
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/$BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_DIR/$BACKUP_FILE s3://logivox-backups/production/

# Upload to Azure (redundancy)
az storage blob upload \
  --account-name logivoxbackups \
  --container-name production \
  --name $BACKUP_FILE \
  --file $BACKUP_DIR/$BACKUP_FILE

# Verify backup integrity
gunzip -t $BACKUP_DIR/$BACKUP_FILE

# Cleanup old local backups (keep last 7 days)
find $BACKUP_DIR -name "logivox_backup_*.sql.gz" -mtime +7 -delete

# Send notification
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"✅ Database backup completed: $BACKUP_FILE\"}"
```

### File Storage Backups

- **S3 Versioning:** Enabled with 30-day retention
- **Azure Blob Soft Delete:** Enabled with 30-day retention
- **Cross-Region Replication:** Enabled for disaster recovery

### Backup Testing

- **Monthly:** Restore test in staging environment
- **Quarterly:** Full disaster recovery drill
- **Documentation:** Update runbooks after each test

---

## Disaster Recovery

### Recovery Time Objective (RTO)

- **Database:** < 4 hours
- **Application:** < 2 hours
- **File Storage:** < 1 hour

### Recovery Point Objective (RPO)

- **Database:** < 15 minutes (using WAL)
- **File Storage:** < 1 hour (using replication)
- **Application Config:** < 5 minutes (using Git)

### DR Procedures

#### Database Recovery

```bash
# scripts/restore-db.sh (already implemented)
#!/bin/bash
set -e

# List available backups
aws s3 ls s3://logivox-backups/production/

# Download backup
BACKUP_FILE="logivox_backup_20260102_020000.sql.gz"
aws s3 cp s3://logivox-backups/production/$BACKUP_FILE /tmp/

# Create pre-restore backup
pg_dump $DATABASE_URL | gzip > /tmp/pre_restore_backup.sql.gz

# Restore
gunzip -c /tmp/$BACKUP_FILE | psql $DATABASE_URL

# Run migrations
npm run prisma:migrate:deploy

# Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

#### Application Recovery

```bash
# Deploy from last known good commit
git checkout <last-good-commit>
docker build -t logivox:recovery .
docker push logivox:recovery

# Update K8s deployment
kubectl set image deployment/logivox-web logivox-web=logivox:recovery
kubectl rollout status deployment/logivox-web
```

### Failover Strategy

**Primary Region (US-East):**

- PostgreSQL RDS (Multi-AZ)
- EKS Cluster (3 AZs)
- S3 Standard

**Secondary Region (US-West):**

- PostgreSQL Read Replica (promoted on failure)
- EKS Cluster (standby)
- S3 Cross-Region Replication

**Failover Trigger:**

- Automated health checks fail for 5 minutes
- Manual trigger via ops dashboard
- RDS automatic failover (< 2 minutes)

---

## Compliance Standards

### SOC 2 Type II

**Security Controls:**

- ✅ Encrypted data at rest (AES-256)
- ✅ Encrypted data in transit (TLS 1.3)
- ✅ Multi-factor authentication
- ✅ Role-based access control
- ✅ Audit logging
- ✅ Vulnerability scanning
- ✅ Penetration testing (annual)
- ✅ Security awareness training

**Availability Controls:**

- ✅ 99.9% uptime SLA
- ✅ Multi-region architecture
- ✅ Automated backups
- ✅ Disaster recovery plan
- ✅ Incident response procedures

**Confidentiality Controls:**

- ✅ Data classification policy
- ✅ Encryption key management
- ✅ Secure credential storage
- ✅ NDA with vendors

### GDPR Compliance

- ✅ Data protection impact assessment (DPIA)
- ✅ Privacy by design
- ✅ Right to access (user data export)
- ✅ Right to erasure (data deletion)
- ✅ Right to portability (JSON export)
- ✅ Consent management
- ✅ Data breach notification (< 72 hours)
- ✅ DPO designated
- ✅ Data processing agreements

### HIPAA (if handling healthcare data)

- ✅ Business Associate Agreement (BAA)
- ✅ PHI encryption
- ✅ Access controls
- ✅ Audit logs
- ✅ Breach notification procedures
- ✅ Staff training
- ✅ Risk assessments

### PCI DSS (if handling credit cards)

- ✅ No storage of full card numbers (use Stripe/tokenization)
- ✅ Secure network architecture
- ✅ Encryption of cardholder data
- ✅ Access control
- ✅ Regular security testing
- ✅ Information security policy

---

## Business Continuity

### Critical Business Functions

1. **Order Processing** (Priority 1)
   - RTO: 2 hours
   - RPO: 15 minutes
   - Alternative: Manual order entry + phone/email

2. **Inventory Management** (Priority 1)
   - RTO: 4 hours
   - RPO: 30 minutes
   - Alternative: Spreadsheet tracking

3. **Shipping** (Priority 2)
   - RTO: 6 hours
   - RPO: 1 hour
   - Alternative: Carrier websites

4. **Reporting** (Priority 3)
   - RTO: 24 hours
   - RPO: 1 day
   - Alternative: Manual reports

### Incident Response Plan

#### Severity Levels

**SEV-1 (Critical):**

- Complete system outage
- Data breach
- Data loss
- Response: Immediate escalation, 24/7 response

**SEV-2 (High):**

- Partial functionality loss
- Performance degradation
- Response: 1-hour response during business hours

**SEV-3 (Medium):**

- Non-critical feature issues
- Response: 4-hour response during business hours

**SEV-4 (Low):**

- Minor bugs, cosmetic issues
- Response: Next business day

#### Response Procedures

```markdown
1. **Detect:** Monitoring alerts, user reports
2. **Assess:** Determine severity and impact
3. **Escalate:** Notify on-call engineer + management (SEV-1/SEV-2)
4. **Communicate:** Update status page, notify customers
5. **Investigate:** Root cause analysis
6. **Mitigate:** Implement fix or workaround
7. **Recover:** Restore normal operations
8. **Document:** Post-mortem report (SEV-1/SEV-2)
9. **Improve:** Implement preventive measures
```

### Communication Plan

**Internal:**

- Slack #incidents channel
- PagerDuty alerts
- Email escalation

**External:**

- Status page (status.logivox.com)
- Email notifications to affected customers
- In-app banners

### Testing Schedule

- **Tabletop exercises:** Quarterly
- **DR drill:** Semi-annually
- **Full failover test:** Annually
- **Backup restore test:** Monthly

---

## Compliance Checklist

### Pre-Production

- [ ] Security audit completed
- [ ] Penetration testing passed
- [ ] GDPR compliance validated
- [ ] SOC 2 controls documented
- [ ] Data retention policies implemented
- [ ] Backup procedures tested
- [ ] DR plan validated
- [ ] Incident response plan reviewed
- [ ] Staff training completed
- [ ] Legal review of terms/privacy policy

### Ongoing

- [ ] Monthly security scans
- [ ] Quarterly vulnerability assessments
- [ ] Annual penetration testing
- [ ] Annual SOC 2 audit
- [ ] Continuous compliance monitoring
- [ ] Regular backup testing
- [ ] Incident response drills

---

## References

- [SOC 2 Compliance Framework](https://www.aicpa.org/soc4so)
- [GDPR Official Text](https://gdpr.eu/)
- [HIPAA Guidelines](https://www.hhs.gov/hipaa/)
- [PCI DSS Standards](https://www.pcisecuritystandards.org/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ISO 27001](https://www.iso.org/isoiec-27001-information-security.html)

---

**Document Version:** 1.0  
**Last Updated:** January 2, 2026  
**Next Review:** April 2, 2026  
**Owner:** Security & Compliance Team
