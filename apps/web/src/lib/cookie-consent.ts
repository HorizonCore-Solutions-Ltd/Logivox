/**
 * Cookie Consent Management System
 *
 * GDPR & CCPA compliant cookie consent with granular control
 *
 * Features:
 * - Granular cookie categories (essential, functional, analytics, marketing)
 * - User consent management and persistence
 * - Cookie banner with clear options
 * - Privacy policy integration
 * - Data retention policies
 * - Consent withdrawal
 */

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  essential: boolean;
  enabled: boolean;
}

export interface CookieConsent {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  version: string; // Track consent version for compliance
}

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: "essential",
    name: "Essential Cookies",
    description:
      "Required for the website to function properly. These include authentication, security, and basic functionality.",
    essential: true,
    enabled: true,
  },
  {
    id: "functional",
    name: "Functional Cookies",
    description:
      "Enhance your experience with features like language preferences, region selection, and personalized content.",
    essential: false,
    enabled: false,
  },
  {
    id: "analytics",
    name: "Analytics Cookies",
    description:
      "Help us understand how visitors interact with our website by collecting anonymous usage data.",
    essential: false,
    enabled: false,
  },
  {
    id: "marketing",
    name: "Marketing Cookies",
    description:
      "Used to track visitors across websites for marketing purposes and to display relevant advertisements.",
    essential: false,
    enabled: false,
  },
];

export const CONSENT_VERSION = "1.0";
export const CONSENT_COOKIE_NAME = "flowstock_cookie_consent";
export const CONSENT_DURATION_DAYS = 365;

// ==========================================
// COOKIE CONSENT MANAGER
// ==========================================

export class CookieConsentManager {
  private static instance: CookieConsentManager;
  private consent: CookieConsent | null = null;
  private listeners: ((consent: CookieConsent) => void)[] = [];

  static getInstance(): CookieConsentManager {
    if (!CookieConsentManager.instance) {
      CookieConsentManager.instance = new CookieConsentManager();
    }
    return CookieConsentManager.instance;
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.loadConsent();
    }
  }

  /**
   * Load consent from stored cookie
   */
  loadConsent(): CookieConsent | null {
    try {
      const stored = this.getCookie(CONSENT_COOKIE_NAME);
      if (stored) {
        this.consent = JSON.parse(decodeURIComponent(stored));
        return this.consent;
      }
    } catch (error) {
      console.error("[CookieConsent] Failed to load consent:", error);
    }
    return null;
  }

  /**
   * Save consent to cookie
   */
  saveConsent(consent: Partial<CookieConsent>): void {
    const fullConsent: CookieConsent = {
      essential: true, // Always true
      functional: consent.functional ?? false,
      analytics: consent.analytics ?? false,
      marketing: consent.marketing ?? false,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };

    this.consent = fullConsent;

    // Save to cookie
    const expires = new Date();
    expires.setDate(expires.getDate() + CONSENT_DURATION_DAYS);

    const cookieValue = encodeURIComponent(JSON.stringify(fullConsent));
    document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;

    // Notify listeners
    this.listeners.forEach((listener) => listener(fullConsent));

    // Initialize analytics/marketing based on consent
    this.initializeServices(fullConsent);
  }

  /**
   * Get current consent
   */
  getConsent(): CookieConsent | null {
    return this.consent;
  }

  /**
   * Check if user has given consent
   */
  hasConsent(): boolean {
    return this.consent !== null;
  }

  /**
   * Check if specific category is consented
   */
  hasConsentFor(category: keyof CookieConsent): boolean {
    if (!this.consent) return false;
    if (category === "timestamp" || category === "version") return false;
    return this.consent[category] === true;
  }

  /**
   * Accept all cookies
   */
  acceptAll(): void {
    this.saveConsent({
      functional: true,
      analytics: true,
      marketing: true,
    });
  }

  /**
   * Accept only essential cookies
   */
  acceptEssential(): void {
    this.saveConsent({
      functional: false,
      analytics: false,
      marketing: false,
    });
  }

  /**
   * Withdraw consent (delete all non-essential cookies)
   */
  withdrawConsent(): void {
    this.consent = null;

    // Delete consent cookie
    document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

    // Delete all non-essential cookies
    this.deleteNonEssentialCookies();

    // Notify listeners
    this.listeners.forEach((listener) =>
      listener({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
        version: CONSENT_VERSION,
      }),
    );
  }

  /**
   * Add consent change listener
   */
  onConsentChange(listener: (consent: CookieConsent) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove consent change listener
   */
  offConsentChange(listener: (consent: CookieConsent) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Initialize third-party services based on consent
   */
  private initializeServices(consent: CookieConsent): void {
    // Analytics (Google Analytics, etc.)
    if (consent.analytics) {
      this.initializeAnalytics();
    } else {
      this.disableAnalytics();
    }

    // Marketing (Facebook Pixel, Google Ads, etc.)
    if (consent.marketing) {
      this.initializeMarketing();
    } else {
      this.disableMarketing();
    }

    // Functional (chat widgets, etc.)
    if (consent.functional) {
      this.initializeFunctional();
    } else {
      this.disableFunctional();
    }
  }

  private initializeAnalytics(): void {
    // TODO: Initialize Google Analytics
    console.log("[CookieConsent] Analytics enabled");

    // Example: Google Analytics 4
    // gtag('config', 'GA_MEASUREMENT_ID');
  }

  private disableAnalytics(): void {
    console.log("[CookieConsent] Analytics disabled");

    // Example: Disable Google Analytics
    // gtag('config', 'GA_MEASUREMENT_ID', { send_page_view: false });
  }

  private initializeMarketing(): void {
    console.log("[CookieConsent] Marketing enabled");

    // TODO: Initialize marketing pixels
    // Facebook Pixel, Google Ads, etc.
  }

  private disableMarketing(): void {
    console.log("[CookieConsent] Marketing disabled");
  }

  private initializeFunctional(): void {
    console.log("[CookieConsent] Functional enabled");

    // TODO: Initialize chat widgets, etc.
  }

  private disableFunctional(): void {
    console.log("[CookieConsent] Functional disabled");
  }

  /**
   * Delete all non-essential cookies
   */
  private deleteNonEssentialCookies(): void {
    const cookies = document.cookie.split(";");

    const essentialCookies = [
      "next-auth.session-token",
      "next-auth.csrf-token",
      "next-auth.callback-url",
      "flowstock_session",
      CONSENT_COOKIE_NAME,
    ];

    cookies.forEach((cookie) => {
      const [name] = cookie.trim().split("=");
      if (name && !essentialCookies.includes(name)) {
        // Delete cookie
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      }
    });
  }

  /**
   * Get cookie value by name
   */
  private getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const nameEQ = name + "=";
    const ca = document.cookie.split(";");

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      if (!c) continue;
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }

    return null;
  }
}

