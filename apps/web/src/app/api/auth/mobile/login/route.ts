// Mobile Authentication Endpoint
// Exchanges email/password for JWT Access Token
// Intended for Native Mobile App (Expo)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 },
      );
    }

    // 1. Find User
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organization: true, // return org details potentially
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 2. Validate Password using the same bcrypt strategy as web auth
    if (!user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 3. Generate Token
    // We use next-auth's encode to create a token compatible with `getToken({req})` if needed,
    // or just a standard JWT signature.
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Auth service misconfigured" },
        { status: 500 },
      );
    }

    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role, // Important for Mobile RBAC
        organizationId: user.organizationId,
        picture: user.image,
      },
      secret,
    });

    // 4. Return Response matching Mobile Expectations
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        avatar: user.image,
      },
      accessToken: token,
      refreshToken: null,
      expiresIn: 3600, // 1 hour
    });
  } catch (error: any) {
    console.error("Mobile Login Error:", error);
    return NextResponse.json({ error: "Internal Auth Error" }, { status: 500 });
  }
}
