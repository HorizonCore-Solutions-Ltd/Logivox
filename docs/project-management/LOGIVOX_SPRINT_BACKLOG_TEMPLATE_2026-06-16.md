# LogiVox Sprint Backlog Template

Use this template to run delivery against the approved stabilization plan.

## Sprint Metadata

- Sprint Name:
- Sprint Window:
- Sprint Goal:
- Phase Mapping: P1 / P2 / P3 / P4 / P5
- Release Train:

## Capacity and Commitments

- Engineering Capacity (points or ideal days):
- QA Capacity:
- Platform/SRE Capacity:
- Planned vs Stretch Scope:

## Epic 1

- Epic Name:
- Domain:
- Owner:
- Status: Not Started / In Progress / Blocked / Done

Stories:

1. Story Title:

- Description:
- Acceptance Criteria:
  - [ ]
  - [ ]
- Test Requirements:
  - [ ] Unit
  - [ ] Integration
  - [ ] Contract
  - [ ] E2E
- Risks:
- Dependencies:
- Estimate:

2. Story Title:

- Description:
- Acceptance Criteria:
  - [ ]
  - [ ]
- Test Requirements:
  - [ ] Unit
  - [ ] Integration
  - [ ] Contract
  - [ ] E2E
- Risks:
- Dependencies:
- Estimate:

## Epic 2

- Epic Name:
- Domain:
- Owner:
- Status: Not Started / In Progress / Blocked / Done

Stories:

1. Story Title:

- Description:
- Acceptance Criteria:
  - [ ]
  - [ ]
- Test Requirements:
  - [ ] Unit
  - [ ] Integration
  - [ ] Contract
  - [ ] E2E
- Risks:
- Dependencies:
- Estimate:

## Mandatory Quality Gates (Per Sprint)

- [ ] Contract tests pass for changed API contracts
- [ ] Tenant and auth tests pass for changed protected routes
- [ ] Integration tests pass for event/webhook/integration changes
- [ ] E2E critical path tests pass for workflow changes
- [ ] Docs updated for behavior changes

## Done Definition (Per Story)

- [ ] Code merged with review approval
- [ ] Acceptance criteria validated
- [ ] Tests implemented and passing in CI
- [ ] Logging/observability adjusted where relevant
- [ ] Security and tenant scope considered
- [ ] Documentation updated

## Blockers Log

1. Blocker:

- Impact:
- Owner:
- Mitigation:
- ETA:

2. Blocker:

- Impact:
- Owner:
- Mitigation:
- ETA:

## Sprint Demo Checklist

- [ ] Voice flow changes demonstrated
- [ ] Contract tests demonstrated
- [ ] Security/tenant controls demonstrated
- [ ] Risk burndown reviewed

## Sprint Retrospective Prompts

1. What reduced platform risk this sprint?
2. What created avoidable churn?
3. Which repeated patterns should move into shared primitives?
4. Which CI gates caught real defects?
5. What should be deferred vs accelerated next sprint?
