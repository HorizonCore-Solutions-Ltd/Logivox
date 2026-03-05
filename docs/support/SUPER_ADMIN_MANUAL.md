# Super Admin Monitoring & Operations Manual

This guide is designed for the highest level of LogiVox internal administration. It outlines the tools, procedures, and responsibilities for maintaining system health, managing enterprise accounts, and troubleshooting major incidents.

## 1. System Health & Infrastructure Monitoring
LogiVox runs on a high-availability architecture utilizing Kubernetes (K8s), Node.js/Next.js (Vercel), PostgreSQL (RDS/Prisma).

### Key Dashboards
- **Grafana / Prometheus**: Monitor cluster health (CPU, Memory, Pod restarts). Alerts are configured for >80% resource utilization.
- **Datadog / New Relic**: Application Performance Monitoring (APM). Track API latency (Goal: <200ms p95), database query times, and background job queues.
- **Vercel Dashboard**: Edge network routing, Serverless function execution times, web vitals.

### Daily Checks
- Review error rates on critical paths (Order ingestion, Wave allocation, API rate limits).
- Verify daily database backup completion (`scripts/backup-db.sh` logs).
- Monitor background task processing queues (IoT ingestion, Billing calculations).

## 2. Tenant & User Management
Super Admins have full access to manage client (tenant) configurations globally.

### Tenant Provisioning
- **New Account Creation**: Run automated scripts (`scripts/setup-production-db.sh`) and configure the primary tenant ID.
- **Module Activation**: Toggle specific LogiVox modules (e.g., Robotics, 3PL, Returns) on a per-tenant basis via the Super Admin portal.
- **Rate Limit Adjustments**: Modify API rate limits (`lib/rate-limit.ts` configurations) for high-volume enterprise clients.

### Security Audits
- Regularly review the Global Audit Log (`audit-log-schema.txt`) for unauthorized access attempts or privilege escalations.
- Enforce MFA (Multi-Factor Authentication) capabilities for all users.

## 3. Incident Management & Support Escalation
When a critical customer issue arises, Super Admins act as Level 3 (L3) support.

- **P0 Incidents (Widespread Outage)**: Engage DevOps and Engineering on-call immediately. Communicate via public status page.
- **P1 Incidents (Critical Bug)**: Specific client hindered from operations. Extract query logs, review Prisma query traces, deploy hotfix if necessary.
- **Database Rollbacks/Fixes**: If data corruption occurs, utilize point-in-time recovery (PITR) procedures.

## 4. Maintenance Operations
- **Database Cleanup**: Run `scripts/db-cleanup.ts` regularly to prune old logs and optimize table indexes (`indexes-schema.txt`).
- **Feature Flags**: Manage global feature rollouts carefully, primarily targeting staging networks before broader production enablement.
