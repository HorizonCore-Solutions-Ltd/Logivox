export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * @route GET /api/pick-lists
 * @desc List all pick lists for the authenticated user's organization
 * @access Private
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
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const warehouseId = searchParams.get("warehouseId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;
    if (search) {
      where.OR = [
        { pickListNumber: { contains: search, mode: "insensitive" } },
        { salesOrder: { soNumber: { contains: search, mode: "insensitive" } } },
        {
          salesOrder: {
            customer: { name: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    const [pickLists, total] = await Promise.all([
      prisma.pickList.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          salesOrder: {
            include: {
              customer: { select: { id: true, name: true, code: true } },
            },
          },
          warehouse: { select: { id: true, name: true, code: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          items: {
            select: {
              id: true,
              quantityToPick: true,
              quantityPicked: true,
            },
          },
        },
      }),
      prisma.pickList.count({ where }),
    ]);

    return NextResponse.json({
      pickLists,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[pick-lists GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch pick lists" },
      { status: 500 },
    );
  }
}
