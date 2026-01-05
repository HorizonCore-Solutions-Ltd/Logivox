# 🗄️ Database Migration Guide - Advanced Inventory System

**Migration ID**: `advanced_inventory_system_v1`  
**Date**: January 4, 2026  
**Status**: Ready to Apply

---

## 📋 MIGRATION OVERVIEW

This migration adds **7 new tables** and enhances **6 existing tables** to support the Advanced Inventory Management System with AI forecasting, autonomous operations, and IoT integration.

### New Tables (7)
1. `autonomous_decisions` - AI-driven inventory decisions
2. `demand_forecasts` - ML prediction storage
3. `iot_readings` - Time-series IoT data
4. `velocity_classifications` - ABC analysis results
5. `digital_twin_states` - Physical-digital sync
6. `environmental_readings` - Environmental compliance
7. `autonomous_configs` - Organization settings

### Enhanced Tables (6)
1. `organizations` - Added autonomous relations
2. `inventory_items` - Added forecasting relations
3. `iot_devices` - Added signal/calibration fields
4. `purchase_orders` - Added autonomous relations
5. `warehouse_transfers` - Added autonomous relations
6. `stock_adjustments` - Added autonomous relations

---

## 🚀 QUICK START

### Step 1: Generate Migration

```bash
cd /workspaces/Flowstock
npx prisma migrate dev --name advanced_inventory_system_v1
```

### Step 2: Apply Migration

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Seed Initial Data (Optional)

```bash
# Seed autonomous configs for existing organizations
npm run seed:autonomous-configs
```

---

## 📊 DETAILED SCHEMA CHANGES

### 1. autonomous_decisions

**Purpose**: Track all AI-driven inventory decisions

```sql
CREATE TABLE autonomous_decisions (
  id                TEXT PRIMARY KEY,
  organization_id   TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id        TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  decision_type     TEXT NOT NULL, -- REORDER, TRANSFER, ADJUST
  confidence        DOUBLE PRECISION NOT NULL, -- 0-100
  reasoning         JSONB NOT NULL,
  action_taken      BOOLEAN DEFAULT FALSE,
  result            TEXT, -- SUCCESS, PENDING, FAILED, REJECTED
  estimated_cost    DECIMAL(10,2) NOT NULL,
  estimated_savings DECIMAL(10,2),
  metadata          JSONB,
  purchase_order_id TEXT REFERENCES purchase_orders(id),
  transfer_id       TEXT REFERENCES warehouse_transfers(id),
  adjustment_id     TEXT REFERENCES stock_adjustments(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_autonomous_decisions_org ON autonomous_decisions(organization_id);
CREATE INDEX idx_autonomous_decisions_product ON autonomous_decisions(product_id);
CREATE INDEX idx_autonomous_decisions_type ON autonomous_decisions(decision_type);
CREATE INDEX idx_autonomous_decisions_result ON autonomous_decisions(result);
CREATE INDEX idx_autonomous_decisions_created ON autonomous_decisions(created_at);
```

**Storage Estimate**: ~500 bytes per row, ~18MB per 10K decisions/month

### 2. demand_forecasts

**Purpose**: Store ML-generated demand predictions

```sql
CREATE TABLE demand_forecasts (
  id              TEXT PRIMARY KEY,
  product_id      TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  horizon_days    INTEGER NOT NULL,
  predictions     JSONB NOT NULL, -- Array of daily predictions
  avg_daily_demand DOUBLE PRECISION NOT NULL,
  confidence      DOUBLE PRECISION NOT NULL, -- 0-100
  model_type      TEXT NOT NULL, -- SMA, EMA, LINEAR, SEASONAL, ENSEMBLE
  metadata        JSONB,
  generated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_demand_forecasts_product ON demand_forecasts(product_id);
CREATE INDEX idx_demand_forecasts_generated ON demand_forecasts(generated_at);
CREATE INDEX idx_demand_forecasts_confidence ON demand_forecasts(confidence);
```

**Storage Estimate**: ~2KB per row (includes 90-day predictions), ~60MB per 1K products

### 3. iot_readings

**Purpose**: Time-series IoT sensor data

```sql
CREATE TABLE iot_readings (
  id           TEXT PRIMARY KEY,
  device_id    TEXT NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
  reading_type TEXT NOT NULL, -- RFID, WEIGHT, TEMP, HUMIDITY
  value        DOUBLE PRECISION NOT NULL,
  metadata     JSONB,
  timestamp    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_iot_readings_device ON iot_readings(device_id);
CREATE INDEX idx_iot_readings_timestamp ON iot_readings(timestamp);
CREATE INDEX idx_iot_readings_type ON iot_readings(reading_type);
```

**Storage Estimate**: ~200 bytes per row, ~2GB per 10M readings  
**Retention Policy**: Recommended 90 days, archive after

### 4. velocity_classifications

