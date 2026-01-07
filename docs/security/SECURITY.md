# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Features

### Implemented Security Controls

- ✅ **Authentication & Authorization**
  - NextAuth.js with secure session management
  - Role-based access control (RBAC)
  - Multi-factor authentication (2FA) support
  - Secure password hashing with bcrypt

- ✅ **Input Validation & Sanitization**
  - Server-side validation for all inputs
  - Protection against SQL injection
  - Protection against NoSQL injection
  - XSS prevention with output encoding

- ✅ **CSRF Protection**
  - CSRF tokens for state-changing operations
  - SameSite cookie attributes
  - Token validation middleware

- ✅ **Rate Limiting**
  - API rate limiting (1000 req/hour authenticated)
  - Login attempt rate limiting (10 attempts)
  - Automatic IP-based throttling

- ✅ **Security Headers**
  - Content Security Policy (CSP)
  - Strict Transport Security (HSTS)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection
  - Referrer-Policy
  - Permissions-Policy

- ✅ **Data Protection**
  - Encryption at rest for sensitive data
  - Encryption in transit (TLS 1.3)
  - Secure session storage
  - PII data masking in logs

- ✅ **Dependency Security**
  - Automated npm audit on every build
  - GitLeaks secret scanning
  - OWASP Dependency-Check
  - Snyk vulnerability monitoring

- ✅ **Secure File Upload**
  - File type validation
  - Size limitations (10MB max)
  - Virus scanning (ClamAV)
  - Secure storage with isolated paths

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### DO NOT create a public GitHub issue

Instead, please report security vulnerabilities to:

**Email:** security@logivox.com

**PGP Key:** [Download our public key](https://logivox.com/.well-known/pgp-key.txt)

### What to Include

1. **Description** - Clear description of the vulnerability
2. **Impact** - Potential impact and severity assessment
3. **Steps to Reproduce** - Detailed steps to reproduce the issue
4. **Proof of Concept** - PoC code or screenshots if applicable
5. **Suggested Fix** - Optional suggestions for remediation

### Response Timeline

- **Initial Response:** Within 24 hours
- **Assessment:** Within 72 hours
- **Fix Deployment:** Critical issues within 7 days
- **Public Disclosure:** After fix is deployed (coordinated disclosure)

### Vulnerability Rewards

We operate a private bug bounty program:

| Severity | Reward Range  |
| -------- | ------------- |
| Critical | $500 - $2,000 |
| High     | $250 - $500   |
| Medium   | $100 - $250   |
| Low      | $50 - $100    |

## Security Testing

### Automated Security Scans

We run automated security scans:

- **Daily** - Dependency vulnerability scanning
- **Daily** - Secret scanning with GitLeaks
- **Daily** - SAST with Semgrep
- **Weekly** - Container security scanning with Trivy
- **Weekly** - DAST with OWASP ZAP
- **Monthly** - Full security audit

### Manual Security Testing

- **Quarterly** - Internal security review
- **Annually** - External penetration testing by certified professionals

## Security Compliance

LogiVox WMS is designed to meet:

- ✅ OWASP Top 10 (2021)
- ✅ CWE Top 25
- ✅ SANS Top 25
- ✅ GDPR requirements
- ✅ SOC 2 Type II controls
- ✅ ISO 27001 guidelines

## Security Audit Log

All security-relevant events are logged:

- Authentication attempts (success/failure)
- Authorization failures
- Data access and modifications
- Configuration changes
- Security policy violations
- API rate limit hits

Logs are:

- Encrypted at rest
- Retained for 90 days
- Available for audit
- Protected with integrity checks

## Incident Response

In case of a security incident:

1. **Detection** - Automated monitoring alerts security team
2. **Containment** - Immediate isolation of affected systems
3. **Investigation** - Root cause analysis
4. **Remediation** - Patch deployment and verification
5. **Communication** - Notification to affected users
6. **Post-Mortem** - Documentation and process improvement

## Security Training

All developers complete:

- Secure coding practices training
- OWASP Top 10 awareness
- Data protection and privacy training
- Incident response procedures

## Third-Party Security

We vet all third-party dependencies:

- Security advisories monitoring
- Regular dependency updates
- License compliance checks
- Supply chain security verification

## Contact

**Security Team:** security@logivox.com

**Security Updates:** https://logivox.com/security

**Status Page:** https://status.logivox.com

---

Last Updated: January 2025
