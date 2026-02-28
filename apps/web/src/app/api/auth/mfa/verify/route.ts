import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MFAService from "@/lib/services/mfa-service";

/**
 * POST /api/auth/mfa/verify
 * Verify MFA code for login or high-privilege actions
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        mfaEnabled: true,
        mfaSecret: true,
      },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { error: "MFA not enabled for this user" },
        { status: 400 },
      );
    }

    const isValid = MFAService.verifyMFACode(user.mfaSecret, token);

    if (!isValid) {
      // Log failed attempt for security audit
      await prisma.auditLog.create({
        data: {
          action: "MFA_VERIFICATION_FAILED",
          userId: user.id,
          metadata: {
            ip: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
          },
        },
      });

      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("MFA Verification Error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification" },
      { status: 500 },
    );
  }
}
