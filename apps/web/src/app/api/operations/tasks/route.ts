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
          in: ["PENDING", "IN_PROGRESS", "BLOCKED"],
        },
      },
      orderBy: {
        priority: "desc",
      },
      take: 50,
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/operations/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task orchestration data" },
      { status: 500 },
    );
  }
}