// ==========================================
// REACT HOOKS
// ==========================================

import { useState, useEffect } from "react";

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const manager = CookieConsentManager.getInstance();
    const currentConsent = manager.getConsent();

    setConsent(currentConsent);
    setHasConsent(currentConsent !== null);

    const handleConsentChange = (newConsent: CookieConsent) => {
      setConsent(newConsent);
      setHasConsent(true);
    };

    manager.onConsentChange(handleConsentChange);

    return () => {
      manager.offConsentChange(handleConsentChange);
    };
  }, []);

  const acceptAll = () => {
    CookieConsentManager.getInstance().acceptAll();
  };

  const acceptEssential = () => {
    CookieConsentManager.getInstance().acceptEssential();
  };

  const saveCustomConsent = (customConsent: Partial<CookieConsent>) => {
    CookieConsentManager.getInstance().saveConsent(customConsent);
  };

  const withdrawConsent = () => {
    CookieConsentManager.getInstance().withdrawConsent();
    setConsent(null);
    setHasConsent(false);
  };

  const hasConsentFor = (category: keyof CookieConsent) => {
    return CookieConsentManager.getInstance().hasConsentFor(category);
  };

  return {
    consent,
    hasConsent,
    acceptAll,
    acceptEssential,
    saveCustomConsent,
    withdrawConsent,
    hasConsentFor,
  };
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Check if cookies are enabled in browser
 */
export function areCookiesEnabled(): boolean {
  try {
    document.cookie = "cookietest=1; SameSite=Strict; Secure";
    const enabled = document.cookie.indexOf("cookietest=") !== -1;
    // Clean up test cookie
    document.cookie =
      "cookietest=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    return enabled;
  } catch {
    return false;
  }
}

/**
 * Get compliance-friendly user IP (hashed for privacy)
 */
export async function getPrivacyFriendlyIP(): Promise<string> {
  try {
    // Use a service that provides hashed/anonymized IP
    const response = await fetch("/api/privacy/ip");
    const data = await response.json();
    return data.hashedIP || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Check if user is in EU (for GDPR)
 */
export async function isUserInEU(): Promise<boolean> {
  try {
    const response = await fetch("/api/privacy/location");
    const data = await response.json();
    return data.isEU || false;
  } catch {
    // Default to true to be safe
    return true;
  }
}
