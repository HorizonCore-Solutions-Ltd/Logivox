export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/verify-email?token=<token>
 * Verifies a user's email address using a one-time token stored in
 * the VerificationToken table (same table NextAuth uses for magic links).
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token || typeof token !== "string" || token.trim() === "") {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 },
      );
    }

    // Look up token — identifier prefix "verify-email:" keeps it isolated
    const record = await prisma.verificationToken.findFirst({
      where: { token },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 },
      );
    }

    // Check expiry
    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { token } });
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Token identifier format: "verify-email:<email>"
    const email = record.identifier.replace(/^verify-email:/, "");

    // Mark the user's email as verified
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Consume the token
    await prisma.verificationToken.deleteMany({ where: { token } });

    // Log the event
    try {
      await prisma.activityLog.create({
        data: {
          action: "EMAIL_VERIFIED",
          entityType: "USER",
          entityId: updatedUser.id,
          description: `Email verified for ${email}`,
          userId: updatedUser.id,
        },
      });
    } catch (_) {
      // Non-fatal
    }

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/auth/verify-email
 * Resend a verification email to the authenticated (but unverified) user.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return 200 to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message:
          "If that email exists in our system, a verification link will be sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email is already verified." });
    }

    // Rotate any existing token
    await prisma.verificationToken.deleteMany({
      where: { identifier: `verify-email:${email}` },
    });

    const crypto = (await import("crypto")).default;
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: { identifier: `verify-email:${email}`, token, expires },
    });

    const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`;

    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey) {
      const sgMail = (await import("@sendgrid/mail")).default;
      sgMail.setApiKey(sendgridKey);
      await sgMail.send({
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@logivox.com",
        subject: "Verify your LogiVox email",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify your email address</h2>
            <p>Click the button below to verify your LogiVox account email. This link expires in 24 hours.</p>
            <a href="${verifyUrl}" style="display:inline-block;background:#3B82F6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
              Verify email
            </a>
            <p style="color:#666;font-size:12px;">If you didn't create a LogiVox account, you can safely ignore this email.</p>
            <p style="color:#666;font-size:12px;">Link: ${verifyUrl}</p>
          </div>
        `,
      });
    } else {
      console.log(
        `\n[DEV] Email verification link for ${email}:\n${verifyUrl}\n`,
      );
    }

    return NextResponse.json({
      message:
        "If that email exists in our system, a verification link will be sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 },
    );
  }
}
