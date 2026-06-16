# LogiVox Phase Checklist Board

Date Baseline: 2026-06-16
Plan Source: LOGIVOX_CLEAN_STRAIGHT_EXECUTION_PLAN_2026-06-16
Owner: Engineering Leadership

## Program Status

- Overall Status: Not Started
- Current Phase: Phase 1
- Target Sequence: P1 -> P2 -> P3 -> P4 (ongoing) + P5 parallel after P3 starts

## Phase 1 - API Contract and Reliability Stabilization

Status: Not Started
Target Window: Week 1-2

Checklist:

- [ ] Add voice compatibility endpoint /api/voice/transcribe
- [ ] Add voice compatibility endpoint /api/voice/command
- [ ] Preserve /api/voice as canonical implementation path
- [ ] Align mobile voice client to canonical response contract
- [ ] Add voice API contract tests
- [ ] Remove duplicate import/declaration blocks in gate-entry routes
- [ ] Remove duplicate import/declaration blocks in picking-task routes
- [ ] Select canonical webhook model name and usage
- [ ] Refactor webhook route/service model usage to one pattern
- [ ] Add webhook delivery success/failure/retry tests
- [ ] Add DLQ replay tests for webhook/event pipeline
- [ ] Add mobile sync contract tests
- [ ] Add replenishment trigger contract tests

Exit Criteria:

- [ ] Voice web and mobile contracts passing in CI
- [ ] Duplicate route blocks removed from targeted files
- [ ] Webhook model usage unified and tested
- [ ] Contract test suite mandatory in CI

## Phase 2 - Tenant and Security Hardening

Status: Not Started
Target Window: Week 3-4

Checklist:

- [ ] Route inventory created for all API domains
- [ ] organizationId guard enforced for all list/mutate routes
- [ ] user identity enforcement verified for all protected routes
- [ ] Role-based authorization checks standardized per domain
- [ ] Domain authorization matrix authored and approved
- [ ] Tests added for authorization matrix by domain
- [ ] Audit logs guaranteed for stock changes
- [ ] Audit logs guaranteed for task creation/state transitions
- [ ] Audit logs guaranteed for CAPA updates
- [ ] Audit logs guaranteed for gate entries
- [ ] Audit logs guaranteed for webhook failure/retry events

Exit Criteria:

- [ ] Tenant guard checklist complete
- [ ] Authorization matrix implemented and test-covered
- [ ] High-risk audit event coverage complete

## Phase 3 - Domain Maturity Alignment

Status: Not Started
Target Window: Week 5-8

Checklist:

- [ ] Identify all placeholder/default/mock production paths
- [ ] Replace placeholders with real service-backed logic
- [ ] Standardize request pipeline: validation -> auth -> idempotency -> events -> error envelope
- [ ] Promote shared validation primitives
- [ ] Promote shared auth guard primitives
- [ ] Promote shared event publishing primitives
- [ ] Promote shared tenant scoping helpers
- [ ] Promote shared error envelope/serialization logic

Exit Criteria:

- [ ] Placeholder production path count = 0
- [ ] Standardized request pipeline active in target domains
- [ ] Shared primitives adopted, duplication reduced

## Phase 4 - Maintainability and Operability

Status: Not Started
Target Window: Ongoing from Week 9

Checklist:

- [ ] ADR template published and adopted
- [ ] ADRs completed for Voice, CAPA, Replenishment, Events, Tenant, Cognitive
- [ ] Documentation drift CI gate active
- [ ] Module ownership matrix published
- [ ] Load test gate active
- [ ] Security test gate active
- [ ] Integration test gate active
- [ ] E2E critical flow gate active

Operating Criteria:

- [ ] Docs changes required for domain behavior changes
- [ ] Owners assigned for WMS, Voice, CAPA, Yard, Workforce, Replen, Integrations
- [ ] Release gate includes expanded quality suites

## Phase 5 - Internal Re-Centering (No Rename, No New Domains)

Status: Not Started
Target Window: Parallel from Week 6-9

Checklist:

- [ ] Publish internal LogiVox core map: Inventory, Tasks, Waves, Replenishment, Orders/Shipments, Voice, Cognitive
- [ ] Publish module map: CAPA, Workforce, Yard/Dock/Gate, Integrations, Reporting, Sustainability
- [ ] Group backlog and release views by core vs module
- [ ] Publish dependency ownership per core/module boundary

Exit Criteria:

- [ ] Core vs module structure documented and adopted in planning artifacts
- [ ] No domain additions, no rename, no CAPA removal
