# 🔥 LOAD TESTING GUIDE

## LogiVox WMS - Performance & Load Testing

### Overview

This guide covers load testing strategies, tools, and benchmarks for ensuring LogiVox can handle production traffic at scale.

---

## 🎯 Performance Targets

### Response Time Targets

| Metric             | Target  | Acceptable | Unacceptable |
| ------------------ | ------- | ---------- | ------------ |
| **Page Load**      | < 1s    | < 2s       | > 3s         |
| **API Response**   | < 200ms | < 500ms    | > 1s         |
| **Search Query**   | < 300ms | < 600ms    | > 1s         |
| **Database Query** | < 100ms | < 300ms    | > 500ms      |

### Throughput Targets

| Metric                    | Target |
| ------------------------- | ------ |
| **Concurrent Users**      | 1000+  |
| **API Requests/Second**   | 500+   |
| **Database Connections**  | 100+   |
| **WebSocket Connections** | 500+   |

---

## 🛠️ Tools

### 1. Playwright Load Tests

Built-in load tests using Playwright:

```bash
# Run all load tests
npm run test:load

# Run specific load test suite
npx playwright test e2e/load-testing.spec.ts

# Run with specific concurrency
npx playwright test --workers=10
```

### 2. k6 Load Testing

Install k6 for advanced load testing:

```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Linux)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 3. Apache JMeter

For GUI-based load testing:

```bash
# Download from https://jmeter.apache.org/
# Run:
./bin/jmeter
```

---

## 📋 Test Scenarios

### Scenario 1: Normal Load

**Goal:** Verify system handles typical daily traffic

- 100 concurrent users
- 5-minute ramp-up
- 30-minute sustained load
- Mix of operations: 60% reads, 40% writes

**k6 Script:**

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "5m", target: 100 }, // Ramp up
    { duration: "30m", target: 100 }, // Stay at 100
    { duration: "5m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% under 500ms
    http_req_failed: ["rate<0.01"], // Error rate <1%
  },
};

export default function () {
  // Read operations (60%)
  if (Math.random() < 0.6) {
    const res = http.get("http://localhost:3000/api/inventory");
    check(res, { "status is 200": (r) => r.status === 200 });
  } else {
    // Write operations (40%)
    const payload = JSON.stringify({
      sku: `ITEM-${Date.now()}`,
      quantity: 100,
    });
    const res = http.post("http://localhost:3000/api/inventory", payload, {
      headers: { "Content-Type": "application/json" },
    });
    check(res, { "status is 201": (r) => r.status === 201 });
  }

  sleep(1); // Think time
}
```

**Run:**

```bash
k6 run scripts/load-tests/normal-load.js
```

### Scenario 2: Peak Load

**Goal:** Test system under peak traffic (Black Friday, end-of-month)

- 500 concurrent users
- 2-minute ramp-up
- 15-minute sustained load

**k6 Script:**

```javascript
export const options = {
  stages: [
    { duration: "2m", target: 500 },
    { duration: "15m", target: 500 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.05"], // 5% error rate acceptable
  },
};

export default function () {
  const endpoints = [
    "/api/inventory",
    "/api/orders",
    "/api/shipments",
    "/api/products",
    "/api/customers",
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  http.get(`http://localhost:3000${endpoint}`);

  sleep(0.5);
}
```

**Run:**

```bash
k6 run scripts/load-tests/peak-load.js
```

### Scenario 3: Stress Test

**Goal:** Find breaking point

- Gradually increase to 2000 users
- Monitor when system starts degrading

**k6 Script:**

```javascript
export const options = {
  stages: [
    { duration: "5m", target: 500 },
    { duration: "5m", target: 1000 },
    { duration: "5m", target: 1500 },
    { duration: "5m", target: 2000 },
    { duration: "10m", target: 2000 },
  ],
};

