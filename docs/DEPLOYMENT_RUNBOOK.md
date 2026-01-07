# 🚀 LogiVox WMS - Production Deployment Runbook

**Version:** 1.0  
**Last Updated:** January 3, 2026  
**Owner:** DevOps Team  
**Severity:** CRITICAL

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Deployment](#database-deployment)
4. [Application Deployment](#application-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Emergency Contacts](#emergency-contacts)

---

## 1. Pre-Deployment Checklist

### ✅ Prerequisites

- [ ] All tests passing in CI/CD pipeline
- [ ] Code review completed and approved
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Performance testing completed
- [ ] Database migration scripts tested in staging
- [ ] Rollback plan documented and tested
- [ ] Change management ticket approved
- [ ] Stakeholders notified (deployment window)
- [ ] Backup verification completed

### 📊 Required Tools

```bash
# Verify required tools are installed
kubectl version --client
helm version
aws --version  # or az for Azure, gcloud for GCP
psql --version
docker --version
```

### 🔑 Required Credentials

- [ ] Kubernetes cluster access (kubectl config)
- [ ] Container registry credentials
- [ ] Database admin credentials
- [ ] Cloud provider credentials (AWS/Azure/GCP)
- [ ] Monitoring system access (Grafana, Prometheus)
- [ ] Notification system access (Slack, PagerDuty)

---

## 2. Infrastructure Setup

### 2.1 Kubernetes Cluster

**Create Namespace:**

```bash
kubectl create namespace production
kubectl create namespace staging
kubectl create namespace monitoring
```

**Apply RBAC:**

```bash
kubectl apply -f k8s/rbac.yaml
```

**Configure Resource Quotas:**

```bash
kubectl apply -f k8s/resource-quota.yaml
```

### 2.2 Storage Setup

**Create Persistent Volumes:**

```bash
# PostgreSQL storage
kubectl apply -f k8s/storage.yaml

# Verify PVs are created
kubectl get pv
kubectl get pvc -n production
```

### 2.3 Secrets Management

**Create Secrets:**

```bash
# Database credentials
kubectl create secret generic flowstock-secrets \
  --from-literal=database-url="postgresql://user:password@postgres-service:5432/logivox" \
  --from-literal=redis-url="redis://redis-service:6379" \
  --from-literal=nextauth-secret="$(openssl rand -base64 32)" \
  --namespace production

# SendGrid API Key
kubectl create secret generic sendgrid-credentials \
  --from-literal=api-key="YOUR_SENDGRID_API_KEY" \
  --namespace production

# Twilio credentials
kubectl create secret generic twilio-credentials \
  --from-literal=account-sid="YOUR_TWILIO_ACCOUNT_SID" \
  --from-literal=auth-token="YOUR_TWILIO_AUTH_TOKEN" \
  --from-literal=phone-number="YOUR_TWILIO_PHONE_NUMBER" \
  --namespace production

# AWS/Azure credentials (if needed)
kubectl create secret generic cloud-credentials \
  --from-literal=access-key-id="YOUR_ACCESS_KEY" \
  --from-literal=secret-access-key="YOUR_SECRET_KEY" \
  --namespace production
```

**Verify Secrets:**

```bash
kubectl get secrets -n production
kubectl describe secret flowstock-secrets -n production
```

### 2.4 ConfigMaps

**Create ConfigMaps:**

```bash
kubectl apply -f k8s/configmap.yaml

# Verify
kubectl get configmap -n production
```

---

## 3. Database Deployment

### 3.1 PostgreSQL Setup

**Deploy PostgreSQL:**

```bash
# Option 1: Using Helm
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgresql bitnami/postgresql \
  --namespace production \
  --set auth.username=logivox \
  --set auth.password=SECURE_PASSWORD \
  --set auth.database=logivox \
  --set primary.persistence.size=100Gi \
  --set primary.resources.requests.memory=4Gi \
  --set primary.resources.requests.cpu=2000m

# Option 2: Using Managed Database (AWS RDS, Azure Database, etc.)
# Configure connection string in secrets
```

**Verify Database:**

```bash
# Test connection
kubectl run -it --rm debug --image=postgres:16 --restart=Never -- \
  psql -h postgres-service -U logivox -d logivox

# Inside psql:
# \l              # List databases
# \dt             # List tables
# \q              # Quit
```

### 3.2 Database Migrations

**Backup Current Database (if upgrading):**

```bash
# Run backup script
./scripts/backup-db.sh production

# Verify backup
aws s3 ls s3://logivox-backups/production/
```

**Run Migrations:**

```bash
# Method 1: Via init container (automatic during deployment)
# This is configured in k8s/deployment.yaml

# Method 2: Manual migration
kubectl run -it --rm migrate --image=ghcr.io/pndlovu/flowstock:latest --restart=Never -- \
  npx prisma migrate deploy

# Method 3: Using migration job
kubectl apply -f k8s/jobs/migration-job.yaml
kubectl wait --for=condition=complete job/migration-job --timeout=600s
kubectl logs job/migration-job
```

**Verify Migration:**

```bash
# Check migration status
kubectl exec -it <postgres-pod> -- \
  psql -U logivox -d logivox -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

### 3.3 Seed Data (First Deployment Only)

```bash
kubectl run -it --rm seed --image=ghcr.io/pndlovu/flowstock:latest --restart=Never -- \
  npx prisma db seed
```

---

## 4. Application Deployment

### 4.1 Deploy Monitoring Stack

**Deploy Prometheus:**

```bash
kubectl apply -f k8s/monitoring/prometheus-config.yaml

# Wait for Prometheus to be ready
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s
```

**Deploy Grafana:**

```bash
kubectl apply -f k8s/monitoring/grafana-config.yaml

# Get Grafana admin password
kubectl get secret grafana-credentials -n monitoring -o jsonpath="{.data.admin-password}" | base64 --decode
```

**Deploy Alertmanager:**

```bash
kubectl apply -f k8s/monitoring/alertmanager-config.yaml
```

### 4.2 Deploy Application

**Build and Push Docker Image:**

```bash
# Build image
docker build -t ghcr.io/pndlovu/flowstock:v1.0.0 -t ghcr.io/pndlovu/flowstock:latest .

# Push to registry
docker push ghcr.io/pndlovu/flowstock:v1.0.0
docker push ghcr.io/pndlovu/flowstock:latest
```

**Deploy Application:**

```bash
# Apply all configurations
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Watch deployment progress
kubectl rollout status deployment/flowstock-app -n production

# Alternative: Using kubectl wait
kubectl wait --for=condition=available deployment/flowstock-app -n production --timeout=600s
```

**Verify Pods:**

```bash
# Check pod status
kubectl get pods -n production -l app=flowstock

# Check logs
kubectl logs -f deployment/flowstock-app -n production

# Check all pods logs
kubectl logs -f -l app=flowstock -n production --all-containers=true
```

### 4.3 Configure Ingress & DNS

**Apply Ingress:**

```bash
kubectl apply -f k8s/ingress.yaml

# Get Load Balancer IP/Hostname
kubectl get ingress -n production
```

**Update DNS Records:**

```bash
# Example for AWS Route53
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.logivox.ai",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "YOUR_LOAD_BALANCER_DNS"}]
      }
    }]
  }'
