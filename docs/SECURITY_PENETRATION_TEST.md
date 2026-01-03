# 🔒 SECURITY PENETRATION TESTING PLAN
## LogiVox WMS - Comprehensive Security Assessment

### Overview

This document outlines the security penetration testing strategy for LogiVox WMS, covering OWASP Top 10 vulnerabilities, authentication/authorization testing, and production security hardening.

---

## 🎯 Testing Objectives

### Primary Goals

1. **Identify Security Vulnerabilities** - Discover exploitable weaknesses
2. **Validate Security Controls** - Ensure authentication/authorization work correctly
3. **Test Data Protection** - Verify sensitive data is encrypted
4. **Assess API Security** - Test GraphQL/REST API endpoints
5. **Check Compliance** - Validate SOC 2, GDPR, HIPAA requirements

### Scope

**In Scope:**
- Web application (Next.js frontend)
- API endpoints (GraphQL + REST)
- Authentication/Authorization (NextAuth.js)
- Database access (PostgreSQL)
- File uploads
- Third-party integrations (carriers, ERP)

**Out of Scope:**
- Physical security
- Social engineering
- DDoS attacks (handled by infrastructure)

---

## 🔍 OWASP Top 10 Testing

### 1. Broken Access Control (A01:2021)

**Tests:**

✅ **Horizontal Privilege Escalation**
```bash
# Test: User A accessing User B's resources
curl -H "Authorization: Bearer USER_A_TOKEN" \
  https://logivox.com/api/users/USER_B_ID/orders
# Expected: 403 Forbidden
```

✅ **Vertical Privilege Escalation**
```bash
# Test: Regular user accessing admin endpoints
curl -H "Authorization: Bearer USER_TOKEN" \
  https://logivox.com/api/admin/users
# Expected: 403 Forbidden
```

✅ **IDOR (Insecure Direct Object Reference)**
```bash
# Test: Guessing object IDs
curl -H "Authorization: Bearer TOKEN" \
  https://logivox.com/api/orders/1
curl -H "Authorization: Bearer TOKEN" \
  https://logivox.com/api/orders/2
# Expected: Only user's own orders visible
```

✅ **Path Traversal**
```bash
# Test: Directory traversal in file access
curl "https://logivox.com/api/files/../../etc/passwd"
# Expected: 400 Bad Request
```

**Checklist:**
- [ ] All API endpoints require authentication
- [ ] Role-based access control enforced
- [ ] Organization-level data isolation verified
- [ ] File upload paths validated
- [ ] Direct object references include authorization checks

### 2. Cryptographic Failures (A02:2021)

**Tests:**

✅ **SSL/TLS Configuration**
```bash
# Test: SSL Labs scan
curl https://www.ssllabs.com/ssltest/analyze.html?d=logivox.com

# Test: Weak ciphers
nmap --script ssl-enum-ciphers -p 443 logivox.com
```

✅ **Sensitive Data in Transit**
```bash
# Test: Capture traffic without HTTPS
curl http://logivox.com/api/login -d '{"email":"test@test.com","password":"pass"}'
# Expected: Redirect to HTTPS or blocked
```

✅ **Sensitive Data at Rest**
```sql
-- Test: Check if passwords are hashed
SELECT password FROM users LIMIT 1;
-- Expected: Bcrypt hash, not plaintext

-- Test: Check if API keys are encrypted
SELECT api_key FROM integrations LIMIT 1;
-- Expected: Encrypted value
```

**Checklist:**
- [ ] HTTPS enforced everywhere
- [ ] TLS 1.2+ only
- [ ] Strong cipher suites
- [ ] Passwords hashed with bcrypt (cost factor 10+)
- [ ] API keys encrypted at rest
- [ ] Database connections encrypted

### 3. Injection (A03:2021)

**Tests:**