**Purpose**: ABC velocity analysis results

```sql
CREATE TABLE velocity_classifications (
  id              TEXT PRIMARY KEY,
  product_id      TEXT UNIQUE NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  velocity_class  TEXT NOT NULL, -- A, B, C, D
  velocity_score  DOUBLE PRECISION NOT NULL, -- 0-100
  turnover_rate   DOUBLE PRECISION NOT NULL,
  annual_revenue  DECIMAL(10,2) NOT NULL,
  last_calculated TIMESTAMP NOT NULL,
  metadata        JSONB
);

CREATE INDEX idx_velocity_class ON velocity_classifications(velocity_class);
CREATE INDEX idx_velocity_calculated ON velocity_classifications(last_calculated);
```

**Storage Estimate**: ~300 bytes per row, ~300KB per 1K products

### 5. digital_twin_states

**Purpose**: Physical-digital inventory synchronization

```sql
CREATE TABLE digital_twin_states (
  id              TEXT PRIMARY KEY,
  product_id      TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  physical_state  JSONB NOT NULL, -- From IoT sensors
  digital_state   JSONB NOT NULL, -- From WMS
  discrepancies   JSONB NOT NULL,
  sync_confidence DOUBLE PRECISION NOT NULL, -- 0-100
  last_sync       TIMESTAMP,
  needs_sync      BOOLEAN DEFAULT FALSE,
  timestamp       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_digital_twin_product ON digital_twin_states(product_id);
CREATE INDEX idx_digital_twin_timestamp ON digital_twin_states(timestamp);
CREATE INDEX idx_digital_twin_needs_sync ON digital_twin_states(needs_sync);
```

**Storage Estimate**: ~1KB per row, ~1MB per 1K products

### 6. environmental_readings

**Purpose**: Environmental compliance tracking

```sql
CREATE TABLE environmental_readings (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
  zone_id     TEXT,
  temperature DOUBLE PRECISION NOT NULL,
  humidity    DOUBLE PRECISION NOT NULL,
  product_ids TEXT[] NOT NULL,
  violations  JSONB,
  timestamp   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_env_readings_device ON environmental_readings(device_id);
CREATE INDEX idx_env_readings_zone ON environmental_readings(zone_id);
CREATE INDEX idx_env_readings_timestamp ON environmental_readings(timestamp);
```

**Storage Estimate**: ~400 bytes per row, ~400MB per 1M readings  
**Retention Policy**: Keep 1 year for compliance

### 7. autonomous_configs

**Purpose**: Organization-level autonomous settings

```sql
CREATE TABLE autonomous_configs (
  id                          TEXT PRIMARY KEY,
  organization_id             TEXT UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  min_trust_score             DOUBLE PRECISION DEFAULT 80, -- 0-100
  approval_threshold          DECIMAL(10,2) DEFAULT 10000,
  max_order_value             DECIMAL(10,2) DEFAULT 50000,
  iot_discrepancy_threshold   DOUBLE PRECISION DEFAULT 10, -- %
  max_adjustment_value        DECIMAL(10,2) DEFAULT 5000,
  require_verification        BOOLEAN DEFAULT TRUE,
  enable_auto_reorders        BOOLEAN DEFAULT TRUE,
  enable_auto_transfers       BOOLEAN DEFAULT TRUE,
  enable_auto_adjustments     BOOLEAN DEFAULT TRUE,
  created_at                  TIMESTAMP DEFAULT NOW(),
  updated_at                  TIMESTAMP DEFAULT NOW()
);
```

**Storage Estimate**: ~200 bytes per org

---

## 🔄 ENHANCED EXISTING TABLES

### iot_devices (Added Fields)

```sql
ALTER TABLE iot_devices
  ADD COLUMN signal_strength DOUBLE PRECISION DEFAULT 100,
  ADD COLUMN last_calibration TIMESTAMP DEFAULT NOW(),
  ADD COLUMN last_seen TIMESTAMP DEFAULT NOW();
```

---

## ⚠️ PRE-MIGRATION CHECKLIST

- [ ] **Backup Database**: `pg_dump flowstock > backup_$(date +%Y%m%d).sql`
- [ ] **Check Disk Space**: Need ~500MB free for new tables
- [ ] **Test in Staging**: Apply migration to staging environment first
- [ ] **Review Prisma Schema**: Ensure schema.prisma is up to date
- [ ] **Check Dependencies**: Ensure all services are stopped

---

## 🧪 POST-MIGRATION VALIDATION

### 1. Verify Tables Created

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'autonomous_decisions',
    'demand_forecasts',
    'iot_readings',
    'velocity_classifications',
    'digital_twin_states',
    'environmental_readings',
    'autonomous_configs'
  );
