export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const hazmatSchema = z.object({
  productId: z.string(),
  unNumber: z.string().min(1, "UN Number is required"), // UN identification number
  hazardClass: z.string().min(1, "Hazard class is required"),
  packingGroup: z.enum(["I", "II", "III"]).optional(),
  properShippingName: z.string().min(1, "Proper shipping name is required"),
  msdsUrl: z.string().url().optional(), // Material Safety Data Sheet
  storageRequirements: z.string().optional(),
  handlingInstructions: z.string().optional(),
  emergencyContact: z.string().optional(),
  expiryDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  certificationNumber: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/hazmat-records
 * List hazmat records
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const hazardClass = searchParams.get("hazardClass");
    const isActive = searchParams.get("isActive");

    const records = await prisma.hazmatRecord.findMany({
      where: {
        organizationId,
        ...(productId && { productId }),
        ...(hazardClass && { hazardClass }),
        ...(isActive !== null && { isActive: isActive === "true" }),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error("Error fetching hazmat records:", error);
    return NextResponse.json(
      { error: "Failed to fetch hazmat records" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/hazmat-records
 * Create a new hazmat record
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const body = await req.json();
    const validatedData = hazmatSchema.parse(body);

    // Verify product exists
    const product = await prisma.product.findFirst({
      where: {
        id: validatedData.productId,
        organizationId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if hazmat record already exists for this product
    const existing = await prisma.hazmatRecord.findFirst({
      where: {
        organizationId,
        productId: validatedData.productId,
        isActive: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Active hazmat record already exists for this product" },
        { status: 400 },
      );
    }

    const record = await prisma.hazmatRecord.create({
      data: {
        ...validatedData,
        organizationId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
          },
        },
      },
    });

    // Update product to mark as hazmat
    await prisma.product.update({
      where: { id: validatedData.productId },
      data: { isHazmat: true },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "HAZMAT_RECORD_CREATED",
        entityType: "HazmatRecord",
        entityId: record.id,
        metadata: {
          productId: product.id,
          productName: product.name,
          unNumber: record.unNumber,
          hazardClass: record.hazardClass,
        },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error creating hazmat record:", error);
    return NextResponse.json(
      { error: "Failed to create hazmat record" },
      { status: 500 },
    );
  }
}
