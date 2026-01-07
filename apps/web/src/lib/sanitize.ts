/**
 * Input Sanitization & Validation System for LogiVox
 *
 * Protects against XSS, SQL injection, and other injection attacks.
 * All user inputs should be sanitized before processing or storage.
 *
 * Features:
 * - HTML escaping and sanitization
 * - SQL injection prevention (complementary to Prisma)
 * - XSS prevention
 * - URL validation and sanitization
 * - Email validation
 * - Phone number validation
 * - File name sanitization
 * - Path traversal prevention
 *
 * @example
 * ```ts
 * // Sanitize user input
 * const safe = sanitizeHtml(userInput);
 *
 * // Validate email
 * if (!isValidEmail(email)) {
 *   throw new Error('Invalid email');
 * }
 *
 * // Sanitize file name
 * const safeName = sanitizeFileName(uploadedFileName);
 * ```
 */

// ============================================================================
// HTML Sanitization
// ============================================================================

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitize HTML by removing dangerous tags and attributes
 *
 * Allows: p, br, strong, em, u, a (with safe href), ul, ol, li
 * Removes: script, style, iframe, object, embed, etc.
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and content
  let sanitized = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove style tags and content
  sanitized = sanitized.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    "",
  );

  // Remove dangerous tags
  const dangerousTags = [
    "iframe",
    "object",
    "embed",
    "link",
    "meta",
    "base",
    "form",
    "input",
    "button",
    "textarea",
    "select",
  ];

  dangerousTags.forEach((tag) => {
    const regex = new RegExp(
      `<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`,
      "gi",
    );
    sanitized = sanitized.replace(regex, "");
    sanitized = sanitized.replace(new RegExp(`<${tag}[^>]*>`, "gi"), "");
  });

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, "");

  // Remove data: URLs (potential XSS vector)
  sanitized = sanitized.replace(/src\s*=\s*["']data:[^"']*["']/gi, "");

  return sanitized;
}

/**
 * Strip all HTML tags, leaving only text content
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize text for safe display (escape HTML)
 */
export function sanitizeText(text: string): string {
  return escapeHtml(text);
}

// ============================================================================
// SQL Injection Prevention
// ============================================================================

/**
 * Escape special characters for SQL (complementary to Prisma)
 *
 * Note: Prisma already prevents SQL injection via parameterized queries.
 * This is an additional layer for raw queries or edge cases.
 */
export function escapeSql(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\x00/g, "\\0")
    .replace(/\x1a/g, "\\Z");
}

/**
 * Validate SQL identifier (table/column name)
 * Allows only alphanumeric and underscore
 */
export function isValidSqlIdentifier(identifier: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

/**
 * Sanitize SQL identifier
 */
export function sanitizeSqlIdentifier(identifier: string): string {
  // Remove any non-alphanumeric/underscore characters
  let sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, "");

  // Ensure it starts with a letter or underscore
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    sanitized = "_" + sanitized;
  }

  return sanitized;
}

// ============================================================================
// URL Validation & Sanitization
// ============================================================================

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Sanitize URL (remove dangerous protocols)
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Only allow safe protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // Basic regex check
  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional checks
  if (email.length > 254) return false; // Max email length
  const localPart = email.split("@")[0];
  if (localPart && localPart.length > 64) return false; // Max local part length

  return true;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();

  // Remove any characters that aren't allowed in emails
  sanitized = sanitized.replace(/[^a-z0-9.!#$%&'*+\/=?^_`{|}~@-]/g, "");

  return sanitized;
}

// ============================================================================
// Phone Number Validation
// ============================================================================

/**
 * Validate phone number (international format)
 */
export function isValidPhone(phone: string): boolean {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, "");

  // Check if it's all digits (with optional + prefix)
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;

  return phoneRegex.test(cleaned);
}

/**
 * Sanitize phone number (remove formatting, keep digits and +)
 */
export function sanitizePhone(phone: string): string {
  // Keep only digits and leading +
  let sanitized = phone.replace(/[^\d+]/g, "");

  // Ensure + is only at the start
  if (sanitized.includes("+")) {
    sanitized = "+" + sanitized.replace(/\+/g, "");
  }

  return sanitized;
}

// ============================================================================
// File Name Sanitization
// ============================================================================

/**
 * Sanitize file name to prevent path traversal and dangerous characters
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and null bytes
  let sanitized = fileName.replace(/[/\\:\x00]/g, "");

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, "");

  // Replace multiple dots with single dot
  sanitized = sanitized.replace(/\.{2,}/g, ".");

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, "");

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop() || "";
    const name = sanitized.substring(0, 255 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }

  return sanitized || "unnamed";
}

/**
 * Validate file extension
 */
export function isValidFileExtension(
  fileName: string,
  allowedExtensions: string[],
): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(path: string): string {
  // Remove any ../ or ..\\ patterns
  let sanitized = path.replace(/\.\.[/\\]/g, "");

  // Remove leading slashes
  sanitized = sanitized.replace(/^[/\\]+/, "");

  // Normalize slashes
  sanitized = sanitized.replace(/\\/g, "/");

  // Remove any remaining dangerous patterns
  sanitized = sanitized.replace(/[:\x00]/g, "");

  return sanitized;
}

