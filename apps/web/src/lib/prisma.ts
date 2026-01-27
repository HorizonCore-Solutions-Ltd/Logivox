import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

// Re-export Prisma namespace for type usage
export { Prisma };

// Default export for compatibility with existing imports
export default prisma;