✅ **SQL Injection**
```bash
# Test: SQL injection in search
curl "https://logivox.com/api/inventory?search='; DROP TABLE inventory; --"
# Expected: Sanitized, no SQL execution

# Test: Union-based injection
curl "https://logivox.com/api/products?id=1 UNION SELECT * FROM users"
# Expected: Blocked or sanitized
```

✅ **GraphQL Injection**
```graphql
# Test: Field injection
query {
  products(where: {sku: "' OR '1'='1"}) {
    id
  }
}
# Expected: No injection possible
```

✅ **NoSQL Injection**
```javascript
// Test: MongoDB injection (if using NoSQL)
{ "username": {"$gt": ""}, "password": {"$gt": ""} }
```

✅ **Command Injection**
```bash
# Test: Command injection in file processing
curl -F "file=@test.csv; cat /etc/passwd" \
  https://logivox.com/api/upload
# Expected: Blocked
```

**Checklist:**
- [ ] Parameterized queries (Prisma ORM)
- [ ] Input validation on all endpoints
- [ ] GraphQL query depth limiting
- [ ] Command execution avoided/sanitized
- [ ] File upload content validation

### 4. Insecure Design (A04:2021)

**Tests:**

✅ **Business Logic Flaws**
```bash
# Test: Negative quantity order
curl -X POST https://logivox.com/api/orders \
  -d '{"quantity": -100, "productId": "PROD-001"}'
# Expected: Validation error

# Test: Race condition in inventory
# Simultaneously place 2 orders for last item in stock
# Expected: One succeeds, one fails with "out of stock"
```

✅ **Missing Rate Limiting**
```bash
# Test: Brute force attempt
for i in {1..1000}; do
  curl https://logivox.com/api/login \
    -d '{"email":"admin@test.com","password":"pass'$i'"}'
done
# Expected: Rate limit triggered after ~10 attempts
```

**Checklist:**
- [ ] Rate limiting on authentication endpoints
- [ ] Transaction isolation for critical operations
- [ ] Proper error handling (no stack traces)
- [ ] Account lockout after failed attempts
- [ ] Business rule validation

### 5. Security Misconfiguration (A05:2021)

**Tests:**

✅ **Default Credentials**
```bash
# Test: Default admin account
curl -X POST https://logivox.com/api/login \
  -d '{"email":"admin@admin.com","password":"admin123"}'
# Expected: No default accounts exist
```

✅ **Directory Listing**
```bash
# Test: Directory browsing
curl https://logivox.com/uploads/
# Expected: 403 Forbidden

curl https://logivox.com/.git/
# Expected: Not accessible
```

✅ **Error Handling**
```bash
# Test: Verbose error messages
curl https://logivox.com/api/nonexistent
# Expected: Generic error, no stack trace
```

✅ **Security Headers**
```bash
# Test: Security headers present
curl -I https://logivox.com

# Expected headers:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Content-Security-Policy: default-src 'self'
# X-XSS-Protection: 1; mode=block
```

**Checklist:**
- [ ] No default credentials
- [ ] Directory listing disabled
- [ ] Error messages generic (no tech details)
- [ ] All security headers present
- [ ] Debug mode disabled in production
- [ ] Unnecessary endpoints removed

### 6. Vulnerable and Outdated Components (A06:2021)

**Tests:**

✅ **Dependency Audit**
```bash
# Test: npm audit
npm audit

# Test: OWASP Dependency Check
dependency-check --project "LogiVox" --scan ./package.json
```

✅ **Version Disclosure**
```bash
# Test: Server version disclosure
curl -I https://logivox.com
# Expected: No "X-Powered-By" header
```

**Checklist:**
- [ ] npm audit shows 0 critical vulnerabilities
- [ ] All dependencies up to date
- [ ] No known CVEs in dependencies
- [ ] Server version not disclosed
- [ ] Regular dependency updates scheduled

### 7. Identification and Authentication Failures (A07:2021)

**Tests:**