```

**Configure SSL/TLS:**

```bash
# Install cert-manager (if not already installed)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@logivox.ai
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Certificate will be automatically issued via ingress annotation
# Wait for certificate
kubectl get certificate -n production
kubectl describe certificate flowstock-tls -n production
```

---

## 5. Post-Deployment Verification

### 5.1 Health Checks

**Check Application Health:**

```bash
# Health endpoint
curl https://app.logivox.ai/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-01-03T...",
#   "database": "connected",
#   "redis": "connected"
# }
```

**Check Metrics:**

```bash
curl https://app.logivox.ai/api/metrics
```

### 5.2 Smoke Tests

**Run Automated Smoke Tests:**

```bash
# From CI/CD pipeline
npm run test:e2e:smoke

# Or manually
kubectl run -it --rm smoke-test --image=ghcr.io/pndlovu/flowstock:latest --restart=Never -- \
  npm run test:e2e:smoke
```

**Manual Verification:**

```bash
# 1. Login
curl -X POST https://app.logivox.ai/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@logivox.ai","password":"admin123"}'

# 2. Fetch inventory
curl https://app.logivox.ai/api/inventory \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Create test order
curl -X POST https://app.logivox.ai/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"...","items":[...]}'
```

### 5.3 Performance Verification

**Check Response Times:**

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://app.logivox.ai/

# Using k6
k6 run scripts/load-test.js
```

**Monitor Resource Usage:**

```bash
# Pod resources
kubectl top pods -n production

# Node resources
kubectl top nodes
```

### 5.4 Monitoring Dashboard

1. Access Grafana: https://monitoring.logivox.ai
2. Verify dashboards are loading
3. Check for any errors or warnings
4. Verify metrics are being collected

### 5.5 Alert Verification

```bash
# Test alert routing
kubectl exec -it <alertmanager-pod> -n monitoring -- \
  amtool alert query

# Trigger test alert
curl -X POST http://prometheus:9090/-/reload
```

---

## 6. Rollback Procedures

### 6.1 Rollback Application

**Quick Rollback:**

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/flowstock-app -n production

# Check rollback status
kubectl rollout status deployment/flowstock-app -n production

# Rollback to specific revision
kubectl rollout undo deployment/flowstock-app -n production --to-revision=2

# View revision history
kubectl rollout history deployment/flowstock-app -n production
```

### 6.2 Rollback Database

**Restore from Backup:**

```bash
# 1. Stop application
kubectl scale deployment/flowstock-app -n production --replicas=0

# 2. Download backup
./scripts/restore-db.sh production BACKUP_FILENAME

