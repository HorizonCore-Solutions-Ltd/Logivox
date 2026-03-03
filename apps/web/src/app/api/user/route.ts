import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

/** GET /api/user – return current user profile */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      organizationMembers: {
        where: { isActive: true },
        select: { organization: { select: { id: true, name: true } } },
        take: 5,
      },
    },
  });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

/** PATCH /api/user – update profile / change password */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const data = updateProfileSchema.parse(body);

  const updates: { name?: string; email?: string; passwordHash?: string } = {};

  if (data.name) updates.name = data.name;
  if (data.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }
    updates.email = data.email;
  }

  if (data.newPassword) {
    if (!data.currentPassword) {
      return NextResponse.json(
        { error: "Current password required to set new password" },
        { status: 400 },
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    const valid = user?.passwordHash
      ? await bcrypt.compare(data.currentPassword, user.passwordHash)
      : false;
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }
    updates.passwordHash = await bcrypt.hash(data.newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json({ user: updated });
}
