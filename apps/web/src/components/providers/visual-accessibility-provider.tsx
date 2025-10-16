'use client';

import { useEffect } from 'react';
import { useVisualAccessibility, applyVisualAccessibilityPreferences } from '@/lib/visual-accessibility';

export function VisualAccessibilityProvider({ children }: { children: React.ReactNode }) {
  const prefs = useVisualAccessibility();

  useEffect(() => {
    // Apply preferences on mount and when they change
    applyVisualAccessibilityPreferences(prefs);
  }, [
    prefs.fontSize,
    prefs.lineSpacing,
    prefs.contrastMode,
    prefs.colorScheme,
    prefs.reduceMotion,
    prefs.reduceTransparency,
    prefs.focusIndicatorStyle,
    prefs.alwaysShowFocus,
    prefs.useColorBlindMode,
    prefs.colorBlindType,
    prefs.increaseTouchTargets,
    prefs.simplifyLayout,
    prefs.underlineLinks,
    prefs.boldText,
  ]);

  return <>{children}</>;
}
