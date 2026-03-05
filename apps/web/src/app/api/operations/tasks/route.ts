import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    try {
        const tasks = await prisma.taskExecution.findMany({
            where: {
                organizationId,
                status: {
                    in: ["PENDING", "IN_PROGRESS", "BLOCKED"]
                }
            },
            orderBy: {
                priority: "desc"
            },
            take: 50
        });

        // Mock tasks if database empty, for demo
        const mockTasks = [
            { id: "t1", type: "PICK", priority: 10, status: "IN_PROGRESS", zone: "Zone A" },
            { id: "t2", type: "REPLEN", priority: 8, status: "PENDING", zone: "Zone B" },
            { id: "t3", type: "PUTAWAY", priority: 5, status: "BLOCKED", zone: "Receiving" },
            { id: "t4", type: "QC", priority: 9, status: "IN_PROGRESS", zone: "QC Station 1" }
        ];

        return NextResponse.json(tasks.length > 0 ? tasks : mockTasks);
    } catch (error) {
        console.error("GET /api/operations/tasks error:", error);
        return NextResponse.json(
            { error: "Failed to fetch task orchestration data" },
            { status: 500 }
        );
    }
}
