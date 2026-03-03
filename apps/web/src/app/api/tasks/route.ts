
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = (session.user as any).organizationId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type"); 

    const where: any = { organizationId };
    
    if (status) {
        where.status = status;
    } else {
        where.status = { notIn: ["COMPLETED", "CANCELLED"] };
    }

    if (type) {
        where.taskType = type;
    }

    try {
        const tasks = await prisma.pickingTask.findMany({
            where,
            include: {
                inventoryItem: true,
                fromLocation: true,
                toLocation: true,
                assignedTo: {
                    select: { name: true, email: true }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' }
            ]
        });
        
        return NextResponse.json({ tasks });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
