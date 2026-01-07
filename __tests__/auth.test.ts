/**
 * Authentication Tests
 * Test user authentication flows including registration, login, and logout
 */

import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

describe("Authentication", () => {
  let testUser: any;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "Test123!@#";

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await prisma.user.delete({
        where: { id: testUser.id },
      });
    }
    await prisma.$disconnect();
  });

  describe("User Registration", () => {
    test("should create a new user with hashed password", async () => {
      const hashedPassword = await bcrypt.hash(testPassword, 12);

      testUser = await prisma.user.create({
        data: {
          email: testEmail,
          name: "Test User",
          password: hashedPassword,
          role: "USER",
        },
      });

      expect(testUser).toBeDefined();
      expect(testUser.email).toBe(testEmail);
      expect(testUser.password).not.toBe(testPassword);
      expect(testUser.password.startsWith("$2b$")).toBe(true);
    });

    test("should not allow duplicate email addresses", async () => {
      const hashedPassword = await bcrypt.hash(testPassword, 12);

      await expect(
        prisma.user.create({
          data: {
            email: testEmail,
            name: "Duplicate User",
            password: hashedPassword,
            role: "USER",
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Password Verification", () => {
    test("should verify correct password", async () => {
      const isValid = await bcrypt.compare(testPassword, testUser.password);
      expect(isValid).toBe(true);
    });

    test("should reject incorrect password", async () => {
      const isValid = await bcrypt.compare(
        "WrongPassword123",
        testUser.password,
      );
      expect(isValid).toBe(false);
    });
  });

  describe("User Lookup", () => {
    test("should find user by email", async () => {
      const foundUser = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(testUser.id);
    });

    test("should return null for non-existent email", async () => {
      const foundUser = await prisma.user.findUnique({
        where: { email: "nonexistent@example.com" },
      });

      expect(foundUser).toBeNull();
    });
  });

  describe("Session Management", () => {
    test("should create session for user", async () => {
      const session = await prisma.session.create({
        data: {
          sessionToken: `session-${Date.now()}`,
          userId: testUser.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(testUser.id);

      // Cleanup
      await prisma.session.delete({ where: { id: session.id } });
    });

    test("should find session by token", async () => {
      const sessionToken = `session-${Date.now()}`;
      const createdSession = await prisma.session.create({
        data: {
          sessionToken,
          userId: testUser.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const foundSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      expect(foundSession).toBeDefined();
      expect(foundSession?.user.email).toBe(testEmail);

      // Cleanup
      await prisma.session.delete({ where: { id: createdSession.id } });
    });
  });

  describe("Role-Based Access", () => {
    test("should assign correct role to user", async () => {
      const adminUser = await prisma.user.create({
        data: {
          email: `admin-${Date.now()}@example.com`,
          name: "Admin User",
          password: await bcrypt.hash("Admin123!@#", 12),
          role: "ADMIN",
        },
      });

      expect(adminUser.role).toBe("ADMIN");

      // Cleanup
      await prisma.user.delete({ where: { id: adminUser.id } });
    });
  });
});
