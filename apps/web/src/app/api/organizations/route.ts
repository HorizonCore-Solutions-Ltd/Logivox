export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createOrganizationSchema = z.object({
  name: z.string().min(2).max(120),
  domain: z.string().trim().toLowerCase().optional(),
});

function baseSlugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function generateUniqueOrgSlug(name: string): Promise<string> {
  const base = baseSlugFromName(name) || "organization";
  for (let i = 0; i < 100; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const existing = await prisma.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString(36)}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user with all their organizations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: {
            organization: {
              include: {
                _count: {
                  select: {
                    members: true,
                    inventoryItems: true,
                    bookings: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      user.organizationMemberships.map((m) => m.organization),
    );
  } catch (error) {
    console.error("Organizations fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch organizations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createOrganizationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const domain = validated.data.domain || null;
    if (domain) {
      const existingDomain = await prisma.organization.findUnique({
        where: { domain },
        select: { id: true },
      });
      if (existingDomain) {
        return NextResponse.json(
          { error: "Organization domain already exists" },
          { status: 409 },
        );
      }
    }

    const slug = await generateUniqueOrgSlug(validated.data.name);

    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: validated.data.name.trim(),
          slug,
          domain,
          createdById: session.user.id,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: session.user.id,
          role: "OWNER",
          isActive: true,
        },
      });

      return tx.organization.findUnique({
        where: { id: org.id },
        include: {
          _count: {
            select: {
              members: true,
              inventoryItems: true,
              bookings: true,
            },
          },
        },
      });
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("Organization create error:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 },
    );
  }
}
