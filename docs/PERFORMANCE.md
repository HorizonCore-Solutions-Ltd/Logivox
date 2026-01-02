# Performance Optimization Guide

## Overview
This guide provides comprehensive strategies and implementation details for optimizing LogiVox WMS performance across all layers of the application.

---

## 1. Database Performance

### Indexing Strategy
All critical database queries are optimized with appropriate indexes. See `prisma/indexes-schema.txt` for complete index definitions.

**Key Indexes:**
- **Inventory**: SKU, warehouse+status, reorder point queries
- **Orders**: Order number, customer+status, warehouse+status
- **Users**: Email, role, status
- **Audit Logs**: User+timestamp, event type, severity

**Index Guidelines:**
```typescript
// Good: Composite index for common query
@@index([warehouseId, status], name: "idx_inventory_warehouse_status")

// Good: Full-text search for name/description
@@fulltext([name, description], name: "idx_inventory_search")

// Avoid: Too many indexes slow writes
// Avoid: Indexes on low-cardinality columns
```

### Query Optimization
Use the Query Optimizer utilities in `lib/db/query-optimizer.ts`:

```typescript
import { SelectFields, OptimizedIncludes } from '@/lib/db/query-optimizer';

// Only select needed fields
const inventory = await prisma.inventory.findMany({
  select: SelectFields.inventory,
  include: OptimizedIncludes.inventoryMinimal,
});

// Use pagination
const { data, pagination } = buildPaginatedResult(
  items,
  total,
  page,
  limit
);
```

### Connection Pooling
Configure Prisma connection pool in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pool settings
  pool_timeout = 10
  connection_limit = 20
}
```

---

## 2. Caching Strategy

### Redis Caching
Implement multi-layer caching with `lib/cache/redis-cache.ts`:

```typescript
import { cache, CachePrefix, CacheTTL } from '@/lib/cache/redis-cache';

// Get or compute and cache
const inventory = await cache.getOrSet(
  `${CachePrefix.INVENTORY}${id}`,
  async () => fetchInventoryFromDB(id),
  CacheTTL.MEDIUM // 5 minutes
);

// Invalidate on updates
await invalidateInventoryCache(id);
```

**Cache TTL Recommendations:**
- **User data**: 5 minutes (MEDIUM)
- **Inventory**: 5 minutes (MEDIUM)
- **Orders**: 1 minute (SHORT)
- **Stats/Reports**: 1 hour (LONG)
- **Settings**: 24 hours (VERY_LONG)

### Cache Invalidation
Always invalidate cache after data mutations:

```typescript
// After creating/updating inventory
await invalidateInventoryCache(inventoryId);
await invalidateStatsCache(); // If affects stats

// After order update
await invalidateOrderCache(orderId);
await invalidateStatsCache();
```

---

## 3. API Response Optimization

### Compression
Enable response compression with `lib/performance/compression.ts`:

```typescript
import { compressedJson } from '@/lib/performance/compression';

// In API route
export async function GET(req: NextRequest) {
  const data = await fetchLargeDataset();
  
  // Automatically compresses if > 1KB and client supports it
  return compressedJson(data, req);
}
```

**Compression Benefits:**
- 60-80% size reduction for JSON
- Reduces bandwidth costs
- Faster response times
- Automatic gzip/deflate negotiation

### Pagination
Always paginate large datasets:

```typescript
import { getPaginationParams } from '@/lib/db/query-optimizer';

const { page, limit, skip, take } = getPaginationParams({
  page: 1,
  limit: 20,
});

const [items, total] = await Promise.all([
  prisma.inventory.findMany({ skip, take }),
  prisma.inventory.count(),
]);
```

### Field Selection
Only return necessary fields:

```typescript
// Bad: Returns all fields
const users = await prisma.user.findMany();

// Good: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

---

## 4. Frontend Optimization

### Code Splitting
Use lazy loading for routes and components:

```typescript
import { lazyLoad } from '@/lib/performance/lazy-loading';

// Lazy load heavy components
const InventoryTable = lazyLoad(
  () => import('@/components/inventory/inventory-table')
);

// In component
<Suspense fallback={<LoadingSkeleton />}>
  <InventoryTable />
</Suspense>
```

**Components to Lazy Load:**
- Dashboard charts
- Report viewers
- Modal dialogs
- Heavy tables
- Maps and visualizations

### Image Optimization
Optimize images with `lib/performance/image-optimization.ts`:

```typescript
import { ImageSizePresets, getOptimizedImageUrl } from '@/lib/performance/image-optimization';

// Use optimized URLs
const thumbnailUrl = getOptimizedImageUrl(src, ImageSizePresets.thumbnail);

// Generate responsive srcset
const srcSet = generateSrcSet(src, [640, 1024, 1920]);
```

**Image Best Practices:**
- Use WebP format (25-35% smaller)
- Implement lazy loading
- Add blur placeholders
- Serve from CDN
- Use appropriate sizes

