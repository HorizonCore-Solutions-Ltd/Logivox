export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withObservability } from "@/lib/middleware/observability";

export async function POST(request: NextRequest) {
  return withObservability(async () => {
    const body = await request.json();
    const { name, email, password, organizationName } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate password strength (A-7: uppercase, number, special char)
    const passwordErrors: string[] = [];
    if (password.length < 8) passwordErrors.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) passwordErrors.push("one uppercase letter");
    if (!/[0-9]/.test(password)) passwordErrors.push("one number");
    if (!/[^A-Za-z0-9]/.test(password)) passwordErrors.push("one special character");
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: `Password must contain: ${passwordErrors.join(", ")}` },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user and organization in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "USER", // Default role
        },
      });

      // Create organization if organizationName is provided
      if (organizationName) {
        // Generate slug from organization name
        const slug = organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        // Check if slug is already taken
        const existingOrg = await tx.organization.findUnique({
          where: { slug },
        });

        if (existingOrg) {
          throw new Error("Organization name is already taken");
        }

        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            slug,
            subscriptionTier: "FREE",
            maxUsers: 5,
            maxWarehouses: 1,
            features: {
              analytics: false,
              api_access: false,
              custom_branding: false,
              priority_support: false,
            },
            timezone: "UTC",
            currency: "USD",
            dateFormat: "MM/DD/YYYY",
            timeFormat: "12h",
            createdById: user.id,
          },
        });

        // Add user as organization owner
        await tx.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: "OWNER",
            permissions: {
              manage_organization: true,
              manage_members: true,
              manage_warehouses: true,
              manage_inventory: true,
              manage_bookings: true,
              manage_suppliers: true,
              manage_customers: true,
              manage_integrations: true,
              view_analytics: true,
              export_data: true,
            },
          },
        });

        // Log activity
        await tx.activityLog.create({
          data: {
            action: "USER_REGISTERED",
            entityType: "USER",
            entityId: user.id,
            description: `New user registered: ${email}`,
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
            organizationId: organization.id,
            userId: user.id,
          },
        });

        return { user, organization };
      }

      // Log activity without organization
      await tx.activityLog.create({
        data: {
          action: "USER_REGISTERED",
          entityType: "USER",
          entityId: user.id,
          description: `New user registered: ${email}`,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          userId: user.id,
        },
      });

      return { user };
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
      },
      { status: 201 },
    );
  }, request);
}
