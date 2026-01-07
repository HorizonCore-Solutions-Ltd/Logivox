/**
 * Screen Reader Utilities
 *
 * Comprehensive utilities for enhancing screen reader support
 * across the LogiVox application. WCAG 2.1 AA compliant.
 */

import { useEffect, useRef } from "react";

// ==========================================
// ARIA LABEL GENERATORS
// ==========================================

/**
 * Generate accessible labels for common UI patterns
 */
export const ariaLabels = {
  // Navigation
  navigation: {
    main: "Main navigation",
    breadcrumb: "Breadcrumb navigation",
    pagination: "Pagination navigation",
    user: "User account navigation",
    sidebar: "Sidebar navigation",
  },

  // Actions
  actions: {
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    refresh: "Refresh",
    download: "Download",
    upload: "Upload",
    add: "Add",
    remove: "Remove",
    expand: "Expand",
    collapse: "Collapse",
  },

  // Status
  status: {
    loading: "Loading...",
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Information",
  },

  // Forms
  forms: {
    required: "(required)",
    optional: "(optional)",
    error: "Error:",
    help: "Help text:",
  },
};

/**
 * Generate descriptive label for a button with an icon
 * @example getIconButtonLabel('Delete', 'Product ABC') => 'Delete Product ABC'
 */
export function getIconButtonLabel(action: string, target?: string): string {
  return target ? `${action} ${target}` : action;
}

/**
 * Generate label for a table row action
 * @example getTableActionLabel('edit', 'product', 'Laptop Pro') => 'Edit product Laptop Pro'
 */
export function getTableActionLabel(
  action: string,
  itemType: string,
  itemName: string,
): string {
  return `${action} ${itemType} ${itemName}`;
}

/**
 * Generate label for a pagination button
 * @example getPaginationLabel(5, true) => 'Page 5, current page'
 */
export function getPaginationLabel(page: number, isCurrent: boolean): string {
  return isCurrent ? `Page ${page}, current page` : `Go to page ${page}`;
}

/**
 * Generate label for a sort button
 * @example getSortLabel('Name', 'asc') => 'Sort by Name, ascending'
 */
export function getSortLabel(
  column: string,
  direction?: "asc" | "desc",
): string {
  if (!direction) return `Sort by ${column}`;
  const dir = direction === "asc" ? "ascending" : "descending";
  return `Sort by ${column}, ${dir}`;
}

// ==========================================
// ARIA LIVE REGIONS
// ==========================================

export type AriaLivePriority = "polite" | "assertive" | "off";

/**
 * Announce a message to screen readers
 * Uses the global ScreenReaderAnnouncer component
 */
export function announceToScreenReader(
  message: string,
  priority: AriaLivePriority = "polite",
  timeout: number = 5000,
): void {
  // Create or get existing live region
  const regionId = `sr-announce-${priority}`;
  let region = document.getElementById(regionId);

  if (!region) {
    // Fallback: create temporary live region if ScreenReaderAnnouncer not mounted
    region = document.createElement("div");
    region.id = regionId;
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", priority);
    region.setAttribute("aria-atomic", "true");
    region.className = "sr-only";
    document.body.appendChild(region);
  }

  // Clear previous message
  region.textContent = "";

  // Announce new message (delay ensures screen reader picks it up)
  setTimeout(() => {
    if (region) {
      region.textContent = message;
    }
  }, 100);

  // Clear message after timeout
  if (timeout > 0) {
    setTimeout(() => {
      if (region && region.textContent === message) {
        region.textContent = "";
      }
    }, timeout);
  }
}

/**
 * Hook to announce messages to screen readers
 */
export function useScreenReaderAnnouncement() {
  return {
    announce: (message: string, priority: AriaLivePriority = "polite") => {
      announceToScreenReader(message, priority);
    },
  };
}

// ==========================================
// LOADING STATES
// ==========================================

/**
 * Props for loading announcements
 */