### Bundle Size Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Keep bundles under 500KB per route
# Use dynamic imports for large libraries
```

---

## 5. Performance Monitoring

### Track Performance Metrics
Use Performance Monitor from `lib/performance/monitoring.ts`:

```typescript
import { performanceMonitor, Measure } from '@/lib/performance/monitoring';

// Decorator for functions
@Measure('fetchInventory')
async function fetchInventory() {
  // ... code
}

// Manual measurement
performanceMonitor.start('complex_operation');
// ... do work
performanceMonitor.end('complex_operation');

// Get statistics
const summary = performanceMonitor.getSummary();
```

### Web Vitals Monitoring
Track Core Web Vitals:

```typescript
import { trackWebVitals } from '@/lib/performance/monitoring';

// In _app.tsx
export function reportWebVitals(metric: any) {
  trackWebVitals(metric);
}
```

**Target Metrics:**
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms

---

## 6. Backend Optimization

### Database Query Monitoring
Track slow queries:

```typescript
import { TrackQuery } from '@/lib/db/query-optimizer';

@TrackQuery('getInventoryWithMovements')
async function getInventoryWithMovements(id: string) {
  return prisma.inventory.findUnique({
    where: { id },
    include: { movements: true },
  });
}

// Logs warning if query > 1 second
```

### Batch Operations
Process large datasets in batches:

```typescript
import { batchProcess } from '@/lib/db/query-optimizer';

const results = await batchProcess(
  items,
  async (batch) => {
    return prisma.inventory.createMany({ data: batch });
  },
  100 // batch size
);
```

### Connection Management
- Use connection pooling (configured in Prisma)
- Close connections properly
- Implement connection retry logic
- Monitor connection pool usage

---

## 7. CDN & Asset Delivery

### CDN Configuration
Configure CDN for static assets:

```typescript
import { getCDNImageUrl, CDNConfig } from '@/lib/performance/image-optimization';

const cdn: CDNConfig = {
  provider: 'cloudflare',
  baseUrl: process.env.CDN_URL,
};

const optimizedUrl = getCDNImageUrl(src, config, cdn);
```

**CDN Best Practices:**
- Host images on CDN
- Enable automatic compression
- Set long cache headers (1 year)
- Use edge caching
- Implement image resizing at edge

---

## 8. Performance Budget

### Budget Thresholds
```typescript
const BUDGETS = {
  apiCall: 500, // ms
  databaseQuery: 100, // ms
  pageLoad: 3000, // ms
  componentRender: 16, // ms (60fps)
  bundleSize: 500000, // bytes (500KB)
};
```

### Monitoring Budget
```typescript
import { checkPerformanceBudgets } from '@/lib/performance/monitoring';

const budgets = checkPerformanceBudgets();
budgets.forEach(({ budget, exceeded, value }) => {
  if (exceeded) {
    console.warn(`Budget exceeded: ${budget.name} = ${value}${budget.unit}`);
  }
});
```

---

## 9. Production Optimizations

### Next.js Configuration
```javascript
// next.config.js
module.exports = {
  // Enable SWC minification
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['cdn.yourapp.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Compression
  compress: true,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### Environment Variables
```env
# Production optimizations
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Database optimization
DATABASE_POOL_SIZE=20
DATABASE_POOL_TIMEOUT=10000

# Redis caching
REDIS_CACHE_TTL=300

# CDN
CDN_URL=https://cdn.yourapp.com
```

---

## 10. Performance Checklist

### Before Deployment
- [ ] Add database indexes for all frequent queries
- [ ] Enable Redis caching for read-heavy data
- [ ] Implement API response compression
- [ ] Configure CDN for static assets
- [ ] Enable image optimization
- [ ] Implement code splitting and lazy loading
- [ ] Set appropriate cache headers
- [ ] Configure connection pooling
- [ ] Enable production minification
- [ ] Remove source maps in production

### Regular Monitoring
- [ ] Review slow query logs weekly
- [ ] Check cache hit rates
- [ ] Monitor Web Vitals
- [ ] Review bundle size reports
- [ ] Check API response times
- [ ] Monitor database connection pool
- [ ] Review error rates
- [ ] Check memory usage

### Optimization Priorities
1. **Database**: Indexes, query optimization, connection pooling
2. **Caching**: Redis for reads, intelligent invalidation
3. **API**: Compression, pagination, field selection
4. **Frontend**: Code splitting, lazy loading, image optimization
5. **CDN**: Static assets, image delivery, edge caching

---

## Additional Resources

- **Prisma Performance**: https://www.prisma.io/docs/guides/performance-and-optimization
- **Next.js Performance**: https://nextjs.org/docs/advanced-features/measuring-performance
- **Web Vitals**: https://web.dev/vitals/
- **Redis Best Practices**: https://redis.io/docs/manual/performance/
