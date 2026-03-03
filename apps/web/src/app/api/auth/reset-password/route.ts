export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    // Password strength validation (same as register)
    const passwordErrors: string[] = [];
    if (password.length < 8) passwordErrors.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) passwordErrors.push("one uppercase letter");
    if (!/[0-9]/.test(password)) passwordErrors.push("one number");
    if (!/[^A-Za-z0-9]/.test(password))
      passwordErrors.push("one special character");
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: `Password must contain: ${passwordErrors.join(", ")}` },
        { status: 400 },
      );
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: { startsWith: "reset:" },
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token. Please request a new one." },
        { status: 400 },
      );
    }

    // Extract email from identifier
    const email = verificationToken.identifier.replace("reset:", "");

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash and update password
    const hashedPassword = await hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier: verificationToken.identifier, token },
      },
    });

    // Reset any account lockout
    await prisma.securityProfile.updateMany({
      where: { userId: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastFailedLogin: null,
      },
    });

    // Log the event
    try {
      await (prisma as any).securityLog.create({
        data: {
          userId: user.id,
          event: "PASSWORD_RESET",
          metadata: { ip: request.headers.get("x-forwarded-for") || "unknown" },
          timestamp: new Date(),
        },
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
