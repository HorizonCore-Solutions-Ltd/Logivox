# Missing Features & Gaps Tracker

**Audit Date:** March 2, 2026  
**Systems Audited:** Voice, Authentication, CAPA, Quality / QC  
**Status Key:** 🔴 Not Started · 🟡 In Progress · 🟢 Done · ⚫ Blocked

---

## 1. Authentication System

| #   | Severity        | Gap                                                                                                            | File(s) Needed                                                                                            | Status |
| --- | --------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------ |
| A-1 | 🔴 **CRITICAL** | MFA enforcement is **commented out** — logins bypass 2FA even when enabled in DB                               | `apps/web/src/lib/auth.ts` lines 89–97                                                                    | 🔴     |
| A-2 | 🔴 **CRITICAL** | No **Forgot Password** flow — link on sign-in points to `/forgot-password` which returns 404                   | `apps/web/src/app/(auth)/forgot-password/page.tsx` + `apps/web/src/app/api/auth/forgot-password/route.ts` | 🔴     |
| A-3 | 🔴 **CRITICAL** | No **Reset Password** flow                                                                                     | `apps/web/src/app/(auth)/reset-password/page.tsx` + `apps/web/src/app/api/auth/reset-password/route.ts`   | 🔴     |
| A-4 | 🟠 **High**     | Account lock-out logic is **commented out** — brute-force protection disabled despite helper function existing | `apps/web/src/lib/auth.ts` lines 63–70 (uncomment + wire `trackFailedLogin`)                              | 🔴     |
| A-5 | 🟠 **High**     | Failed login tracking disabled — `trackFailedLogin()` exists but call is commented out                         | `apps/web/src/lib/auth.ts` line 78                                                                        | 🔴     |
| A-6 | 🟠 **High**     | No **Email Verification** flow after registration                                                              | `apps/web/src/app/api/auth/verify-email/route.ts` + page                                                  | 🔴     |
| A-7 | 🟡 **Medium**   | Password strength only checks length ≥ 8 — no uppercase / number / special char rules                          | `apps/web/src/app/api/auth/register/route.ts`                                                             | 🔴     |

---

## 2. Voice System

| #   | Severity        | Gap                                                                                                                                                                           | File(s) Needed                                                | Status |
| --- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| V-1 | 🔴 **CRITICAL** | No **Voice Dashboard page** — `voice-browser/page.tsx` is isolated, not linked in sidebar nav                                                                                 | `apps/web/src/app/(dashboard)/voice/page.tsx` + sidebar entry | 🔴     |
| V-2 | 🔴 **CRITICAL** | Voice sessions stored **in-memory only** — lost on every server restart, no audit trail                                                                                       | `prisma/schema.prisma` — add `VoiceSession` model             | 🔴     |
| V-3 | 🟠 **High**     | Missing voice **intents in parser**: `putaway`, `ship order [id]`, `transfer [qty] to [location]`, `pack order [id]`, `batch pick`, `exception / problem`, `cancel`, `repeat` | `apps/web/src/lib/voice/voiceEngine.ts` — `parseIntent()`     | 🔴     |
| V-4 | 🟠 **High**     | No **text-command fallback** — if `OPENAI_API_KEY` is absent the entire system returns `NOT_CONFIGURED`. A text input path for testing/fallback is missing                    | `apps/web/src/app/api/voice/process/route.ts` + UI input      | 🔴     |
| V-5 | 🟡 **Medium**   | No **voice command history** — no audit log of who said what and when                                                                                                         | DB model + `apps/web/src/app/api/voice/history/route.ts`      | 🔴     |
| V-6 | 🟡 **Medium**   | Language **hardcoded to `"en"`** in Whisper call — multi-language support not wired up                                                                                        | `apps/web/src/lib/voice/voiceEngine.ts` line 80               | 🔴     |
| V-7 | 🟡 **Medium**   | No **real-time streaming** — API only accepts full file uploads. No WebSocket for live command feedback                                                                       | `apps/web/src/app/api/voice/stream/route.ts`                  | 🔴     |
| V-8 | 🟢 Low          | GET `/api/voice/process` returns static info only — no command testing endpoint                                                                                               | Add test param to GET handler                                 | 🔴     |

---

## 3. CAPA System