✅ **Weak Password Policy**
```bash
# Test: Create account with weak password
curl -X POST https://logivox.com/api/register \
  -d '{"email":"test@test.com","password":"123"}'
# Expected: Rejected (min 8 chars, complexity required)
```

✅ **Session Management**
```bash
# Test: Session expiration
# 1. Login and get token
# 2. Wait 24 hours
# 3. Use token
curl -H "Authorization: Bearer OLD_TOKEN" \
  https://logivox.com/api/profile
# Expected: 401 Unauthorized

# Test: Session fixation
# Expected: Session ID regenerated after login
```

✅ **Brute Force Protection**
```bash
# Test: Account lockout
for i in {1..20}; do
  curl https://logivox.com/api/login \
    -d '{"email":"victim@test.com","password":"wrong"}'
done
# Expected: Account locked after 5 attempts
```

✅ **Multi-Factor Authentication**
```bash
# Test: MFA bypass
curl -H "Authorization: Bearer TOKEN_WITHOUT_MFA" \
  https://logivox.com/api/sensitive-operation
# Expected: MFA required
```

**Checklist:**
- [ ] Password complexity enforced (8+ chars, special chars)
- [ ] Account lockout after 5 failed attempts
- [ ] Session timeout (24 hours)
- [ ] No session fixation vulnerability
- [ ] MFA available for sensitive operations
- [ ] Password reset requires email verification

### 8. Software and Data Integrity Failures (A08:2021)

**Tests:**

✅ **Unsigned Code**
```bash
# Test: Verify npm packages
npm audit signatures
```

✅ **Deserialization Attacks**
```bash
# Test: Malicious serialized object
curl -X POST https://logivox.com/api/import \
  -H "Content-Type: application/json" \
  -d '{"__proto__":{"isAdmin":true}}'
# Expected: Prototype pollution prevented
```

**Checklist:**
- [ ] All npm packages verified
- [ ] No eval() or Function() with user input
- [ ] JSON parsing without prototype pollution
- [ ] File uploads validated (type, size, content)
- [ ] CI/CD pipeline integrity checks

### 9. Security Logging and Monitoring Failures (A09:2021)

**Tests:**

✅ **Login Attempts Logged**
```bash
# Check logs for failed login attempts
grep "Failed login" /var/log/logivox/auth.log
```

✅ **Sensitive Operations Audited**
```sql
-- Check audit log
SELECT * FROM audit_log 
WHERE action = 'USER_DELETED' 
ORDER BY created_at DESC;
```

**Checklist:**
- [ ] All authentication attempts logged
- [ ] Failed authorization logged
- [ ] Sensitive operations audited
- [ ] Log retention policy (90 days)
- [ ] Alerts for suspicious activity
- [ ] Logs not containing sensitive data (passwords, tokens)

### 10. Server-Side Request Forgery (SSRF) (A10:2021)

**Tests:**

✅ **SSRF in URL Parameters**
```bash
# Test: Internal network access
curl "https://logivox.com/api/fetch?url=http://localhost:5432"
# Expected: Blocked

# Test: Cloud metadata access
curl "https://logivox.com/api/fetch?url=http://169.254.169.254/latest/meta-data/"
# Expected: Blocked
```

**Checklist:**
- [ ] URL validation with whitelist
- [ ] No access to internal IPs (127.0.0.1, 10.0.0.0/8)
- [ ] Cloud metadata endpoint blocked
- [ ] DNS rebinding protection

---

## 🔐 Authentication & Authorization Testing

### JWT Token Security

**Tests:**

✅ **Token Signature Verification**
```javascript
// Test: Modify JWT payload without re-signing
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const [header, payload, signature] = token.split('.');
const modifiedPayload = btoa(JSON.stringify({
  ...JSON.parse(atob(payload)),
  role: 'ADMIN'
}));
const maliciousToken = `${header}.${modifiedPayload}.${signature}`;

// Use malicious token
fetch('/api/admin', {
  headers: { Authorization: `Bearer ${maliciousToken}` }
});
// Expected: 401 Unauthorized
```

