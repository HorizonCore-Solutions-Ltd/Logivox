# Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying LogiVox WMS to production environments using Docker, Kubernetes, and CI/CD pipelines.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Database Management](#database-management)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
```bash
# Docker
docker --version  # >= 24.0

# Docker Compose
docker-compose --version  # >= 2.20

# Kubernetes CLI
kubectl version --client  # >= 1.28

# Node.js
node --version  # >= 20.0
```

### Required Accounts
- GitHub account (for CI/CD)
- Container registry access (GitHub Container Registry, Docker Hub, or AWS ECR)
- Cloud provider account (AWS, GCP, Azure, or DigitalOcean)
- Domain name with DNS management

---

## Docker Deployment

### Local Development

```bash
# Clone repository
git clone https://github.com/PNdlovu/Flowstock.git
cd Flowstock

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Scale application instances
docker-compose -f docker-compose.prod.yml up -d --scale app-1=3 --scale app-2=3

# Monitor services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Build Custom Image

```bash
# Build production image
docker build -t flowstock:latest .

# Build with specific target
docker build --target runner -t flowstock:prod .

# Tag for registry
docker tag flowstock:latest ghcr.io/pndlovu/flowstock:latest

# Push to registry
docker push ghcr.io/pndlovu/flowstock:latest
```

---

## Kubernetes Deployment

### Cluster Setup

#### 1. Create Namespace
```bash
kubectl create namespace production
kubectl config set-context --current --namespace=production
```

#### 2. Create Secrets
```bash
# Generate secrets
kubectl create secret generic logivox-secrets \
  --from-literal=database-url='postgresql://user:pass@postgres:5432/flowstock' \
  --from-literal=redis-url='redis://:pass@redis:6379' \
  --from-literal=nextauth-secret='your-secret-here' \
  --from-literal=jwt-secret='your-jwt-secret' \
  -n production

# Or apply from file
kubectl apply -f k8s/secrets.yaml
```

#### 3. Create ConfigMap
```bash
kubectl apply -f k8s/configmap.yaml
```

#### 4. Create Storage
```bash
kubectl apply -f k8s/storage.yaml

# Verify PVCs
kubectl get pvc -n production
```

#### 5. Deploy Application
```bash
# Apply deployment
kubectl apply -f k8s/deployment.yaml

# Check rollout status
kubectl rollout status deployment/logivox-app -n production

# View pods
kubectl get pods -n production
```

#### 6. Configure Ingress
```bash
# Install ingress controller (if not installed)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Apply ingress
kubectl apply -f k8s/ingress.yaml

# Get ingress IP
kubectl get ingress -n production
```

### Deployment Management

#### Update Application
```bash
# Update image
kubectl set image deployment/logivox-app \
  logivox-app=ghcr.io/pndlovu/flowstock:v1.0.1 \
  -n production

# Rollout status
kubectl rollout status deployment/logivox-app -n production

# Rollback if needed
kubectl rollout undo deployment/logivox-app -n production
```

#### Scale Application
```bash
# Manual scaling
kubectl scale deployment/logivox-app --replicas=5 -n production

# Auto-scaling is configured via HPA (see deployment.yaml)
kubectl get hpa -n production
```

#### View Logs
```bash
# All pods
kubectl logs -f -l app=flowstock -n production

# Specific pod
kubectl logs -f <pod-name> -n production

# Previous instance (if crashed)
kubectl logs --previous <pod-name> -n production
```

#### Execute Commands
```bash
# Shell into pod
kubectl exec -it <pod-name> -n production -- /bin/sh

# Run database migration
kubectl exec -it <pod-name> -n production -- npx prisma migrate deploy
```

---

## CI/CD Pipeline

### GitHub Actions Setup

#### 1. Configure Secrets
Go to GitHub repository → Settings → Secrets and add:

```
# Container Registry
GHCR_TOKEN (GitHub Personal Access Token)

# Kubernetes
KUBE_CONFIG_STAGING (base64 encoded kubeconfig)
KUBE_CONFIG_PROD (base64 encoded kubeconfig)

# Notifications
SLACK_WEBHOOK (Slack webhook URL)

# Monitoring
SENTRY_DSN (Sentry DSN)
```

#### 2. Workflow Triggers
The CI/CD pipeline triggers on:
- Push to `main` → Production deployment
- Push to `develop` → Staging deployment
- Pull requests → Tests only

#### 3. Pipeline Stages
1. **Lint** - Code quality checks
2. **Test** - Unit and integration tests
3. **Build** - Docker image build
4. **Scan** - Security vulnerability scan
5. **Deploy** - Kubernetes deployment
6. **Verify** - Smoke tests

### Manual Deployment

```bash
# Trigger workflow manually
gh workflow run ci-cd.yml

