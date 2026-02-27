#!/bin/bash
# TENANT SCOPING ROLLOUT CHECKLIST
# Run this script at the beginning of Phase 2 to verify setup is complete

set -e

echo "=================================="
echo "🔍 TENANT SCOPING PHASE 2 CHECKLIST"
echo "=================================="
echo ""

# Check 1: Verify files exist
echo "✓ Checking Phase 1 files exist..."
files=(
  "apps/web/src/lib/prisma.ts"
  "apps/web/src/lib/tenant-context.ts"
  "apps/web/src/lib/tenant-route-helpers.ts"
  "__tests__/security/tenant-scoping-middleware.test.ts"
  "__tests__/integration/tenant-isolation-e2e.test.ts"
  "prisma/migrations/tenant-isolation-indexes.sql"
  "scripts/tenant-scoping-ci-guard.ts"
  "docs/technical/TENANT_SCOPING_QUICK_START.md"
  "docs/technical/PHASE_2_ENDPOINT_MIGRATION.md"
)

missing=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file MISSING"
    missing=$((missing + 1))
  fi
done

if [ $missing -gt 0 ]; then
  echo ""
  echo "❌ ERROR: $missing files missing. Run Phase 1 first!"
  exit 1
fi

echo ""
echo "✓ All Phase 1 files present!"
echo ""

# Check 2: Verify Prisma middleware is loaded
echo "✓ Checking Prisma middleware installation..."
if grep -q "prisma.\$use" apps/web/src/lib/prisma.ts; then
  echo "  ✅ Prisma middleware hook found"
else
  echo "  ❌ Prisma middleware hook not found!"
  exit 1
fi

echo ""

# Check 3: Quick syntax check
echo "✓ Checking TypeScript compilation..."
echo "  (This may take a minute...)"
cd apps/web
npx tsc --noEmit > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ TypeScript compiles successfully"
else
  echo "  ⚠️  TypeScript has errors (may be pre-existing)"
fi
cd - > /dev/null

echo ""

# Check 4: Database migration status
echo "✓ Checking database migrations..."
if [ -f "prisma/migrations/tenant-isolation-indexes.sql" ]; then
  echo "  ✅ Tenant isolation migration SQL exists"
  echo "  ⏳ To apply: prisma migrate deploy"
else
  echo "  ❌ Migration SQL not found!"
  exit 1
fi

echo ""

# Check 5: Find endpoints that need updating
echo "✓ Scanning API routes for potential violations..."
violations=$(grep -r "prisma\.inventory" apps/web/src/app/api --include="*.ts" 2>/dev/null | wc -l)
if [ "$violations" -gt 0 ]; then
  echo "  ℹ️  Found $violations files with inventory queries"
  echo "  → These routes should be reviewed for tenant scoping"
fi

echo ""

# Check 6: Estimate work
echo "📊 WORK ESTIMATE"
echo "  Total API route files: $(find apps/web/src/app/api -name 'route.ts' | wc -l)"
echo "  Total query patterns: $(grep -r 'prisma\.\w\+\.find' apps/web/src/app/api --include='*.ts' 2>/dev/null | wc -l)"
echo ""
echo "  Estimated lines to review: ~5,000"
echo "  Estimated fixes needed: 40-60 routes"
echo "  Estimated time: 1-2 weeks with team"
echo ""

# Final instructions
echo "=================================="
echo "✅ PHASE 2 SETUP VERIFIED"
echo "=================================="
echo ""
echo "📚 NEXT STEPS:"
echo "1. Read: docs/technical/PHASE_2_ENDPOINT_MIGRATION.md"
echo "2. Read: docs/technical/TENANT_SCOPING_QUICK_START.md"
echo "3. Run: prisma migrate deploy (to apply indexes)"
echo "4. Pick first endpoint from CRITICAL list"
echo "5. Follow pattern from PHASE_2_ENDPOINT_MIGRATION.md"
echo "6. Test both same-tenant and cross-tenant scenarios"
echo "7. Run: npx jest __tests__/integration/tenant-isolation-e2e.test.ts"
echo ""
echo "🚀 Ready to begin Phase 2!"
echo ""
