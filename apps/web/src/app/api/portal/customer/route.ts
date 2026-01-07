export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/customer
 * Get current customer's details
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get customer record
    const customerUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true,
          },
        },
      },
    });

    if (!customerUser?.customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      user: {
        id: customerUser.id,
        name: customerUser.name,
        email: customerUser.email,
      },
      customer: customerUser.customer,
    });
  } catch (error: any) {
    console.error("Portal customer error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer details" },
      { status: 500 },
    );
  }
}
