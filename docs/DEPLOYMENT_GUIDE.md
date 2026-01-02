# LogiVox WMS - Deployment Guide

**Version 1.0**  
**Last Updated**: October 16, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Options](#deployment-options)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [Environment Configuration](#environment-configuration)
8. [Database Setup](#database-setup)
9. [SSL/TLS Configuration](#ssltls-configuration)
10. [Monitoring Setup](#monitoring-setup)
11. [Backup Configuration](#backup-configuration)
12. [Post-Deployment Checklist](#post-deployment-checklist)
13. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides comprehensive instructions for deploying LogiVox WMS in production environments. Whether you're deploying to Docker, Kubernetes, or cloud platforms, this guide covers all necessary steps.

### Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              Load Balancer (Nginx)              │
└─────────────────┬───────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐   ┌───▼────┐   ┌───▼────┐
│  App   │   │  App   │   │  App   │
│ Server │   │ Server │   │ Server │
│   #1   │   │   #2   │   │   #3   │
└───┬────┘   └───┬────┘   └───┬────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼──────┐  ┌──▼──────┐  ┌──▼──────┐
│PostgreSQL│  │  Redis  │  │   S3    │
│ Database │  │  Cache  │  │ Storage │
└──────────┘  └─────────┘  └─────────┘
```

### Supported Platforms

- **Docker & Docker Compose**
- **Kubernetes (K8s)**
- **AWS (ECS, EKS, EC2)**
- **Azure (AKS, App Service)**
- **Google Cloud (GKE, Cloud Run)**
- **On-Premises Servers**

---

## Prerequisites

### System Requirements

**Production Environment:**
- **CPU**: 8 cores (minimum), 16 cores (recommended)
- **RAM**: 16 GB (minimum), 32 GB (recommended)
- **Storage**: 100 GB SSD (minimum), 500 GB (recommended)
- **Network**: 1 Gbps bandwidth
- **OS**: Ubuntu 22.04 LTS, CentOS 8+, or RHEL 8+

**Development Environment:**
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD

### Required Software

- **Node.js**: v20.x LTS or higher
- **PostgreSQL**: v16.x or higher
- **Redis**: v7.x or higher
- **Docker**: v24.x or higher (for containerized deployments)
- **Kubernetes**: v1.28+ (for K8s deployments)
- **Nginx**: v1.24+ (for reverse proxy)

### Domain & SSL

- Registered domain name (e.g., `flowstock.yourcompany.com`)
- SSL/TLS certificate (Let's Encrypt recommended)
- DNS access to configure A/CNAME records

---

## Deployment Options

### Option 1: Docker Deployment (Recommended for Small-Medium)

Best for:
- Small to medium-sized deployments
- Single-server deployments
- Quick setup and testing

**Pros:**
- Simple setup
- Easy to manage
- Portable across environments

**Cons:**
- Limited scalability
- Single point of failure

### Option 2: Kubernetes Deployment (Recommended for Enterprise)

Best for:
- Large-scale deployments
- High availability requirements
- Auto-scaling needs

**Pros:**
- Highly scalable
- Auto-healing
- Load balancing
- Zero-downtime deployments

**Cons:**
- Complex setup
- Requires K8s expertise

### Option 3: Cloud Platform Deployment

Best for:
- Managed infrastructure
- Pay-as-you-go pricing
- Global distribution

**Pros:**
- Managed services
- Built-in monitoring
- Easy scaling

**Cons:**
- Vendor lock-in
- Ongoing costs

---

## Docker Deployment

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installations
docker --version
docker compose version
```

### Step 2: Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourcompany/logivox-wms.git
cd logivox-wms

# Checkout production branch
git checkout main
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

**Required Environment Variables:**

```bash
# Application
NODE_ENV=production
APP_NAME=LogiVox WMS
APP_URL=https://flowstock.yourcompany.com
PORT=3000

# Database
DATABASE_URL=postgresql://flowstock:secure_password@db:5432/flowstock_prod
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_NAME=flowstock_prod
DATABASE_USER=flowstock
DATABASE_PASSWORD=secure_password_here

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password

# Security
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d
SESSION_SECRET=your_session_secret_min_32_chars
ENCRYPTION_KEY=your_encryption_key_32_chars

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourcompany.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@yourcompany.com
SMTP_FROM_NAME=LogiVox WMS

# AWS S3 (File Storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=logivox-files-prod

# Integrations (Optional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info
```

### Step 4: Build and Deploy

```bash
# Build Docker images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check service status
docker compose -f docker-compose.prod.yml ps
```

**docker-compose.prod.yml:**

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: logivox-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - logivox-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    container_name: logivox-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: flowstock_prod
      POSTGRES_USER: flowstock
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - logivox-network
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U flowstock"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: logivox-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - logivox-network
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: logivox-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - logivox-network

volumes:
  postgres-data:
  redis-data:

networks:
  logivox-network:
    driver: bridge
```

### Step 5: Initialize Database

```bash
# Run database migrations
docker compose -f docker-compose.prod.yml exec app npm run migrate:prod

# Seed initial data
docker compose -f docker-compose.prod.yml exec app npm run seed:prod

# Create admin user
docker compose -f docker-compose.prod.yml exec app npm run create-admin
```

### Step 6: Configure Nginx

**nginx/nginx.conf:**

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # Upstream
    upstream flowstock_app {
        least_conn;
        server app:3000 max_fails=3 fail_timeout=30s;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name flowstock.yourcompany.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name flowstock.yourcompany.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # Proxy settings
        location / {
            proxy_pass http://flowstock_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api_limit burst=50 nodelay;
            limit_conn conn_limit 20;
            proxy_pass http://flowstock_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files with caching
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://flowstock_app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Health check endpoint (no rate limit)
        location /health {
            proxy_pass http://flowstock_app;
            access_log off;
        }
    }
}
```

### Step 7: Obtain SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d flowstock.yourcompany.com

# Verify auto-renewal
sudo certbot renew --dry-run

# Auto-renewal cron job (already configured by certbot)
sudo systemctl status certbot.timer
```

---

## Kubernetes Deployment

### Step 1: Prepare Kubernetes Cluster

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify cluster access
kubectl cluster-info
kubectl get nodes
```

### Step 2: Create Namespace

```bash
# Create namespace
kubectl create namespace logivox-prod

# Set as default namespace (optional)
kubectl config set-context --current --namespace=logivox-prod
```

### Step 3: Create Secrets

```bash
# Database credentials
kubectl create secret generic db-credentials \
  --from-literal=username=flowstock \
  --from-literal=password=secure_password_here \
  --from-literal=database=flowstock_prod \
  -n logivox-prod

# Application secrets
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=your_jwt_secret_min_32_chars \
  --from-literal=session-secret=your_session_secret_min_32_chars \
  --from-literal=encryption-key=your_encryption_key_32_chars \
  -n logivox-prod

# AWS credentials
kubectl create secret generic aws-credentials \
  --from-literal=access-key-id=your_access_key \
  --from-literal=secret-access-key=your_secret_key \
  -n logivox-prod

# SMTP credentials
kubectl create secret generic smtp-credentials \
  --from-literal=username=noreply@yourcompany.com \
  --from-literal=password=your_app_password \
  -n logivox-prod
```

### Step 4: Deploy PostgreSQL

**k8s/postgres-deployment.yaml:**

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: logivox-prod
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: gp3  # AWS EBS gp3, adjust for your provider
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: logivox-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: database
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: logivox-prod
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

```bash
# Apply PostgreSQL deployment
kubectl apply -f k8s/postgres-deployment.yaml
```

### Step 5: Deploy Redis

**k8s/redis-deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: logivox-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command:
          - redis-server
          - --requirepass
          - $(REDIS_PASSWORD)
          - --maxmemory
          - 2gb
          - --maxmemory-policy
          - allkeys-lru
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: redis-password
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: logivox-prod
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
```

```bash
# Apply Redis deployment
kubectl apply -f k8s/redis-deployment.yaml
```

### Step 6: Deploy Application

**k8s/app-deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logivox-app
  namespace: logivox-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: logivox-app
  template:
    metadata:
      labels:
        app: logivox-app
    spec:
      containers:
      - name: app
        image: your-registry.com/logivox-wms:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DATABASE_HOST
          value: "postgres-service"
        - name: DATABASE_PORT
          value: "5432"
        - name: DATABASE_NAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: database
        - name: DATABASE_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: REDIS_HOST
          value: "redis-service"
        - name: REDIS_PORT
          value: "6379"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
---
apiVersion: v1
kind: Service
metadata:
  name: logivox-app-service
  namespace: logivox-prod
spec:
  selector:
    app: logivox-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: logivox-app-hpa
  namespace: logivox-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: logivox-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

```bash
# Apply application deployment
kubectl apply -f k8s/app-deployment.yaml

# Check deployment status
kubectl get deployments -n logivox-prod
kubectl get pods -n logivox-prod
kubectl get services -n logivox-prod
```

### Step 7: Configure Ingress

**k8s/ingress.yaml:**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: logivox-ingress
  namespace: logivox-prod
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - flowstock.yourcompany.com
    secretName: logivox-tls
  rules:
  - host: flowstock.yourcompany.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: logivox-app-service
            port:
              number: 80
```

```bash
# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager for SSL
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Apply ingress
kubectl apply -f k8s/ingress.yaml
```

---

## Cloud Deployment

### AWS Deployment (ECS)

**1. Create ECS Cluster:**

```bash
aws ecs create-cluster --cluster-name logivox-prod

# Create task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create service
aws ecs create-service \
  --cluster logivox-prod \
  --service-name logivox-app \
  --task-definition logivox-app:1 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

### Azure Deployment (AKS)

```bash
# Create resource group
az group create --name logivox-prod --location eastus

# Create AKS cluster
az aks create \
  --resource-group logivox-prod \
  --name logivox-cluster \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3 \
  --enable-managed-identity \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group logivox-prod --name logivox-cluster

# Deploy application
kubectl apply -f k8s/
```

### Google Cloud Deployment (GKE)

```bash
# Create GKE cluster
gcloud container clusters create logivox-cluster \
  --num-nodes=3 \
  --machine-type=n1-standard-4 \
  --zone=us-central1-a

# Get credentials
gcloud container clusters get-credentials logivox-cluster --zone=us-central1-a

# Deploy application
kubectl apply -f k8s/
```

---

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file with all required variables:

```bash
# Complete list available in repository: .env.example
# Critical variables listed in Docker Deployment section above
```

### Security Best Practices

1. **Never commit secrets to version control**
2. **Use environment-specific .env files**
3. **Rotate secrets regularly (every 90 days)**
4. **Use secret management tools** (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
5. **Enable encryption at rest and in transit**

---

## Database Setup

### Initial Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE flowstock_prod;"

# Create user
psql -U postgres -c "CREATE USER flowstock WITH PASSWORD 'secure_password';"

# Grant permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE flowstock_prod TO flowstock;"
```

### Run Migrations

```bash
# Using Docker
docker compose -f docker-compose.prod.yml exec app npm run migrate:prod

# Using Kubernetes
kubectl exec -it <pod-name> -n logivox-prod -- npm run migrate:prod

# Direct server
npm run migrate:prod
```

### Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_orders_status ON sales_orders(status);
CREATE INDEX idx_inventory_item ON inventory_transactions(inventory_item_id);
CREATE INDEX idx_users_email ON users(email);

-- Enable query logging
ALTER DATABASE flowstock_prod SET log_statement = 'mod';

-- Set connection limits
ALTER DATABASE flowstock_prod CONNECTION LIMIT 100;
```

---

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot

# Obtain certificate (standalone)
sudo certbot certonly --standalone -d flowstock.yourcompany.com

# Certificate files location
# /etc/letsencrypt/live/flowstock.yourcompany.com/fullchain.pem
# /etc/letsencrypt/live/flowstock.yourcompany.com/privkey.pem

# Auto-renewal
sudo certbot renew --dry-run
```

### Custom SSL Certificate

1. **Generate CSR** (Certificate Signing Request)
2. **Purchase SSL from provider** (DigiCert, GoDaddy, etc.)
3. **Download certificate files**
4. **Configure in Nginx** (see nginx.conf above)

---

## Monitoring Setup

### Application Monitoring (Sentry)

```bash
# Install Sentry SDK
npm install @sentry/node @sentry/tracing

# Configure in app
# See: src/config/sentry.ts
```

### Infrastructure Monitoring (Prometheus + Grafana)

**Deploy Prometheus:**

```bash
# Using Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

**Access Grafana:**

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Open http://localhost:3000
# Default credentials: admin / prom-operator
```

---

## Backup Configuration

### Automated Backups

**Backup Script (backup.sh):**

```bash
#!/bin/bash
# LogiVox WMS - Automated Backup Script

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="flowstock_backup_${DATE}.sql.gz"

# Database backup
docker exec logivox-db pg_dump -U flowstock flowstock_prod | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" s3://logivox-backups-prod/

# Delete local backups older than 7 days
find ${BACKUP_DIR} -name "flowstock_backup_*.sql.gz" -mtime +7 -delete

# Delete S3 backups older than 30 days
aws s3 ls s3://logivox-backups-prod/ | while read -r line; do
  fileName=$(echo $line | awk '{print $4}')
  fileDate=$(echo $fileName | grep -oP '\d{8}')
  if [ $(($(date +%s) - $(date -d $fileDate +%s))) -gt $((30*86400)) ]; then
    aws s3 rm "s3://logivox-backups-prod/${fileName}"
  fi
done

echo "Backup completed: ${BACKUP_FILE}"
```

**Schedule with Cron:**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/logivox-backup.log 2>&1
```

---

## Post-Deployment Checklist

### ✅ Verify Deployment

- [ ] Application accessible via domain
- [ ] SSL/TLS certificate valid
- [ ] Database connections working
- [ ] Redis cache operational
- [ ] File uploads working (S3)
- [ ] Email sending functional
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] All services healthy

### ✅ Security Configuration

- [ ] Firewall rules configured
- [ ] SSH key-based authentication only
- [ ] Database access restricted
- [ ] Admin user 2FA enabled
- [ ] API rate limiting active
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Secrets rotated
- [ ] Audit logging enabled

### ✅ Monitoring & Alerts

- [ ] Sentry error tracking active
- [ ] Prometheus metrics collection
- [ ] Grafana dashboards configured
- [ ] Email alerts configured
- [ ] Slack notifications setup
- [ ] Uptime monitoring active

### ✅ Backup & Recovery

- [ ] Automated backups scheduled
- [ ] Backup restoration tested
- [ ] Off-site backup storage configured
- [ ] Disaster recovery plan documented

### ✅ Performance Optimization

- [ ] Database indexes created
- [ ] Redis cache warming
- [ ] CDN configured for static assets
- [ ] Image optimization enabled
- [ ] Gzip compression enabled
- [ ] Connection pooling configured

### ✅ Documentation

- [ ] Environment variables documented
- [ ] Deployment procedures documented
- [ ] Rollback procedures documented
- [ ] Incident response plan created
- [ ] Team access credentials shared securely

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker compose logs -f app

# Common issues:
# 1. Database connection failed
#    - Verify DATABASE_URL in .env
#    - Check database is running: docker compose ps
#    - Test connection: psql -h localhost -U flowstock -d flowstock_prod

# 2. Redis connection failed
#    - Verify REDIS_URL in .env
#    - Check Redis is running: docker compose ps redis
#    - Test connection: redis-cli -h localhost ping

# 3. Missing environment variables
#    - Verify all required variables in .env
#    - Check .env.example for complete list
```

### Database Migration Errors

```bash
# Reset migrations (development only!)
docker compose exec app npm run migrate:reset

# Run migrations manually
docker compose exec app npx prisma migrate deploy

# Check migration status
docker compose exec app npx prisma migrate status
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Increase memory limits in docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
```

### SSL Certificate Issues

```bash
# Verify certificate
openssl s_client -connect flowstock.yourcompany.com:443 -showcerts

# Renew Let's Encrypt certificate
sudo certbot renew --force-renewal

# Test certificate renewal
sudo certbot renew --dry-run
```

### Performance Issues

```bash
# Check application logs
docker compose logs -f app | grep -i error

# Monitor database queries
docker exec -it logivox-db psql -U flowstock -d flowstock_prod
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;

# Clear Redis cache
docker exec -it logivox-redis redis-cli FLUSHALL

# Restart services
docker compose restart
```

---

## Support

**Deployment Support:**
- 📧 Email: devops@logivox.ai
- 💬 Slack: #deployment-support
- 📚 Docs: https://docs.logivox.ai/deployment

**Emergency Support:**
- 📞 Phone: 1-800-LOGIVOX (24/7)
- 🚨 On-call: PagerDuty integration

---

**LogiVox WMS Deployment Guide - Version 1.0**  
*Last updated: October 16, 2025*
