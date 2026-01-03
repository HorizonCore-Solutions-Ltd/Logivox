export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    // Get tenant ID from first organization
    const tenantId = session.user.organizations[0]?.id;
    if (!tenantId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Track search (simplified - could store in database)
    console.log(`Search tracked: "${query}" by user ${session.user.id} in tenant ${tenantId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking search:", error);
    return NextResponse.json(
      { error: "Failed to track search" },
      { status: 500 }
    );
  }
}
