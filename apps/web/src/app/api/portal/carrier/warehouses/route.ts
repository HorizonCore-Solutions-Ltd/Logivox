import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Allow CARRIER
    if ((session.user as any).role !== "CARRIER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const warehouses = await prisma.warehouse.findMany({
            select: { id: true, name: true, code: true }
        });
        return NextResponse.json(warehouses);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
