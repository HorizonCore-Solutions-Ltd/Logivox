export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin of this organization
    const adminMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: params.id,
        role: "ADMIN",
      },
    });

    if (!adminMembership) {
      return NextResponse.json(
        { message: "Only admins can update member roles" },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { role } = updateMemberSchema.parse(body);

    // Get the target member
    const targetMember = await prisma.organizationMember.findUnique({
      where: {
        id: params.memberId,
      },
      include: {
        user: true,
      },
    });

    if (!targetMember || targetMember.organizationId !== params.id) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 },
      );
    }

    // Prevent changing own role
    if (targetMember.userId === session.user.id) {
      return NextResponse.json(
        { message: "You cannot change your own role" },
        { status: 400 },
      );
    }

    // Count admins in organization
    const adminCount = await prisma.organizationMember.count({
      where: {
        organizationId: params.id,
        role: "ADMIN",
      },
    });

    // Prevent removing last admin
    if (targetMember.role === "ADMIN" && adminCount === 1) {
      return NextResponse.json(
        { message: "Cannot change role of the last admin" },
        { status: 400 },
      );
    }

    // Update member role
    const updatedMember = await prisma.organizationMember.update({
      where: { id: params.memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "member",
        entityId: updatedMember.id,
        userId: session.user.id,
        details: JSON.stringify({
          memberEmail: targetMember.user.email,
          previousRole: targetMember.role,
          newRole: role,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 },
      );
    }

    console.error("Member update error:", error);
    return NextResponse.json(
      { message: "Failed to update member" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin of this organization
    const adminMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: params.id,
        role: "ADMIN",
      },
    });

    if (!adminMembership) {
      return NextResponse.json(
        { message: "Only admins can remove members" },
        { status: 403 },
      );
    }

    // Get the target member
    const targetMember = await prisma.organizationMember.findUnique({
      where: {
        id: params.memberId,
      },
      include: {
        user: true,
      },
    });

    if (!targetMember || targetMember.organizationId !== params.id) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 },
      );
    }

    // Prevent removing self
    if (targetMember.userId === session.user.id) {
      return NextResponse.json(
        { message: "You cannot remove yourself from the organization" },
        { status: 400 },
      );
    }

    // Count admins in organization
    const adminCount = await prisma.organizationMember.count({
      where: {
        organizationId: params.id,
        role: "ADMIN",
      },
    });

    // Prevent removing last admin
    if (targetMember.role === "ADMIN" && adminCount === 1) {
      return NextResponse.json(
        { message: "Cannot remove the last admin" },
        { status: 400 },
      );
    }

    // Delete member
    await prisma.organizationMember.delete({
      where: { id: params.memberId },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "member",
        entityId: targetMember.id,
        userId: session.user.id,
        details: JSON.stringify({
          memberEmail: targetMember.user.email,
          memberRole: targetMember.role,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Member delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete member" },
      { status: 500 },
    );
  }
}
