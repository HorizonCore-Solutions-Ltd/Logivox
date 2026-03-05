# Documentation Drift Audit - 2026-03-05

## Scope

Quick comparison between live codebase structure and high-visibility documentation claims.

## Current Codebase Baseline (Measured)

- API route handlers: `435`
  - Source: `apps/web/src/app/api/**/route.ts`
- Total app page routes: `382`
  - Source: `apps/web/src/app/**/page.tsx`
- Dashboard page routes: `243`
  - Source: `apps/web/src/app/(dashboard)/**/page.tsx`
- Prisma models: `243`
  - Source: `prisma/schema.prisma` (`model` declarations)
- Migration directories: `17` (includes base folder count behavior)
  - Source: `prisma/migrations`

## Drift Findings

### High Priority

- `README.md`
  - Multiple stale numeric claims (`489` APIs, `201` tables, `42` dashboards).
  - Broken API docs link to `./docs/api/` (directory does not exist).
  - Status: Updated on 2026-03-05.

- `docs/status-reports/QUICK_STATUS.md`
  - Reported `283` APIs and `100+` models no longer reflect codebase.
  - Status: Updated on 2026-03-05.

- `docs/status-reports/ACTUAL_COMPLETION_STATUS.md`
  - Reported `283` APIs and `100+` models; now materially undercounted.
  - Status: Updated top-line metrics on 2026-03-05.

### Medium Priority

- `docs/status-reports/TURNKEY_COMPLETION_TRACKER.md`
  - Status: Updated on 2026-03-05 to remove stale fixed counts and outdated in-progress planning blocks.

- `docs/status-reports/ENTERPRISE_VALUE_AUDIT_AND_ENHANCEMENTS.md`
  - Status: Updated on 2026-03-05 to remove stale fixed counts and align enhancement status language.

- `docs/product/mobile/MOBILE_APP_IMPLEMENTATION_PLAN.md`
  - Status: Updated on 2026-03-05 to remove fixed endpoint count language and normalize branding.

### Low Priority (Historical Snapshot Files)

- Many files in `docs/completion-summaries/` and selected `docs/quality-assurance/` reports use point-in-time metrics (for example `228+`, `283`, `100% complete`).
- These should be treated as historical records unless explicitly re-baselined.

## Recommendations

1. Use relative language for volatile metrics in most docs.
   - Example: "Current API surface in `apps/web/src/app/api`" instead of hard-coded counts.
2. Keep exact counts only in one canonical status file.
   - Suggested canonical file: `docs/status-reports/QUICK_STATUS.md`.
3. Add update stamps to module docs after major enhancement waves.
4. Add a lightweight docs drift check in CI (optional).
   - Verify broken internal links.
   - Flag stale numeric claims for known volatile metrics (`API`, `dashboard`, `tables/models`).

## Notes

- This audit is intentionally conservative and based on direct file-system counts, not runtime route discovery.
- Dynamic/virtual routes are represented by route files and page files counted in source.
