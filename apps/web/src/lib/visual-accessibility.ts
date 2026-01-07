/**
 * Visual Accessibility Preferences
 *
 * Comprehensive system for managing visual accessibility preferences
 * including font scaling, contrast modes, reduced motion, and color schemes.
 * WCAG 2.1 AA compliant.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ==========================================
// TYPES
// ==========================================

export type FontSize = "default" | "medium" | "large" | "x-large";
export type ContrastMode = "normal" | "high" | "highest";
export type ColorScheme = "light" | "dark" | "system";
export type FocusIndicatorStyle = "subtle" | "normal" | "bold";
export type LineSpacing = "normal" | "relaxed" | "loose";

export interface VisualAccessibilityPreferences {
  // Font preferences
  fontSize: FontSize;
  lineSpacing: LineSpacing;

  // Contrast preferences
  contrastMode: ContrastMode;
  colorScheme: ColorScheme;

  // Motion preferences
  reduceMotion: boolean;
  reduceTransparency: boolean;

  // Focus preferences
  focusIndicatorStyle: FocusIndicatorStyle;
  alwaysShowFocus: boolean;

  // Color preferences
  useColorBlindMode: boolean;
  colorBlindType: "none" | "protanopia" | "deuteranopia" | "tritanopia";

  // Layout preferences
  increaseTouchTargets: boolean;
  simplifyLayout: boolean;

  // Text preferences
  underlineLinks: boolean;
  boldText: boolean;
}

interface VisualAccessibilityState extends VisualAccessibilityPreferences {
  // Actions
  setFontSize: (size: FontSize) => void;
  setLineSpacing: (spacing: LineSpacing) => void;
  setContrastMode: (mode: ContrastMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setReduceMotion: (reduce: boolean) => void;
  setReduceTransparency: (reduce: boolean) => void;
  setFocusIndicatorStyle: (style: FocusIndicatorStyle) => void;
  setAlwaysShowFocus: (show: boolean) => void;
  setColorBlindMode: (
    enabled: boolean,
    type?: "protanopia" | "deuteranopia" | "tritanopia",
  ) => void;
  setIncreaseTouchTargets: (increase: boolean) => void;
  setSimplifyLayout: (simplify: boolean) => void;
  setUnderlineLinks: (underline: boolean) => void;
  setBoldText: (bold: boolean) => void;
  resetToDefaults: () => void;
  applySystemPreferences: () => void;
}

// ==========================================
// DEFAULT PREFERENCES
// ==========================================

const defaultPreferences: VisualAccessibilityPreferences = {
  fontSize: "default",
  lineSpacing: "normal",
  contrastMode: "normal",
  colorScheme: "system",
  reduceMotion: false,
  reduceTransparency: false,
  focusIndicatorStyle: "normal",
  alwaysShowFocus: false,
  useColorBlindMode: false,
  colorBlindType: "none",
  increaseTouchTargets: false,
  simplifyLayout: false,
  underlineLinks: false,
  boldText: false,
};

// ==========================================
// ZUSTAND STORE
// ==========================================

export const useVisualAccessibility = create<VisualAccessibilityState>()(
  persist(
    (set) => ({
      ...defaultPreferences,

      setFontSize: (fontSize) => set({ fontSize }),
      setLineSpacing: (lineSpacing) => set({ lineSpacing }),
      setContrastMode: (contrastMode) => set({ contrastMode }),
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setReduceTransparency: (reduceTransparency) =>
        set({ reduceTransparency }),
      setFocusIndicatorStyle: (focusIndicatorStyle) =>
        set({ focusIndicatorStyle }),
      setAlwaysShowFocus: (alwaysShowFocus) => set({ alwaysShowFocus }),
      setColorBlindMode: (useColorBlindMode, colorBlindType = "protanopia") =>
        set({
          useColorBlindMode,
          colorBlindType: useColorBlindMode ? colorBlindType : "none",
        }),
      setIncreaseTouchTargets: (increaseTouchTargets) =>
        set({ increaseTouchTargets }),
      setSimplifyLayout: (simplifyLayout) => set({ simplifyLayout }),
      setUnderlineLinks: (underlineLinks) => set({ underlineLinks }),
      setBoldText: (boldText) => set({ boldText }),

      resetToDefaults: () => set(defaultPreferences),

      applySystemPreferences: () => {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        const prefersHighContrast = window.matchMedia(
          "(prefers-contrast: high)",
        ).matches;
        const prefersDarkMode = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;

        set({
          reduceMotion: prefersReducedMotion,
          contrastMode: prefersHighContrast ? "high" : "normal",
          colorScheme: prefersDarkMode ? "dark" : "light",
        });
      },
    }),
    {
      name: "visual-accessibility-preferences",
      version: 1,
    },
  ),
);

// ==========================================
// CSS CLASS GENERATORS
// ==========================================

export function getFontSizeClass(size: FontSize): string {
  const sizeMap: Record<FontSize, string> = {
    default: "",
    medium: "text-scale-110",
    large: "text-scale-125",
    "x-large": "text-scale-150",
  };
  return sizeMap[size];
}

export function getLineSpacingClass(spacing: LineSpacing): string {
  const spacingMap: Record<LineSpacing, string> = {
    normal: "",
    relaxed: "leading-relaxed",
    loose: "leading-loose",
  };
  return spacingMap[spacing];
}

export function getContrastModeClass(mode: ContrastMode): string {
  const modeMap: Record<ContrastMode, string> = {
    normal: "",
    high: "contrast-high",
    highest: "contrast-highest",
  };
  return modeMap[mode];
}

export function getFocusIndicatorClass(style: FocusIndicatorStyle): string {
  const styleMap: Record<FocusIndicatorStyle, string> = {
    subtle: "focus-subtle",
    normal: "",
    bold: "focus-bold",
  };
  return styleMap[style];
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get all active CSS classes based on preferences
 */
