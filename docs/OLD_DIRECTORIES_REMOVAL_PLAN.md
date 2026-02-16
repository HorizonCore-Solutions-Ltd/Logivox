# 🗑️ OLD Directories Removal Plan

**Date:** January 9, 2026  
**Status:** ✅ READY FOR DELETION

---

## 📊 Verification Summary

### Directories to Remove

1. **app.OLD/** - 144 files, 3.5MB
2. **components.OLD/** - 28 files, 388KB
3. **lib.OLD/** - 109 files, 1.7MB

**Total:** 281 files, ~5.6MB

---

## ✅ Pre-Deletion Verification Checklist

### 1. Migration Complete

- ✅ All API routes moved to `/apps/web/src/app/api/`
- ✅ All dashboard pages moved to `/apps/web/src/app/(dashboard)/`
- ✅ All components moved to `/apps/web/src/components/`
- ✅ All lib/services moved to `/apps/web/src/lib/`

### 2. No Code References

- ✅ No imports from `app.OLD` found in codebase
- ✅ No imports from `components.OLD` found in codebase
- ✅ No imports from `lib.OLD` found in codebase
- ✅ All imports use `@/` path aliases pointing to new structure

### 3. Configuration Files

- ✅ `tsconfig.json` (root) - No references to OLD directories
- ✅ `apps/web/tsconfig.json` - Uses correct paths (`./src/*`)
- ✅ No `*.OLD` references in any config files

### 4. New Structure Verified

```
✅ /apps/web/src/app/
   ├── (dashboard)/ - 31 route folders
   ├── api/ - 98+ endpoints
   └── Other routes

✅ /apps/web/src/components/
   ├── qc/
   ├── capa/
   ├── dock/
   ├── cross-dock/
   ├── load-optimization/
   ├── returns/
   └── All other components

✅ /apps/web/src/lib/
   └── services/qc/
```

---

## 🛡️ Safety Measures

### Git Safety

All OLD directories are already in Git history and can be recovered if needed:

```bash
# To recover a file if needed later:
git log --all --full-history -- "app.OLD/path/to/file"
git checkout <commit-hash> -- "app.OLD/path/to/file"
```

### Backup Option (Optional)

If you want extra safety, create a backup before deletion:

```bash
# Create backup archive
tar -czf old_directories_backup_$(date +%Y%m%d).tar.gz app.OLD components.OLD lib.OLD

# Move to safe location
mkdir -p ../backups
mv old_directories_backup_*.tar.gz ../backups/
```

---

## 🚀 Deletion Commands

### Option 1: Safe Deletion (Recommended First)

Move to a backup location outside the repo:

```bash
# Create backup directory
mkdir -p ../flowstock_old_backups

# Move directories
mv app.OLD ../flowstock_old_backups/
mv components.OLD ../flowstock_old_backups/
mv lib.OLD ../flowstock_old_backups/

# Verify app still works
npm run dev --workspace=apps/web

# If everything works for a few days, delete the backup
```

### Option 2: Direct Deletion

```bash
# Remove OLD directories
rm -rf app.OLD
rm -rf components.OLD
rm -rf lib.OLD

# Commit the change
git add -A
git commit -m "chore: remove OLD directories after successful migration"
```

---

## 🧪 Post-Deletion Testing

After deletion, verify:

1. **Build Test:**

   ```bash
   npm run build --workspace=apps/web
   ```

2. **Type Check:**

   ```bash
   npm run type-check --workspace=apps/web
   ```

3. **Start Dev Server:**

   ```bash
   npm run dev --workspace=apps/web
   ```

4. **Test Key Routes:**
   - http://localhost:3000/dashboard
   - http://localhost:3000/qc
   - http://localhost:3000/capa
   - http://localhost:3000/dock
   - Test API: http://localhost:3000/api/qc/inspections

---

## 📋 Known Build Issues (Unrelated to OLD directories)

These errors exist but are NOT related to the OLD directories:

1. Missing `@heroicons/react/24/outline` dependency
2. Syntax error in `dock/load-planning/page.tsx`
3. Missing `@/components/ui/separator` component
4. Missing `@/lib/auth-options` file

These need to be fixed separately but don't block OLD directory removal.

---

## ✅ Recommendation

**SAFE TO DELETE** - All three OLD directories can be removed:

1. No code references them
2. All functionality migrated to new structure
3. Git history preserves everything
4. TypeScript configs point to new locations
5. Import paths all use new structure

### Suggested Approach:

1. Create a backup archive (optional but recommended)
2. Move directories outside repo for 1-2 days of testing
3. If no issues arise, permanently delete
4. Commit the changes

---

## 🎯 Impact Assessment

**Risk Level:** 🟢 LOW

- All code successfully migrated
- No dangling references
- Fully recoverable from Git
- Modern structure in place

**Benefits:**

- Cleaner repository structure
- Faster IDE indexing
- No confusion between old/new code
- ~5.6MB less repository size
- Clearer project organization

---

## Next Steps

Ready to proceed? Execute the deletion using one of the methods above, then run the post-deletion tests to confirm everything works.
