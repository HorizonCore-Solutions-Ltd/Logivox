/**
 * Screen Reader Announcements Component
 * Provides ARIA live regions for announcing dynamic content to screen readers
 */

"use client";

/**
 * Global Screen Reader Announcer
 *
 * Provides ARIA live regions for dynamic content announcements.
 * Should be placed once in the root layout.
 *
 * Usage:
 * - Use announceToScreenReader() from lib/accessibility.ts to announce messages
 * - Or use the useScreenReaderAnnouncements() hook
 *
 * @example
 * ```tsx
 * // In root layout
 * <ScreenReaderAnnouncer />
 *
 * // In a component
 * import { announceToScreenReader } from '@/lib/accessibility'
 *
 * function MyComponent() {
 *   const handleAction = () => {
 *     // Do something
 *     announceToScreenReader('Action completed successfully')
 *   }
 * }
 * ```
 */
export function ScreenReaderAnnouncer() {
  return (
    <>
      {/* Polite announcements - don't interrupt current screen reader output */}
      <div
        id="screen-reader-announcements"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />

      {/* Assertive announcements - interrupt current screen reader output */}
      <div
        id="screen-reader-announcements-assertive"
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
      />
    </>
  );
}
