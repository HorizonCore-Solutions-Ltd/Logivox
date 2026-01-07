import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MFAService from "@/lib/services/mfa-service";

/**
 * GET /api/auth/mfa/setup
 * Generate MFA setup data (secret, QR code, backup codes)
 */
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        mfaEnabled: true,
        mfaSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if MFA is already enabled
    if (user.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA is already enabled for this account" },
        { status: 400 },
      );
    }

    // Generate MFA setup data
    const setupData = await MFAService.generateMFASetup(
      user.id,
      user.email!,
      "LogiVox WMS",
    );

    // Hash backup codes for storage
    const hashedBackupCodes = await MFAService.hashBackupCodes(
      setupData.backupCodes,
    );

    // Store secret and backup codes (temporarily, until verified)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaSecret: setupData.secret, // Temporary until verification
        mfaBackupCodes: hashedBackupCodes,
      },
    });

    // Return setup data (include plaintext backup codes for user to save)
    return NextResponse.json({
      qrCodeUrl: setupData.qrCodeUrl,
      backupCodes: setupData.backupCodes, // User needs to save these
      secret: setupData.secret, // For manual entry if QR code doesn't work
    });
  } catch (error: any) {
    console.error("Error generating MFA setup:", error);
    return NextResponse.json(
      { error: "Failed to generate MFA setup" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/auth/mfa/setup
 * Verify and enable MFA
 */
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 },
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        mfaEnabled: true,
        mfaSecret: true,
      },
    });

    if (!user || !user.mfaSecret) {
      return NextResponse.json(
        { error: "MFA setup not initiated. Please start setup first." },
        { status: 400 },
      );
    }

    // Verify the token
    const isValid = MFAService.verifyMFACode(user.mfaSecret, token);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code. Please try again." },
        { status: 400 },
      );
    }

    // Enable MFA for user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
        mfaVerifiedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "SECURITY_MFA_ENABLED",
        entityType: "User",
        entityId: user.id,
        details: {
          method: "TOTP",
          verifiedAt: new Date().toISOString(),
        },
        ipAddress:
          req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: "MFA enabled successfully",
    });
  } catch (error: any) {
    console.error("Error enabling MFA:", error);
    return NextResponse.json(
      { error: "Failed to enable MFA" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/auth/mfa/setup
 * Disable MFA (requires password confirmation)
 */
export async function DELETE(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { password, token } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required to disable MFA" },
        { status: 400 },
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
        mfaEnabled: true,
        mfaSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify password
    const bcrypt = require("bcrypt");
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // If MFA is currently enabled, require MFA token as well
    if (user.mfaEnabled && user.mfaSecret) {
      if (!token) {
        return NextResponse.json(
          { error: "MFA verification code is required" },
          { status: 400 },
        );
      }

      const isValidToken = MFAService.verifyMFACode(user.mfaSecret, token);
      if (!isValidToken) {
        return NextResponse.json(
          { error: "Invalid MFA code" },
          { status: 400 },
        );
      }
    }

    // Disable MFA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
        mfaVerifiedAt: null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "SECURITY_MFA_DISABLED",
        entityType: "User",
        entityId: user.id,
        details: {
          disabledAt: new Date().toISOString(),
        },
        ipAddress:
          req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: "MFA disabled successfully",
    });
  } catch (error: any) {
    console.error("Error disabling MFA:", error);
    return NextResponse.json(
      { error: "Failed to disable MFA" },
      { status: 500 },
    );
  }
}