// ============================================================================
// Generic Input Validation
// ============================================================================

/**
 * Validate string length
 */
export function isValidLength(
  text: string,
  options: { min?: number; max?: number },
): boolean {
  const { min = 0, max = Infinity } = options;
  return text.length >= min && text.length <= max;
}

/**
 * Validate alphanumeric string
 */
export function isAlphanumeric(text: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(text);
}

/**
 * Validate alphanumeric with spaces and basic punctuation
 */
export function isAlphanumericWithSpaces(text: string): boolean {
  return /^[a-zA-Z0-9\s.,!?-]+$/.test(text);
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid,
  );
}

/**
 * Validate integer
 */
export function isValidInteger(value: string | number): boolean {
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  return Number.isInteger(num);
}

/**
 * Validate positive integer
 */
export function isPositiveInteger(value: string | number): boolean {
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  return Number.isInteger(num) && num > 0;
}

/**
 * Validate decimal number
 */
export function isValidDecimal(value: string | number): boolean {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num);
}

/**
 * Validate date string (ISO 8601)
 */
export function isValidDate(date: string): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Validate JSON string
 */
export function isValidJson(json: string): boolean {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Data Sanitization
// ============================================================================

/**
 * Sanitize object by removing dangerous properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  allowedKeys: string[],
): Partial<T> {
  const sanitized: Partial<T> = {};

  allowedKeys.forEach((key) => {
    if (key in obj) {
      sanitized[key as keyof T] = obj[key];
    }
  });

  return sanitized;
}

/**
 * Deep sanitize object (recursively escape HTML in all string values)
 */
export function deepSanitizeObject<T>(obj: T): T {
  if (typeof obj === "string") {
    return escapeHtml(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSanitizeObject) as T;
  }

  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    Object.keys(obj).forEach((key) => {
      sanitized[key] = deepSanitizeObject((obj as any)[key]);
    });
    return sanitized;
  }

  return obj;
}

/**
 * Trim and normalize whitespace
 */
export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Remove all whitespace
 */
export function removeWhitespace(text: string): string {
  return text.replace(/\s/g, "");
}

// ============================================================================
// Content Security
// ============================================================================

/**
 * Check if string contains only safe characters (no control characters)
 */
export function containsOnlySafeCharacters(text: string): boolean {
  // Allow printable ASCII and common Unicode characters
  // Reject control characters and dangerous Unicode
  return !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text);
}

/**
 * Remove control characters
 */
export function removeControlCharacters(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Check for common XSS patterns
 */
export function containsXssPatterns(text: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers
    /<iframe/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(text));
}

/**
 * Check for SQL injection patterns
 */
export function containsSqlInjectionPatterns(text: string): boolean {
  const sqlPatterns = [
    /(\bunion\b.*\bselect\b)/i,
    /(\bor\b.*=.*)/i,
    /(;\s*drop\s+table)/i,
    /(;\s*delete\s+from)/i,
    /(;\s*update\s+)/i,
    /('|")\s*or\s*('|")\s*=\s*('|")/i,
    /--/,
    /\/\*/,
    /xp_/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(text));
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type for sanitization result with validation
 */
export interface SanitizationResult {
  value: string;
  isValid: boolean;
  errors: string[];
}

/**
 * Comprehensive input validation and sanitization
 */
export function validateAndSanitize(
  input: string,
  options: {
    maxLength?: number;
    minLength?: number;
    allowHtml?: boolean;
    allowUrls?: boolean;
    type?: "text" | "email" | "url" | "phone" | "filename";
  } = {},
): SanitizationResult {
  const errors: string[] = [];
  let sanitized = input;

  // Length validation
  if (options.maxLength && input.length > options.maxLength) {
    errors.push(`Input exceeds maximum length of ${options.maxLength}`);
  }
  if (options.minLength && input.length < options.minLength) {
    errors.push(`Input is below minimum length of ${options.minLength}`);
  }

  // Type-specific validation
  switch (options.type) {
    case "email":
      if (!isValidEmail(input)) {
        errors.push("Invalid email format");
      }
      sanitized = sanitizeEmail(input);
      break;

    case "url":
      if (!isValidUrl(input)) {
        errors.push("Invalid URL format");
      }
      sanitized = sanitizeUrl(input);
      break;

    case "phone":
      if (!isValidPhone(input)) {
        errors.push("Invalid phone number format");
      }
      sanitized = sanitizePhone(input);
      break;

    case "filename":
      sanitized = sanitizeFileName(input);
      break;

    case "text":
    default:
      // HTML sanitization
      if (!options.allowHtml) {
        sanitized = sanitizeText(input);
      } else {
        sanitized = sanitizeHtml(input);
      }
      break;
  }

  // Security checks
  if (containsXssPatterns(sanitized)) {
    errors.push("Input contains potentially dangerous XSS patterns");
  }

  if (containsSqlInjectionPatterns(sanitized)) {
    errors.push("Input contains potentially dangerous SQL patterns");
  }

  return {
    value: sanitized,
    isValid: errors.length === 0,
    errors,
  };
}
