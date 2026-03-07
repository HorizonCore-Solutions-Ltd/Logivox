import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Dynamically derive tenant-scoped models from the Prisma schema
// Currently disabled because Prisma.dmmf is not available at runtime in some environments
// const TENANT_SCOPED_MODELS = new Set(
//   Prisma.dmmf.datamodel.models
//     .filter((model) =>
//       model.fields.some((field) => field.name === "organizationId"),
//     )
//     .map((model) => model.name),
// );

// Helpers to verify organization scoping on queries
function containsOrganizationId(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;

  if (
    Object.prototype.hasOwnProperty.call(input, "organizationId") &&
    (input as Record<string, unknown>).organizationId !== undefined
  ) {
    return true;
  }

  const candidate = input as Record<string, unknown>;
  const logicalKeys = ["AND", "OR", "NOT"] as const;
  return logicalKeys.some((key) => {
    if (!candidate[key]) return false;
    const value = candidate[key];
    return Array.isArray(value)
      ? value.some((v) => containsOrganizationId(v))
      : containsOrganizationId(value);
  });
}

function assertWhereScoped(params: {
  where: unknown;
  model?: string | null;
  action: string;
}) {
  if (!containsOrganizationId(params.where)) {
    throw new Error(
      `Tenant scope required: ${params.model ?? "unknown model"} ${params.action} must include organizationId in where clause.`,
    );
  }
}

function assertCreateScoped(
  data: unknown,
  model?: string | null,
  action?: string,
) {
  if (Array.isArray(data)) {
    data.forEach((entry) => assertCreateScoped(entry, model, action));
    return;
  }

  if (data && typeof data === "object" && "create" in (data as any)) {
    // Handle upsert-like shapes: { create: {...}, update: {...} }
    const shaped = data as { create?: unknown; update?: unknown };
    if (shaped.create) {
      assertCreateScoped(shaped.create, model, action);
      return;
    }
  }

  if (!containsOrganizationId(data)) {
    throw new Error(
      `Tenant scope required: ${model ?? "unknown model"} ${action ?? "create"} must include organizationId in data.`,
    );
  }
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
      // Production optimizations
      datasourceUrl: process.env.DATABASE_URL,
    });

    // TODO: Re-enable tenant scoping with proper fix for User model access
    // Temporarily disabled to resolve login authentication issues
    // The tenant scoping logic needs to be refactored to work with Prisma Client Extensions
    // without blocking User authentication queries
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

// Re-export Prisma namespace for type usage
export { Prisma };

// Default export for compatibility with existing imports
export default prisma;