# 3. Verify restoration
kubectl exec -it <postgres-pod> -- \
  psql -U logivox -d logivox -c "SELECT COUNT(*) FROM users;"

# 4. Start application
kubectl scale deployment/flowstock-app -n production --replicas=3
```

### 6.3 Complete Rollback

```bash
# Rollback everything
./scripts/rollback-deployment.sh production v1.0.0

# Manual steps:
# 1. Rollback application
# 2. Rollback database
# 3. Rollback configuration
# 4. Verify health
# 5. Notify stakeholders
```

---

## 7. Troubleshooting

### 7.1 Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n production

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n production --previous

# Common issues:
# - Image pull errors: Check registry credentials
# - Resource limits: Check resource quotas
# - Configuration errors: Check configmaps and secrets
```

### 7.2 Database Connection Issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:16 --restart=Never -- \
  psql -h postgres-service -U logivox -d logivox

# Check service endpoints
kubectl get endpoints -n production

# Check network policies
kubectl get networkpolicies -n production
```

### 7.3 High Memory/CPU Usage

```bash
# Check resource usage
kubectl top pods -n production

# Get detailed metrics
kubectl describe pod <pod-name> -n production

# Scale up if needed
kubectl scale deployment/flowstock-app -n production --replicas=5

# Check for memory leaks in logs
kubectl logs <pod-name> -n production | grep -i "memory"
```

### 7.4 SSL/TLS Certificate Issues

```bash
# Check certificate status
kubectl describe certificate flowstock-tls -n production

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Manually trigger certificate renewal
kubectl delete certificate flowstock-tls -n production
kubectl apply -f k8s/ingress.yaml
```

### 7.5 Application Errors

```bash
# Check application logs
kubectl logs -f deployment/flowstock-app -n production

# Check specific pod logs
kubectl logs <pod-name> -n production -c flowstock-app

# Stream logs from all pods
kubectl logs -f -l app=flowstock -n production --all-containers=true

# Export logs for analysis
kubectl logs deployment/flowstock-app -n production > app-logs.txt
```

---

## 8. Emergency Contacts

### On-Call Rotation

| Role           | Primary       | Secondary    | Contact     |
| -------------- | ------------- | ------------ | ----------- |
| DevOps Lead    | John Doe      | Jane Smith   | +1-555-0100 |
| Backend Lead   | Alice Johnson | Bob Wilson   | +1-555-0200 |
| Database Admin | Charlie Brown | Diana Prince | +1-555-0300 |
| Security Lead  | Eve Anderson  | Frank Castle | +1-555-0400 |

### Communication Channels

- **Slack:** #logivox-incidents
- **PagerDuty:** logivox-production
- **Email:** ops@logivox.ai
- **War Room:** Zoom (link in wiki)

### Escalation Path

1. **Level 1:** On-call engineer (0-15 min)
2. **Level 2:** Team lead (15-30 min)
3. **Level 3:** Engineering manager (30-60 min)
4. **Level 4:** CTO (60+ min, critical incidents only)

---

## 9. Post-Deployment Tasks

### Immediate (within 1 hour)

- [ ] Verify all health checks passing
- [ ] Monitor error rates for 1 hour
- [ ] Check performance metrics
- [ ] Verify monitoring alerts are working
- [ ] Update deployment documentation
- [ ] Send deployment success notification

### Within 24 hours

- [ ] Review application logs for anomalies
- [ ] Check resource utilization trends
- [ ] Verify backup automation is running
- [ ] Review security scan results
- [ ] Update runbook with lessons learned
- [ ] Schedule post-mortem meeting (if issues occurred)

### Within 1 week

- [ ] Review performance metrics weekly trend
- [ ] Optimize resource allocation if needed
- [ ] Update capacity planning documentation
- [ ] Review and update monitoring dashboards
- [ ] Conduct disaster recovery drill

---

## 10. Maintenance Windows

### Scheduled Maintenance

- **Timing:** Sundays, 2:00 AM - 4:00 AM UTC
- **Frequency:** Monthly (first Sunday)
- **Duration:** Up to 2 hours
- **Notification:** 7 days advance notice

### Maintenance Procedures

1. Post maintenance notification (7 days before)
2. Create backup before maintenance
3. Follow deployment runbook
4. Verify all checks post-maintenance
5. Send completion notification

---

## Appendix: Quick Reference Commands

```bash
# Check deployment status
kubectl get all -n production

# Restart deployment
kubectl rollout restart deployment/flowstock-app -n production

# Scale application
kubectl scale deployment/flowstock-app -n production --replicas=5

# Get logs
kubectl logs -f deployment/flowstock-app -n production

# Execute command in pod
kubectl exec -it <pod-name> -n production -- /bin/sh

# Port forward for debugging
kubectl port-forward svc/flowstock-service 8080:3000 -n production

# Check resource quotas
kubectl describe resourcequota -n production

# View all events
kubectl get events -n production --sort-by='.lastTimestamp'
```

---

**END OF RUNBOOK**

_For questions or updates, contact: ops@logivox.ai_
