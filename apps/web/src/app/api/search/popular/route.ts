export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant ID from first organization
    const tenantId = session.user.organizations[0]?.id;
    if (!tenantId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // In a real implementation, fetch from database
    // For now, return hardcoded popular searches
    const popularSearches = [
      { query: "laptop", count: 150 },
      { query: "mouse", count: 98 },
      { query: "keyboard", count: 87 },
      { query: "monitor", count: 76 },
      { query: "headphones", count: 65 },
    ];

    return NextResponse.json({ popular: popularSearches });
  } catch (error) {
    console.error("Error fetching popular searches:", error);
    return NextResponse.json(
      { error: "Failed to fetch popular searches" },
      { status: 500 }
    );
  }
}
