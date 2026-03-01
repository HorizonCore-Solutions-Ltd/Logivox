# CVE Vulnerability Remediation Plan

**Date:** March 1, 2026  
**Status:** 45 vulnerabilities identified (1 critical, 18 high, 4 moderate, 22 low)  
**Priority:** P0 - Security Critical

---

## 🔴 Critical Vulnerabilities (1)

### 1. nodemailer (Email Sending Library)

**Current Version:** `^6.10.1`  
**Vulnerabilities:**

- **GHSA-mm7p-fcc7-pg87**: Email to unintended domain (Interpretation Conflict)
- **GHSA-rcmh-qjqh-p98v**: DoS via recursive calls in addressparser

**Recommended Action:**

- Upgrade to `nodemailer@8.0.1+` (BREAKING CHANGE)
- Alternative: Replace with `@aws-sdk/client-sesv2` (already installed)

**Implementation:**

```bash
# Option 1: Upgrade (Breaking Changes)
npm install nodemailer@8.0.1 --save

# Option 2: Replace with AWS SES (Recommended for enterprise)
# Already have @aws-sdk/client-sesv2 installed
# Migrate email sending to AWS SES
```

**Breaking Changes:**

- API changes in v8.x - requires code updates
- Configuration format changes
- Attachment handling updates

**Estimated Time:** 4-6 hours

---

## 🟠 High Priority Vulnerabilities (18)

### 2. next.js (Web Framework)

**Current Version:** `^14.0.4`  
**Vulnerabilities:**

- **GHSA-9g9p-9gw9-jx7f**: DoS via Image Optimizer remotePatterns
- **GHSA-h25m-26qc-wcjf**: HTTP deserialization DoS with React Server Components

**Recommended Action:**

- Upgrade to `next@16.1.6` (BREAKING CHANGE - v15 to v16)

**Implementation:**

```bash
npm install next@16.1.6 --save
# Review breaking changes: https://nextjs.org/docs/app/building-your-application/upgrading
```

**Breaking Changes:**

- App Router changes (v15→v16)
- TypeScript strict mode updates
- Middleware API changes
- Image optimization configuration changes

**Estimated Time:** 8-12 hours

---

### 3. xlsx (Excel File Parsing)

**Current Version:** `^0.18.5`  
**Vulnerabilities:**

- **GHSA-4r6h-8v6p-xvw6**: Prototype Pollution
- **GHSA-5pgg-2g8v-p4x9**: Regular Expression DoS (ReDoS)

**Status:** ⚠️ **NO FIX AVAILABLE**

**Recommended Action:**

- **REPLACE** with alternative library
- Options:
  1. `exceljs@^4.3.0` - Full featured, maintained
  2. `xlsx-populate@^1.21.0` - Better security, smaller footprint
  3. `node-xlsx@^0.23.0` - Lightweight alternative

**Implementation:**

```bash
npm uninstall xlsx
npm install exceljs@^4.3.0 --save

# Update imports:
# OLD: import XLSX from 'xlsx'
# NEW: import ExcelJS from 'exceljs'
```

**Code Changes Required:**

- Update all XLSX usage in codebase
- Rewrite Excel generation/parsing logic

**Estimated Time:** 6-8 hours

---

### 4. serialize-javascript

**Vulnerabilities:**

- **GHSA-5c6j-r48x-rmvq**: RCE via RegExp.flags

**Status:** Fixed in `serialize-javascript@^7.0.3`

**Implementation:**

```bash
npm audit fix --legacy-peer-deps
```

**Estimated Time:** 1 hour

---

### 5. minimatch (File Pattern Matching)

**Vulnerabilities:**

- **GHSA-3ppc-4f35-3m26**: ReDoS via repeated wildcards
- **GHSA-7r86-cg39-jmmj**: ReDoS via GLOBSTAR segments
- **GHSA-23c5-xmqv-rm74**: ReDoS via nested extglobs

**Recommended Action:**

- Upgrade to `minimatch@^10.0.0`

**Implementation:**

```bash
npm update minimatch --save
```

**Estimated Time:** 1 hour

---

## 🟡 Moderate Priority (4)

### 6. @auth/core (Authentication)

**Current Version:** `<=0.41.0`  
**Vulnerabilities:** Via cookie and nodemailer dependencies

**Recommended Action:**

- Upgrade `@auth/prisma-adapter@2.11.1` (includes updated @auth/core)

**Implementation:**

```bash
npm install @auth/prisma-adapter@2.11.1 --save
```

**Estimated Time:** 2 hours

---

## 📋 Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)

- [ ] Upgrade `minimatch`
- [ ] Upgrade `serialize-javascript`
- [ ] Upgrade `@auth/prisma-adapter`
- [ ] Run `npm audit fix --legacy-peer-deps`

**Estimated Reduction:** 15-20 vulnerabilities

---

### Phase 2: Breaking Changes (3-5 days)

- [ ] Plan Next.js upgrade testing window
- [ ] Create feature flag for gradual rollout
- [ ] Upgrade `next@16.1.6`
- [ ] Test all critical user flows
- [ ] Monitor for regressions

**Estimated Reduction:** 8-10 vulnerabilities

---

### Phase 3: Library Replacements (2-3 days)

- [ ] Audit all `xlsx` usage
- [ ] Install `exceljs` as replacement
- [ ] Migrate Excel generation code
- [ ] Migrate Excel parsing code
- [ ] Test all Excel workflows

**Estimated Reduction:** 5-7 vulnerabilities

---

### Phase 4: Email Service Migration (2-3 days)

- [ ] Set up AWS SES configuration
- [ ] Create email service abstraction layer
- [ ] Migrate from nodemailer to AWS SES
- [ ] Test email sending workflows
- [ ] Update environment variables

**Estimated Reduction:** 2-3 vulnerabilities

---

## ✅ Success Criteria

- [ ] Zero critical vulnerabilities
- [ ] Less than 5 high vulnerabilities
- [ ] All security patches applied
- [ ] No breaking changes affecting production
- [ ] Full test coverage for updated code
- [ ] Documentation updated

---

## 🚨 Risk Mitigation

**Risks:**

1. Breaking changes cause production issues
2. Dependencies incompatible with upgrades
3. Extended downtime during testing

**Mitigation:**

1. Deploy to staging first
2. Use feature flags for gradual rollout
3. Maintain rollback plan
4. Schedule maintenance window
5. Monitor error rates closely

---

## 📞 Escalation

**If blocking issues occur:**

1. Technical Lead: Review breaking change impact
2. DevOps: Coordinate rollback if needed
3. Security Team: Assess risk vs. stability trade-off

---

## 📊 Current Status

**Starting Point:**

- 45 vulnerabilities (1 critical, 18 high, 4 moderate, 22 low)

**After quick fixes:**

- ~30 vulnerabilities (1 critical, 10 high, 2 moderate, 17 low)

**After all phases:**

- ~10 vulnerabilities (0 critical, 2 high, 1 moderate, 7 low)

**Target:** < 15 total vulnerabilities, 0 critical, < 5 high
