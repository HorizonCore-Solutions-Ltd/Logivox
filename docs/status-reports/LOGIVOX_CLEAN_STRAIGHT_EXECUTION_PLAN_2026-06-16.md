# LOGIVOX: Clean, Straight, Unconfused Execution Plan

Date: 2026-06-16
Repository: HorizonCore-Solutions-Ltd/Logivox
Branch: main

## 0. Core Principles
1. We do NOT remove CAPA.
2. We do NOT rename the product.
3. We do NOT introduce new domains.
4. We do NOT rebuild from scratch.
5. We DO clean, harden, and straighten LogiVox exactly as it is.
6. We DO make LogiVox internally consistent, stable, and enterprise-ready.

This is a stabilization and clarity plan, not a reinvention.

---

## 1. Phase 1 - API Contract and Reliability Stabilization (1-2 weeks)

### 1.1 Voice API Contract Alignment
1. Add `/api/voice/transcribe` compatibility endpoint.
2. Add `/api/voice/command` compatibility endpoint.
3. Keep `/api/voice` as canonical implementation.
4. Update mobile client contract usage to canonical schema.
5. Add contract tests to prevent future drift.

Outcome:
1. Mobile and web voice flows are stable and predictable.

### 1.2 Duplicate Route and Import Cleanup
1. Remove repeated imports and duplicated declarations in gate entry routes.
2. Remove repeated imports and duplicated declarations in picking task routes.
3. Refactor repeated logic into local helpers where needed.

Outcome:
1. Less hidden bug surface and better maintainability.

### 1.3 Webhook Model Consistency
1. Choose one canonical model naming path (`webhook` or `integrationWebhook`).
2. Refactor all webhook routes and services to the same model contract.
3. Add tests for delivery success, failure, retry, and DLQ replay behavior.

Outcome:
1. No runtime confusion from naming mismatch.

### 1.4 Contract Tests for Critical Flows
1. Voice contract tests.
2. Mobile offline sync contract tests.
3. Webhook contract tests.
4. Replenishment trigger contract tests.

Outcome:
1. Contract drift becomes detectable and preventable in CI.

### Phase 1 Exit Criteria
1. Voice compatibility endpoints operational and tested.
2. Duplicate route/import issues removed in targeted files.
3. Webhook model usage unified.
4. Contract test suite runs in CI and is required for merge.

---

## 2. Phase 2 - Tenant and Security Hardening (1-2 weeks)

### 2.1 Universal Tenant Guards
Every route must enforce:
1. `organizationId` scoping.
2. `userId` identity.
3. Role permission checks.

### 2.2 Authorization Matrix
Define and implement domain permissions for:
1. WMS.
2. Voice.
3. CAPA.
4. Yard.
5. Workforce.
6. Replenishment.
7. Integrations.

### 2.3 Audit Logging
Ensure logs are emitted for:
1. Stock changes.
2. Task creation/critical state transitions.
3. CAPA updates.
4. Gate entries.
5. Webhook failures/retries.

Outcome:
1. LogiVox becomes safe, compliant, and multi-tenant correct.

### Phase 2 Exit Criteria
1. Tenant/auth guard checklist passes on all route groups.
2. Authorization matrix implemented and test-covered.
3. Audit events present for all high-risk operations.

---

## 3. Phase 3 - Domain Maturity Alignment (2-4 weeks)

### 3.1 Replace Placeholder and Mock Endpoints
1. Identify all `mock`, `default`, and `placeholder` code paths in production APIs.
2. Replace with real service-backed logic.

### 3.2 Standardize Domain Service Pattern
Every domain service follows:
1. Validation.
2. Auth and tenant checks.
3. Idempotency when required.
4. Event publishing when required.
5. Consistent error envelopes.

### 3.3 Promote Shared Orchestration Primitives
Promote to `/lib` shared usage:
1. Validation.
2. Auth guards.
3. Event publishing.
4. Error handling.
5. Tenant scoping helpers.

Outcome:
1. Consistent behavior across all existing LogiVox domains.

