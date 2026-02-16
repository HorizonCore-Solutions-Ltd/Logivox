/**
 * PRODUCTION ENVIRONMENT VALIDATION
 * Validates all required environment variables and configuration
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

interface ConfigValidation {
  isValid: boolean;
  environment: string;
  errors: string[];
  warnings: string[];
  configuration: {
    database: ConfigCheck;
    authentication: ConfigCheck;
    security: ConfigCheck;
    integrations: ConfigCheck;
    monitoring: ConfigCheck;
  };
}

interface ConfigCheck {
  status: "valid" | "invalid" | "warning";
  message: string;
  details?: string[];
}

export async function GET(): Promise<NextResponse> {
  const validation = validateEnvironment();

  if (!validation.isValid) {
    return NextResponse.json(validation, {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return NextResponse.json(validation, {
    status: validation.warnings.length > 0 ? 206 : 200,
    headers: { "Content-Type": "application/json" },
  });
}

function validateEnvironment(): ConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const environment = process.env.NODE_ENV || "development";

  // Database Configuration
  const databaseCheck = validateDatabase(errors, warnings);

  // Authentication Configuration
  const authCheck = validateAuthentication(errors, warnings);

  // Security Configuration
  const securityCheck = validateSecurity(errors, warnings);

  // Integrations Configuration
  const integrationsCheck = validateIntegrations(errors, warnings);

  // Monitoring Configuration
  const monitoringCheck = validateMonitoring(errors, warnings);

  return {
    isValid: errors.length === 0,
    environment,
    errors,
    warnings,
    configuration: {
      database: databaseCheck,
      authentication: authCheck,
      security: securityCheck,
      integrations: integrationsCheck,
      monitoring: monitoringCheck,
    },
  };
}

function validateDatabase(errors: string[], warnings: string[]): ConfigCheck {
  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
    return { status: "invalid", message: "Database URL not configured" };
  }

  // Check if using localhost in production
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DATABASE_URL.includes("localhost")
  ) {
    warnings.push("Using localhost database URL in production");
    return {
      status: "warning",
      message: "Database configured with warnings",
      details: ["Localhost database in production"],
    };
  }

  // Check for proper SSL configuration in production
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.DATABASE_URL.includes("sslmode=require")
  ) {
    warnings.push("Database SSL not enforced in production");
  }

  return { status: "valid", message: "Database properly configured" };
}

function validateAuthentication(
  errors: string[],
  warnings: string[],
): ConfigCheck {
  const issues: string[] = [];

  if (!process.env.NEXTAUTH_SECRET) {
    errors.push("NEXTAUTH_SECRET is required");
    issues.push("NextAuth secret missing");
  } else if (
    process.env.NEXTAUTH_SECRET.includes("test") ||
    process.env.NEXTAUTH_SECRET.includes("change") ||
    process.env.NEXTAUTH_SECRET.length < 32
  ) {
    if (process.env.NODE_ENV === "production") {
      errors.push("NEXTAUTH_SECRET is insecure for production");
      issues.push("Insecure NextAuth secret");
    } else {
      warnings.push("NEXTAUTH_SECRET appears to be a test value");
      issues.push("Test NextAuth secret");
    }
  }

  if (!process.env.NEXTAUTH_URL) {
    errors.push("NEXTAUTH_URL is required");
    issues.push("NextAuth URL missing");
  }

  if (issues.length > 0) {
    return {
      status: errors.some((e) => e.includes("NEXTAUTH"))
        ? "invalid"
        : "warning",
      message: "Authentication configuration issues",
      details: issues,
    };
  }

  return { status: "valid", message: "Authentication properly configured" };
}

function validateSecurity(errors: string[], warnings: string[]): ConfigCheck {
  const issues: string[] = [];

  // Check for HTTPS in production
  if (process.env.NODE_ENV === "production") {
    if (
      process.env.NEXTAUTH_URL &&
      !process.env.NEXTAUTH_URL.startsWith("https://")
    ) {
      errors.push("HTTPS required in production");
      issues.push("Non-HTTPS URL in production");
    }
  }

  // Check for security headers configuration
  if (!process.env.SECURITY_HEADERS_ENABLED) {
    warnings.push("Security headers not explicitly enabled");
    issues.push("Security headers configuration missing");
  }

  // Check for rate limiting
  if (!process.env.RATE_LIMIT_ENABLED) {
    warnings.push("Rate limiting not explicitly enabled");
    issues.push("Rate limiting configuration missing");
  }

  if (issues.length > 0) {
    return {
      status: errors.some((e) => e.includes("HTTPS")) ? "invalid" : "warning",
      message: "Security configuration issues",
      details: issues,
    };
  }

  return { status: "valid", message: "Security properly configured" };
}

function validateIntegrations(
  errors: string[],
  warnings: string[],
): ConfigCheck {
  const issues: string[] = [];

  // Check OAuth providers (optional but recommended)
  const hasGoogleAuth =
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  const hasGitHubAuth = process.env.GITHUB_ID && process.env.GITHUB_SECRET;

  if (!hasGoogleAuth && !hasGitHubAuth) {
    warnings.push("No OAuth providers configured");
    issues.push("OAuth providers not configured");
  }

  // Check email configuration
  if (!process.env.SMTP_HOST && !process.env.SENDGRID_API_KEY) {
    warnings.push("No email service configured");
    issues.push("Email service not configured");
  }

  if (issues.length > 0) {
    return {
      status: "warning",
      message: "Integration configuration warnings",
      details: issues,
    };
  }

  return { status: "valid", message: "Integrations properly configured" };
}

function validateMonitoring(errors: string[], warnings: string[]): ConfigCheck {
  const issues: string[] = [];

  // Check for monitoring configuration
  if (!process.env.LOG_LEVEL) {
    warnings.push("Log level not configured, using default");
    issues.push("Log level not explicitly set");
  }

  if (!process.env.SENTRY_DSN && process.env.NODE_ENV === "production") {
    warnings.push("Error tracking not configured for production");
    issues.push("Error tracking not configured");
  }

  if (issues.length > 0) {
    return {
      status: "warning",
      message: "Monitoring configuration warnings",
      details: issues,
    };
  }

  return { status: "valid", message: "Monitoring properly configured" };
}
