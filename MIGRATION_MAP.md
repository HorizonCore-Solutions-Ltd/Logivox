# 🚀 5-MINUTE MIGRATION GUIDE - WHERE TO DROP EACH FOLDER

## 📋 STEP-BY-STEP COPY/PASTE MAP

### 1️⃣ API ROUTES - Move to `/apps/web/src/app/api/`

**FROM** `/app/api/` **→ TO** `/apps/web/src/app/api/`

```
Cut these folders from /app/api/:
├── qc/                    → /apps/web/src/app/api/qc/
├── capa/                  → /apps/web/src/app/api/capa/
├── computer-vision/       → /apps/web/src/app/api/computer-vision/
├── digital-twin/          → /apps/web/src/app/api/digital-twin/
├── optimization/          → /apps/web/src/app/api/optimization/
├── dock/                  → /apps/web/src/app/api/dock/
├── cross-dock/            → /apps/web/src/app/api/cross-dock/
├── bay-doors/             → /apps/web/src/app/api/bay-doors/
├── loadsheets/            → /apps/web/src/app/api/loadsheets/
├── containers/            → /apps/web/src/app/api/containers/
├── load-optimization/     → /apps/web/src/app/api/load-optimization/
├── labor-management/      → /apps/web/src/app/api/labor-management/
├── ai-advanced/           → /apps/web/src/app/api/ai-advanced/
├── ai-intervention/       → /apps/web/src/app/api/ai-intervention/
├── ai-supervision/        → /apps/web/src/app/api/ai-supervision/
├── inspection-templates/  → /apps/web/src/app/api/inspection-templates/
├── assembly-orders/       → /apps/web/src/app/api/assembly-orders/
├── boms/                  → /apps/web/src/app/api/boms/
├── packing/               → /apps/web/src/app/api/packing/
├── orders/                → /apps/web/src/app/api/orders/
├── collaboration/         → /apps/web/src/app/api/collaboration/
└── errors/                → /apps/web/src/app/api/errors/
```

**ACTION**:

1. Open `/app/api/` in left panel
2. Open `/apps/web/src/app/api/` in right panel
3. Select all folders above
4. Cut (Ctrl+X) and Paste (Ctrl+V)

---

### 2️⃣ DASHBOARD PAGES - Move to `/apps/web/src/app/(dashboard)/`

**FROM** `/app/dashboard/` **→ TO** `/apps/web/src/app/(dashboard)/dashboard/`

```
Cut these folders from /app/dashboard/:
├── qc/                    → /apps/web/src/app/(dashboard)/dashboard/qc/
```

**FROM** `/app/` **→ TO** `/apps/web/src/app/(dashboard)/`

```
Cut these folders from /app/:
├── qc/                    → /apps/web/src/app/(dashboard)/qc/
├── capa/                  → /apps/web/src/app/(dashboard)/capa/
├── dock/                  → /apps/web/src/app/(dashboard)/dock/
├── admin/                 → /apps/web/src/app/(dashboard)/admin/
├── manager/               → /apps/web/src/app/(dashboard)/manager/
├── customer/              → /apps/web/src/app/(dashboard)/customer/
├── analytics/             → /apps/web/src/app/(dashboard)/analytics/
├── ai/                    → /apps/web/src/app/(dashboard)/ai/
├── integrations/          → /apps/web/src/app/(dashboard)/integrations/
├── assembly/              → /apps/web/src/app/(dashboard)/assembly/
├── waves/                 → /apps/web/src/app/(dashboard)/waves/
├── picking-tasks/         → /apps/web/src/app/(dashboard)/picking-tasks/
├── receiving/             → /apps/web/src/app/(dashboard)/receiving/
├── supplier/              → /apps/web/src/app/(dashboard)/supplier/
└── warehouse/             → /apps/web/src/app/(dashboard)/warehouse/
```

**ACTION**:

1. Open `/app/` in left panel
2. Open `/apps/web/src/app/(dashboard)/` in right panel
3. Cut each folder and paste

---

### 3️⃣ COMPONENTS - Move to `/apps/web/src/components/`

**FROM** `/components/` **→ TO** `/apps/web/src/components/`

```
Cut these folders from /components/:
├── qc/                    → /apps/web/src/components/qc/
├── capa/                  → /apps/web/src/components/capa/
├── dock/                  → /apps/web/src/components/dock/
├── cross-dock/            → /apps/web/src/components/cross-dock/
├── load-optimization/     → /apps/web/src/components/load-optimization/
└── returns/               → /apps/web/src/components/returns/
```

**ACTION**:

1. Open `/components/` (root) in left panel
2. Open `/apps/web/src/components/` in right panel
3. Cut folders and paste (DON'T overwrite inventory/, mobile/, ui/)

---

### 4️⃣ LIB/SERVICES - Move to `/apps/web/src/lib/`

**FROM** `/lib/services/` **→ TO** `/apps/web/src/lib/services/`

```
Cut this folder from /lib/:
└── qc/                    → /apps/web/src/lib/services/qc/
```

**ACTION**:

1. Open `/lib/services/` in left panel
2. Open `/apps/web/src/lib/services/` in right panel
3. Cut `qc` folder and paste

---

## ⚠️ IMPORTANT RULES

### ✅ DO:

- Cut entire folders (not individual files)
- Paste at exact locations shown above
- Keep folder names identical

### ❌ DON'T:

- Don't merge - if folder exists, skip it (already migrated)
- Don't rename folders
- Don't move files individually

### 📁 Folders to SKIP (already in /apps/web/):

- `/app/api/inventory/` - Already migrated ✅
- `/app/api/rmas/` - Already migrated ✅
- `/app/api/grn/` - Already migrated ✅
- `/apps/web/src/components/inventory/` - Already there ✅

---

## 🎯 QUICK CHECKLIST

After moving, you should see:

```
/apps/web/src/
├── app/
│   ├── api/
│   │   ├── qc/              ✅ NEW
│   │   ├── capa/            ✅ NEW
│   │   ├── computer-vision/ ✅ NEW
│   │   ├── dock/            ✅ NEW
│   │   └── [22 more...]     ✅ NEW
│   └── (dashboard)/
│       ├── qc/              ✅ NEW
│       ├── capa/            ✅ NEW
│       ├── dock/            ✅ NEW
│       └── [12 more...]     ✅ NEW
└── components/
    ├── qc/                  ✅ NEW
    ├── capa/                ✅ NEW
    └── [4 more...]          ✅ NEW
```

---

## 🚀 AFTER YOU'RE DONE

1. **Tell me** "Done moving files"
2. **I'll fix**:
   - Import paths (`@/` references)
   - Prisma imports
   - Component imports
   - Any broken links
3. **Test**: We'll verify APIs work
4. **Delete**: We'll remove old `/app/` folder

---

## 💡 TIME ESTIMATE

- API routes: 2 minutes (22 folders)
- Dashboard pages: 2 minutes (15 folders)
- Components: 1 minute (6 folders)
- **TOTAL: 5 minutes** ⚡

Ready? Start with the API routes first - they're the most important!
