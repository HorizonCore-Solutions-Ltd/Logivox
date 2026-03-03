import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { prisma } from "@/lib/prisma";

// Account lockout configuration
const ACCOUNT_LOCKOUT = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Find user with security tracking — include securityProfile so
        // lockout and MFA checks have real data to work with
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { securityProfile: true },
        });

        if (!user || !user.password) {
          // Prevent timing attacks
          await bcrypt.compare(
            "dummy",
            "$2a$12$dummy.hash.to.prevent.timing.attacks",
          );
          throw new Error("Invalid credentials");
        }

        // Check if account is disabled/deactivated
        if (!user.isActive) {
          throw new Error("Account is disabled. Contact your administrator.");
        }

        // Check if account is locked (A-4: lockout enforcement)
        if (
          user.securityProfile?.lockedUntil &&
          user.securityProfile.lockedUntil > new Date()
        ) {
          throw new Error("Account temporarily locked due to security");
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValidPassword) {
          // Track failed attempts (A-5)
          await trackFailedLogin(user.id);
          throw new Error("Invalid credentials");
        }

        // Verify MFA if enabled (A-1)
        if (user.securityProfile?.mfaEnabled && !credentials.mfaCode) {
          throw new Error("MFA code required");
        }

        if (user.securityProfile?.mfaEnabled && credentials.mfaCode) {
          const isValidMFA = await verifyMFACode(user.id, credentials.mfaCode);
          if (!isValidMFA) {
            await trackFailedLogin(user.id);
            throw new Error("Invalid MFA code");
          }
        }

        // Reset failed attempts on successful login
        await resetFailedAttempts(user.id);

        // Log successful login
        /*
        await logSecurityEvent(user.id, "LOGIN_SUCCESS", {
          ip: "unknown", // Would get from request in real implementation
          userAgent: "unknown",
        });
        */

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // 12 hours (reduced from 30 days!)
    updateAge: 30 * 60, // 30 minutes
  },
  jwt: {
    maxAge: 12 * 60 * 60, // 12 hours
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Additional security checks
      if (!user.email) return false;

      // Check for suspicious activity
      const suspiciousActivity = await checkSuspiciousActivity(user.email);
      if (suspiciousActivity) {
        await logSecurityEvent(user.id, "SUSPICIOUS_LOGIN_BLOCKED", {
          email: user.email,
          provider: account?.provider,
        });
        return false;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;

        // Get user's organization memberships and role
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            organizationMemberships: {
              where: { isActive: true },
              include: {
                organization: true,
              },
            },
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.organizations = dbUser.organizationMemberships.map(
            (m: any) => ({
              id: m.organization.id,
              name: m.organization.name,
              role: m.role,
              slug: m.organization.slug,
            }),
          );
          token.lastActivity = Date.now();
        }
      }

      // Auto-logout after inactivity (6 hours)
      if (
        token.lastActivity &&
        Date.now() - (token.lastActivity as number) > 6 * 60 * 60 * 1000
      ) {
        return null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizations = token.organizations as any;
        // Convenience: set organizationId to first organization for backward compatibility
        session.user.organizationId =
          (token.organizations as any)?.[0]?.id ?? null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      await logSecurityEvent(user.id, "SIGN_IN", {
        provider: account?.provider,
        isNewUser,
      });
    },
    async signOut({ token }) {
      if (token?.id) {
        await logSecurityEvent(token.id as string, "SIGN_OUT", {});
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

// Security helper functions
async function trackFailedLogin(userId: string) {
  try {
    await prisma.securityProfile.upsert({
      where: { userId },
      update: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLogin: new Date(),
      },
      create: {
        userId,
        failedLoginAttempts: 1,
        lastFailedLogin: new Date(),
      },
    });

    // Check if we should lock the account
    const profile = await prisma.securityProfile.findUnique({
      where: { userId },
    });

    if (
      profile &&
      profile.failedLoginAttempts >= ACCOUNT_LOCKOUT.MAX_FAILED_ATTEMPTS
    ) {
      await prisma.securityProfile.update({
        where: { userId },
        data: {
          lockedUntil: new Date(Date.now() + ACCOUNT_LOCKOUT.LOCKOUT_DURATION),
        },
      });
    }
  } catch (error) {
    console.error("Failed to track login attempt:", error);
  }
}

async function resetFailedAttempts(userId: string) {
  try {
    await prisma.securityProfile.updateMany({
      where: { userId },
      data: {
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        lockedUntil: null,
      },
    });
  } catch (error) {
    console.error("Failed to reset failed attempts:", error);
  }
}

async function verifyMFACode(userId: string, code: string): Promise<boolean> {
  try {
    // Get user's MFA secret from database
    const securityProfile = await prisma.securityProfile.findUnique({
      where: { userId },
      select: { mfaSecret: true, mfaEnabled: true },
    });

    if (!securityProfile?.mfaEnabled || !securityProfile.mfaSecret) {
      return false;
    }

    if (!/^\d{6}$/.test(code)) {
      return false;
    }

    return authenticator.check(code, securityProfile.mfaSecret);
  } catch (error) {
    console.error("MFA verification error:", error);
    return false;
  }
}

async function checkSuspiciousActivity(email: string): Promise<boolean> {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Check for rapid login attempts in the last 5 minutes
    const recentAttempts = await prisma.securityLog.count({
      where: {
        user: { email },
        event: "LOGIN_ATTEMPT",
        timestamp: { gte: fiveMinutesAgo },
      },
    });

    // Flag as suspicious if more than 10 attempts in 5 minutes
    if (recentAttempts > 10) {
      return true;
    }

    // Check for failed attempts in the last hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const failedAttempts = await prisma.securityLog.count({
      where: {
        user: { email },
        event: "LOGIN_FAILED",
        timestamp: { gte: oneHourAgo },
      },
    });

    // Flag as suspicious if more than 20 failed attempts in 1 hour
    return failedAttempts > 20;
  } catch (error) {
    console.error("Error checking suspicious activity:", error);
    // Err on the side of caution - don't block if we can't check
    return false;
  }
}

async function logSecurityEvent(userId: string, event: string, metadata: any) {
  try {
    await prisma.securityLog.create({
      data: {
        userId,
        event,
        metadata,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}
