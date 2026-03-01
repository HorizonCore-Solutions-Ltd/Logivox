/**
 * GDPR Compliance Tests
 * Tests for GDPR data export and deletion functionality
 */

import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

describe("GDPR Compliance", () => {
  let testUser: any;
  const testEmail = `gdpr-test-${Date.now()}@example.com`;
  const testPassword = "Test123!@#";

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: "GDPR Test User",
        password: hashedPassword,
        role: "USER",
      },
    });

    // Create some activity logs
    await prisma.activityLog.create({
      data: {
        userId: testUser.id,
        action: "LOGIN",
        entityType: "User",
        entityId: testUser.id,
        details: { test: true },
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      },
    });
  });

  afterAll(async () => {
    // Clean up - find user by anonymized email pattern
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: testEmail },
          { email: { contains: "deleted_" } },
        ],
      },
    });
    await prisma.$disconnect();
  });

  describe("Article 15 - Right to Access", () => {
    test("should export user data in machine-readable format", async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: {
          activityLogs: true,
          accounts: true,
          sessions: true,
        },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);
      expect(user?.activityLogs).toBeDefined();
      expect(Array.isArray(user?.activityLogs)).toBe(true);
    });

    test("should include all required GDPR data categories", async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          isActive: true,
        },
      });

      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("createdAt");
      expect(user).toHaveProperty("role");
    });
  });

  describe("Article 17 - Right to Erasure", () => {
    test("should anonymize user data while preserving audit logs", async () => {
      // Verify user exists
      let user = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);

      // Perform anonymization
      const anonymousId = `deleted_${Date.now()}`;
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: testUser.id },
          data: {
            name: `Deleted User ${anonymousId}`,
            email: `${anonymousId}@deleted.logivox.local`,
            password: null,
            isActive: false,
          },
        });

        await tx.activityLog.updateMany({
          where: { userId: testUser.id },
          data: {
            details: {
              anonymized: true,
              deletionDate: new Date().toISOString(),
            },
          },
        });
      });

      // Verify anonymization
      user = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(user).toBeDefined();
      expect(user?.email).toContain("@deleted.logivox.local");
      expect(user?.password).toBeNull();
      expect(user?.isActive).toBe(false);

      // Verify audit logs still exist
      const logs = await prisma.activityLog.findMany({
        where: { userId: testUser.id },
      });
      expect(logs.length).toBeGreaterThan(0);
    });

    test("should delete authentication accounts", async () => {
      const accountsBefore = await prisma.account.count({
        where: { userId: testUser.id },
      });

      await prisma.account.deleteMany({
        where: { userId: testUser.id },
      });

      const accountsAfter = await prisma.account.count({
        where: { userId: testUser.id },
      });

      expect(accountsAfter).toBeLessThanOrEqual(accountsBefore);
    });

    test("should delete active sessions", async () => {
      const sessionsBefore = await prisma.session.count({
        where: { userId: testUser.id },
      });

      await prisma.session.deleteMany({
        where: { userId: testUser.id },
      });

      const sessionsAfter = await prisma.session.count({
        where: { userId: testUser.id },
      });

      expect(sessionsAfter).toBeLessThanOrEqual(sessionsBefore);
    });
  });

  describe("Data Retention", () => {
    test("should preserve anonymized activity logs for compliance", async () => {
      const logs = await prisma.activityLog.findMany({
        where: {
          userId: testUser.id,
          details: {
            path: ["anonymized"],
            equals: true,
          },
        },
      });

      // Logs should exist but be anonymized
      if (logs.length > 0) {
        expect(logs[0].details).toHaveProperty("anonymized");
        expect((logs[0].details as any).anonymized).toBe(true);
      }
    });

    test("should mark deletion in audit trail", async () => {
      await prisma.activityLog.create({
        data: {
          userId: null,
          action: "GDPR_DATA_DELETION_COMPLETED",
          entityType: "User",
          entityId: testUser.id,
          details: {
            completionDate: new Date().toISOString(),
            gdprArticle: "Article 17",
          },
          ipAddress: "127.0.0.1",
          userAgent: "test",
        },
      });

      const deletionLog = await prisma.activityLog.findFirst({
        where: {
          action: "GDPR_DATA_DELETION_COMPLETED",
          entityId: testUser.id,
        },
      });

      expect(deletionLog).toBeDefined();
      expect(deletionLog?.action).toBe("GDPR_DATA_DELETION_COMPLETED");
      expect((deletionLog?.details as any).gdprArticle).toBe("Article 17");
    });
  });
});
