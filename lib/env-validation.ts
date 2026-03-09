import { z } from "zod";

/**
 * Production Environment Validation
 * Validates all required environment variables before application start
 */

const requiredEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),
  DIRECT_URL: z
    .string()
    .url("DIRECT_URL must be a valid PostgreSQL URL")
    .optional(),

  // Authentication
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters")
    .refine((val) => !/^(123|abc|password|changeme|test)/i.test(val), "NEXTAUTH_SECRET contains weak or default patterns"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  // Security
  ENCRYPTION_KEY: z
    .string()
    .length(32, "ENCRYPTION_KEY must be exactly 32 characters"),
  CSRF_SECRET: z
    .string()
    .min(32, "CSRF_SECRET must be at least 32 characters")
    .optional(),

  // Application
  NODE_ENV: z.enum(["development", "production", "test"]),
  APP_VERSION: z.string().default("1.0.0"),

  // Feature flags
  SECURITY_HEADERS_ENABLED: z.enum(["true", "false"]).default("true"),
  RATE_LIMIT_ENABLED: z.enum(["true", "false"]).default("true"),
  AUDIT_LOGGING_ENABLED: z.enum(["true", "false"]).default("true"),
});

const optionalEnvSchema = z.object({
  // SMTP Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // File Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  environment: Record<string, any>;
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate required environment variables
    const requiredEnv = requiredEnvSchema.parse(process.env);
    const optionalEnv = optionalEnvSchema.parse(process.env);

    // Check for production-specific requirements
    if (process.env.NODE_ENV === "production") {
      // Ensure secrets are not default/development values
      const dangerousDefaults = [
        "your-super-secret-nextauth-secret-key-here-change-in-production",
        "your-jwt-secret-key-here-change-in-production",
        "your-32-character-encryption-key",
        "development-secret",
        "test-secret",
        "changeme",
        "password",
        "123456",
      ];

      const secrets = [
        { name: "NEXTAUTH_SECRET", value: requiredEnv.NEXTAUTH_SECRET },
        { name: "JWT_SECRET", value: requiredEnv.JWT_SECRET },
        { name: "ENCRYPTION_KEY", value: requiredEnv.ENCRYPTION_KEY },
      ];

      for (const secret of secrets) {
        if (
          dangerousDefaults.some((def) =>
            secret.value.toLowerCase().includes(def.toLowerCase()),
          )
        ) {
          errors.push(
            `${secret.name} appears to be using a default/development value in production`,
          );
        }
      }

      // Check email configuration
      if (!optionalEnv.SMTP_HOST) {
        warnings.push(
          "SMTP not configured - email notifications will not work",
        );
      }

      // Check file storage
      if (!optionalEnv.S3_BUCKET_NAME && !process.env.UPLOAD_DIR) {
        warnings.push(
          "No file storage configured - file uploads will use local filesystem",
        );
      }

      // Check monitoring
      if (!optionalEnv.SENTRY_DSN) {
        warnings.push("Sentry not configured - error tracking will not work");
      }
    }

    // Additional security checks
    if (
      requiredEnv.DATABASE_URL.includes("localhost") &&
      process.env.NODE_ENV === "production"
    ) {
      errors.push("DATABASE_URL should not use localhost in production");
    }

    if (
      requiredEnv.NEXTAUTH_URL.includes("localhost") &&
      process.env.NODE_ENV === "production"
    ) {
      errors.push("NEXTAUTH_URL should not use localhost in production");
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
      environment: Object.fromEntries(
        Object.entries({ ...requiredEnv, ...optionalEnv }).map(([key, value]) => [
          key,
          key.includes("SECRET") || key.includes("KEY") || key.includes("URL") 
          ? "***REDACTED***" 
          : value
        ])
      ),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const envErrors = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`,
      );

      return {
        success: false,
        errors: ["Environment validation failed:", ...envErrors],
        warnings,
        environment: {},
      };
    }

    return {
      success: false,
      errors: [
        `Environment validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      warnings,
      environment: {},
    };
  }
}

// Runtime environment validation for API routes
export function validateApiEnvironment() {
  const result = validateEnvironment();

  if (!result.success) {
    throw new Error(
      `Environment validation failed: ${result.errors.join(", ")}`,
    );
  }

  if (result.warnings.length > 0) {
    console.warn("Environment warnings:", result.warnings);
  }

  return result.environment;
}

// Startup validation that can be called during application initialization
export function validateStartupEnvironment() {
  const result = validateEnvironment();

  console.log("🔒 Environment Validation Results:");
  console.log(`Status: ${result.success ? "✅ PASSED" : "❌ FAILED"}`);

  if (result.errors.length > 0) {
    console.error("❌ Errors:");
    result.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn("⚠️  Warnings:");
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  console.log("📊 Environment Summary:");
  console.log(`  NODE_ENV: ${result.environment.NODE_ENV || "not set"}`);
  console.log(
    `  Database: ${result.environment.DATABASE_URL ? "Configured" : "Not configured"}`,
  );
  console.log(
    `  Authentication: ${result.environment.NEXTAUTH_SECRET ? "Configured" : "Not configured"}`,
  );
  console.log(
    `  Security Features: ${result.environment.SECURITY_HEADERS_ENABLED === "true" ? "Enabled" : "Disabled"}`,
  );

  if (!result.success) {
    process.exit(1);
  }

  return result;
}