# Rollback deployment (requires manual approval)
gh workflow run ci-cd.yml --ref rollback
```

---

## Database Management

### Migrations

```bash
# Run migrations in Kubernetes
kubectl exec -it deployment/logivox-app -n production -- npx prisma migrate deploy

# Generate Prisma client
kubectl exec -it deployment/logivox-app -n production -- npx prisma generate

# Reset database (DANGER!)
kubectl exec -it deployment/logivox-app -n production -- npx prisma migrate reset --force
```

### Database Access

```bash
# Port forward to PostgreSQL
kubectl port-forward svc/postgres-service 5432:5432 -n production

# Connect with psql
psql postgresql://username:password@localhost:5432/flowstock
```

---

## Monitoring and Logging

### Application Logs

```bash
# Stream application logs
kubectl logs -f -l app=flowstock -n production

# Export logs to file
kubectl logs -l app=flowstock -n production > app-logs.txt

# Filter logs by timestamp
kubectl logs --since=1h -l app=flowstock -n production
```

### Health Checks

```bash
# Check health endpoint
curl https://logivox.ai/api/health

# Check readiness
curl https://logivox.ai/api/health/ready

# Via kubectl
kubectl exec -it <pod-name> -n production -- curl http://localhost:3000/api/health
```

### Prometheus & Grafana

```bash
# Access Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n production
# Open http://localhost:9090

# Access Grafana
kubectl port-forward svc/grafana 3001:3000 -n production
# Open http://localhost:3001
```

---

## Backup and Recovery

### Automated Backups

Backups run automatically via cron job (see docker-compose.prod.yml).

**Configuration:**
```env
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
RETENTION_DAYS=30
S3_BUCKET=logivox-backups
```

### Manual Backup

```bash
# Run backup script
docker exec logivox-postgres /backup.sh

# Or in Kubernetes
kubectl exec -it deployment/postgres -n production -- /backup.sh
```

### Restore from Backup

```bash
# List available backups
ls -lh ./backups/

# Restore specific backup
./scripts/restore.sh flowstock_backup_20250116_020000.sql.gz

# Restore from S3
./scripts/restore.sh flowstock_backup_20250116_020000.sql.gz --from-s3
```

---

## SSL/TLS Configuration

### Cert-Manager Setup

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create Let's Encrypt issuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@logivox.ai
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Certificate Management

```bash
# Check certificate status
kubectl get certificate -n production

# Describe certificate
kubectl describe certificate logivox-tls -n production

# Force renewal
kubectl delete certificate logivox-tls -n production
kubectl apply -f k8s/ingress.yaml
```

---

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n production

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n production
```

#### 2. Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it <pod-name> -n production -- psql ${DATABASE_URL} -c "SELECT 1"

# Check database service
kubectl get svc postgres-service -n production

# Check database pod
kubectl logs <postgres-pod> -n production
```

#### 3. Redis Connection Issues
```bash
# Test Redis connectivity
kubectl exec -it <pod-name> -n production -- redis-cli -u ${REDIS_URL} ping

# Check Redis service
kubectl get svc redis-service -n production
```

#### 4. Image Pull Errors
```bash
# Check image pull secrets
kubectl get secrets -n production

# Create image pull secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=<username> \
  --docker-password=<token> \
  -n production
```

#### 5. Ingress Not Working
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress status
kubectl describe ingress logivox-ingress -n production

# Check certificate
kubectl get certificate -n production
```

### Debug Commands

```bash
# Get all resources
kubectl get all -n production

# Check resource usage
kubectl top nodes
kubectl top pods -n production

# Check logs from previous crash
kubectl logs --previous <pod-name> -n production

# Debug with temporary pod
kubectl run debug --image=busybox -it --rm -n production -- /bin/sh
```

---

## Security Checklist

- [ ] All secrets stored in Kubernetes Secrets or secret manager
- [ ] SSL/TLS certificates configured and auto-renewing
- [ ] Network policies configured
- [ ] RBAC roles properly configured
- [ ] Container images scanned for vulnerabilities
- [ ] Resource limits set for all containers
- [ ] Non-root users for all containers
- [ ] Read-only root filesystem where possible
- [ ] Security headers configured in Ingress
- [ ] Rate limiting enabled
- [ ] Backup strategy implemented and tested
- [ ] Monitoring and alerting configured
- [ ] Audit logging enabled

---

## Additional Resources

- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **Docker Documentation**: https://docs.docker.com/
- **GitHub Actions**: https://docs.github.com/en/actions
- **Cert-Manager**: https://cert-manager.io/docs/
- **Nginx Ingress**: https://kubernetes.github.io/ingress-nginx/