export default function () {
  http.get("http://localhost:3000/api/inventory");
  sleep(Math.random() * 2);
}
```

### Scenario 4: Spike Test

**Goal:** Test recovery from sudden traffic spikes

- Sudden jump from 100 to 1000 users
- Verify system recovers

**k6 Script:**

```javascript
export const options = {
  stages: [
    { duration: "1m", target: 100 },
    { duration: "10s", target: 1000 }, // Spike
    { duration: "3m", target: 1000 },
    { duration: "10s", target: 100 },
    { duration: "1m", target: 100 },
  ],
};
```

### Scenario 5: Soak Test (Endurance)

**Goal:** Check for memory leaks and degradation over time

- 200 concurrent users
- 4-hour sustained load

**k6 Script:**

```javascript
export const options = {
  stages: [
    { duration: "5m", target: 200 },
    { duration: "4h", target: 200 },
    { duration: "5m", target: 0 },
  ],
};
```

---

## 📊 Monitoring During Tests

### Metrics to Track

1. **Response Times**
   - Average
   - 95th percentile
   - 99th percentile
   - Max

2. **Throughput**
   - Requests per second
   - Successful requests
   - Failed requests
   - Error rate

3. **System Resources**
   - CPU usage
   - Memory usage
   - Database connections
   - Network I/O

4. **Database**
   - Query execution time
   - Connection pool usage
   - Slow queries
   - Deadlocks

### Monitoring Tools

**1. Prometheus + Grafana**

Access metrics endpoint:

```
http://localhost:3000/api/metrics
```

**2. Database Monitoring**

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Lock waits
SELECT * FROM pg_locks WHERE NOT granted;
```

**3. Application Logs**

```bash
# Real-time log monitoring
tail -f logs/application.log | grep ERROR

# Error rate per minute
grep ERROR logs/application.log | awk '{print $1}' | uniq -c
```

---

## 🎯 Optimization Strategies

### 1. Database Optimization

**Connection Pooling:**

```env
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=100
DATABASE_POOL_TIMEOUT=30000
```

**Query Optimization:**

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM inventory WHERE sku = 'ITEM-001';
```

### 2. Caching

**Redis Caching:**

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Cache inventory query
const cacheKey = `inventory:${sku}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const data = await prisma.inventory.findUnique({ where: { sku } });
await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min TTL
return data;
```

### 3. API Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

app.use("/api/", limiter);
```

### 4. Load Balancing

**Nginx Configuration:**

```nginx
upstream logivox {
    least_conn;
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://logivox;
    }
}
```

---

## ✅ Acceptance Criteria

### Must Pass

- ✅ 1000 concurrent users with <2s page load
- ✅ 500 API requests/second with <500ms response
- ✅ Error rate <1% under normal load
- ✅ Error rate <5% under peak load
- ✅ No memory leaks in 4-hour soak test
- ✅ Recovery from spike within 2 minutes

### Should Pass

- ✅ 2000 concurrent users without crashes
- ✅ 95th percentile <500ms
- ✅ Database connection pool never exhausted
- ✅ CPU usage <80% under peak load

---

## 📝 Test Report Template

```markdown
# Load Test Report

**Date:** 2026-01-03
**Tester:** John Doe
**Environment:** Staging

## Test Configuration

- Scenario: Peak Load
- Users: 500 concurrent
- Duration: 15 minutes
- Endpoint: Mixed operations

## Results

### Response Times

- Average: 234ms ✅
- 95th percentile: 456ms ✅
- 99th percentile: 892ms ✅
- Max: 1.2s ⚠️

### Throughput

- Requests/second: 532 ✅
- Total requests: 479,280
- Success rate: 99.2% ✅

### System Resources

- CPU: Peak 72% ✅
- Memory: Peak 6.2GB ✅
- Database connections: Peak 87/100 ✅

## Issues Found

1. Occasional 1s+ response on /api/reports endpoint
2. Memory usage trending upward (potential leak?)

## Recommendations

1. Optimize /api/reports query
2. Investigate memory usage pattern
3. Add more caching for product catalog
```

---

## 🚀 Running Load Tests

### Local Testing

```bash
# Start application
npm run dev

# Run Playwright load tests
npm run test:load

# Run k6 load tests
k6 run scripts/load-tests/normal-load.js
```

### Staging Testing

```bash
# Deploy to staging
npm run deploy:staging

# Run load tests against staging
k6 run scripts/load-tests/peak-load.js --env ENVIRONMENT=staging

# Monitor during test
watch -n 1 'curl -s https://staging.logivox.com/api/metrics | grep http_requests'
```

### Production Monitoring

```bash
# Real-time metrics
curl https://logivox.com/api/metrics

# Grafana dashboard
open https://grafana.logivox.com/d/logivox-performance
```

---

**Last Updated:** January 3, 2026  
**Status:** Production Ready  
**Next Review:** After 1 week of production traffic