| #   | Severity        | Gap                                                                                                                                                                     | File(s) Needed                                                       | Status |
| --- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------ |
| C-1 | 🔴 **CRITICAL** | **No base `/api/capa/route.ts`** — root GET (list CAPAs) and POST (create CAPA) are completely absent. All 17 sub-routes exist but the core CRUD entry point is missing | `apps/web/src/app/api/capa/route.ts`                                 | 🔴     |
| C-2 | 🔴 **CRITICAL** | No **root `/dashboard/capa/page.tsx`** — only the hub sub-page exists. Users with direct `/capa` link get 404                                                           | `apps/web/src/app/(dashboard)/capa/page.tsx` (redirect or main list) | 🔴     |
| C-3 | 🟠 **High**     | Dashboard has `/capa/monitoring/page.tsx` but **no `/api/capa/monitoring/route.ts`**                                                                                    | `apps/web/src/app/api/capa/monitoring/route.ts`                      | 🔴     |
| C-4 | 🟡 **Medium**   | API has `/api/capa/ai-rca` (AI Root Cause Analysis) but **no dashboard page**                                                                                           | `apps/web/src/app/(dashboard)/capa/ai-rca/page.tsx`                  | 🔴     |
| C-5 | 🟡 **Medium**   | API has `/api/capa/predictive` but **no dashboard page**                                                                                                                | `apps/web/src/app/(dashboard)/capa/predictive/page.tsx`              | 🔴     |
| C-6 | 🟡 **Medium**   | API has `/api/capa/effectiveness` but **no dashboard page**                                                                                                             | `apps/web/src/app/(dashboard)/capa/effectiveness/page.tsx`           | 🔴     |

---

## 4. Quality Control (QC) System

> **Root cause:** 86 API routes exist across 29 functional areas but the dashboard only has 2 pages (`qc/page.tsx` and `qc/audits/page.tsx`).

| #    | Severity        | Gap                                                                                                                                      | File(s) Needed                                                          | Status |
| ---- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| Q-1  | 🔴 **CRITICAL** | No QC **sub-navigation** — users land on QC dashboard but have no way to access any sub-module                                           | `apps/web/src/app/(dashboard)/qc/page.tsx` — add nav + sub-module links | 🔴     |
| Q-2  | 🔴 **CRITICAL** | No **`/qc/calibration`** dashboard page (API: 4 routes)                                                                                  | `apps/web/src/app/(dashboard)/qc/calibration/page.tsx`                  | 🔴     |
| Q-3  | 🔴 **CRITICAL** | No **`/qc/ncr`** (Non-Conformance) dashboard page (API: stats + CRUD)                                                                    | `apps/web/src/app/(dashboard)/qc/ncr/page.tsx`                          | 🔴     |
| Q-4  | 🔴 **CRITICAL** | No **`/qc/fmea`** (Failure Mode & Effects) dashboard page (API: 7 routes)                                                                | `apps/web/src/app/(dashboard)/qc/fmea/page.tsx`                         | 🔴     |
| Q-5  | 🔴 **CRITICAL** | No **`/qc/quality-holds`** dashboard page (API: stats + CRUD)                                                                            | `apps/web/src/app/(dashboard)/qc/quality-holds/page.tsx`                | 🔴     |
| Q-6  | 🟠 **High**     | No **`/qc/complaints`** dashboard page (API: investigate + resolve)                                                                      | `apps/web/src/app/(dashboard)/qc/complaints/page.tsx`                   | 🔴     |
| Q-7  | 🟠 **High**     | No **`/qc/mrb`** (Material Review Board) dashboard page (API: disposition)                                                               | `apps/web/src/app/(dashboard)/qc/mrb/page.tsx`                          | 🔴     |
| Q-8  | 🟠 **High**     | No **`/qc/spc`** (Statistical Process Control) dashboard page (API: calculate + rules)                                                   | `apps/web/src/app/(dashboard)/qc/spc/page.tsx`                          | 🔴     |
| Q-9  | 🟠 **High**     | No **`/qc/documents`** dashboard page (API: approve, training, review cycle)                                                             | `apps/web/src/app/(dashboard)/qc/documents/page.tsx`                    | 🔴     |
| Q-10 | 🟠 **High**     | No **`/qc/training`** dashboard page (API: compliance, matrix, expiring, records)                                                        | `apps/web/src/app/(dashboard)/qc/training/page.tsx`                     | 🔴     |
| Q-11 | 🟠 **High**     | No **`/qc/supplier-quality`** dashboard page (API: rankings, scorecard, trend)                                                           | `apps/web/src/app/(dashboard)/qc/supplier-quality/page.tsx`             | 🔴     |
| Q-12 | 🟡 **Medium**   | No **`/qc/measurements`** dashboard page (API: Cpk, SPC stats, raw measurements)                                                         | `apps/web/src/app/(dashboard)/qc/measurements/page.tsx`                 | 🔴     |
| Q-13 | 🟡 **Medium**   | No **`/qc/risk`** dashboard page                                                                                                         | `apps/web/src/app/(dashboard)/qc/risk/page.tsx`                         | 🔴     |
| Q-14 | 🟡 **Medium**   | No **`/qc/debit-memos`** dashboard page (API: approve + CRUD)                                                                            | `apps/web/src/app/(dashboard)/qc/debit-memos/page.tsx`                  | 🔴     |
| Q-15 | 🟡 **Medium**   | No **`/qc/changes`** (Change Control) dashboard page (API: submit + approve)                                                             | `apps/web/src/app/(dashboard)/qc/changes/page.tsx`                      | 🔴     |
| Q-16 | 🟡 **Medium**   | No **`/qc/rtv`** (Return to Vendor) dashboard page                                                                                       | `apps/web/src/app/(dashboard)/qc/rtv/page.tsx`                          | 🔴     |
| Q-17 | 🟡 **Medium**   | No **`/qc/concessions`** dashboard page                                                                                                  | `apps/web/src/app/(dashboard)/qc/concessions/page.tsx`                  | 🔴     |
| Q-18 | 🟡 **Medium**   | No **`/qc/reports`** dashboard page (API: generate + export)                                                                             | `apps/web/src/app/(dashboard)/qc/reports/page.tsx`                      | 🔴     |
| Q-19 | 🟡 **Medium**   | **Duplicate inspection paths** — `/api/qc-inspections` and `/api/qc/inspections` both serve the same concept. One needs to be deprecated | Consolidate to `/api/qc/inspections`                                    | 🔴     |
| Q-20 | 🟢 Low          | No **`/qc/analytics`** dashboard page (API: KPIs, pareto, trends, forecast)                                                              | `apps/web/src/app/(dashboard)/qc/analytics/page.tsx`                    | 🔴     |

