# Security Implementation Guide

## Overview
This document describes the comprehensive security features implemented in LogiVox WMS to protect against common vulnerabilities and attacks.

## Security Features

### 1. Rate Limiting
**Purpose:** Prevent brute force attacks and API abuse

**Implementation:**
- Redis-based distributed rate limiting
- Memory store fallback for development
- Different limits for different endpoint types:
  - Auth endpoints: 5 requests per 15 minutes
  - API endpoints: 100 requests per minute
  - Read operations: 300 requests per minute
  - Write operations: 50 requests per minute
  - Password reset: 3 requests per hour

**Usage:**
```typescript
import { rateLimit, RateLimitPresets } from '@/lib/middleware/rate-limiter';

// In API route
const limitCheck = await rateLimit(req, RateLimitPresets.API);
if (limitCheck?.status === 429) {
  return limitCheck; // Return 429 Too Many Requests
}
```

### 2. Security Headers
**Purpose:** Protect against XSS, clickjacking, and other attacks

**Headers Applied:**
- **Content-Security-Policy:** Restricts resource loading
- **Strict-Transport-Security (HSTS):** Forces HTTPS
- **X-Frame-Options:** Prevents clickjacking
- **X-Content-Type-Options:** Prevents MIME sniffing
- **Referrer-Policy:** Controls referrer information
- **Permissions-Policy:** Restricts browser features
- **Cross-Origin-*-Policy:** Controls cross-origin behavior

**Configuration:**
```typescript
import { securityHeaders } from '@/lib/middleware/security-headers';

// Apply to all responses
const response = securityHeaders()(req);
```

### 3. Input Sanitization
**Purpose:** Prevent XSS and injection attacks

**Functions:**
- `sanitizeHtml()`: Clean HTML while allowing safe tags
- `stripHtml()`: Remove all HTML tags
- `sanitizeSql()`: Remove SQL injection patterns
- `sanitizeFilename()`: Prevent directory traversal
- `sanitizePath()`: Safe path handling
- `sanitizeEmail()`: Email validation and cleaning
- `sanitizeObject()`: Recursive object sanitization

**Usage:**
```typescript
import { sanitizeHtml, stripHtml } from '@/lib/security/sanitization';

const cleanDescription = sanitizeHtml(userInput);
const plainText = stripHtml(userInput);
```

### 4. Authentication Security
**Purpose:** Secure password handling and token management

**Features:**
- Bcrypt password hashing (12 rounds)
- Password strength validation
- Common password detection
- Secure token generation
- Password reset tokens with expiry
- Email verification tokens
- 2FA support with backup codes
- API key generation and verification
- Constant-time string comparison

**Usage:**
```typescript
import { hashPassword, verifyPassword, checkPasswordStrength } from '@/lib/security/authentication';

// Hash password
const hash = await hashPassword(password);

// Verify password
const valid = await verifyPassword(password, hash);

// Check strength
const { valid, errors } = checkPasswordStrength(password);
```

### 5. Authorization & RBAC
**Purpose:** Role-based access control

**Roles:**
- ADMIN: Full system access
- WAREHOUSE_MANAGER: Warehouse operations
- WAREHOUSE_OPERATOR: Basic operations
- INVENTORY_CONTROLLER: Inventory management
- SALES_MANAGER: Sales operations
- PURCHASING_MANAGER: Procurement
- VIEWER: Read-only access

**Permissions:**
- Inventory: view, create, edit, delete, adjust
- Orders: view, create, edit, delete, approve, cancel
- Warehouse: view, manage, location.manage, wave.create
- Users: view, manage, roles.manage
- Reports: view, export, analytics.view
- System: settings.view, settings.manage, audit.view

**Usage:**
```typescript
import { authorize, Permission } from '@/lib/middleware/authorization';

// Check permission
const authCheck = await authorize(req, {
  permissions: Permission.INVENTORY_EDIT,
});
if (authCheck) return authCheck; // 403 Forbidden
```

### 6. CSRF Protection
**Purpose:** Prevent Cross-Site Request Forgery attacks

**Implementation:**
- Token-based protection
- Cookie + header verification
- Automatic token generation
- Exempt safe methods (GET, HEAD, OPTIONS)

**Usage:**
```typescript
import { csrfProtection } from '@/lib/middleware/csrf-protection';

// Apply to mutation endpoints
const csrfCheck = await csrfProtection(req);
if (csrfCheck?.status === 403) {
  return csrfCheck;
}
```

**Client-side:**
```typescript
// Get CSRF token
const response = await fetch('/api/csrf-token');
const { token } = await response.json();

// Include in requests
await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
  },
});
```

### 7. Audit Logging
**Purpose:** Track all important system events

**Event Types:**
- Authentication: login, logout, failed attempts
- User management: create, update, delete, role changes
- Inventory: create, update, delete, adjustments
- Orders: create, update, cancel, ship
- Security: unauthorized access, permission denied
- System: settings changes, exports, backups

**Usage:**
```typescript
import { logAuditEvent, AuditEventType } from '@/lib/security/audit-logging';

await logAuditEvent({
  eventType: AuditEventType.INVENTORY_CREATED,
  userId: user.id,
  userName: user.name,
  resource: 'inventory',
  resourceId: item.id,
  success: true,
});
```

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not in common passwords list

### Session Management
- 24-hour session expiry
- Secure, HTTP-only cookies
- SameSite=Lax for CSRF protection
- Session rotation on privilege escalation

### API Security
- Always use HTTPS in production
- Include authentication tokens in headers
- Validate all input data
- Use parameterized queries (Prisma)
- Implement request signing for sensitive operations

### File Upload Security
- Validate file types and sizes
- Scan uploads for malware
- Store files outside web root
- Generate random filenames
- Implement access controls

### Database Security
- Use Prisma ORM (prevents SQL injection)
- Implement row-level security
- Encrypt sensitive data at rest
- Regular backups
- Limit database user permissions

## Environment Variables

**Required:**
```env
DATABASE_URL=
NEXTAUTH_SECRET=
JWT_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Recommended:**
```env
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
SENTRY_DSN=
```

## Security Checklist

### Before Deployment
- [ ] Update all secrets and tokens
- [ ] Enable HTTPS/TLS
- [ ] Configure Redis for rate limiting
- [ ] Set up email service
- [ ] Enable audit logging
- [ ] Configure security headers
- [ ] Test CSRF protection
- [ ] Verify authentication flows
- [ ] Review permission matrix
- [ ] Set up monitoring and alerts

### Regular Maintenance
- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Security audit annually
- [ ] Penetration testing annually
- [ ] Backup verification monthly

## Incident Response

### If Security Breach Detected:
1. **Contain:** Disable affected accounts/features
2. **Investigate:** Review audit logs for attack vector
3. **Remediate:** Patch vulnerability
4. **Notify:** Inform affected users
5. **Monitor:** Watch for further attempts
6. **Document:** Record incident details

### Emergency Contacts:
- Security Team: security@yourcompany.com
- DevOps: devops@yourcompany.com
- Management: cto@yourcompany.com

## Additional Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- CIS Controls: https://www.cisecurity.org/controls/
- UK NCSC Guidance: https://www.ncsc.gov.uk/guidance

## Support

For security concerns or questions:
- Email: security@yourcompany.com
- Internal Wiki: https://wiki.yourcompany.com/security
- Slack: #security-team
