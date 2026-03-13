import crypto from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ACCOUNT_LOCKOUT = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  fcmToken: z.string().optional(),
});

async function createToken(
  payload: Record<string, unknown>,
  expiresInSeconds: number,
) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not configured");
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(new TextEncoder().encode(secret));
}

async function trackFailedLogin(userId: string) {
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
        lockedUntil: new Date(Date.now() + ACCOUNT_LOCKOUT.LOCKOUT_DURATION_MS),
      },
    });
  }
}

async function resetFailedAttempts(userId: string) {
  await prisma.securityProfile.updateMany({
    where: { userId },
    data: {
      failedLoginAttempts: 0,
      lastFailedLogin: null,
      lockedUntil: null,
    },
  });
}

// POST /api/mobile/auth/login - Mobile login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, deviceId, deviceName, fcmToken } =
      loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        securityProfile: true,
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user || !user.password) {
      // Prevent timing attacks
      await bcrypt.compare(
        "invalid",
        "$2a$12$invalid.invalid.invalid.invalid.invalidinvalidinv",
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        },
        { status: 401 },
      );
    }

    if (
      user.securityProfile?.lockedUntil &&
      user.securityProfile.lockedUntil > new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message: "Account temporarily locked. Try again later.",
          },
        },
        { status: 423 },
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await trackFailedLogin(user.id);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        },
        { status: 401 },
      );
    }

    await resetFailedAttempts(user.id);

    const activeOrg = user.organizationMemberships[0];
    const orgPayload = activeOrg
      ? {
          id: activeOrg.organization.id,
          name: activeOrg.organization.name,
          slug: activeOrg.organization.slug,
          role: activeOrg.role,
        }
      : null;

    const accessToken = await createToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        organizationId: orgPayload?.id ?? null,
        type: "access",
      },
      60 * 60, // 1 hour
    );

    const refreshToken = await createToken(
      {
        sub: user.id,
        type: "refresh",
        tokenId: crypto.randomUUID(),
      },
      60 * 60 * 24 * 30, // 30 days
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          organization: orgPayload,
          device: {
            id: deviceId,
            name: deviceName,
            registered: Boolean(deviceId),
            fcmToken,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_INPUT", details: error.issues },
        },
        { status: 400 },
      );
    }
    console.error("Mobile login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "LOGIN_FAILED",
          message: "Failed to authenticate",
        },
      },
      { status: 401 },
    );
  }
}
