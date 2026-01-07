import * as React from "react";

export interface UseToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

const toastVariants = {
  default: "bg-white border-gray-200",
  destructive: "bg-red-50 border-red-200 text-red-900",
};

export function useToast() {
  const [toasts, setToasts] = React.useState<UseToastOptions[]>([]);

  const toast = React.useCallback((options: UseToastOptions) => {
    setToasts((prev) => [...prev, options]);

    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, options.duration || 3000);
  }, []);

  return { toast, toasts };
}