---

## Summary Totals

| System         | Critical | High   | Medium | Low   | Total  |
| -------------- | -------- | ------ | ------ | ----- | ------ |
| Authentication | 3        | 2      | 1      | 0     | **7**  |
| Voice          | 2        | 2      | 3      | 1     | **8**  |
| CAPA           | 2        | 1      | 3      | 0     | **6**  |
| Quality / QC   | 5        | 6      | 8      | 1     | **20** |
| **TOTAL**      | **12**   | **11** | **15** | **2** | **40** |

---

## Suggested Fix Order (Today's Session)

### Phase 1 — Auth Quick Wins (est. 45 min)

- [ ] A-1: Uncomment MFA enforcement in `auth.ts`
- [ ] A-4: Uncomment account lockout in `auth.ts`
- [ ] A-5: Uncomment failed login tracking in `auth.ts`
- [ ] A-7: Strengthen password validation in register endpoint

### Phase 2 — Auth Missing Pages (est. 1 hr)

- [ ] A-2: Create forgot-password page + API route
- [ ] A-3: Create reset-password page + API route
- [ ] A-6: Create email verification API route

### Phase 3 — CAPA Gaps (est. 45 min)

- [ ] C-1: Create base `/api/capa/route.ts` with GET list + POST create
- [ ] C-2: Create root `/dashboard/capa/page.tsx`
- [ ] C-3: Create `/api/capa/monitoring/route.ts`
- [ ] C-4/C-5/C-6: Create ai-rca, predictive, effectiveness dashboard pages

### Phase 4 — Voice Improvements (est. 1 hr)

- [ ] V-3: Add missing intents to `voiceEngine.ts` parser
- [ ] V-4: Add text-fallback command path
- [ ] V-5: Add voice command history API + DB model
- [ ] V-2: Add `VoiceSession` model to Prisma schema

### Phase 5 — QC Dashboard Build-out (est. 3–4 hrs — biggest effort)

- [ ] Q-1: Fix QC nav/sub-navigation
- [ ] Q-2–Q-18: Create 17 QC sub-module dashboard pages
- [ ] Q-19: Deprecate `/api/qc-inspections` duplicate

---

_Last updated: March 2, 2026 — auto-generated from system audit_
