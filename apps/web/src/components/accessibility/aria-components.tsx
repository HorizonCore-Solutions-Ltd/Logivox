/**
 * ARIA Attributes Component
 *
 * Reusable component for adding comprehensive ARIA attributes
 * to enhance screen reader support across the application.
 */

import React from "react";

// ==========================================
// VISUALLY HIDDEN TEXT
// ==========================================

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Render text that's only visible to screen readers
 * @example <VisuallyHidden>Additional context for screen readers</VisuallyHidden>
 */
export function VisuallyHidden({
  children,
  as: Component = "span",
}: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>;
}

// ==========================================
// ARIA DESCRIBED BY
// ==========================================

interface AriaDescribedByProps {
  id: string;
  children: React.ReactNode;
}

/**
 * Wrapper for description text referenced by aria-describedby
 * @example
 * <AriaDescribedBy id="help-text">Enter your email address</AriaDescribedBy>
 * <input aria-describedby="help-text" />
 */
export function AriaDescribedBy({ id, children }: AriaDescribedByProps) {
  return (
    <div id={id} className="text-sm text-muted-foreground mt-1">
      {children}
    </div>
  );
}

// ==========================================
// ARIA LABEL TEXT
// ==========================================

interface AriaLabelTextProps {
  id: string;
  children: React.ReactNode;
}

/**
 * Hidden label text for aria-labelledby
 * @example
 * <AriaLabelText id="button-label">Close dialog</AriaLabelText>
 * <button aria-labelledby="button-label">X</button>
 */
export function AriaLabelText({ id, children }: AriaLabelTextProps) {
  return (
    <span id={id} className="sr-only">
      {children}
    </span>
  );
}

// ==========================================
// LOADING SPINNER WITH ARIA
// ==========================================

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Accessible loading spinner
 */
export function LoadingSpinner({
  label = "Loading...",
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`inline-block ${className}`}
    >
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-current border-t-transparent`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// ==========================================
// STATUS BADGE WITH ARIA
// ==========================================

interface StatusBadgeProps {
  status: "success" | "error" | "warning" | "info" | "neutral";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Accessible status badge with proper ARIA attributes
 */
export function StatusBadge({ status, children, icon }: StatusBadgeProps) {
  const statusMap = {
    success: { role: "status", ariaLabel: "Success" },
    error: { role: "alert", ariaLabel: "Error" },
    warning: { role: "alert", ariaLabel: "Warning" },
    info: { role: "status", ariaLabel: "Information" },
    neutral: { role: "status", ariaLabel: "Status" },
  };

  const { role, ariaLabel } = statusMap[status];

  return (
    <div
      role={role}
      aria-label={`${ariaLabel}: ${children}`}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
        status === "success"
          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
          : status === "error"
            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            : status === "warning"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
              : status === "info"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      }`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </div>
  );
}

// ==========================================
// TOOLTIP WITH ARIA
// ==========================================

interface TooltipTextProps {
  id: string;
  children: React.ReactNode;
}

/**
 * Accessible tooltip text for aria-describedby
 * @example
 * <button aria-describedby="tooltip-1">Click me</button>
 * <TooltipText id="tooltip-1">This button performs an action</TooltipText>
 */
export function TooltipText({ id, children }: TooltipTextProps) {
  return (
    <div id={id} role="tooltip" className="sr-only">
      {children}
    </div>
  );
}

// ==========================================
// ERROR MESSAGE WITH ARIA
// ==========================================

interface ErrorMessageProps {
  id: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Accessible error message for form fields
 * @example
 * <input aria-invalid="true" aria-describedby="error-1" />
 * <ErrorMessage id="error-1">Email is required</ErrorMessage>
 */
export function ErrorMessage({ id, children, icon }: ErrorMessageProps) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 mt-1"
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </div>
  );
}

// ==========================================
// SUCCESS MESSAGE WITH ARIA
// ==========================================

interface SuccessMessageProps {
  id?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Accessible success message
 */
export function SuccessMessage({ id, children, icon }: SuccessMessageProps) {
  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 mt-1"
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </div>
  );
}

// ==========================================
// EMPTY STATE WITH ARIA
// ==========================================

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Accessible empty state component
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={`Empty state: ${title}`}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {icon && (
        <div aria-hidden="true" className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-md">{description}</p>
      )}
      {action}
    </div>
  );
}

// ==========================================
// TABLE CAPTION
// ==========================================

interface TableCaptionProps {
  children: React.ReactNode;
  srOnly?: boolean;
}

/**
 * Accessible table caption
 * @example
 * <table>
 *   <TableCaption>List of products in inventory</TableCaption>
 *   ...
 * </table>
 */
export function TableCaption({ children, srOnly = false }: TableCaptionProps) {
  return (
    <caption
      className={srOnly ? "sr-only" : "py-2 text-sm text-muted-foreground"}
    >
      {children}
    </caption>
  );
}

// ==========================================
// BREADCRUMB SEPARATOR
// ==========================================

export function BreadcrumbSeparator() {
  return (
    <span aria-hidden="true" className="mx-2 text-muted-foreground">
      /
    </span>
  );
}

// ==========================================
// REQUIRED FIELD INDICATOR
// ==========================================

export function RequiredIndicator() {
  return (
    <>
      <span aria-hidden="true" className="text-red-500 ml-1">
        *
      </span>
      <span className="sr-only">(required)</span>
    </>
  );
}

// ==========================================
// OPTIONAL FIELD INDICATOR
// ==========================================

export function OptionalIndicator() {
  return <span className="text-sm text-muted-foreground ml-2">(optional)</span>;
}

// ==========================================
// PROGRESS BAR WITH ARIA
// ==========================================

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Accessible progress bar
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = "md",
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const ariaLabel = label
    ? `${label}: ${percentage}% complete`
    : `${percentage}% complete`;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{label}</span>
          {showPercentage && (
            <span className="text-sm text-muted-foreground">{percentage}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel}
        className={`w-full bg-muted rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

// ==========================================
// CARD WITH ARIA
// ==========================================

interface AccessibleCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  as?: "article" | "section" | "div";
  headingLevel?: "h2" | "h3" | "h4" | "h5" | "h6";
}

/**
 * Accessible card component with proper semantic HTML
 */
export function AccessibleCard({
  title,
  description,
  children,
  as: Component = "article",
  headingLevel: Heading = "h3",
}: AccessibleCardProps) {
  return (
    <Component className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <Heading className="text-lg font-semibold mb-2">{title}</Heading>
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}
        <div>{children}</div>
      </div>
    </Component>
  );
}
