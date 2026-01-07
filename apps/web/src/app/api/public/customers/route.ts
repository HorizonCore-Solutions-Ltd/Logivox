export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // Authenticate API key
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) return auth.error!;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  // Build where clause
  const where: any = { organizationId: auth.organizationId };
  if (type) {
    where.type = type;
  }

  // Fetch customers for the organization
  const customers = await prisma.customer.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      type: true,
      taxId: true,
      _count: {
        select: {
          bookings: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}
