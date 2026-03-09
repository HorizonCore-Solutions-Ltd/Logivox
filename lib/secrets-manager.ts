/**
 * AWS Secrets Manager Integration
 * Production-ready secrets management for LogiVox
 */

import { SecretsManager } from "@aws-sdk/client-secrets-manager";

interface SecretConfig {
  region: string;
  secretArn?: string;
  localFallback?: boolean;
}

class SecretsService {
  private client: SecretsManager;
  private config: SecretConfig;
  private cache = new Map<string, { value: any; expires: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: SecretConfig) {
    this.config = config;
    this.client = new SecretsManager({
      region: config.region,
      // Use IAM roles for production, avoid hardcoded credentials
    });
  }

  /**
   * Retrieve a secret from AWS Secrets Manager with caching
   */
  async getSecret(secretName: string): Promise<Record<string, any>> {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && Date.now() < cached.expires) {
      return cached.value;
    }

    try {
      const response = await this.client.getSecretValue({
        SecretId: secretName,
      });

      if (!response.SecretString) {
        throw new Error(`Secret ${secretName} has no string value`);
      }

      const secretValue = JSON.parse(response.SecretString);

      // Cache the result
      this.cache.set(secretName, {
        value: secretValue,
        expires: Date.now() + this.CACHE_TTL,
      });

      return secretValue;
    } catch (error) {
      if (this.config.localFallback && process.env.NODE_ENV === "development") {
        console.warn(`⚠️ Falling back to local env for secret: ${secretName}`);
        return this.getLocalFallback(secretName);
      }

      console.error(`❌ Failed to retrieve secret ${secretName}:`, error);
      throw new Error(`Failed to retrieve secret: ${secretName}`);
    }
  }

  /**
   * Get database configuration from secrets manager
   */
  async getDatabaseConfig(): Promise<string> {
    const secrets = await this.getSecret("logivox/database");
    const { username, password, host, port, database } = secrets;
    return `postgresql://${username}:${password}@${host}:${port}/${database}?sslmode=require`;
  }

  /**
   * Get NextAuth configuration from secrets manager
   */
  async getAuthConfig(): Promise<{ secret: string; url: string }> {
    const secrets = await this.getSecret("logivox/auth");
    return {
      secret: secrets.nextauth_secret,
      url:
        secrets.nextauth_url ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000",
    };
  }

  /**
   * Get third-party service credentials
   */
  async getServiceCredentials(
    service: "sendgrid" | "twilio" | "stripe",
  ): Promise<Record<string, string>> {
    return this.getSecret(`logivox/services/${service}`);
  }

  /**
   * Local development fallback (reads from .env)
   */
  private getLocalFallback(secretName: string): Record<string, any> {
    switch (secretName) {
      case "logivox/database":
        if (!process.env.DB_USERNAME || !process.env.DB_PASSWORD) {
          throw new Error(`CRITICAL: Local secrets missing for ${secretName}. Add DB_USERNAME and DB_PASSWORD to .env.local immediately.`);
        }
        return {
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          host: process.env.DB_HOST || "localhost",
          port: process.env.DB_PORT || "5432",
          database: process.env.DB_NAME || "logivox_dev",
        };

      case "logivox/auth":
        if (!process.env.NEXTAUTH_SECRET) {
          throw new Error(`CRITICAL: Local secrets missing for ${secretName}. Add NEXTAUTH_SECRET to .env.local immediately.`);
        }
        return {
          nextauth_secret: process.env.NEXTAUTH_SECRET,
          nextauth_url: process.env.NEXTAUTH_URL || "http://localhost:3000",
        };

      default:
        throw new Error(`No local fallback for secret: ${secretName}`);
    }
  }

  /**
   * Clear cached secrets (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance for production use
let secretsService: SecretsService | null = null;

export function getSecretsService(): SecretsService {
  if (!secretsService) {
    const region = process.env.AWS_REGION || "us-east-1";
    const localFallback = process.env.NODE_ENV === "development";

    secretsService = new SecretsService({
      region,
      localFallback,
    });
  }

  return secretsService;
}

/**
 * Utility function to get database URL from secrets
 */
export async function getDatabaseUrl(): Promise<string> {
  if (process.env.NODE_ENV === "development" && process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const secretsService = getSecretsService();
  return secretsService.getDatabaseConfig();
}

/**
 * Utility function to get NextAuth configuration
 */
export async function getNextAuthConfig() {
  if (process.env.NODE_ENV === "development") {
    return {
      secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-me",
      url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    };
  }

  const secretsService = getSecretsService();
  return secretsService.getAuthConfig();
}

export { SecretsService };