export function getAccessibilityClasses(
  prefs: VisualAccessibilityPreferences,
): string {
  const classes: string[] = [];

  if (prefs.fontSize !== "default") {
    classes.push(getFontSizeClass(prefs.fontSize));
  }

  if (prefs.lineSpacing !== "normal") {
    classes.push(getLineSpacingClass(prefs.lineSpacing));
  }

  if (prefs.contrastMode !== "normal") {
    classes.push(getContrastModeClass(prefs.contrastMode));
  }

  if (prefs.focusIndicatorStyle !== "normal") {
    classes.push(getFocusIndicatorClass(prefs.focusIndicatorStyle));
  }

  if (prefs.reduceMotion) {
    classes.push("reduce-motion");
  }

  if (prefs.reduceTransparency) {
    classes.push("reduce-transparency");
  }

  if (prefs.alwaysShowFocus) {
    classes.push("always-show-focus");
  }

  if (prefs.useColorBlindMode && prefs.colorBlindType !== "none") {
    classes.push(`colorblind-${prefs.colorBlindType}`);
  }

  if (prefs.increaseTouchTargets) {
    classes.push("touch-targets-large");
  }

  if (prefs.simplifyLayout) {
    classes.push("layout-simplified");
  }

  if (prefs.underlineLinks) {
    classes.push("underline-links");
  }

  if (prefs.boldText) {
    classes.push("text-bold");
  }

  return classes.join(" ");
}

/**
 * Apply preferences to document
 */
export function applyVisualAccessibilityPreferences(
  prefs: VisualAccessibilityPreferences,
): void {
  const html = document.documentElement;
  const classes = getAccessibilityClasses(prefs);

  // Remove all existing accessibility classes
  html.classList.remove(
    "text-scale-110",
    "text-scale-125",
    "text-scale-150",
    "leading-relaxed",
    "leading-loose",
    "contrast-high",
    "contrast-highest",
    "focus-subtle",
    "focus-bold",
    "reduce-motion",
    "reduce-transparency",
    "always-show-focus",
    "colorblind-protanopia",
    "colorblind-deuteranopia",
    "colorblind-tritanopia",
    "touch-targets-large",
    "layout-simplified",
    "underline-links",
    "text-bold",
  );

  // Add new classes
  if (classes) {
    html.classList.add(...classes.split(" ").filter(Boolean));
  }

  // Apply color scheme
  if (prefs.colorScheme !== "system") {
    html.classList.remove("light", "dark");
    html.classList.add(prefs.colorScheme);
  }
}

// ==========================================
// REACT HOOK
// ==========================================

export function useApplyVisualAccessibility() {
  const prefs = useVisualAccessibility();

  // Apply preferences on mount and when they change
  if (typeof window !== "undefined") {
    applyVisualAccessibilityPreferences(prefs);
  }

  return prefs;
}

// ==========================================
// CONTRAST RATIO CHECKER
// ==========================================

/**
 * Calculate contrast ratio between two colors
 * @param color1 Hex color (e.g., "#ffffff")
 * @param color2 Hex color (e.g., "#000000")
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param ratio Contrast ratio
 * @param isLargeText Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether it meets WCAG AA (4.5:1 for normal, 3:1 for large)
 */
export function meetsWCAGAA(
  ratio: number,
  isLargeText: boolean = false,
): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 * @param ratio Contrast ratio
 * @param isLargeText Whether text is large
 * @returns Whether it meets WCAG AAA (7:1 for normal, 4.5:1 for large)
 */
export function meetsWCAGAAA(
  ratio: number,
  isLargeText: boolean = false,
): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

// ==========================================
// PRESET CONFIGURATIONS
// ==========================================

export const accessibilityPresets = {
  default: defaultPreferences,

  highContrast: {
    ...defaultPreferences,
    contrastMode: "highest" as ContrastMode,
    focusIndicatorStyle: "bold" as FocusIndicatorStyle,
    underlineLinks: true,
    boldText: true,
  },

  largeText: {
    ...defaultPreferences,
    fontSize: "large" as FontSize,
    lineSpacing: "relaxed" as LineSpacing,
    increaseTouchTargets: true,
  },

  reducedMotion: {
    ...defaultPreferences,
    reduceMotion: true,
    reduceTransparency: true,
  },

  lowVision: {
    ...defaultPreferences,
    fontSize: "x-large" as FontSize,
    lineSpacing: "loose" as LineSpacing,
    contrastMode: "highest" as ContrastMode,
    focusIndicatorStyle: "bold" as FocusIndicatorStyle,
    underlineLinks: true,
    boldText: true,
    increaseTouchTargets: true,
    simplifyLayout: true,
  },

  motorImpairment: {
    ...defaultPreferences,
    increaseTouchTargets: true,
    alwaysShowFocus: true,
    focusIndicatorStyle: "bold" as FocusIndicatorStyle,
  },
};
