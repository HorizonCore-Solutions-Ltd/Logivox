# LogiVox Developer Quick Reference

**Print this and pin it to your desk.** Non-negotiable rules for LogiVox development.

---

## The Golden Rule

**TURNKEY, NO STUBS.**

Every feature must be fully functional from database to UI. No TODOs. No fake endpoints. No dead buttons.

---

## Definition of Done (6-Point Checklist)

Before you mark a feature done, ALL 6 must be ✅:

```
☑ Database: Schema, migrations, ORM aligned
☑ Backend: All endpoints exist, validated, authenticated
☑ Frontend: All screens, fully wired (no dead buttons)
☑ Authorization: Access control enforced by role & tenant
☑ Errors: Failures logged with context, user-facing message shown
☑ Tests: At least critical path has automated test
```

**If ANY box is not ✅, the feature is not done.**

---

## Prohibited Patterns (Never Do This)

| ❌ PROHIBITED              | ✅ REQUIRED                         |
| -------------------------- | ----------------------------------- |
| TODO/FIXME in shipped code | Fix it now or create separate issue |
| Mock endpoints             | Real API calls                      |
| Dead buttons               | Every button does something         |
| Silent failures            | Logged error + user message         |
| Fake data                  | Real data from database             |
| `any` types                | Typed end-to-end                    |
| Missing tests              | At least happy path tested          |

---

## Error Handling Pattern

**Every error path must do 3 things:**

```typescript
// 1. LOG with context
logger.error("operation_failed", {
  userId: user.id,
  organizationId: org.id,
  errorCode: error.code,
  timestamp: new Date(),
});

// 2. RETURN meaningful error
return json(
  {
    success: false,
    error: { code: "INSUFFICIENT_STOCK", message: "Not enough inventory" },
  },
  { status: 400 },
);

// 3. SHOW user-facing message
toast.error(error.message);
```

---

## Type Alignment Checklist

Align these 4 sources of truth:

```
[ ] Database schema (prisma/schema.prisma)
    ↓
[ ] ORM models (types/models.ts)
    ↓
[ ] API contract (types/api.ts)
    ↓
[ ] Frontend types (types/frontend.ts)
```

All 4 must match. If you change one, update all 4.

---

## Before Every Commit

- [ ] Can I click through the entire workflow in the running app?
- [ ] Is there any UI element that does nothing?
- [ ] Are error cases handled?
- [ ] Did I log enough context for debugging?
- [ ] Are there any TODO/FIXME comments?
- [ ] Does everything build without errors?

---

## Questions? Check This First

| Question                               | Answer                                   |
| -------------------------------------- | ---------------------------------------- |
| "Can I make a TODO comment?"           | No. Fix it or create an issue.           |
| "Can I use a mock endpoint?"           | Only in tests.                           |
| "Can I ship an unfinished feature?"    | No. Ship complete features only.         |
| "How much testing do I need?"          | At least the happy path.                 |
| "What if it's 'just a demo'?"          | There's no such thing in this codebase.  |
| "Can I leave a button non-functional?" | No. Wire it or delete it.                |
| "How much error handling is enough?"   | Enough that a regulator could review it. |

---

## Definition of "Done"

A feature is DONE when:

1. ✅ A real user can use it end-to-end in the running app
2. ✅ No dead code, dead buttons, or fake endpoints
3. ✅ All errors are handled, logged, and show user-facing messages
4. ✅ Database → API → Frontend are all wired correctly
5. ✅ At least the happy path is tested
6. ✅ Code builds and runs with no errors

**If ANY of these are not true, the feature is not done.**

---

## Release Gate (Before We Ship to Customers)

- ☑ All major features implemented (no "planned" stubs)
- ☑ No TypeScript errors
- ☑ No ESLint errors
- ☑ No failing tests
- ☑ No dead UI buttons
- ☑ All error paths handled
- ☑ No TODO/FIXME in code
- ☑ Can complete all major workflows end-to-end

---

## Links

- **Full governance**: [DEVELOPMENT_GOVERNANCE.md](../DEVELOPMENT_GOVERNANCE.md)
- **Feature tracker**: [TURNKEY_COMPLETION_TRACKER.md](../TURNKEY_COMPLETION_TRACKER.md)
- **Example error handling**: See governance doc section "Error Handling Template"

---

## In Doubt?

Ask: "Would a customer be able to use this without my help?"

If the answer is no → not done yet.

---

**This is not a suggestion. This is the production standard for LogiVox.**

Last updated: March 1, 2026
