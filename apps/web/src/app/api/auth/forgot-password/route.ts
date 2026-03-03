export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_HOURS = 1; // Token expires in 1 hour

async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  // Use SendGrid if available, else log to console (dev fallback)
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    const sgMail = (await import("@sendgrid/mail")).default;
    sgMail.setApiKey(sendgridKey);
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@logivox.com",
      subject: "Reset your LogiVox password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>You requested a password reset for your LogiVox account.</p>
          <p>Click the button below to choose a new password. This link expires in ${TOKEN_TTL_HOURS} hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#3B82F6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
            Reset password
          </a>
          <p style="color:#666;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color:#666;font-size:12px;">Link: ${resetUrl}</p>
        </div>
      `,
    });
  } else {
    // Dev fallback — print to stdout
    console.log(`\n[DEV] Password reset link for ${email}:\n${resetUrl}\n`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Delete any existing reset token for this email
      await prisma.verificationToken.deleteMany({
        where: { identifier: `reset:${email}` },
      });

      // Generate a secure token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

      await prisma.verificationToken.create({
        data: {
          identifier: `reset:${email}`,
          token,
          expires,
        },
      });

      await sendPasswordResetEmail(email, token);
    }

    // Always return the same message (prevent user enumeration)
    return NextResponse.json({
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
