import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DutyService } from "@/lib/services/duties/duty-service";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "7");
  const since = new Date(Date.now() - days * 24 * 3600_000);

  const kpis = await DutyService.getKPIs(session.user.organizationId, since);
  return NextResponse.json(kpis);
}
