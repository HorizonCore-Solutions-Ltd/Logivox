# How to Use LogiVox Governance Framework

**A practical guide to the governance system.**

---

## Quick Navigation

```
📋 Planning a feature?
   → START: [Turnkey Completion Tracker](./TURNKEY_COMPLETION_TRACKER.md)

👨‍💻 Implementing the feature?
   → REFERENCE: [Developer Quick Reference](./DEVELOPER_QUICK_REFERENCE.md)

🔍 Reviewing code?
   → USE: [Code Review Checklist](./CODE_REVIEW_CHECKLIST.md)

📚 Need detailed guidance?
   → READ: [Development Governance Framework](./DEVELOPMENT_GOVERNANCE.md)
```

---

## The Workflow

### Phase 1: Planning

**Who**: Product manager, tech lead, developer  
**When**: Before starting work  
**Action**: Open [Turnkey Completion Tracker](./TURNKEY_COMPLETION_TRACKER.md)

Ask:

- What feature are we building?
- Which 6 dimensions does it involve? (DB, Backend, Frontend, AuthZ, Errors, Tests)
- What's the status of each dimension?
- What are the dependencies?

Example:

```
Feature: "Autonomous Wave Generation"
  Database: ⏳ NOT STARTED (need AutomationRule model)
  Backend:  ⏳ NOT STARTED (need POST /api/automations/waves)
  Frontend: ⏳ NOT STARTED (need Rules UI)
  AuthZ:    ⏳ NOT STARTED (ops managers only)
  Errors:   ⏳ NOT STARTED (what if generation fails?)
  Tests:    ⏳ NOT STARTED (test algorithm)

Dependencies: Must complete database first
Target: March 15, 2026
```

---

### Phase 2: Development

**Who**: Developer  
**When**: While implementing  
**Action**: Keep [Developer Quick Reference](./DEVELOPER_QUICK_REFERENCE.md) visible

Before you write code:

1. Print the Quick Reference and pin it to your desk
2. Keep the Definition of Done visible (6-point checklist)
3. Use the Error Handling Template for every new error path
4. Check the Prohibited Patterns list before committing

During development:

```javascript
// 1. Create database schema (prisma/schema.prisma)
model AutomationRule {
  id String @id
  organizationId String
  name String
  triggerCondition String
  // ... etc
}

// 2. Create ORM types (types/models.ts)
export interface AutomationRule {
  id: string;
  organizationId: string;
  name: string;
  triggerCondition: string;
}

// 3. Implement backend endpoints (app/api/automations/route.ts)
export const POST = async (req: Request) => {
  try {
    // validate, create, return
  } catch (error) {
    // log with context
    // return meaningful error
  }
}

// 4. Implement frontend UI (app/(dashboard)/automations/page.tsx)
export default function AutomationsPage() {
  // fetch from real API
  // render forms
  // wire onClick handlers
  // show loading/error/success states
}

// 5. Add tests (app/api/automations/__tests__/route.test.ts)
describe('POST /api/automations', () => {
  it('creates automation rule and triggers wave generation', async () => {
    // test happy path
  });

  it('returns error if insufficient permissions', async () => {
    // test authorization
  });
});
```

As you build, update the tracker:

```
Feature: Autonomous Wave Generation
  Database: 🟡 IN PROGRESS (schema created, migration pending)
  Backend:  🟡 IN PROGRESS (endpoints 50% done)
  Frontend: ⏳ NOT STARTED
  AuthZ:    ⏳ NOT STARTED
  Errors:   🟡 IN PROGRESS (error model defined)
  Tests:    🟡 IN PROGRESS (unit tests written)
```

---

### Phase 3: Code Review

**Who**: Code reviewer  
**When**: PR submitted  
**Action**: Use [Code Review Checklist](./CODE_REVIEW_CHECKLIST.md)

Walk through the checklist:

```
☐ Database & ORM:
  ✅ Schema matches ORM
  ✅ Migrations created
  ✅ Multi-tenant scoping added

☐ Backend API:
  ✅ Endpoints exist
  ✅ Input validation enforced
  ✅ Authorization checked
  ✅ Errors return typed responses
  ✅ Logging has context
  ❌ TODO comment found! (Request changes)

☐ Frontend UI:
  ✅ All screens implemented
  ✅ Buttons wired to real API calls
  ✅ Loading/error/success states shown

☐ Tests:
  ✅ Happy path tested
  ✅ Error cases tested
```

