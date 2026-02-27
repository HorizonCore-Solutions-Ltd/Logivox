import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const models = await (prisma as any).mLModel.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        lastTrainedAt: "desc",
      },
    });

    const metrics = models.map((m: any) => ({
      modelName: m.modelName,
      version: m.version,
      accuracy: m.accuracy,
      mape:
        typeof m.parameters?.mape === "number" ? m.parameters.mape : null,
      mae: typeof m.parameters?.mae === "number" ? m.parameters.mae : null,
      lastTrained: m.lastTrainedAt.toISOString(),
      trainingDataPoints: m.trainingDataCount,
    }));

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching model metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
