import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Dynamically derive tenant-scoped models from the Prisma schema
const TENANT_SCOPED_MODELS = new Set(
  Prisma.dmmf.datamodel.models
    .filter((model) =>
      model.fields.some((field) => field.name === "organizationId"),
    )
    .map((model) => model.name),
);

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

    // Enforce tenant scoping at the data layer for all models with organizationId
    globalForPrisma.prisma.$use(async (params, next) => {
      const { model, action, args } = params;

      // Only enforce on tenant-aware models
      if (!model || !TENANT_SCOPED_MODELS.has(model)) {
        return next(params);
      }

      switch (action) {
        case "create":
          assertCreateScoped(args?.data, model, action);
          break;
        case "createMany":
          assertCreateScoped(args?.data, model, action);
          break;
        case "upsert":
          assertCreateScoped(args?.create, model, action);
          assertWhereScoped({ where: args?.where, model, action });
          break;
        case "findMany":
        case "findFirst":
        case "findUnique":
        case "findUniqueOrThrow":
        case "findFirstOrThrow":
        case "update":
        case "updateMany":
        case "delete":
        case "deleteMany":
          assertWhereScoped({ where: args?.where, model, action });
          break;
        default:
          break; // Allow aggregate/raw operations to pass through
      }

      return next(params);
    });
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

// Re-export Prisma namespace for type usage
export { Prisma };

// Default export for compatibility with existing imports
export default prisma;