✅ **Token Expiration**
```bash
# Use expired token
curl -H "Authorization: Bearer EXPIRED_TOKEN" \
  https://logivox.com/api/profile
# Expected: 401 Unauthorized
```

✅ **Algorithm Confusion**
```javascript
// Test: Change alg to "none"
const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
const payload = btoa(JSON.stringify({ userId: "ADMIN-001", role: "ADMIN" }));
const noneToken = `${header}.${payload}.`;

// Expected: Rejected
```

### Role-Based Access Control (RBAC)

**Test Matrix:**

| Endpoint | VIEWER | OPERATOR | MANAGER | ADMIN |
|----------|--------|----------|---------|-------|
| GET /api/inventory | ✅ | ✅ | ✅ | ✅ |
| POST /api/inventory | ❌ | ✅ | ✅ | ✅ |
| DELETE /api/inventory | ❌ | ❌ | ✅ | ✅ |
| GET /api/users | ❌ | ❌ | ✅ | ✅ |
| DELETE /api/users | ❌ | ❌ | ❌ | ✅ |

**Automated Test:**

```typescript
// rbac.test.ts
describe('RBAC Tests', () => {
  it('VIEWER cannot create inventory', async () => {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { Authorization: `Bearer ${VIEWER_TOKEN}` },
      body: JSON.stringify({ sku: 'TEST', quantity: 10 })
    });
    expect(response.status).toBe(403);
  });

  it('ADMIN can delete users', async () => {
    const response = await fetch('/api/users/USER-123', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    expect(response.status).toBe(200);
  });
});
```

---

## 🛠️ Security Testing Tools

### 1. OWASP ZAP (Zed Attack Proxy)

**Installation:**
```bash
# macOS
brew install --cask owasp-zap

# Linux
wget https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2_14_0_unix.sh
chmod +x ZAP_2_14_0_unix.sh
./ZAP_2_14_0_unix.sh
```

**Automated Scan:**
```bash
# Docker scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://logivox.com \
  -r zap_report.html
```

**Manual Testing Steps:**
1. Configure browser proxy to ZAP (localhost:8080)
2. Navigate through application
3. Spider the application
4. Active scan
5. Review alerts

### 2. Burp Suite

**Setup:**
```bash
# Download from https://portswigger.net/burp
# Community edition is free
```

**Key Features:**
- Intercept and modify requests
- Repeater for replaying requests
- Intruder for brute force
- Scanner for vulnerability detection

### 3. Nikto

**Web Server Scanner:**
```bash
# Install
brew install nikto

# Scan
nikto -h https://logivox.com -ssl -Format html -output nikto_report.html
```

### 4. SQLMap

**SQL Injection Testing:**
```bash
# Install
pip install sqlmap

# Test endpoint
sqlmap -u "https://logivox.com/api/products?id=1" \
  --cookie="session=YOUR_SESSION_COOKIE" \
  --level=5 --risk=3
```

### 5. Nmap

**Network Scanning:**
```bash
# Port scan
nmap -sV -sC logivox.com

# SSL/TLS scan
nmap --script ssl-enum-ciphers -p 443 logivox.com
```

### 6. WPScan (if using WordPress admin)

```bash
wpscan --url https://logivox.com/blog --enumerate u,t,p
```

---

## 📊 Vulnerability Severity Classification

### CVSS v3.1 Scoring

| Severity | Score | Examples |
|----------|-------|----------|
| **Critical** | 9.0-10.0 | SQL injection with data exfiltration, RCE |
| **High** | 7.0-8.9 | Privilege escalation, auth bypass |
| **Medium** | 4.0-6.9 | XSS, CSRF, information disclosure |
| **Low** | 0.1-3.9 | Missing security headers, verbose errors |

