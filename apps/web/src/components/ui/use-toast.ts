import * as React from "react";

export interface UseToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

// ---------------------------------------------------------------------------
// Global pub-sub so `toast()` can be called outside React components
// ---------------------------------------------------------------------------
type ToastSubscriber = (options: UseToastOptions) => void;
let _subscriber: ToastSubscriber | null = null;

/** Standalone imperative toast — mirrors the hook API for direct imports. */
export function toast(options: UseToastOptions) {
  if (_subscriber) {
    _subscriber(options);
  } else {
    // Fallback: queue until a Toaster mounts, or log in dev
    if (process.env.NODE_ENV !== "production") {
      console.warn("[toast] called before <Toaster> mounted:", options);
    }
  }
}

const toastVariants = {
  default: "bg-white border-gray-200",
  destructive: "bg-red-50 border-red-200 text-red-900",
};

export function useToast() {
  const [toasts, setToasts] = React.useState<UseToastOptions[]>([]);

  const toastFn = React.useCallback((options: UseToastOptions) => {
    setToasts((prev) => [...prev, options]);

    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, options.duration || 3000);
  }, []);

  // Register this instance so the imperative `toast()` function works
  React.useEffect(() => {
    _subscriber = toastFn;
    return () => {
      if (_subscriber === toastFn) _subscriber = null;
    };
  }, [toastFn]);

  return { toast: toastFn, toasts };
}
