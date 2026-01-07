/**
 * Lazy Loading Utilities
 * Dynamic imports and code splitting helpers
 */

import dynamic from "next/dynamic";
import { ComponentType, ReactNode } from "react";

/**
 * Loading fallback component
 */
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`}
      />
    </div>
  );
}

/**
 * Loading skeleton component
 */
export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Error fallback component
 */
export function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <p className="text-red-600 font-semibold">Failed to load component</p>
      {error && <p className="text-sm text-gray-600 mt-2">{error.message}</p>}
    </div>
  );
}

/**
 * Lazy load component with custom loading
 */
export function lazyLoad<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ReactNode;
    fallback?: ReactNode;
  },
) {
  return dynamic(importFn, {
    loading: () => <>{options?.loading || <LoadingSpinner />}</>,
    ssr: false,
  });
}

/**
 * Lazy load with SSR support
 */
export function lazyLoadSSR<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ReactNode;
  },
) {
  return dynamic(importFn, {
    loading: () => <>{options?.loading || <LoadingSpinner />}</>,
    ssr: true,
  });
}

/**
 * Lazy loaded components for common features
 */

// Dashboard components
export const LazyDashboardCharts = lazyLoad(
  () => import("@/components/dashboard/charts"),
  { loading: <LoadingSkeleton rows={5} /> },
);

export const LazyDashboardStats = lazyLoad(
  () => import("@/components/dashboard/stats"),
  { loading: <LoadingSkeleton rows={2} /> },
);

// Inventory components
export const LazyInventoryTable = lazyLoad(
  () => import("@/components/inventory/inventory-table"),
  { loading: <LoadingSkeleton rows={10} /> },
);

export const LazyInventoryForm = lazyLoad(
  () => import("@/components/inventory/inventory-form"),
  { loading: <LoadingSkeleton rows={8} /> },
);

// Order components
export const LazyOrderTable = lazyLoad(
  () => import("@/components/orders/order-table"),
  { loading: <LoadingSkeleton rows={10} /> },
);

export const LazyOrderForm = lazyLoad(
  () => import("@/components/orders/order-form"),
  { loading: <LoadingSkeleton rows={8} /> },
);

// Report components
export const LazyReportViewer = lazyLoad(
  () => import("@/components/reports/report-viewer"),
  { loading: <LoadingSkeleton rows={15} /> },
);

export const LazyReportExport = lazyLoad(
  () => import("@/components/reports/report-export"),
  { loading: <LoadingSkeleton rows={3} /> },
);

// Settings components
export const LazySettingsForm = lazyLoad(
  () => import("@/components/settings/settings-form"),
  { loading: <LoadingSkeleton rows={10} /> },
);

// User management components
export const LazyUserTable = lazyLoad(
  () => import("@/components/users/user-table"),
  { loading: <LoadingSkeleton rows={8} /> },
);

// Warehouse components
export const LazyWarehouseMap = lazyLoad(
  () => import("@/components/warehouse/warehouse-map"),
  { loading: <LoadingSpinner size="lg" /> },
);

// Modal components
export const LazyModal = lazyLoad(() => import("@/components/ui/modal"), {
  loading: <LoadingSpinner />,
});

// Chart components (heavy libraries)
export const LazyChartjs = lazyLoad(
  () => import("@/components/charts/chartjs"),
  {
    loading: <LoadingSkeleton rows={5} />,
  },
);

export const LazyApexCharts = lazyLoad(
  () => import("@/components/charts/apex-charts"),
  { loading: <LoadingSkeleton rows={5} /> },
);

/**
 * Prefetch utilities
 */
export function prefetchComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>,
): void {
  if (typeof window !== "undefined") {
    // Prefetch on idle
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => {
        importFn();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        importFn();
      }, 1);
    }
  }
}

/**
 * Route-based code splitting
 */
export const RouteComponents = {
  // Dashboard
  Dashboard: lazyLoad(() => import("@/app/(dashboard)/page")),

  // Inventory
  Inventory: lazyLoad(() => import("@/app/(dashboard)/inventory/page")),
  InventoryDetails: lazyLoad(
    () => import("@/app/(dashboard)/inventory/[id]/page"),
  ),

  // Orders
  Orders: lazyLoad(() => import("@/app/(dashboard)/orders/page")),
  OrderDetails: lazyLoad(() => import("@/app/(dashboard)/orders/[id]/page")),

  // Warehouse
  Warehouse: lazyLoad(() => import("@/app/(dashboard)/warehouse/page")),
  WarehouseDetails: lazyLoad(
    () => import("@/app/(dashboard)/warehouse/[id]/page"),
  ),

  // Reports
  Reports: lazyLoad(() => import("@/app/(dashboard)/reports/page")),

  // Settings
  Settings: lazyLoad(() => import("@/app/(dashboard)/settings/page")),

  // Users
  Users: lazyLoad(() => import("@/app/(dashboard)/users/page")),
};

/**
 * Image lazy loading helper
 */
export interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: LazyImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

/**
 * Intersection Observer for lazy loading
 */
export function useLazyLoad(options?: IntersectionObserverInit) {
  if (typeof window === "undefined") return null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement;
        const src = target.dataset.src;
        if (src) {
          target.setAttribute("src", src);
          observer.unobserve(target);
        }
      }
    });
  }, options);

  return observer;
}
