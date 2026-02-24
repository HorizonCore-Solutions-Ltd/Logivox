# API Versioning, Offline Support, and UX Considerations

## API Versioning / API-First

- Introduce versioned namespaces: `/api/v1/...` (and future `/api/v2/...`).
- Publish a spec (OpenAPI/GraphQL) from route handlers and `schema.graphql`; keep it in `docs/api/openapi.yaml`.
- Deprecation policy: keep previous minor for 90 days; add `Deprecation` headers and changelog entries.
- Auth: ensure versioned routes share auth middleware; keep signing/HMAC consistent.

## Offline Support

- Identify offline-critical flows: pick/pack confirmations, scans, and task lists.
- Implement local queue + sync with conflict handling; surface queued/synced states in UI.
- Service worker: cache shell + static assets; background sync for queued mutations.
- Testing: simulate offline in devtools; verify no data loss and correct replay ordering.

## UX / Performance

- Lazy load heavy marketing sections and large dashboard widgets where applicable.
- Pagination: ensure all large lists use server pagination (webhook deliveries done; extend to other grids as needed).
- Voice baseline: Chrome/Edge primary; provide fallback message on unsupported browsers.

## Security & Compliance

- Enforce TLS for prod `DATABASE_URL`; HSTS/CSP/CORS tuned to prod domains.
- Keep webhook signing secrets per integration; monitor delivery logs and retries.
- Consent: GA/FB only after consent; document data residency/DSR contacts on legal pages.

## Next Actions

- Create `/api/v1` wrappers for current route handlers and publish initial OpenAPI spec.
- Add offline queue + sync for one critical flow (pick confirmation) as a pilot.
- Audit large lists for pagination/lazy loading and patch where missing.
- Add security headers (CSP/HSTS) in `next.config.js`/middleware for prod domain.
