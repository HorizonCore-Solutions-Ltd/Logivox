import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SupplierPortal } from "@/lib/portals/portalService";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ROLE
    if ((session.user as any).role !== "SUPPLIER") {
      return NextResponse.json(
        { error: "Forbidden: Supplier Access Only" },
        { status: 403 },
      );
    }

    const body = await req.json();

    // Basic validation
    if (!body.poId || !body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "Invalid payload: poId and items array required" },
        { status: 400 },
      );
    }

    // Transform dates
    const items = body.items.map((item: any) => ({
      ...item,
      expiry: item.expiry ? new Date(item.expiry) : undefined,
    }));

    const result = await SupplierPortal.createASN((session.user as any).id, {
      poId: body.poId,
      items,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("ASN Creation Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