### Phase 3 Exit Criteria
1. No placeholder logic in production execution paths.
2. Standardized request pipeline adopted in all target domains.
3. Shared primitives adopted and duplicated glue code reduced.

---

## 4. Phase 4 - Maintainability and Operability (ongoing)

### 4.1 ADRs (Architecture Decision Records)
Create ADRs for:
1. Voice.
2. CAPA.
3. Replenishment.
4. Events.
5. Tenant model.
6. Cognitive engine.

### 4.2 Documentation Drift Controls
CI rule:
1. If a domain changes, relevant docs must be updated in the same PR.

### 4.3 Module Ownership
Assign owners for:
1. WMS.
2. Voice.
3. CAPA.
4. Yard.
5. Workforce.
6. Replenishment.
7. Integrations.

### 4.4 Expanded Test Gates
Add or enforce:
1. Load tests.
2. Security tests.
3. Integration tests.
4. E2E critical flows.

Outcome:
1. LogiVox stays stable and understandable over time.

### Phase 4 Operating Criteria
1. ADRs are versioned and reviewed.
2. Docs gate blocks stale domain changes.
3. Every module has a responsible owner.
4. Release pipeline includes expanded quality gates.

---

## 5. Phase 5 - Internal Re-Centering (No Renaming, No New Domains)

### 5.1 Declare Internal Core (within LogiVox)
Core execution center:
1. Inventory.
2. Tasks.
3. Waves.
4. Replenishment.
5. Orders and Shipments.
6. Voice engine.
7. Cognitive engine.

This is internal product clarity, not a rename.

### 5.2 Keep Existing Modules as Modules
1. CAPA.
2. Workforce.
3. Yard/Dock/Gate.
4. Integrations.
5. Reporting.
6. Sustainability.

Outcome:
1. LogiVox becomes easier to reason about and easier to operate.

### Phase 5 Exit Criteria
1. Internal module boundary map documented.
2. Core-vs-module ownership and dependencies published.
3. Backlog and release views grouped by this structure.

---

## 6. Optional Enhancements (Only by Explicit Choice)
Not part of mandatory cleanup:
1. Transport optimization.
2. Slotting optimization expansion.
3. Advanced OMS enhancements.
4. AI-driven forecasting extensions.

---

## Missing Pieces Added (Execution Essentials)
The following were added to make this plan executable by engineering leadership without changing your scope:
1. Explicit phase exit criteria.
2. CI gate requirements per phase.
3. Ownership and governance requirements.
4. Standardized quality gates for release.
5. Core-vs-module internal boundary completion criteria.

---

## Delivery Sequence (When)
1. Week 1-2: Phase 1.
2. Week 3-4: Phase 2.
3. Week 5-8: Phase 3.
4. Week 9 onward: Phase 4 ongoing.
5. Parallel in Week 6-9: Phase 5 internal recentering artifacts.

---

## Program KPIs
1. Contract drift incidents: target 0 after Phase 1.
2. High-risk route audit coverage: target 100% after Phase 2.
3. Placeholder production path count: target 0 after Phase 3.
4. ADR coverage for strategic domains: target 100% after early Phase 4.
5. Docs-gated domain PR compliance: target 100% after Phase 4 CI activation.

---

## Condensed Tracker Version

### Phase 1 - Stabilize
1. Voice API alignment.
2. Webhook model consistency.
3. Duplicate route cleanup.
4. Contract tests.

### Phase 2 - Secure
1. Tenant guards.
2. Auth matrix.
3. Audit logs.

### Phase 3 - Mature
1. Replace mocks.
2. Standardize services.
3. Promote shared primitives.

### Phase 4 - Maintain
1. ADRs.
2. Docs gates.
3. Module ownership.
4. Test gates.

### Phase 5 - Clarify
1. Declare LogiVox core.
2. Keep existing modules.
3. No renaming.
4. No new domains.

---

## Final Decision
1. CAPA stays.
2. Product name stays LogiVox.
3. Domains stay as-is.
4. Focus is hardening, consistency, and execution discipline.
