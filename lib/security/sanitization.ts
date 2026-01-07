/**
 * Input Sanitization Utilities
 * Prevents XSS, SQL injection, and other injection attacks
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ul",
      "ol",
      "li",
      "a",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Strip all HTML tags
 */
export function stripHtml(input: string): string {
  if (!input) return "";

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize string for safe SQL usage (for dynamic queries - prefer parameterized queries!)
 */
export function sanitizeSql(input: string): string {
  if (!input) return "";

  // Remove common SQL injection patterns
  return input
    .replace(/['";\\]/g, "") // Remove quotes and semicolons
    .replace(/--/g, "") // Remove SQL comments
    .replace(/\/\*/g, "") // Remove block comment start
    .replace(/\*\//g, "") // Remove block comment end
    .replace(/xp_/gi, "") // Remove extended stored procedures
    .replace(/sp_/gi, "") // Remove stored procedures
    .replace(/exec\s/gi, "") // Remove EXEC statements
    .replace(/execute\s/gi, "") // Remove EXECUTE statements
    .replace(/insert\s/gi, "") // Remove INSERT statements
    .replace(/update\s/gi, "") // Remove UPDATE statements
    .replace(/delete\s/gi, "") // Remove DELETE statements
    .replace(/drop\s/gi, "") // Remove DROP statements
    .replace(/create\s/gi, "") // Remove CREATE statements
    .replace(/alter\s/gi, "") // Remove ALTER statements
    .replace(/union\s/gi, "") // Remove UNION statements
    .trim();
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "";

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "") // Keep only alphanumeric, dots, underscores, hyphens
    .replace(/\.{2,}/g, ".") // Prevent multiple dots
    .replace(/^\./, "") // Remove leading dot
    .slice(0, 255); // Limit length
}

/**
 * Sanitize path to prevent directory traversal
 */
export function sanitizePath(path: string): string {
  if (!path) return "";

  return path
    .replace(/\.\./g, "") // Remove parent directory references
    .replace(/[^a-zA-Z0-9/_-]/g, "") // Keep only safe characters
    .replace(/\/{2,}/g, "/") // Prevent double slashes
    .replace(/^\//, "") // Remove leading slash
    .slice(0, 1024); // Limit length
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";

  // Basic email format check and sanitization
  const sanitized = email.toLowerCase().trim();

  // Remove any characters that shouldn't be in an email
  return sanitized.replace(/[^a-z0-9@._+-]/g, "");
}

/**
 * Sanitize phone number (UK format)
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return "";

  // Remove all non-numeric characters except +
  return phone.replace(/[^\d+]/g, "");
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number | null {
  if (typeof input === "number") return input;
  if (!input) return null;

  const sanitized = String(input).replace(/[^\d.-]/g, "");
  const parsed = parseFloat(sanitized);

  return isNaN(parsed) ? null : parsed;
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(input: unknown): boolean {
  if (typeof input === "boolean") return input;
  if (typeof input === "string") {
    return input.toLowerCase() === "true" || input === "1";
  }
  if (typeof input === "number") {
    return input === 1;
  }
  return false;
}

/**
 * Sanitize object by applying sanitizers to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizer: (value: string) => string = stripHtml,
): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizer(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizer(item) : item,
      );
    } else if (value !== null && typeof value === "object") {
      sanitized[key] = sanitizeObject(value, sanitizer);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Only allow HTTP(S) protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Escape special characters for regex
 */
export function escapeRegex(input: string): string {
  if (!input) return "";

  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return "";

  return query
    .trim()
    .replace(/[<>'"]/g, "") // Remove dangerous characters
    .slice(0, 100); // Limit length
}

/**
 * Sanitize SKU
 */
export function sanitizeSKU(sku: string): string {
  if (!sku) return "";

  return sku
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "") // Only allow alphanumeric and hyphens
    .slice(0, 50);
}

/**
 * Sanitize barcode
 */
export function sanitizeBarcode(barcode: string): string {
  if (!barcode) return "";

  return barcode
    .replace(/[^A-Z0-9-]/gi, "") // Only allow alphanumeric and hyphens
    .slice(0, 50);
}

/**
 * Sanitize order/reference number
 */
export function sanitizeReferenceNumber(ref: string): string {
  if (!ref) return "";

  return ref
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 50);
}

/**
 * Deep freeze object to prevent modifications
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as any)[prop];
    if (
      value !== null &&
      typeof value === "object" &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  });

  return obj;
}

/**
 * Validate that object only contains expected keys
 */
export function validateObjectKeys<T extends string>(
  obj: Record<string, any>,
  allowedKeys: readonly T[],
): boolean {
  const objKeys = Object.keys(obj);
  return objKeys.every((key) => allowedKeys.includes(key as T));
}

/**
 * Strip null bytes from string (potential security issue)
 */
export function stripNullBytes(input: string): string {
  if (!input) return "";
  return input.replace(/\0/g, "");
}

/**
 * Normalize whitespace in string
 */
export function normalizeWhitespace(input: string): string {
  if (!input) return "";
  return input.replace(/\s+/g, " ").trim();
}

/**
 * Truncate string safely at word boundary
 */
export function truncateString(input: string, maxLength: number): string {
  if (!input || input.length <= maxLength) return input;

  const truncated = input.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 0
    ? truncated.slice(0, lastSpace) + "..."
    : truncated + "...";
}
