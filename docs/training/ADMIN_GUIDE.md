# LogiVox WMS - Administrator Guide

**Version 1.0**  
**Last Updated: October 16, 2025**

---

## Table of Contents

1. [System Administration](#system-administration)
2. [User Management](#user-management)
3. [Role-Based Access Control](#role-based-access-control)
4. [System Configuration](#system-configuration)
5. [Warehouse Setup](#warehouse-setup)
6. [Integration Management](#integration-management)
7. [Backup & Recovery](#backup--recovery)
8. [Security Management](#security-management)
9. [Performance Monitoring](#performance-monitoring)
10. [Audit & Compliance](#audit--compliance)

---

## System Administration

### Administrator Dashboard

Access the admin dashboard at `/admin` (requires Super Admin or Admin role).

**Key Sections:**

- System Settings
- User Management
- System Health
- Audit Logs
- Backup Management

### System Requirements

**Production Environment:**

- **Server**: 8 CPU cores, 16GB RAM minimum
- **Database**: PostgreSQL 16+
- **Cache**: Redis 7+
- **Storage**: 100GB+ SSD
- **Network**: 1Gbps connection
- **SSL/TLS**: Required for production

**Development Environment:**

- **Server**: 4 CPU cores, 8GB RAM
- **Database**: PostgreSQL 14+
- **Cache**: Redis 6+
- **Storage**: 50GB
- **Node.js**: v20 LTS

---

## User Management

### Creating Users

1. Navigate to **Admin → Users**
2. Click **"+ Add User"**
3. Enter user information:
   - **Name**: Full name
   - **Email**: Unique email address (used for login)
   - **Role**: Select from available roles
   - **Status**: Active, Inactive, or Locked
4. Generate temporary password or allow user to set on first login
5. Enable/disable two-factor authentication
6. Click **"Create User"**

**Password Requirements:**

- Minimum 8 characters (configurable)
- Uppercase, lowercase, number, special character
- Cannot reuse last 5 passwords
- Expires every 90 days (configurable)

### Managing User Accounts

#### Deactivating Users

1. Navigate to **Admin → Users**
2. Find user in list
3. Click **Actions** → **"Deactivate"**
4. Confirm action
5. User can no longer log in

#### Resetting Passwords

1. Navigate to **Admin → Users**
2. Find user in list
3. Click **Actions** → **"Reset Password"**
4. Choose method:
   - Send reset link via email
   - Generate temporary password
5. User must change password on next login

#### Unlocking Accounts

Accounts lock after 5 failed login attempts (configurable).

1. Navigate to **Admin → Users**
2. Find locked user (status shows 🔒)
3. Click **Actions** → **"Unlock Account"**
4. User can attempt login again

### Bulk Operations

Import multiple users:

1. Navigate to **Admin → Users → Import**
2. Download CSV template
3. Fill in user data:
   ```csv
   name,email,role,status
   John Doe,john@company.com,WAREHOUSE_STAFF,active
   Jane Smith,jane@company.com,MANAGER,active
   ```
4. Upload CSV file
5. Review preview
6. Click **"Import Users"**

---

## Role-Based Access Control

### Available Roles

LogiVox WMS includes 7 predefined roles:

#### 1. SUPER_ADMIN

**Full system access**

- All permissions
- System configuration
- User management
- Security settings
- Cannot be deleted or demoted

#### 2. ADMIN

**Administrative access**

- User management
- System settings (limited)
- Report access
- No security settings

#### 3. MANAGER

**Operational management**

- View all orders and inventory
- Approve orders
- Generate reports
- Manage warehouse staff
- No system configuration

#### 4. WAREHOUSE_STAFF

**Warehouse operations**

- Process orders
- Adjust inventory
- Scan products
- View assigned warehouse only
- No administrative access

#### 5. SALES

**Sales operations**

- Create sales orders
- View customers
- Process orders
- View inventory (read-only)
- No warehouse operations

#### 6. ACCOUNTANT

**Financial operations**

- View orders and invoices
- Generate financial reports
- View inventory valuation
- No order processing
- No inventory adjustments

#### 7. USER

**Limited access**

- View-only dashboard
- Basic reports
- Cannot modify data

### Permission Matrix

| Permission            | Super Admin | Admin | Manager | Warehouse | Sales | Accountant | User |
| --------------------- | ----------- | ----- | ------- | --------- | ----- | ---------- | ---- |
| System Settings       | ✅          | ⚠️    | ❌      | ❌        | ❌    | ❌         | ❌   |
| User Management       | ✅          | ✅    | ⚠️      | ❌        | ❌    | ❌         | ❌   |
| Create Orders         | ✅          | ✅    | ✅      | ✅        | ✅    | ❌         | ❌   |
| Process Orders        | ✅          | ✅    | ✅      | ✅        | ❌    | ❌         | ❌   |
| Inventory Adjustments | ✅          | ✅    | ✅      | ✅        | ❌    | ❌         | ❌   |
| View Reports          | ✅          | ✅    | ✅      | ⚠️        | ⚠️    | ✅         | ⚠️   |
| Backups               | ✅          | ⚠️    | ❌      | ❌        | ❌    | ❌         | ❌   |
| Audit Logs            | ✅          | ✅    | ⚠️      | ❌        | ❌    | ❌         | ❌   |

**Legend:**

- ✅ Full access
- ⚠️ Limited access
- ❌ No access

### Custom Permissions

Create granular permissions:

1. Navigate to **Admin → Roles → Permissions**
2. Select role to modify
3. Toggle permissions:
   - `products:create`, `products:read`, `products:update`, `products:delete`
   - `orders:create`, `orders:read`, `orders:update`, `orders:delete`
   - `inventory:adjust`, `inventory:transfer`
   - `users:create`, `users:read`, `users:update`, `users:delete`
   - `settings:read`, `settings:write`
   - `reports:view`, `reports:export`
   - `audit:read`, `backup:create`, `backup:restore`
4. Click **"Save Permissions"**

---

## System Configuration

### General Settings

Navigate to **Admin → Settings → General**

#### Application Settings

- **Application Name**: Display name (default: "LogiVox WMS")
- **Application URL**: Base URL for the application
- **Company Name**: Your company name
- **Timezone**: System timezone (affects all timestamps)
- **Date Format**: MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD
- **Currency**: USD, EUR, GBP, JPY, etc.
- **Language**: System default language

### Email Configuration

Navigate to **Admin → Settings → Email**

#### SMTP Settings

```
SMTP Host: smtp.gmail.com
SMTP Port: 587 (TLS) or 465 (SSL)
SMTP User: your-email@company.com
SMTP Password: your-app-password
From Email: noreply@company.com
From Name: LogiVox WMS
```

#### Testing Email

1. Enter SMTP configuration
2. Click **"Test Connection"**
3. Enter test recipient email
4. Click **"Send Test Email"**
5. Verify email received

**Email Templates Configured:**

- Welcome email (new user)
- Password reset
- Order confirmation
- Shipping notification
- Low stock alert
- System notifications

### Notification Settings

Navigate to **Admin → Settings → Notifications**

#### Available Channels

- **Email Notifications**: ✅ Enabled
- **SMS Notifications**: ⚠️ Requires Twilio integration
- **Push Notifications**: ⚠️ Requires mobile app

#### Alert Types

- ✅ Low Stock Alerts (when stock ≤ reorder level)
- ✅ Order Alerts (new orders, status changes)
- ✅ System Alerts (errors, warnings, updates)
- ✅ Security Alerts (failed logins, suspicious activity)

### Security Settings

Navigate to **Admin → Settings → Security**

#### Session Management

- **Session Timeout**: 60 minutes (idle timeout)
- **Max Session Duration**: 8 hours (absolute timeout)
- **Remember Me**: 30 days

#### Password Policy

- **Minimum Length**: 8 characters
- **Require Uppercase**: ✅ Yes
- **Require Numbers**: ✅ Yes
- **Require Symbols**: ✅ Yes
- **Password History**: Remember last 5 passwords
- **Password Expiry**: 90 days

#### Two-Factor Authentication

- **2FA Enabled**: ✅ Optional (can be enforced)
- **Methods**: TOTP (Google Authenticator, Authy)
- **Backup Codes**: 10 codes generated per user

#### Account Lockout

- **Max Login Attempts**: 5 attempts
- **Lockout Duration**: 15 minutes
- **IP-based Lockout**: ✅ Enabled

### Inventory Settings

Navigate to **Admin → Settings → Inventory**

#### Stock Management

- **Auto Reorder**: ✅ Enabled (create draft POs when low stock)
- **Reorder Lead Time**: 7 days
- **Allow Negative Stock**: ❌ Disabled (prevent overselling)
- **Track Serial Numbers**: ✅ Enabled
- **Track Batch Numbers**: ✅ Enabled

#### Stock Valuation Methods

- **FIFO** (First In, First Out) - Default
- **LIFO** (Last In, First Out)
- **Average Cost**
- **Specific Identification**

---

## Warehouse Setup

### Creating Warehouses

1. Navigate to **Admin → Warehouses**
2. Click **"+ Add Warehouse"**
3. Enter warehouse details:
   - **Name**: Warehouse name
   - **Code**: Unique identifier (e.g., WH-001)
   - **Type**: Main, Satellite, Distribution Center
   - **Address**: Full address
   - **Contact**: Phone and email
   - **Status**: Active, Inactive, Maintenance
4. Configure warehouse settings:
   - **Default Warehouse**: Set as default for new products
   - **Allow Transfers**: Enable inter-warehouse transfers
   - **Require Approval**: Require manager approval for adjustments
5. Click **"Save Warehouse"**

### Location Hierarchy

Define warehouse structure:

```
Warehouse
  └── Zone (A, B, C)
      └── Aisle (01, 02, 03)
          └── Rack (1, 2, 3)
              └── Shelf (A, B, C, D)
                  └── Bin (01, 02, 03)
```

**Example Location Code**: `A-01-1-B-02`

#### Bulk Location Creation

1. Navigate to **Admin → Warehouses → [Warehouse] → Locations**
2. Click **"Bulk Create"**
3. Enter parameters:
   - Zones: A, B, C
   - Aisles: 01-10
   - Racks: 1-5
   - Shelves: A-D
   - Bins: 01-10
4. Click **"Generate Locations"**
5. Review preview (e.g., 6,000 locations)
6. Click **"Create All"**

### Warehouse Zones

Configure zone types:

1. **Receiving Zone**: For incoming shipments
2. **Storage Zone**: Primary inventory storage
3. **Picking Zone**: High-velocity items
4. **Packing Zone**: Order packing area
5. **Shipping Zone**: Outbound staging
6. **Returns Zone**: Returned items processing
7. **Quarantine Zone**: Damaged/hold items

---

## Integration Management

### Available Integrations

#### Payment Processing

**Stripe Integration**

1. Navigate to **Admin → Settings → Integrations**
2. Toggle **"Stripe Enabled"** to ON
3. Enter credentials:
   - Publishable Key: `pk_live_...`
   - Secret Key: `sk_live_...`
4. Click **"Test Connection"**
5. Click **"Save"**

**Supported Features:**

- Payment processing
- Refunds
- Subscription billing
- Invoice generation

#### Shipping Carriers

**Supported Carriers:**

- FedEx
- UPS
- USPS
- DHL
- Custom carriers

**Configuration:**

1. Navigate to **Admin → Integrations → Shipping**
2. Select carrier
3. Enter API credentials
4. Configure shipping methods
5. Set rate calculation preferences
6. Click **"Save"**

#### Accounting Software

**QuickBooks Integration**

1. Navigate to **Admin → Integrations → Accounting**
2. Click **"Connect QuickBooks"**
3. Authorize access
4. Map accounts:
   - Revenue account
   - Inventory asset account
   - Cost of goods sold account
5. Configure sync settings:
   - Sync frequency: Real-time, Hourly, Daily
   - Sync direction: One-way or Two-way
6. Click **"Save"**

**Xero Integration**
Similar process to QuickBooks.

#### E-commerce Platforms

**Shopify Integration**

1. Install LogiVox WMS app from Shopify App Store
2. Authorize access
3. Configure sync settings:
   - Product sync: ✅ Two-way
   - Inventory sync: ✅ Real-time
   - Order import: ✅ Automatic
4. Map Shopify locations to LogiVox warehouses
5. Click **"Save"**

**WooCommerce Integration**

1. Install LogiVox WMS plugin on WordPress
2. Enter API credentials
3. Configure sync settings
4. Click **"Save"**

#### Communication

**Slack Integration**

1. Navigate to **Admin → Integrations → Slack**
2. Click **"Add to Slack"**
3. Select Slack channel for notifications
4. Configure alert types:
   - Low stock alerts
   - Order notifications
   - System alerts
5. Click **"Save"**

**Twilio (SMS) Integration**

1. Navigate to **Admin → Integrations → Twilio**
2. Enter credentials:
   - Account SID
   - Auth Token
   - Phone Number
3. Click **"Test Connection"**
4. Configure SMS notifications
5. Click **"Save"**

### API Access

Grant API access to external systems:

1. Navigate to **Admin → Integrations → API**
2. Click **"+ Generate API Key"**
3. Enter details:
   - Name: Integration name
   - Permissions: Select allowed operations
   - IP Whitelist: Restrict access by IP (optional)
   - Rate Limit: Requests per minute
4. Copy API key (shown once only!)
5. Store securely

**API Documentation**: https://api.logivox.ai/docs

---

## Backup & Recovery

### Automated Backups

**Schedule Configuration:**

1. Navigate to **Admin → Backups**
2. View backup schedule:
   - **Frequency**: Daily at 2:00 AM UTC
   - **Retention**: 30 days
   - **Storage**: Local + S3
3. Modify schedule if needed
4. Click **"Save Schedule"**

### Manual Backups

Create on-demand backups:

1. Navigate to **Admin → Backups**
2. Click **"+ Create Backup"**
3. Select backup type:
   - **Full**: Complete database
   - **Incremental**: Changes since last backup
4. Enter description (optional)
5. Click **"Create"**
6. Monitor progress
7. Download when complete

**Backup includes:**

- Database (all tables)
- User-uploaded files
- System configuration
- Integration settings (encrypted)

### Restoring from Backup

**⚠️ WARNING: This will overwrite current data!**

1. Navigate to **Admin → Backups**
2. Select backup from list
3. Click **Actions → "Restore"**
4. Review restore details
5. Enter confirmation code
6. Click **"Confirm Restore"**
7. System creates safety backup of current state
8. Restore process begins (system unavailable)
9. Users redirected to maintenance page
10. Restore completes (typically 10-30 minutes)
11. Verify data integrity
12. Notify users

**Emergency Restore:**
If web interface unavailable, use command line:

```bash
./scripts/restore.sh /path/to/backup.sql.gz
```

### Disaster Recovery Plan

**Recovery Time Objective (RTO)**: 4 hours  
**Recovery Point Objective (RPO)**: 24 hours

**Steps:**

1. Identify incident and severity
2. Notify stakeholders
3. Activate disaster recovery team
4. Restore from most recent backup
5. Verify system functionality
6. Test all integrations
7. Monitor for 24 hours
8. Conduct post-incident review

---

## Security Management

### Security Monitoring

Navigate to **Admin → Security**

#### Failed Login Attempts

Monitor suspicious login activity:

- View failed login attempts
- See IP addresses
- Review user agents
- Block suspicious IPs

#### Active Sessions

View all active user sessions:

- User name
- Login time
- IP address
- Device/browser
- Last activity
- Force logout capability

#### IP Blacklist

Block malicious IP addresses:

1. Navigate to **Admin → Security → IP Blacklist**
2. Click **"+ Add IP"**
3. Enter IP address or range
4. Enter reason
5. Set expiration (optional)
6. Click **"Block"**

### Security Audit

Regular security checks:

#### Weekly Tasks

- [ ] Review failed login attempts
- [ ] Check for locked accounts
- [ ] Review API usage logs
- [ ] Verify backup completion

#### Monthly Tasks

- [ ] Review user permissions
- [ ] Audit user activity logs
- [ ] Check for inactive users
- [ ] Review integration access
- [ ] Verify SSL certificate validity

#### Quarterly Tasks

- [ ] Full security audit
- [ ] Penetration testing
- [ ] Password policy review
- [ ] Update security procedures
- [ ] Staff security training

### Compliance

#### Data Privacy (GDPR, CCPA)

**User Data Requests:**

1. Navigate to **Admin → Compliance**
2. Click **"Data Request"**
3. Enter user email
4. Select request type:
   - **Export**: Download all user data
   - **Delete**: Permanently remove user data
5. Click **"Process Request"**
6. Data package generated within 30 days

**Data Retention:**

- User data: Retained while account active
- Deleted accounts: 30-day retention before permanent deletion
- Audit logs: 7 years
- Financial records: 7 years
- Backups: 30 days

#### SOC 2 Compliance

LogiVox WMS meets SOC 2 Type II requirements:

- ✅ Security controls
- ✅ Availability monitoring
- ✅ Processing integrity
- ✅ Confidentiality measures
- ✅ Privacy protections

**Audit Reports**: Available upon request

---

## Performance Monitoring

### System Health Dashboard

Navigate to **Admin → Health**

#### Server Metrics

- **CPU Usage**: Current: 45%, Threshold: 80%
- **Memory Usage**: Current: 62%, Threshold: 85%
- **Disk Usage**: Current: 38%, Threshold: 90%
- **Uptime**: 45 days, 12 hours

#### Database Performance

- **Active Connections**: 15 / 100
- **Average Query Time**: 12ms (Excellent)
- **Database Size**: 2.3 GB
- **Slow Queries**: 0 (last 24 hours)

#### Cache Performance

- **Redis Status**: ✅ Healthy
- **Hit Rate**: 94% (Excellent)
- **Memory Used**: 128 MB / 1 GB
- **Total Keys**: 45,231

#### API Performance

- **Requests/Minute**: 850
- **Average Response Time**: 85ms
- **Error Rate**: 0.02% (Excellent)
- **99th Percentile**: 250ms

### Performance Optimization

#### Database Optimization

**Index Management:**

```sql
-- Check missing indexes
SELECT * FROM pg_stat_user_tables
WHERE idx_scan = 0 AND seq_scan > 1000;

-- Create indexes for slow queries
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

**Query Optimization:**

1. Navigate to **Admin → Performance → Slow Queries**
2. Review queries taking > 100ms
3. Click **"Optimize"** for suggestions
4. Apply recommendations

**Vacuum and Analyze:**

```bash
# Automated weekly maintenance
psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

#### Cache Optimization

**Redis Configuration:**

```bash
# Increase memory limit
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
```

**Cache Strategy:**

- Product data: 1 hour TTL
- User sessions: Session duration
- Reports: 15 minutes TTL
- Static content: 24 hours TTL

#### Application Optimization

**Code Splitting:**

- Lazy load dashboard widgets
- Dynamic imports for heavy components
- Route-based code splitting

**Image Optimization:**

- WebP format with fallback
- Responsive images
- Lazy loading
- CDN delivery

**API Optimization:**

- Response compression (gzip/brotli)
- Pagination for large datasets
- Field selection (GraphQL-style)
- ETags for caching

### Monitoring Tools

**Integrated Monitoring:**

- **Sentry**: Error tracking and monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Uptime Robot**: Availability monitoring

**Alerts Configuration:**

1. Navigate to **Admin → Monitoring → Alerts**
2. Configure thresholds:
   - CPU > 80% for 5 minutes
   - Memory > 85% for 5 minutes
   - Error rate > 1% for 10 minutes
   - Response time > 500ms (p99)
3. Set notification channels:
   - Email
   - Slack
   - PagerDuty
4. Click **"Save Alerts"**

---

## Audit & Compliance

### Audit Logs

Navigate to **Admin → Audit Logs**

#### Tracked Events (40+ types)

**User Events:**

- `user_created`, `user_updated`, `user_deleted`
- `login_success`, `login_failed`, `logout`
- `password_changed`, `2fa_enabled`, `2fa_disabled`

**Inventory Events:**

- `product_created`, `product_updated`, `product_deleted`
- `stock_adjusted`, `stock_transferred`
- `location_assigned`

**Order Events:**

- `order_created`, `order_updated`, `order_cancelled`
- `order_picked`, `order_packed`, `order_shipped`

**System Events:**

- `settings_updated`, `integration_enabled`
- `backup_created`, `backup_restored`
- `user_permission_changed`

#### Audit Log Details

Each log entry includes:

- **Timestamp**: UTC timestamp
- **User**: Who performed the action
- **Action**: What was done
- **Resource**: What was affected
- **Resource ID**: Specific item affected
- **IP Address**: Origin of request
- **User Agent**: Browser/device info
- **Details**: JSON payload with specifics

#### Searching Audit Logs

**Filters:**

- Date range
- User
- Action type
- Resource type
- IP address

**Export Options:**

- CSV (Excel-compatible)
- JSON (for analysis)
- PDF (for reporting)

### Compliance Reports

Generate compliance reports:

1. Navigate to **Admin → Compliance → Reports**
2. Select report type:
   - **Access Report**: Who accessed what
   - **Change Report**: What was modified
   - **Security Report**: Security events
   - **User Activity Report**: User actions
3. Select date range
4. Click **"Generate Report"**
5. Download PDF or CSV

### Legal Hold

Preserve data for legal proceedings:

1. Navigate to **Admin → Compliance → Legal Hold**
2. Click **"+ New Legal Hold"**
3. Enter case details:
   - Case name
   - Date range
   - Users involved
   - Data categories
4. Click **"Create Hold"**
5. Data excluded from automatic deletion
6. Release hold when case closed

---

## Best Practices

### Security Best Practices

1. **Enable 2FA** for all administrators
2. **Regular password changes** every 90 days
3. **Review user permissions** quarterly
4. **Monitor failed login attempts** weekly
5. **Keep system updated** with latest patches
6. **Use strong API keys** (rotated regularly)
7. **Encrypt sensitive data** at rest and in transit
8. **Regular security audits** quarterly
9. **Train users** on security awareness
10. **Incident response plan** documented and tested

### Operational Best Practices

1. **Daily backup verification**
2. **Weekly performance review**
3. **Monthly user activity audit**
4. **Quarterly system optimization**
5. **Annual disaster recovery drill**
6. **Document all changes**
7. **Test integrations regularly**
8. **Monitor system health proactively**
9. **Keep documentation updated**
10. **Maintain staging environment for testing**

---

## Support & Resources

**Administrator Support:**

- 📧 Email: admin-support@logivox.ai
- 📞 Phone: 1-800-LOGIVOX (24/7 for critical issues)
- 💬 Slack: LogiVox Administrators Community
- 📚 Knowledge Base: https://admin.logivox.ai

**Training:**

- 🎓 Administrator Certification Program
- 📹 Video Tutorials: https://learn.logivox.ai/admin
- 📖 API Documentation: https://api.logivox.ai/docs

**Release Notes:**

- https://changelog.logivox.ai

---

**LogiVox WMS Administrator Guide - Version 1.0**  
_For questions or feedback: documentation@logivox.ai_
