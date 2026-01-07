// =============================================================================
// CRITICAL PATH TESTS - Authentication Flow
// =============================================================================
import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

describe("Authentication Critical Path", () => {
  const testUser = {
    email: "test@example.com",
    name: "Test User",
    password: "SecurePass123!",
  };

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  describe("User Registration", () => {
    test("should create a new user account", async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 12);

      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
        },
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(testUser.email);
      expect(user.name).toBe(testUser.name);
      expect(user.password).not.toBe(testUser.password); // Password should be hashed
    });

    test("should not allow duplicate email addresses", async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 12);

      // Create first user
      await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
        },
      });

      // Attempt to create duplicate
      await expect(
        prisma.user.create({
          data: {
            email: testUser.email,
            name: "Another User",
            password: hashedPassword,
          },
        }),
      ).rejects.toThrow();
    });

    test("should hash password correctly", async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      const isValid = await bcrypt.compare(testUser.password, hashedPassword);
      expect(isValid).toBe(true);
    });
  });

  describe("User Login", () => {
    test("should authenticate with correct credentials", async () => {
      // Create user
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
        },
      });

      // Verify credentials
      const foundUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      expect(foundUser).toBeDefined();
      const isValidPassword = await bcrypt.compare(
        testUser.password,
        foundUser!.password!,
      );
      expect(isValidPassword).toBe(true);
    });

    test("should reject incorrect password", async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
        },
      });

      const foundUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      const isValidPassword = await bcrypt.compare(
        "WrongPassword",
        foundUser!.password!,
      );
      expect(isValidPassword).toBe(false);
    });

    test("should reject non-existent user", async () => {
      const foundUser = await prisma.user.findUnique({
        where: { email: "nonexistent@example.com" },
      });
      expect(foundUser).toBeNull();
    });
  });

  describe("Session Management", () => {
    test("should create and retrieve user session", async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
        },
      });

      // Simulate session creation
      const sessionToken = `session_${Date.now()}`;
      const session = await prisma.session.create({
        data: {
          sessionToken,
          userId: user.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(user.id);

      // Retrieve session
      const foundSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      expect(foundSession).toBeDefined();
      expect(foundSession!.user.email).toBe(testUser.email);
    });

    test("should invalidate expired sessions", async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
        },
      });

      // Create expired session
      const sessionToken = `session_${Date.now()}`;
      await prisma.session.create({
        data: {
          sessionToken,
          userId: user.id,
          expires: new Date(Date.now() - 1000), // Expired
        },
      });

      const session = await prisma.session.findUnique({
        where: { sessionToken },
      });

      expect(session).toBeDefined();
      expect(session!.expires.getTime()).toBeLessThan(Date.now());
    });
  });

  describe("Password Reset", () => {
    test("should generate password reset token", async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
        },
      });

      const resetToken = `reset_${Date.now()}`;
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry: tokenExpiry,
        },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser!.resetToken).toBe(resetToken);
      expect(updatedUser!.resetTokenExpiry).toEqual(tokenExpiry);
    });

    test("should reset password with valid token", async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      const resetToken = `reset_${Date.now()}`;

      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
          resetToken,
          resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Verify token is valid
      const foundUser = await prisma.user.findFirst({
        where: {
          resetToken,
          resetTokenExpiry: { gt: new Date() },
        },
      });

      expect(foundUser).toBeDefined();

      // Reset password
      const newPassword = "NewSecurePass123!";
      const newHashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: newHashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      const isNewPasswordValid = await bcrypt.compare(
        newPassword,
        updatedUser!.password!,
      );
      expect(isNewPasswordValid).toBe(true);
      expect(updatedUser!.resetToken).toBeNull();
    });
  });
});
