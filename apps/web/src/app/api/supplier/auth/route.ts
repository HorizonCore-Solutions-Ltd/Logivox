import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for production');
}

/**
 * POST /api/supplier/auth
 * Supplier login authentication
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Find supplier user
    const supplierUser = await prisma.supplierUser.findUnique({
      where: { email },
      include: {
        supplier: true,
      },
    });

    if (!supplierUser) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!supplierUser.active) {
      return NextResponse.json(
        { error: "Account is inactive. Please contact support." },
        { status: 403 },
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      supplierUser.password,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Update last login
    await prisma.supplierUser.update({
      where: { id: supplierUser.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: supplierUser.id,
        supplierId: supplierUser.supplierId,
        email: supplierUser.email,
        role: supplierUser.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: supplierUser.id,
          name: supplierUser.name,
          email: supplierUser.email,
          role: supplierUser.role,
          supplier: {
            id: supplierUser.supplier.id,
            name: supplierUser.supplier.name,
            code: supplierUser.supplier.code,
          },
        },
      },
    });
  } catch (error: any) {
    console.error("Supplier auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/supplier/auth
 * Create initial supplier user account
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { supplierId, email, name, password } = body;

    if (!supplierId || !email || !name || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 },
      );
    }

    // Check if email already exists
    const existingUser = await prisma.supplierUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create supplier user
    const supplierUser = await prisma.supplierUser.create({
      data: {
        supplierId,
        email,
        name,
        password: hashedPassword,
        role: "ADMIN", // First user is admin
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: supplierUser.id,
        email: supplierUser.email,
        name: supplierUser.name,
        role: supplierUser.role,
      },
    });
  } catch (error: any) {
    console.error("Create supplier user error:", error);
    return NextResponse.json(
      { error: "Failed to create supplier user" },
      { status: 500 },
    );
  }
}
