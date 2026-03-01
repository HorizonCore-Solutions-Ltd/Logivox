# Code Review Checklist - LogiVox Governance

**Use this checklist for every PR review.**

---

## Pre-Review

- [ ] PR title clearly describes what's being changed
- [ ] PR description references a feature/issue
- [ ] PR has unit tests
- [ ] PR passes CI pipeline (no build errors, no lint errors)

---

## Database & ORM (DB & ORM)

- [ ] Schema changes are backward compatible
- [ ] Migrations are created for schema changes
- [ ] ORM models match schema exactly
- [ ] No unused fields in ORM
- [ ] No missing fields in ORM
- [ ] Foreign keys and relationships are correct
- [ ] Indexes are added where needed (high-query tables)
- [ ] Multi-tenant scoping is enforced in schema (organizationId)

---

## Backend API (Backend APIs)

- [ ] All CRUD operations are implemented (create, read, update, delete)
- [ ] All domain-specific actions are implemented
- [ ] Input validation is enforced (Zod schemas, DTOs)
- [ ] Authentication is required on protected endpoints
- [ ] Authorization is enforced (role-based access control)
- [ ] Multi-tenant isolation is verified (users only see their org data)
- [ ] Error responses are typed and meaningful (not generic 500)
- [ ] Logging has context (userId, organizationId, error code)
- [ ] Rate limiting is applied where needed
- [ ] Pagination/filtering is implemented for list endpoints
- [ ] No fake endpoints or mock data
- [ ] No TODO/FIXME comments in shipped code

---

## Frontend UI (Frontend UI)

- [ ] All required screens/pages are implemented
- [ ] Every button, link, and control has an onClick/handler
- [ ] API calls are made to REAL endpoints (not fake)
- [ ] API calls are typed (TypeScript interfaces)
- [ ] Loading states are shown during async operations
- [ ] Error states are shown with user-facing messages
- [ ] Success states are shown (toast, modal, redirect)
- [ ] Empty states are handled (no data → show message, not blank page)
- [ ] Form validation is implemented (client-side at minimum)
- [ ] Forms submit to real endpoints and handle responses
- [ ] No dead code or unreachable branches
- [ ] No TODO/FIXME comments in shipped code
- [ ] Dark mode works (if applicable)
- [ ] Responsive design works on mobile/tablet/desktop

---

## Authorization & Roles (AuthZ & Roles)

- [ ] Access control is enforced per role
- [ ] Multi-tenant isolation is enforced
  - [ ] User can only see their organization's data
  - [ ] User cannot access other organizations' data even with URL manipulation
- [ ] Unauthorized access is logged and rejected
- [ ] Role-based features are hidden from unauthorized users
- [ ] Admin-only features are admin-only

---

## Errors & Logging (Errors & Logging)

- [ ] All error paths have try-catch or error boundaries
- [ ] Errors are logged with context (at minimum: userId, organizationId, errorCode)
- [ ] User-facing error messages are clear and actionable
- [ ] System errors are distinguishable from user errors
  - Example: "You don't have enough stock" (user error) vs "Database connection failed" (system error)
- [ ] Sensitive data is never logged (passwords, API keys, SSNs)
- [ ] Error tracking/monitoring is configured (e.g., Sentry)
- [ ] Logs are centralized (not scattered console.logs)

---

## Testing (Tests)

- [ ] At least the happy path is tested
- [ ] At least one error case is tested
- [ ] Tests use realistic data (not mocks)
- [ ] Tests are not flaky (don't fail randomly)
- [ ] Test coverage is reasonable for critical paths
- [ ] Tests pass locally and in CI

---

## Type Safety (Types)

- [ ] No `any` types (except in escape cases, well-documented)
- [ ] API response types match backend schema
- [ ] Form data types match backend validation schema
- [ ] Component props are fully typed
- [ ] Hook returns are fully typed
- [ ] No type mismatches between layers

---

## General Quality

- [ ] No duplicate logic (shared logic extracted to modules/services/hooks)
- [ ] Code is readable and follows naming conventions
- [ ] Functions are single-responsibility (not too long)
- [ ] No console.log statements left (use structured logging)
- [ ] No commented-out code blocks
- [ ] No dead imports

---

## End-to-End Behavior

- [ ] Can complete the full workflow in the running app? **[MANUALLY TEST THIS]**
- [ ] Data flows correctly from UI → API → Database → API → UI?
- [ ] No "coming soon", "placeholder", or non-functional UI elements?
- [ ] All error cases handled gracefully?

---

## Red Flags 🚩

**Reject the PR if ANY of these are true:**

- [ ] 🚩 PR introduces TODO/FIXME/FIXME later comments in shipped code
- [ ] 🚩 PR adds fake endpoints or mock data in application code
- [ ] 🚩 PR has dead buttons or non-functional UI
- [ ] 🚩 PR references non-existent functions/components
- [ ] 🚩 PR adds unvalidated user input (SQL injection, XSS risk)
- [ ] 🚩 PR bypasses authorization checks
- [ ] 🚩 PR logs sensitive data (passwords, tokens, SSNs)
- [ ] 🚩 PR uses `any` type without justification
- [ ] 🚩 PR has silent error failures (catch block with no action)
- [ ] 🚩 PR has critical test failures
- [ ] 🚩 PR breaks existing tests

**If you see a red flag, request changes. Do not approve.**

---

## Approval Checklist

Before you approve, confirm:

- [ ] ✅ All items above are correct
- [ ] ✅ No red flags detected
- [ ] ✅ Feature works end-to-end in running app (manual test)
- [ ] ✅ Code is production-grade (not a shortcut or workaround)
- [ ] ✅ I would ship this to customers with confidence

---

## Review Comment Template

If you request changes, use this template:

```
Category: [Database | Backend | Frontend | Authorization | Errors | Tests]

Issue: [What's wrong]

Example: [Example code showing the problem]

Fix: [How to fix it]

Reference: [Link to governance doc section]
```

---

## Sign-Off

**Reviewer Name**: ********\_********  
**Date**: ********\_********  
**PR Number**: ********\_********  
**Status**: ☐ Approved ☐ Requested Changes

---

**Remember**: A good code review is not about being critical. It's about shipping production-grade software.

References:

- [Full Governance](./DEVELOPMENT_GOVERNANCE.md)
- [Quick Reference](./DEVELOPER_QUICK_REFERENCE.md)
- [Completion Tracker](./TURNKEY_COMPLETION_TRACKER.md)