If ALL boxes are ✅ → **APPROVE**  
If ANY box is ❌ → **REQUEST CHANGES** (with clear fix instructions)

Example rejection comment:

```
Category: Backend API

Issue: POST /api/automations has no error logging context

Example:
  } catch (error) {
    logger.error('creation failed: ' + error.message);
  }

Fix: Log with full context
  } catch (error) {
    logger.error('automation_creation_failed', {
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      errorCode: error.code,
      errorMessage: error.message,
    });
  }

Reference: DEVELOPMENT_GOVERNANCE.md → Error Handling Discipline
```

---

### Phase 4: Verification

**Who**: Developer + reviewer  
**When**: Before merging to main  
**Action**: Manual end-to-end test

Test in running app:

```
☐ Can I access the feature as intended user?
☐ Can I create/update/delete the feature?
☐ Does data persist to database?
☐ If I try unauthorized access, am I denied?
☐ If I cause an error (bad input), do I see user-friendly message?
☐ Is data isolated by tenant (can't see other org's data)?
☐ Does the feature work on mobile (if applicable)?
```

Update the tracker to ✅ DONE:

```
Feature: Autonomous Wave Generation
  Database: ✅ DONE
  Backend:  ✅ DONE
  Frontend: ✅ DONE
  AuthZ:    ✅ DONE
  Errors:   ✅ DONE
  Tests:    ✅ DONE
  OVERALL:  ✅ TURNKEY (ready for production)
```

---

## Real Example: Supplier Scorecard Feature

### Planning (Day 1)

Open Turnkey Tracker, create new row:

```
Feature: Supplier Scorecards
  Database:  ⏳ NOT STARTED
  Backend:   ⏳ NOT STARTED
  Frontend:  ⏳ NOT STARTED
  AuthZ:     ⏳ NOT STARTED
  Errors:    ⏳ NOT STARTED
  Tests:     ⏳ NOT STARTED
```

### Database (Day 1-2)

```prisma
// prisma/schema.prisma
model SupplierScorecard {
  id String @id
  organizationId String
  supplierId String
  qualityScore Float
  deliveryScore Float
  complianceScore Float
  overallScore Float
  calculatedAt DateTime @default(now())

  supplier Supplier @relation(fields: [supplierId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id])
  @@unique([organizationId, supplierId])
}
```

Update tracker: Database 🟡 IN PROGRESS

### Backend (Day 2-3)

```typescript
// app/api/suppliers/scorecards/route.ts
export const GET = async (req: Request) => {
  try {
    const org = await getAuthenticatedOrg(req);
    const scorecards = await prisma.supplierScorecard.findMany({
      where: { organizationId: org.id },
      include: { supplier: { select: { name: true } } },
    });
    return json<SupplierScorecardDTO[]>(scorecards);
  } catch (error) {
    logger.error("scorecard_fetch_failed", {
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      errorCode: error.code,
    });
    return json({ error: "Failed to fetch scorecards" }, { status: 500 });
  }
};

// Calculate scorecard scores (service)
export const calculateScorecardScores = async (
  organizationId: string,
  supplierId: string,
) => {
  // Get quality metrics
  // Get delivery metrics
  // Get compliance metrics
  // Calculate weighted score
  // Update database
};
```

Update tracker: Backend 🟡 IN PROGRESS

### Frontend (Day 3-4)

```typescript
// app/(dashboard)/suppliers/scorecards/page.tsx
export default function SuppliersScorecardsPage() {
  const [scorecards, setScorecards] = useState<SupplierScorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/suppliers/scorecards');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setScorecards(data);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Skeleton />;
  if (error) return <ErrorState message={error} />;
  if (!scorecards.length) return <EmptyState />;

  return (
    <div>
      <Table>
        {scorecards.map(scorecard => (
          <TableRow key={scorecard.id}>
            <TableCell>{scorecard.supplier.name}</TableCell>
            <TableCell>
              <ScoreBar value={scorecard.qualityScore} />
            </TableCell>
            <TableCell>
              <ScoreBar value={scorecard.deliveryScore} />
            </TableCell>
            <TableCell>
              <ScoreBar value={scorecard.overallScore} />
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
```

Update tracker: Frontend 🟡 IN PROGRESS

