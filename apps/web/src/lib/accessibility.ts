"use client";

/**
 * Accessibility utilities for keyboard navigation, focus management, and screen reader support
 * Ensures WCAG 2.1 AA compliance across the application
 */

import { useEffect, useRef, useCallback, useState } from "react";

// ============================================================================
// KEYBOARD NAVIGATION CONSTANTS
// ============================================================================

/**
 * Common keyboard shortcuts used throughout the application
 */
export const KEYBOARD_SHORTCUTS = {
  // Global shortcuts
  TOGGLE_VOICE_CONTROL: "Ctrl+Shift+V",
  SHOW_VOICE_HELP: "Ctrl+Shift+H",
  SHOW_KEYBOARD_SHORTCUTS: "Ctrl+Shift+K",
  FOCUS_SEARCH: "Ctrl+K",
  TOGGLE_SIDEBAR: "Ctrl+B",
  TOGGLE_THEME: "Ctrl+Shift+T",

  // Navigation shortcuts
  GO_TO_DASHBOARD: "Ctrl+Shift+D",
  GO_TO_INVENTORY: "Ctrl+Shift+I",
  GO_TO_BOOKINGS: "Ctrl+Shift+B",
  GO_TO_ALERTS: "Ctrl+Shift+A",
  GO_TO_REPORTS: "Ctrl+Shift+R",

  // Modal/Dialog shortcuts
  CLOSE_MODAL: "Escape",
  CONFIRM_ACTION: "Enter",
  CANCEL_ACTION: "Escape",

  // Table navigation
  NEXT_ROW: "ArrowDown",
  PREVIOUS_ROW: "ArrowUp",
  FIRST_ROW: "Home",
  LAST_ROW: "End",
  SELECT_ROW: "Space",

  // Form navigation
  NEXT_FIELD: "Tab",
  PREVIOUS_FIELD: "Shift+Tab",
  SUBMIT_FORM: "Ctrl+Enter",
} as const;

/**
 * Skip link targets for keyboard navigation
 */
export const SKIP_LINK_TARGETS = {
  MAIN_CONTENT: "main-content",
  NAVIGATION: "main-navigation",
  SEARCH: "search-input",
  SIDEBAR: "sidebar",
} as const;

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Hook to manage focus trap within a container (for modals, dialogs, etc.)
 * Prevents focus from leaving the container when tabbing
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when trap activates
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      // Shift + Tab on first element -> go to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
      // Tab on last element -> go to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to restore focus when a component unmounts (useful for modals)
 */
export function useRestoreFocus() {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    return () => {
      // Restore focus when component unmounts
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, []);
}

/**
 * Hook to manage focus on a specific element when a condition is met
 */
export function useFocusOnMount(
  shouldFocus: boolean = true,
  selector?: string,
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!shouldFocus) return;

    if (selector && ref.current) {
      const element = ref.current.querySelector(selector) as HTMLElement;
      element?.focus();
    } else {
      ref.current?.focus();
    }
  }, [shouldFocus, selector]);

  return ref;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    "[contenteditable]",
  ].join(", ");

  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors),
  ).filter((element) => {
    // Exclude hidden elements
    return (
      element.offsetWidth > 0 &&
      element.offsetHeight > 0 &&
      window.getComputedStyle(element).visibility !== "hidden"
    );
  });
}

// ============================================================================
// KEYBOARD SHORTCUT HANDLING
// ============================================================================

/**
 * Parse keyboard shortcut string into event properties
 */
function parseShortcut(shortcut: string) {
  const parts = shortcut.split("+");
  return {
    key: parts[parts.length - 1],
    ctrlKey: parts.includes("Ctrl"),
    shiftKey: parts.includes("Shift"),
    altKey: parts.includes("Alt"),
    metaKey: parts.includes("Meta") || parts.includes("Cmd"),
  };
}

/**
 * Check if a keyboard event matches a shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut);
  return (
    event.key === parsed.key &&
    event.ctrlKey === parsed.ctrlKey &&
    event.shiftKey === parsed.shiftKey &&
    event.altKey === parsed.altKey &&
    event.metaKey === parsed.metaKey
  );
}

/**
 * Hook to register keyboard shortcuts
 */
export function useKeyboardShortcut(
  shortcut: string,
  callback: (event: KeyboardEvent) => void,
  options: {
    enabled?: boolean;
    preventDefault?: boolean;
    target?: "window" | "document";
  } = {},
) {
  const {
    enabled = true,
    preventDefault = true,
    target = "document",
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesShortcut(event, shortcut)) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    const targetElement = target === "window" ? window : document;

    targetElement.addEventListener("keydown", handleKeyDown as any);
    return () =>
      targetElement.removeEventListener("keydown", handleKeyDown as any);
  }, [shortcut, callback, enabled, preventDefault, target]);
}

