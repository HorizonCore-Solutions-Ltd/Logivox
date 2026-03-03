
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const organizationId = (session.user as any).organizationId;

    const tasks = await prisma.pickingTask.findMany({
        where: { 
            organizationId, 
            taskType: "REPLENISH",
            status: { not: "CANCELLED" }
        },
        include: { inventoryItem: true, fromLocation: true, toLocation: true },
        orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ tasks });
}