### Authorization (Day 4)

```typescript
// In both API and frontend:
// - Only procurement managers can view scorecards
// - Suppliers can view their own scorecard
// - Admins see all

// app/api/suppliers/scorecards/route.ts
const org = await getAuthenticatedOrg(req);
if (!hasRole(req.user, ["admin", "procurement_manager"])) {
  throw new UnauthorizedError("Insufficient permissions");
}
```

Update tracker: AuthZ 🟡 IN PROGRESS

### Tests (Day 4-5)

```typescript
// app/api/suppliers/scorecards/__tests__/route.test.ts
describe("GET /api/suppliers/scorecards", () => {
  it("returns scorecards for authenticated user", async () => {
    // Create test org, suppliers, scorecards
    // Make API request
    // Assert response
  });

  it("returns 401 if not authenticated", async () => {
    // Make unauthenticated request
    // Assert 401 Unauthorized
  });

  it("only returns scorecards for user's organization", async () => {
    // Create two orgs with scorecards
    // Make request as user from org1
    // Assert only org1 scorecards returned
  });
});
```

Update tracker: Tests 🟡 IN PROGRESS

### Final Check (Day 5)

Manual test in app:

```
☐ Can I see scorecard dashboard? YES
☐ Are scores calculated correctly? YES
☐ Can I not see other org's scorecards? YES (confirmed isolation)
☐ If API fails, do I see error message? YES
☐ Does mobile view work? YES
```

Update tracker: **✅ TURNKEY**

---

## Using the Tools Together

```
❌ WRONG: Jump into coding without planning
❌ WRONG: Code review without checklist
❌ WRONG: Merge without manual testing
❌ WRONG: Mark "done" without all 6 dimensions complete

✅ RIGHT:
1. Add to Turnkey Tracker
2. Develop with Quick Reference visible
3. Peer review using Code Review Checklist
4. Manual test end-to-end
5. Mark feature ✅ TURNKEY
```

---

## When Something Goes Wrong

### Scenario 1: "I wrote a button but forgot to wire the API call"

**Solution**:

1. Look at Quick Reference → Prohibited Patterns → Dead Buttons
2. Open CODE_REVIEW_CHECKLIST.md → Frontend UI section
3. Wire the button to real API before commit

### Scenario 2: "I added error handling but forgot to log context"

**Solution**:

1. Look at DEVELOPMENT_GOVERNANCE.md → Error Handling Template
2. Check CODE_REVIEW_CHECKLIST.md → Errors & Logging section
3. Update error handling to include context

### Scenario 3: "Feature is done but tests are failing"

**Solution**:

1. Don't merge. Tests are part of Definition of Done
2. Fix the tests or the code causing failures
3. Once tests pass, feature is ready for review

---

## Accountability

| Role              | Responsibility                                 |
| ----------------- | ---------------------------------------------- |
| **Developer**     | Follow Definition of Done, use Quick Reference |
| **Code Reviewer** | Use Code Review Checklist, catch violations    |
| **Tech Lead**     | Update Turnkey Tracker, enforce governance     |
| **Manager**       | Use Turnkey Tracker for progress visibility    |

---

## Questions?

| Question                          | Answer                                                 |
| --------------------------------- | ------------------------------------------------------ |
| "Where's the Definition of Done?" | DEVELOPER_QUICK_REFERENCE.md (6-point checklist)       |
| "What should I commit?"           | Only features that pass Code Review Checklist          |
| "How do I track progress?"        | Update TURNKEY_COMPLETION_TRACKER.md                   |
| "What's prohibited?"              | See DEVELOPER_QUICK_REFERENCE.md → Prohibited Patterns |
| "I'm blocked on something"        | Flag in Turnkey Tracker as 🔴 BLOCKED                  |
| "Feature is ambiguous"            | Ask for clarification before starting                  |

---

## TL;DR Summary

**In 3 steps:**

1. **PLAN**: Add feature to Turnkey Tracker
2. **BUILD**: Develop using Quick Reference, ensure all 6 dimensions done
3. **REVIEW**: Other person uses Code Review Checklist, you do manual end-to-end test
4. **MARK DONE**: Update Turnkey Tracker to ✅ TURNKEY

**That's it.**

---

**Last Updated:** March 1, 2026  
**Owner:** Development Team  
**Questions?** Refer to the governance documents linked above.