/**
 * Hook to register multiple keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, (event: KeyboardEvent) => void>,
  options: { enabled?: boolean; preventDefault?: boolean } = {},
) {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const [shortcut, callback] of Object.entries(shortcuts)) {
        if (matchesShortcut(event, shortcut)) {
          if (preventDefault) {
            event.preventDefault();
          }
          callback(event);
          break; // Only trigger one shortcut per event
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled, preventDefault]);
}

// ============================================================================
// SCREEN READER SUPPORT
// ============================================================================

/**
 * Announce a message to screen readers using ARIA live region
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite",
  timeout: number = 1000,
) {
  const liveRegion = document.getElementById("screen-reader-announcements");

  if (liveRegion) {
    liveRegion.setAttribute("aria-live", priority);
    liveRegion.textContent = message;

    // Clear after timeout to allow for re-announcements
    setTimeout(() => {
      liveRegion.textContent = "";
    }, timeout);
  }
}

/**
 * Hook to create and manage an ARIA live region for announcements
 */
export function useScreenReaderAnnouncements() {
  const [announcement, setAnnouncement] = useState("");

  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      setAnnouncement(message);
      announceToScreenReader(message, priority);
    },
    [],
  );

  return { announcement, announce };
}

// ============================================================================
// SKIP LINKS
// ============================================================================

/**
 * Skip link component data
 */
export interface SkipLink {
  id: string;
  label: string;
  target: string;
}

/**
 * Default skip links for the application
 */
export const DEFAULT_SKIP_LINKS: SkipLink[] = [
  {
    id: "skip-to-main",
    label: "Skip to main content",
    target: SKIP_LINK_TARGETS.MAIN_CONTENT,
  },
  {
    id: "skip-to-nav",
    label: "Skip to navigation",
    target: SKIP_LINK_TARGETS.NAVIGATION,
  },
  {
    id: "skip-to-search",
    label: "Skip to search",
    target: SKIP_LINK_TARGETS.SEARCH,
  },
];

/**
 * Handle skip link click - focus the target element
 */
export function handleSkipLinkClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  targetId: string,
) {
  event.preventDefault();
  const target = document.getElementById(targetId);

  if (target) {
    // Make the element focusable if it isn't already
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }

    target.focus();

    // Scroll to the target
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ============================================================================
// ROVING TABINDEX (for lists, grids, etc.)
// ============================================================================

/**
 * Hook to manage roving tabindex for keyboard navigation in lists/grids
 */
export function useRovingTabIndex(itemCount: number) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, currentIndex: number) => {
      let newIndex = currentIndex;

      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
          event.preventDefault();
          newIndex = (currentIndex + 1) % itemCount;
          break;
        case "ArrowUp":
        case "ArrowLeft":
          event.preventDefault();
          newIndex = currentIndex === 0 ? itemCount - 1 : currentIndex - 1;
          break;
        case "Home":
          event.preventDefault();
          newIndex = 0;
          break;
        case "End":
          event.preventDefault();
          newIndex = itemCount - 1;
          break;
        default:
          return;
      }

      setFocusedIndex(newIndex);
    },
    [itemCount],
  );

  const getTabIndex = useCallback(
    (index: number) => (index === focusedIndex ? 0 : -1),
    [focusedIndex],
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getTabIndex,
  };
}

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

/**
 * Check if reduced motion is preferred by the user
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Check if high contrast mode is enabled
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia("(prefers-contrast: high)").matches;
}

/**
 * Check if dark mode is preferred by the user
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Hook to detect user's accessibility preferences
 */
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    darkMode: false,
  });

  useEffect(() => {
    const updatePreferences = () => {
      setPreferences({
        reducedMotion: prefersReducedMotion(),
        highContrast: prefersHighContrast(),
        darkMode: prefersDarkMode(),
      });
    };

    updatePreferences();

    // Listen for changes
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const highContrastQuery = window.matchMedia("(prefers-contrast: high)");
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    reducedMotionQuery.addEventListener("change", updatePreferences);
    highContrastQuery.addEventListener("change", updatePreferences);
    darkModeQuery.addEventListener("change", updatePreferences);

    return () => {
      reducedMotionQuery.removeEventListener("change", updatePreferences);
      highContrastQuery.removeEventListener("change", updatePreferences);
      darkModeQuery.removeEventListener("change", updatePreferences);
    };
  }, []);

  return preferences;
}

/**
 * Generate a unique ID for accessibility attributes
 */
let idCounter = 0;
export function generateId(prefix: string = "a11y"): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Hook to generate a stable unique ID for accessibility
 */
export function useA11yId(prefix: string = "a11y"): string {
  const idRef = useRef<string>();

  if (!idRef.current) {
    idRef.current = generateId(prefix);
  }

  return idRef.current;
}