export interface LoadingAnnouncementProps {
  isLoading: boolean;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook to announce loading states
 */
export function useLoadingAnnouncement({
  isLoading,
  loadingMessage = "Loading...",
  successMessage,
  errorMessage,
}: LoadingAnnouncementProps) {
  const previousLoadingRef = useRef(isLoading);

  useEffect(() => {
    // Loading started
    if (isLoading && !previousLoadingRef.current) {
      announceToScreenReader(loadingMessage, "polite");
    }

    // Loading finished successfully
    if (!isLoading && previousLoadingRef.current && successMessage) {
      announceToScreenReader(successMessage, "polite");
    }

    previousLoadingRef.current = isLoading;
  }, [isLoading, loadingMessage, successMessage]);

  // Announce errors separately
  const announceError = (error?: string) => {
    announceToScreenReader(
      error || errorMessage || "An error occurred",
      "assertive",
    );
  };

  return { announceError };
}

// ==========================================
// FORM VALIDATION
// ==========================================

/**
 * Generate accessible error message for form fields
 */
export function getFieldErrorMessage(
  fieldLabel: string,
  error: string,
): string {
  return `${fieldLabel}: ${error}`;
}

/**
 * Generate accessible success message for forms
 */
export function getFormSuccessMessage(formName: string): string {
  return `${formName} submitted successfully`;
}

/**
 * Hook to announce form validation errors
 */
export function useFormValidationAnnouncement() {
  const announceError = (fieldLabel: string, error: string) => {
    const message = getFieldErrorMessage(fieldLabel, error);
    announceToScreenReader(message, "assertive");
  };

  const announceSuccess = (formName: string) => {
    const message = getFormSuccessMessage(formName);
    announceToScreenReader(message, "polite");
  };

  return { announceError, announceSuccess };
}

// ==========================================
// DATA TABLE ANNOUNCEMENTS
// ==========================================

/**
 * Announce table updates
 */
export function announceTableUpdate(
  action: "loaded" | "updated" | "sorted" | "filtered",
  itemCount: number,
  itemType: string,
): void {
  const messages = {
    loaded: `Loaded ${itemCount} ${itemType}${itemCount !== 1 ? "s" : ""}`,
    updated: `Table updated with ${itemCount} ${itemType}${itemCount !== 1 ? "s" : ""}`,
    sorted: `Table sorted, showing ${itemCount} ${itemType}${itemCount !== 1 ? "s" : ""}`,
    filtered: `Filtered to ${itemCount} ${itemType}${itemCount !== 1 ? "s" : ""}`,
  };

  announceToScreenReader(messages[action], "polite");
}

/**
 * Hook to announce table updates
 */
export function useTableAnnouncement(itemType: string) {
  return {
    announceLoaded: (count: number) =>
      announceTableUpdate("loaded", count, itemType),
    announceUpdated: (count: number) =>
      announceTableUpdate("updated", count, itemType),
    announceSorted: (count: number) =>
      announceTableUpdate("sorted", count, itemType),
    announceFiltered: (count: number) =>
      announceTableUpdate("filtered", count, itemType),
  };
}

// ==========================================
// MODAL / DIALOG ANNOUNCEMENTS
// ==========================================

/**
 * Announce modal state changes
 */
export function announceModalState(isOpen: boolean, modalTitle: string): void {
  if (isOpen) {
    announceToScreenReader(`${modalTitle} dialog opened`, "polite");
  } else {
    announceToScreenReader("Dialog closed", "polite");
  }
}

/**
 * Hook to announce modal state
 */
export function useModalAnnouncement(title: string) {
  const previousOpenRef = useRef(false);

  useEffect(() => {
    return () => {
      // Announce when modal closes
      if (previousOpenRef.current) {
        announceToScreenReader("Dialog closed", "polite");
      }
    };
  }, []);

  const announceOpen = () => {
    announceToScreenReader(`${title} dialog opened`, "polite");
    previousOpenRef.current = true;
  };

  return { announceOpen };
}

// ==========================================
// NOTIFICATION ANNOUNCEMENTS
// ==========================================

/**
 * Announce toast/notification messages
 */
export function announceNotification(
  type: "success" | "error" | "warning" | "info",
  message: string,
): void {
  const priority: AriaLivePriority = type === "error" ? "assertive" : "polite";
  const prefix = type === "error" ? "Error: " : "";
  announceToScreenReader(`${prefix}${message}`, priority);
}

// ==========================================
// NAVIGATION ANNOUNCEMENTS
// ==========================================

/**
 * Announce route changes
 */
export function announceRouteChange(pageName: string): void {
  announceToScreenReader(`Navigated to ${pageName}`, "polite", 3000);
}

/**
 * Hook to announce route changes
 */
export function useRouteAnnouncement() {
  const announce = (pageName: string) => {
    announceRouteChange(pageName);
  };

  return { announce };
}

// ==========================================
// PROGRESS ANNOUNCEMENTS
// ==========================================

/**
 * Announce progress updates
 */
export function announceProgress(
  current: number,
  total: number,
  label?: string,
): void {
  const percentage = Math.round((current / total) * 100);
  const message = label
    ? `${label}: ${percentage}% complete`
    : `${percentage}% complete`;

  // Only announce at 25% intervals to avoid spam
  if (percentage % 25 === 0 || percentage === 100) {
    announceToScreenReader(message, "polite");
  }
}

// ==========================================
// SEMANTIC HTML HELPERS
// ==========================================

/**
 * Get appropriate heading level based on section depth
 */
export function getHeadingLevel(
  depth: number,
): "h1" | "h2" | "h3" | "h4" | "h5" | "h6" {
  const level = Math.min(Math.max(depth, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
  return `h${level}`;
}

/**
 * Generate landmark role labels
 */
export const landmarkLabels = {
  header: "Site header",
  nav: "Main navigation",
  main: "Main content",
  aside: "Sidebar",
  footer: "Site footer",
  search: "Search",
  form: "Form",
  region: "Region",
};

// ==========================================
// ALT TEXT GENERATORS
// ==========================================

/**
 * Generate alt text for user avatars
 */
export function getAvatarAltText(userName: string, hasImage: boolean): string {
  return hasImage ? `${userName}'s profile picture` : `${userName}'s initials`;
}

/**
 * Generate alt text for status icons
 */
export function getStatusIconAltText(status: string): string {
  const statusMap: Record<string, string> = {
    success: "Success icon",
    error: "Error icon",
    warning: "Warning icon",
    info: "Information icon",
    loading: "Loading spinner",
    active: "Active status",
    inactive: "Inactive status",
    pending: "Pending status",
  };

  return statusMap[status.toLowerCase()] || `${status} icon`;
}

/**
 * Generate alt text for charts/graphs
 */
export function getChartAltText(
  chartType: string,
  dataPoints: number,
  trend?: "increasing" | "decreasing" | "stable",
): string {
  let alt = `${chartType} chart with ${dataPoints} data point${dataPoints !== 1 ? "s" : ""}`;

  if (trend) {
    alt += `, showing ${trend} trend`;
  }

  return alt;
}

// ==========================================
// DESCRIPTIVE TEXT
// ==========================================

/**
 * Format numbers for screen readers
 * @example formatNumberForScreenReader(1234567) => '1,234,567'
 */
export function formatNumberForScreenReader(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format currency for screen readers
 * @example formatCurrencyForScreenReader(1234.56) => '$1,234.56 dollars'
 */
export function formatCurrencyForScreenReader(
  amount: number,
  currency: string = "USD",
): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

  return `${formatted} ${currency.toLowerCase()}`;
}

/**
 * Format dates for screen readers
 * @example formatDateForScreenReader(new Date()) => 'October 15, 2025'
 */
export function formatDateForScreenReader(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Format time for screen readers
 * @example formatTimeForScreenReader(new Date()) => '2:30 PM'
 */
export function formatTimeForScreenReader(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

// ==========================================
// KEYBOARD NAVIGATION HELPERS
// ==========================================

/**
 * Get appropriate role for interactive elements
 */
export function getInteractiveRole(
  element: "link" | "button" | "tab" | "menuitem",
): string {
  const roleMap = {
    link: "link",
    button: "button",
    tab: "tab",
    menuitem: "menuitem",
  };

  return roleMap[element];
}

/**
 * Generate aria-label for icon-only buttons
 */
export function getIconOnlyButtonLabel(
  icon: string,
  action: string,
  target?: string,
): string {
  if (target) {
    return `${action} ${target}`;
  }
  return action;
}