```

Expected: 7 rows

### 2. Verify Indexes Created

```sql
-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE '%autonomous%' 
   OR tablename LIKE '%forecast%'
   OR tablename LIKE '%velocity%'
   OR tablename LIKE '%twin%';
```

Expected: 15+ indexes

### 3. Verify Relations

```sql
-- Check foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'autonomous_decisions',
    'demand_forecasts',
    'iot_readings',
    'velocity_classifications',
    'digital_twin_states',
    'environmental_readings',
    'autonomous_configs'
  );
```

Expected: 10+ constraints

### 4. Test Prisma Client

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test autonomous decision creation
const decision = await prisma.autonomousDecision.create({
  data: {
    organizationId: 'test-org',
    productId: 'test-product',
    decisionType: 'REORDER',
    confidence: 92.5,
    reasoning: { test: true },
    estimatedCost: 1000.00
  }
});

console.log('✅ AutonomousDecision created:', decision.id);

// Test demand forecast creation
const forecast = await prisma.demandForecast.create({
  data: {
    productId: 'test-product',
    horizonDays: 90,
    predictions: [{ day: 1, demand: 10, confidence: 95 }],
    avgDailyDemand: 10.5,
    confidence: 95.0,
    modelType: 'ENSEMBLE'
  }
});

console.log('✅ DemandForecast created:', forecast.id);
```

---

## 🔧 ROLLBACK PROCEDURE

If migration fails:

```bash
# 1. Rollback to previous migration
npx prisma migrate resolve --rolled-back advanced_inventory_system_v1

# 2. Restore from backup
psql flowstock < backup_YYYYMMDD.sql

# 3. Verify rollback
npx prisma migrate status
```

---

## 📊 PERFORMANCE TUNING

### 1. Optimize Indexes

```sql
-- Analyze tables for query optimization
ANALYZE autonomous_decisions;
ANALYZE demand_forecasts;
ANALYZE iot_readings;
ANALYZE velocity_classifications;
ANALYZE digital_twin_states;
ANALYZE environmental_readings;
```

### 2. Partition Large Tables (Optional)

For high-volume deployments (10M+ readings):

```sql
-- Partition iot_readings by month
CREATE TABLE iot_readings_2026_01 PARTITION OF iot_readings
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE iot_readings_2026_02 PARTITION OF iot_readings
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

### 3. Set up Archival

```sql
-- Archive old IoT readings (>90 days)
CREATE TABLE iot_readings_archive (LIKE iot_readings INCLUDING ALL);

INSERT INTO iot_readings_archive
SELECT * FROM iot_readings
WHERE timestamp < NOW() - INTERVAL '90 days';

DELETE FROM iot_readings
WHERE timestamp < NOW() - INTERVAL '90 days';
```

---

## 📈 MONITORING

### Database Size Monitoring

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'autonomous_decisions',
    'demand_forecasts',
    'iot_readings',
    'velocity_classifications',
    'digital_twin_states',
    'environmental_readings',
    'autonomous_configs'
  )
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Growth Rate Monitoring

```sql
-- Monitor daily growth
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS decisions,
  SUM(estimated_cost) AS total_cost,
  AVG(confidence) AS avg_confidence
FROM autonomous_decisions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## ✅ COMPLETION CHECKLIST

- [ ] Migration generated successfully
- [ ] Migration applied to staging
- [ ] Validation tests passed
- [ ] Indexes created and analyzed
- [ ] Prisma client regenerated
- [ ] API endpoints tested
- [ ] Services tested
- [ ] Performance benchmarks met
- [ ] Monitoring set up
- [ ] Documentation updated
- [ ] Team notified
- [ ] Migration applied to production

---

## 🆘 TROUBLESHOOTING

### Error: "Column already exists"

```bash
# Reset migrations
npx prisma migrate reset --skip-seed
npx prisma migrate dev
```

### Error: "Foreign key constraint fails"

```sql
-- Check orphaned records
SELECT i.id 
FROM inventory_items i
LEFT JOIN organizations o ON i.organization_id = o.id
WHERE o.id IS NULL;

-- Clean up orphans
DELETE FROM inventory_items
WHERE organization_id NOT IN (SELECT id FROM organizations);
```

### Error: "Out of memory"

```sql
-- Reduce batch size for large migrations
ALTER TABLE iot_readings SET (fillfactor = 70);
VACUUM FULL iot_readings;
```

---

## 📞 SUPPORT

For issues or questions:
- Check logs: `tail -f /var/log/postgresql/postgresql.log`
- Prisma docs: https://www.prisma.io/docs/concepts/components/prisma-migrate
- GitHub Issues: https://github.com/your-org/flowstock/issues

---

**Migration Status**: ✅ Ready to Apply  
**Risk Level**: 🟡 Medium (adds tables, enhances existing)  
**Downtime Required**: None (backward compatible)  
**Estimated Time**: 2-5 minutes

---

*Last Updated: January 4, 2026*
