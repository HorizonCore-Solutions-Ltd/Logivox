# LogiVox WMS - Troubleshooting Guide

**Version 1.0**  
**Last Updated**: October 16, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Diagnostics](#quick-diagnostics)
3. [Authentication Issues](#authentication-issues)
4. [Database Issues](#database-issues)
5. [Performance Problems](#performance-problems)
6. [API Errors](#api-errors)
7. [Integration Issues](#integration-issues)
8. [Deployment Issues](#deployment-issues)
9. [Email & Notification Issues](#email--notification-issues)
10. [Barcode Scanning Issues](#barcode-scanning-issues)
11. [Mobile App Issues](#mobile-app-issues)
12. [Data Inconsistency Issues](#data-inconsistency-issues)
13. [Log Analysis](#log-analysis)
14. [Emergency Procedures](#emergency-procedures)

---

## Overview

This comprehensive troubleshooting guide helps administrators and support staff diagnose and resolve common issues in LogiVox WMS. Each section includes symptoms, causes, diagnostics, and solutions.

### Getting Help

- **Self-Service**: Check this guide first
- **Knowledge Base**: https://support.logivox.ai
- **Email Support**: support@logivox.ai
- **Phone Support**: 1-800-LOGIVOX
- **Emergency**: urgent@logivox.ai (24/7)

---

## Quick Diagnostics

### System Health Check

Run the built-in health check command:

```bash
# Docker deployment
docker compose exec app npm run health-check

# Kubernetes deployment
kubectl exec -it <pod-name> -n logivox-prod -- npm run health-check

# Direct server
npm run health-check
```

**Expected Output:**

```
✅ Database: Connected
✅ Redis: Connected
✅ S3 Storage: Accessible
✅ SMTP: Configured
✅ API: Responding
✅ All systems operational
```

### Common Diagnostic Commands

```bash
# Check service status
docker compose ps

# View logs (last 100 lines)
docker compose logs --tail=100 -f app

# Check resource usage
docker stats

# Database connection test
docker compose exec db psql -U flowstock -d flowstock_prod -c "SELECT version();"

# Redis connection test
docker compose exec redis redis-cli ping

# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

---

## Authentication Issues

### Issue 1: Cannot Log In

**Symptoms:**
- "Invalid credentials" error despite correct password
- Login page redirects back without error
- Login succeeds but immediately logs out

**Possible Causes:**
1. Incorrect username/password
2. Account locked due to failed attempts
3. Session configuration issues
4. Database connection problems
5. Redis cache issues

**Diagnostics:**

```bash
# Check user exists
docker compose exec db psql -U flowstock -d flowstock_prod -c "SELECT id, email, status FROM users WHERE email='user@example.com';"

# Check account lockout
docker compose exec db psql -U flowstock -d flowstock_prod -c "SELECT failed_login_attempts, locked_until FROM users WHERE email='user@example.com';"

# Check Redis connection
docker compose exec redis redis-cli ping

# View authentication logs
docker compose logs app | grep -i "authentication"
```

**Solutions:**

**1. Reset Password:**

```bash
# Using admin panel
# Navigate to: Admin → Users → Select User → Reset Password

# Using command line
docker compose exec app npm run reset-password -- --email=user@example.com
```

**2. Unlock Account:**

```bash
# Unlock via database
docker compose exec db psql -U flowstock -d flowstock_prod -c "UPDATE users SET failed_login_attempts=0, locked_until=NULL WHERE email='user@example.com';"

# Unlock via admin panel
# Admin → Users → Select User → Unlock Account
```

**3. Clear Session Cache:**

```bash
# Clear all sessions
docker compose exec redis redis-cli FLUSHDB

# Clear specific user sessions
docker compose exec redis redis-cli --scan --pattern "sess:user:*" | xargs docker compose exec redis redis-cli DEL
```

**4. Check JWT Configuration:**

```bash
# Verify JWT_SECRET is set
docker compose exec app printenv | grep JWT_SECRET

# Regenerate JWT secret (will log out all users!)
# Update .env file:
JWT_SECRET=new_secret_at_least_32_characters_long

# Restart application
docker compose restart app
```

### Issue 2: Two-Factor Authentication (2FA) Not Working

**Symptoms:**
- QR code won't scan
- Verification code always invalid
- "Invalid token" error

**Diagnostics:**

```bash
# Check server time (must be synchronized)
date

# Check if NTP is running
timedatectl status

# Test 2FA for user
docker compose exec app npm run test-2fa -- --email=user@example.com
```

**Solutions:**

**1. Synchronize Server Time:**

```bash
# Install NTP
sudo apt install ntp -y

# Synchronize time
sudo ntpdate -s time.nist.gov

# Enable automatic time sync
sudo timedatectl set-ntp true
```

**2. Reset 2FA for User:**

```bash
# Via database
docker compose exec db psql -U flowstock -d flowstock_prod -c "UPDATE users SET twofa_enabled=false, twofa_secret=NULL WHERE email='user@example.com';"

# Via admin panel
# Admin → Users → Select User → Disable 2FA
```

**3. Generate Backup Codes:**

```bash
# Generate new backup codes
docker compose exec app npm run generate-backup-codes -- --email=user@example.com
```

### Issue 3: Session Expires Too Quickly

**Symptoms:**
- Users logged out after a few minutes
- "Session expired" errors

**Diagnostics:**

```bash
# Check session configuration
docker compose exec app printenv | grep SESSION

# Check Redis TTL for sessions
docker compose exec redis redis-cli --scan --pattern "sess:*" | head -1 | xargs docker compose exec redis redis-cli TTL
```

**Solutions:**

```bash
# Update session timeout in .env
SESSION_TIMEOUT=3600  # 1 hour
SESSION_ABSOLUTE_TIMEOUT=28800  # 8 hours

# Restart application
docker compose restart app
```

---

## Database Issues

### Issue 1: Database Connection Failed

**Symptoms:**
- "Cannot connect to database" error
- Application won't start
- Timeout errors

**Diagnostics:**

```bash
# Check database container status
docker compose ps db

# Check database logs
docker compose logs db

# Test connection from host
psql -h localhost -U flowstock -d flowstock_prod -c "SELECT 1;"

# Test connection from app container
docker compose exec app psql -h db -U flowstock -d flowstock_prod -c "SELECT 1;"

# Check DATABASE_URL
docker compose exec app printenv DATABASE_URL
```

**Solutions:**

**1. Restart Database:**

```bash
# Restart database container
docker compose restart db

# Wait for database to be ready
docker compose exec db pg_isready -U flowstock
```

**2. Fix Connection String:**

```bash
# Correct format in .env:
DATABASE_URL=postgresql://flowstock:password@db:5432/flowstock_prod

# Restart application
docker compose restart app
```

**3. Increase Connection Limit:**

```bash
# Connect to database
docker compose exec db psql -U flowstock -d flowstock_prod

# Check current connections
SELECT count(*) FROM pg_stat_activity;

# Show max connections
SHOW max_connections;

# Increase max connections (requires restart)
ALTER SYSTEM SET max_connections = 200;

# Exit and restart
\q
docker compose restart db
```

**4. Check Firewall Rules:**

```bash
# Check if port 5432 is accessible
telnet localhost 5432

# Allow PostgreSQL through firewall
sudo ufw allow 5432/tcp
```

### Issue 2: Slow Database Queries

**Symptoms:**
- Pages loading slowly
- API timeouts
- High database CPU usage

**Diagnostics:**

```bash
# Connect to database
docker compose exec db psql -U flowstock -d flowstock_prod

# Find slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
ORDER BY duration DESC;

# Check missing indexes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    CASE WHEN n_tup_ins > 0 THEN (n_tup_hot_upd::numeric / n_tup_upd::numeric) ELSE 0 END AS hot_update_ratio
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

# Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan
LIMIT 20;
```

**Solutions:**

**1. Create Missing Indexes:**

```sql
-- Common indexes for LogiVox WMS
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_locations_warehouse ON locations(warehouse_id);
```

**2. Optimize Queries:**

```sql
-- Analyze tables
ANALYZE;

-- Vacuum tables
VACUUM ANALYZE;

-- Reindex database
REINDEX DATABASE flowstock_prod;
```

**3. Increase Database Resources:**

```yaml
# In docker-compose.yml
services:
  db:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G
```

**4. Tune PostgreSQL Configuration:**

```bash
# Edit postgresql.conf
docker compose exec db sh -c 'cat >> /var/lib/postgresql/data/postgresql.conf << EOF
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 64MB
max_connections = 200
random_page_cost = 1.1
effective_io_concurrency = 200
EOF'

# Restart database
docker compose restart db
```

### Issue 3: Database Out of Space

**Symptoms:**
- "disk full" errors
- Cannot insert/update records
- Application crashes

**Diagnostics:**

```bash
# Check disk space
df -h

# Check database size
docker compose exec db psql -U flowstock -d flowstock_prod -c "SELECT pg_size_pretty(pg_database_size('flowstock_prod'));"

# Check table sizes
docker compose exec db psql -U flowstock -d flowstock_prod -c "
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;"
```

**Solutions:**

**1. Clean Up Old Data:**

```sql
-- Delete old audit logs (keep last 90 days)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete old notifications (keep last 30 days)
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';

-- Vacuum to reclaim space
VACUUM FULL;
```

**2. Increase Storage:**

```bash
# For Docker volume
# 1. Stop services
docker compose down

# 2. Resize volume (AWS EBS example)
aws ec2 modify-volume --volume-id vol-xxxxx --size 200

# 3. Extend filesystem
sudo resize2fs /dev/xvdf

# 4. Start services
docker compose up -d
```

**3. Archive Old Data:**

```bash
# Export old data
docker compose exec db pg_dump -U flowstock -d flowstock_prod -t audit_logs --where="created_at < '2024-01-01'" > audit_logs_archive.sql

# Delete archived data
docker compose exec db psql -U flowstock -d flowstock_prod -c "DELETE FROM audit_logs WHERE created_at < '2024-01-01';"
```

---

## Performance Problems

### Issue 1: Slow Page Load Times

**Symptoms:**
- Pages take >5 seconds to load
- Timeouts on dashboard
- Slow API responses

**Diagnostics:**

```bash
# Check application logs
docker compose logs app | grep -i "slow"

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://flowstock.yourcompany.com/api/health

# curl-format.txt:
# time_namelookup: %{time_namelookup}\n
# time_connect: %{time_connect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total: %{time_total}\n

# Check Redis cache hit rate
docker compose exec redis redis-cli INFO stats | grep hit
```

**Solutions:**

**1. Clear Cache:**

```bash
# Clear application cache
docker compose exec redis redis-cli FLUSHALL

# Clear browser cache (instruct users)
```

**2. Optimize Database:**

```sql
-- Run ANALYZE
ANALYZE;

-- Run VACUUM
VACUUM ANALYZE;
```

**3. Enable Query Caching:**

```bash
# Update .env
CACHE_TTL=300  # 5 minutes

# Restart application
docker compose restart app
```

**4. Increase Resources:**

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
```

**5. Enable Gzip Compression:**

```nginx
# nginx.conf
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### Issue 2: High Memory Usage

**Symptoms:**
- Out of memory errors
- Application crashes
- Swap usage increasing

**Diagnostics:**

```bash
# Check memory usage
docker stats

# Check memory leaks
docker compose exec app node --expose-gc --inspect app.js

# Monitor memory over time
watch -n 5 'free -h'
```

**Solutions:**

**1. Increase Memory Limit:**

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 8G
        reservations:
          memory: 4G
```

**2. Restart Services:**

```bash
# Restart application
docker compose restart app

# Clear Redis memory
docker compose exec redis redis-cli FLUSHALL
```

**3. Optimize Code:**

```javascript
// Implement connection pooling
// src/config/database.ts
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Issue 3: High CPU Usage

**Symptoms:**
- CPU consistently >80%
- Server becomes unresponsive
- Slow API responses

**Diagnostics:**

```bash
# Check CPU usage
top

# Identify CPU-intensive processes
ps aux | sort -nrk 3,3 | head -n 5

# Check Node.js processes
docker compose exec app ps aux | grep node
```

**Solutions:**

**1. Optimize Queries:**

```sql
-- Find expensive queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**2. Scale Horizontally:**

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
```

**3. Implement Rate Limiting:**

```javascript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## API Errors

### Issue 1: 500 Internal Server Error

**Symptoms:**
- API returns 500 status code
- Generic error message
- Application logs show errors

**Diagnostics:**

```bash
# Check application logs
docker compose logs app | grep -i "error"

# Check for unhandled exceptions
docker compose logs app | grep -i "unhandled"

# Check error tracking (Sentry)
# Visit Sentry dashboard
```

**Solutions:**

**1. Check Error Logs:**

```bash
# View detailed error logs
docker compose logs --tail=500 app | grep -A 10 "500"
```

**2. Restart Application:**

```bash
docker compose restart app
```

**3. Check Database Connection:**

```bash
docker compose exec app npm run health-check
```

### Issue 2: 401 Unauthorized

**Symptoms:**
- API returns 401 status
- "Authentication required" message
- Valid credentials rejected

**Diagnostics:**

```bash
# Check JWT token
# Decode token at https://jwt.io

# Check token expiration
docker compose exec app printenv | grep JWT_EXPIRATION

# Test API with curl
curl -H "Authorization: Bearer YOUR_TOKEN" https://flowstock.yourcompany.com/api/products
```

**Solutions:**

**1. Refresh Token:**

```bash
# Request new token via /api/auth/refresh endpoint
curl -X POST https://flowstock.yourcompany.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

**2. Check JWT Secret:**

```bash
# Verify JWT_SECRET is configured
docker compose exec app printenv JWT_SECRET
```

### Issue 3: 429 Too Many Requests

**Symptoms:**
- API returns 429 status
- "Rate limit exceeded" message
- Requests blocked temporarily

**Diagnostics:**

```bash
# Check rate limit headers
curl -I https://flowstock.yourcompany.com/api/products

# Check current rate limit
docker compose exec redis redis-cli GET "rate_limit:192.168.1.100"
```

**Solutions:**

**1. Wait for Rate Limit Reset:**

```bash
# Check reset time from response headers
# X-RateLimit-Reset: 1697472000
```

**2. Increase Rate Limit:**

```bash
# Update .env
RATE_LIMIT_MAX=200  # Increase from 100

# Restart application
docker compose restart app
```

**3. Implement API Key Tiers:**

```javascript
// Premium users get higher limits
const premiumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500 // 5x normal limit
});
```

---

## Integration Issues

### Issue 1: Stripe Integration Not Working

**Symptoms:**
- Payment processing fails
- "Invalid API key" error
- Webhook events not received

**Diagnostics:**

```bash
# Check Stripe configuration
docker compose exec app printenv | grep STRIPE

# Test Stripe connection
docker compose exec app npm run test-stripe

# Check webhook logs
docker compose logs app | grep -i "stripe"
```

**Solutions:**

**1. Verify API Keys:**

```bash
# Ensure using correct keys for environment
# Test: sk_test_... and pk_test_...
# Live: sk_live_... and pk_live_...

# Update .env
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Restart application
docker compose restart app
```

**2. Configure Webhooks:**

```bash
# Stripe Dashboard → Developers → Webhooks
# Add endpoint: https://flowstock.yourcompany.com/api/webhooks/stripe
# Events to listen:
# - payment_intent.succeeded
# - payment_intent.payment_failed
# - charge.refunded
```

**3. Test Webhook:**

```bash
# Use Stripe CLI
stripe trigger payment_intent.succeeded
```

### Issue 2: Email Not Sending

**Symptoms:**
- Users not receiving emails
- Password reset emails not delivered
- "SMTP error" in logs

**Diagnostics:**

```bash
# Check SMTP configuration
docker compose exec app printenv | grep SMTP

# Test email sending
docker compose exec app npm run test-email -- --to=test@example.com

# Check email logs
docker compose logs app | grep -i "email"
```

**Solutions:**

**1. Verify SMTP Credentials:**

```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Update .env with correct credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourcompany.com
SMTP_PASSWORD=your_app_password

# Restart application
docker compose restart app
```

**2. Enable Less Secure Apps (Gmail):**

```bash
# For Gmail, use App Password:
# Google Account → Security → 2-Step Verification → App passwords
# Generate password for "Mail" on "Other (Custom name)"
```

**3. Check Email Queue:**

```bash
# View email queue
docker compose exec redis redis-cli LRANGE "queue:email" 0 -1

# Clear email queue
docker compose exec redis redis-cli DEL "queue:email"
```

---

## Deployment Issues

### Issue 1: Docker Build Fails

**Symptoms:**
- `docker compose build` fails
- Dependency installation errors
- Image build timeouts

**Diagnostics:**

```bash
# Check Docker logs
docker compose build --no-cache --progress=plain

# Check Dockerfile syntax
docker run --rm -i hadolint/hadolint < Dockerfile
```

**Solutions:**

**1. Clear Build Cache:**

```bash
# Remove all build cache
docker system prune -a --volumes

# Rebuild from scratch
docker compose build --no-cache
```

**2. Fix Dependency Issues:**

```bash
# Update package-lock.json
npm install

# Rebuild
docker compose build
```

### Issue 2: Kubernetes Pods CrashLoopBackOff

**Symptoms:**
- Pods continuously restarting
- "CrashLoopBackOff" status
- Application won't start

**Diagnostics:**

```bash
# Check pod status
kubectl get pods -n logivox-prod

# View pod logs
kubectl logs <pod-name> -n logivox-prod

# Describe pod
kubectl describe pod <pod-name> -n logivox-prod

# Check events
kubectl get events -n logivox-prod --sort-by='.lastTimestamp'
```

**Solutions:**

**1. Check Configuration:**

```bash
# Verify secrets exist
kubectl get secrets -n logivox-prod

# Verify config maps
kubectl get configmaps -n logivox-prod
```

**2. Increase Resources:**

```yaml
# deployment.yaml
resources:
  requests:
    memory: "2Gi"
    cpu: "1000m"
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

**3. Fix Health Checks:**

```yaml
# deployment.yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 60  # Increase from 30
  periodSeconds: 30
```

---

## Email & Notification Issues

### Issue 1: Users Not Receiving Notifications

**Symptoms:**
- Notification settings enabled but not receiving
- Email queue growing
- No errors in logs

**Diagnostics:**

```bash
# Check notification settings
docker compose exec db psql -U flowstock -d flowstock_prod -c "SELECT id, email, notification_preferences FROM users WHERE id='user_123';"

# Check email queue
docker compose exec redis redis-cli LLEN "queue:email"

# Check notification logs
docker compose logs app | grep -i "notification"
```

**Solutions:**

**1. Check User Preferences:**

```sql
-- Verify notification settings
SELECT email, notification_preferences
FROM users
WHERE id = 'user_123';

-- Reset to defaults
UPDATE users
SET notification_preferences = '{"email": true, "push": true, "sms": false}'
WHERE id = 'user_123';
```

**2. Process Email Queue:**

```bash
# Manual queue processing
docker compose exec app npm run process-email-queue

# Check queue status
docker compose exec redis redis-cli LLEN "queue:email"
```

---

## Barcode Scanning Issues

### Issue 1: Barcode Won't Scan

**Symptoms:**
- Scanner not reading barcode
- Incorrect values scanned
- Scanner not connecting

**Solutions:**

**1. Check Barcode Quality:**
- Print barcodes at higher resolution (300 DPI minimum)
- Ensure adequate contrast (black bars on white background)
- Avoid damaged or wrinkled labels

**2. Configure Scanner:**
- Check scanner is in correct mode (Code 39, Code 128, QR, etc.)
- Verify USB connection
- Test scanner with known-good barcode

**3. Adjust Scan Distance:**
- Optimal distance: 4-12 inches
- Ensure adequate lighting
- Hold scanner perpendicular to barcode

---

## Mobile App Issues

### Issue 1: Mobile App Won't Sync

**Symptoms:**
- "Sync failed" message
- Data not updating
- Offline mode stuck

**Diagnostics:**

```bash
# Check API health
curl https://flowstock.yourcompany.com/api/health

# Check mobile app logs
# iOS: Xcode → Devices → Select device → View console
# Android: adb logcat | grep LogiVox
```

**Solutions:**

**1. Clear App Cache:**
- iOS: Settings → LogiVox → Clear Cache
- Android: Settings → Apps → LogiVox → Storage → Clear Cache

**2. Force Sync:**
- Open app → Settings → Force Sync

**3. Reinstall App:**
- Uninstall and reinstall from app store

---

## Data Inconsistency Issues

### Issue 1: Stock Levels Incorrect

**Symptoms:**
- Physical count doesn't match system
- Negative stock levels
- Discrepancies after transfers

**Diagnostics:**

```sql
-- Check inventory transactions
SELECT * FROM inventory_transactions
WHERE inventory_item_id = 'item_123'
ORDER BY created_at DESC
LIMIT 20;

-- Check current stock levels
SELECT warehouse_id, location_id, quantity
FROM inventory_levels
WHERE inventory_item_id = 'item_123';

-- Find negative stock
SELECT * FROM inventory_levels WHERE quantity < 0;
```

**Solutions:**

**1. Perform Cycle Count:**
- Navigate to: Warehouse → Cycle Counting
- Select items with discrepancies
- Perform physical count
- Adjust system quantities

**2. Reconcile Inventory:**

```sql
-- Recalculate stock from transactions
WITH transaction_totals AS (
  SELECT
    inventory_item_id,
    warehouse_id,
    SUM(CASE WHEN transaction_type IN ('IN', 'ADJUST_IN') THEN quantity ELSE -quantity END) as calculated_qty
  FROM inventory_transactions
  GROUP BY inventory_item_id, warehouse_id
)
UPDATE inventory_levels il
SET quantity = tt.calculated_qty
FROM transaction_totals tt
WHERE il.inventory_item_id = tt.inventory_item_id
  AND il.warehouse_id = tt.warehouse_id;
```

**3. Enable Audit Logging:**

```bash
# Update .env
AUDIT_INVENTORY_CHANGES=true

# Restart application
docker compose restart app
```

---

## Log Analysis

### Viewing Logs

```bash
# Application logs
docker compose logs -f app

# Database logs
docker compose logs -f db

# Redis logs
docker compose logs -f redis

# Nginx logs
docker compose logs -f nginx

# All logs
docker compose logs -f

# Filter by level
docker compose logs app | grep -i "error"
docker compose logs app | grep -i "warn"

# Export logs
docker compose logs > logivox-logs-$(date +%Y%m%d).txt
```

### Log Locations

```bash
# Application logs
/var/log/flowstock/app.log

# Error logs
/var/log/flowstock/error.log

# Access logs
/var/log/nginx/access.log

# Database logs
/var/log/postgresql/postgresql-16-main.log
```

---

## Emergency Procedures

### Emergency Rollback

```bash
# 1. Stop current deployment
docker compose down

# 2. Checkout previous version
git checkout tags/v1.0.0

# 3. Restore database backup
./scripts/restore.sh /backups/flowstock_backup_20251015.sql.gz

# 4. Start services
docker compose up -d

# 5. Verify health
docker compose exec app npm run health-check
```

### Emergency Database Restore

```bash
# 1. Stop application
docker compose stop app

# 2. Create safety backup
docker exec logivox-db pg_dump -U flowstock flowstock_prod | gzip > safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# 3. Restore from backup
gunzip -c flowstock_backup_20251015.sql.gz | docker exec -i logivox-db psql -U flowstock -d flowstock_prod

# 4. Start application
docker compose start app
```

### Emergency Contact

**Critical Issues (24/7):**
- 📞 Phone: 1-800-LOGIVOX
- 📧 Email: urgent@logivox.ai
- 💬 Slack: #emergency-support

**On-Call Engineer:**
- PagerDuty: Automatic escalation
- Response Time: <15 minutes

---

## Support Resources

- **Knowledge Base**: https://support.logivox.ai
- **Community Forum**: https://community.logivox.ai
- **API Documentation**: https://docs.logivox.ai/api
- **Video Tutorials**: https://logivox.ai/tutorials
- **Status Page**: https://status.logivox.ai

---

**LogiVox WMS Troubleshooting Guide - Version 1.0**  
*Last updated: October 16, 2025*