### Response Time SLA

| Severity | Response Time | Remediation Time |
|----------|---------------|------------------|
| **Critical** | 1 hour | 24 hours |
| **High** | 4 hours | 7 days |
| **Medium** | 1 day | 30 days |
| **Low** | 1 week | 90 days |

---

## ✅ Pre-Production Checklist

### Security Hardening

- [ ] **Environment Variables**
  - [ ] All secrets in environment variables (not code)
  - [ ] .env files in .gitignore
  - [ ] Production secrets rotated

- [ ] **Database**
  - [ ] Least privilege database user
  - [ ] Database backups encrypted
  - [ ] Connection strings encrypted
  - [ ] SSL/TLS for database connections

- [ ] **API Security**
  - [ ] Rate limiting enabled
  - [ ] CORS properly configured
  - [ ] API keys rotated
  - [ ] GraphQL depth limiting
  - [ ] Query complexity limits

- [ ] **Authentication**
  - [ ] Password complexity enforced
  - [ ] Account lockout enabled
  - [ ] Session timeout configured
  - [ ] MFA available
  - [ ] OAuth scopes validated

- [ ] **Data Protection**
  - [ ] PII encrypted at rest
  - [ ] All traffic over HTTPS
  - [ ] Backup encryption enabled
  - [ ] Data retention policy implemented

- [ ] **Monitoring**
  - [ ] Failed login alerts
  - [ ] Suspicious activity alerts
  - [ ] Audit logging enabled
  - [ ] Log aggregation configured

- [ ] **Compliance**
  - [ ] SOC 2 controls validated
  - [ ] GDPR data rights implemented
  - [ ] HIPAA safeguards (if healthcare)
  - [ ] PCI DSS (if payments)

---

## 📝 Penetration Test Report Template

```markdown
# Penetration Test Report

**Client:** LogiVox Inc.
**Tester:** [Your Name]
**Date:** [Test Date]
**Scope:** Web application, API, database

## Executive Summary

Brief overview of findings, risk level, and recommendations.

## Methodology

- OWASP Top 10 testing
- Manual penetration testing
- Automated scanning (OWASP ZAP)
- Social engineering (if authorized)

## Findings

### Critical Severity

#### 1. SQL Injection in /api/search

**Risk:** Critical (CVSS 9.8)

**Description:**
The search endpoint is vulnerable to SQL injection...

**Steps to Reproduce:**
1. Navigate to /api/search
2. Enter payload: `'; DROP TABLE users; --`
3. Observe error message revealing database structure

**Impact:**
- Complete database compromise
- Data exfiltration
- Data destruction

**Remediation:**
Use parameterized queries (Prisma ORM):
```typescript
// VULNERABLE
const results = await prisma.$queryRaw`
  SELECT * FROM products WHERE name = '${searchTerm}'
`;

// FIXED
const results = await prisma.product.findMany({
  where: { name: { contains: searchTerm } }
});
```

**Status:** Open / In Progress / Resolved

---

### High Severity

#### 2. Broken Access Control

[Details...]

---

### Medium Severity

[...]

---

## Conclusion

Overall security posture: Good / Fair / Poor

Priority actions:
1. Fix SQL injection immediately
2. Implement rate limiting
3. Add security headers

## Appendices

- Appendix A: Detailed test cases
- Appendix B: Tool outputs
- Appendix C: Network diagrams
```

---

## 🚀 Continuous Security Testing

### CI/CD Integration

**GitHub Actions Workflow:**

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'LogiVox'
          path: '.'
          format: 'HTML'
      
      - name: Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
```

### Regular Scans

- **Daily:** npm audit
- **Weekly:** OWASP ZAP automated scan
- **Monthly:** Full penetration test
- **Quarterly:** Third-party security audit

---

**Last Updated:** January 3, 2026  
**Next Audit:** April 1, 2026  
**Status:** Production Ready
