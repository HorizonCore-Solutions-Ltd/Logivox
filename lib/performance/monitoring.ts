/**
 * Performance Monitoring and Optimization
 * Tools for measuring and improving application performance
 */

/**
 * Performance metrics collection
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: "ms" | "bytes" | "count";
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Performance Monitor class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start measuring performance
   */
  start(name: string): void {
    this.startTimes.set(name, Date.now());
  }

  /**
   * End measurement and record metric
   */
  end(name: string, metadata?: Record<string, any>): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      console.warn(`No start time found for metric: ${name}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.record(name, duration, "ms", metadata);
    this.startTimes.delete(name);
    return duration;
  }

  /**
   * Record a metric
   */
  record(
    name: string,
    value: number,
    unit: "ms" | "bytes" | "count" = "ms",
    metadata?: Record<string, any>,
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      metadata,
    };

    const existing = this.metrics.get(name) || [];
    existing.push(metric);

    // Keep only last 100 metrics per name
    if (existing.length > 100) {
      existing.shift();
    }

    this.metrics.set(name, existing);
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get average value for a metric
   */
  getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get percentile value
   */
  getPercentile(name: string, percentile: number): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const sorted = metrics.map((m) => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Get all metrics summary
   */
  getSummary(): Record<
    string,
    {
      count: number;
      avg: number;
      min: number;
      max: number;
      p50: number;
      p95: number;
      p99: number;
    }
  > {
    const summary: Record<string, any> = {};

    for (const [name, metrics] of this.metrics.entries()) {
      const values = metrics.map((m) => m.value).sort((a, b) => a - b);

      summary[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: values[0],
        max: values[values.length - 1],
        p50: values[Math.floor(values.length * 0.5)],
        p95: values[Math.floor(values.length * 0.95)],
        p99: values[Math.floor(values.length * 0.99)],
      };
    }

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }

  /**
   * Export metrics to JSON
   */
  export(): string {
    const data = {
      metrics: Array.from(this.metrics.entries()),
      summary: this.getSummary(),
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }
}

/**
 * Convenience instance
 */
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Decorator for measuring function performance
 */
export function Measure(metricName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.start(name);
      try {
        return await originalMethod.apply(this, args);
      } finally {
        const duration = performanceMonitor.end(name);

        // Log slow operations (> 1 second)
        if (duration > 1000) {
          console.warn(`Slow operation: ${name} took ${duration}ms`);
        }
      }
    };

    return descriptor;
  };
}

/**
 * Web Vitals tracking
 */
export interface WebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

export function trackWebVitals(metric: WebVitals): void {
  performanceMonitor.record(
    "web_vitals",
    Object.values(metric)[0] || 0,
    "ms",
    metric,
  );

  // Log poor Core Web Vitals
  if (metric.LCP && metric.LCP > 2500) {
    console.warn(`Poor LCP: ${metric.LCP}ms (should be < 2.5s)`);
  }
  if (metric.FID && metric.FID > 100) {
    console.warn(`Poor FID: ${metric.FID}ms (should be < 100ms)`);
  }
  if (metric.CLS && metric.CLS > 0.1) {
    console.warn(`Poor CLS: ${metric.CLS} (should be < 0.1)`);
  }
}

/**
 * Memory usage tracking
 */
export function trackMemoryUsage(): void {
  if (typeof window !== "undefined" && "memory" in performance) {
    const memory = (performance as any).memory;
    performanceMonitor.record("memory_used", memory.usedJSHeapSize, "bytes");
    performanceMonitor.record("memory_total", memory.totalJSHeapSize, "bytes");
    performanceMonitor.record("memory_limit", memory.jsHeapSizeLimit, "bytes");
  }
}

/**
 * API performance tracking
 */
export async function measureApiCall<T>(
  name: string,
  apiCall: () => Promise<T>,
): Promise<T> {
  performanceMonitor.start(`api_${name}`);
  try {
    return await apiCall();
  } finally {
    performanceMonitor.end(`api_${name}`);
  }
}

/**
 * Component render tracking
 */
export function measureRender(componentName: string): () => void {
  const startTime = Date.now();

  return () => {
    const duration = Date.now() - startTime;
    performanceMonitor.record(`render_${componentName}`, duration, "ms");

    // Log slow renders (> 16ms = 60fps)
    if (duration > 16) {
      console.warn(`Slow render: ${componentName} took ${duration}ms`);
    }
  };
}

/**
 * Database query performance tracking
 */
export async function measureQuery<T>(
  queryName: string,
  query: () => Promise<T>,
): Promise<T> {
  performanceMonitor.start(`query_${queryName}`);
  try {
    return await query();
  } finally {
    const duration = performanceMonitor.end(`query_${queryName}`);

    // Log slow queries (> 100ms)
    if (duration > 100) {
      console.warn(`Slow query: ${queryName} took ${duration}ms`);
    }
  }
}

/**
 * Performance budget checker
 */
export interface PerformanceBudget {
  name: string;
  threshold: number;
  unit: "ms" | "bytes" | "count";
}

export const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  { name: "api_call", threshold: 500, unit: "ms" },
  { name: "database_query", threshold: 100, unit: "ms" },
  { name: "page_load", threshold: 3000, unit: "ms" },
  { name: "component_render", threshold: 16, unit: "ms" },
  { name: "bundle_size", threshold: 500000, unit: "bytes" }, // 500KB
];

export function checkPerformanceBudgets(): Array<{
  budget: PerformanceBudget;
  exceeded: boolean;
  value: number;
}> {
  return PERFORMANCE_BUDGETS.map((budget) => {
    const avg = performanceMonitor.getAverage(budget.name);
    return {
      budget,
      exceeded: avg > budget.threshold,
      value: avg,
    };
  });
}

/**
 * Performance report generator
 */
export function generatePerformanceReport(): string {
  const summary = performanceMonitor.getSummary();
  const budgets = checkPerformanceBudgets();

  let report = "# Performance Report\n\n";
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += "## Metrics Summary\n\n";
  for (const [name, stats] of Object.entries(summary)) {
    report += `### ${name}\n`;
    report += `- Count: ${stats.count}\n`;
    report += `- Average: ${stats.avg.toFixed(2)}ms\n`;
    report += `- Min: ${stats.min.toFixed(2)}ms\n`;
    report += `- Max: ${stats.max.toFixed(2)}ms\n`;
    report += `- P50: ${stats.p50.toFixed(2)}ms\n`;
    report += `- P95: ${stats.p95.toFixed(2)}ms\n`;
    report += `- P99: ${stats.p99.toFixed(2)}ms\n\n`;
  }

  report += "## Performance Budget Status\n\n";
  for (const { budget, exceeded, value } of budgets) {
    const status = exceeded ? "❌ EXCEEDED" : "✅ OK";
    report += `- ${budget.name}: ${status} (${value.toFixed(2)}${budget.unit} / ${budget.threshold}${budget.unit})\n`;
  }

  return report;
}

/**
 * Performance optimization tips
 */
export const OPTIMIZATION_TIPS = {
  api: [
    "Implement response caching",
    "Use compression for responses",
    "Optimize database queries",
    "Implement pagination",
    "Use connection pooling",
  ],
  database: [
    "Add appropriate indexes",
    "Use query optimization",
    "Implement connection pooling",
    "Cache frequent queries",
    "Use read replicas for scaling",
  ],
  frontend: [
    "Implement code splitting",
    "Use lazy loading",
    "Optimize images",
    "Minimize bundle size",
    "Use service workers for caching",
  ],
  rendering: [
    "Avoid unnecessary re-renders",
    "Use React.memo for expensive components",
    "Implement virtualization for long lists",
    "Optimize CSS and animations",
    "Use debouncing and throttling",
  ],
};
