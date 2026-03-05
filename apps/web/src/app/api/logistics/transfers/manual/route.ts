// Turnkey API: Manual Inter-Org Transfer Trigger
// POST /api/logistics/transfers/manual

import { NextResponse } from "next/server";
import { CognitiveTransferOrchestrator } from "@/lib/logistics/transfer-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      sourceOrgId, 
      targetOrgId, 
      sku, 
      quantity, 
      boxId, 
      originalOrderId,
      requesterId 
    } = body;

    if (!sourceOrgId || !targetOrgId || !sku || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields (sourceOrgId, targetOrgId, sku, quantity)" },
        { status: 400 }
      );
    }

    // Optional: Validate User
    // const session = await getServerSession(authOptions);
    // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await CognitiveTransferOrchestrator.requestInterBranchTransfer(
      sourceOrgId,
      targetOrgId,
      sku,
      Number(quantity),
      requesterId || "SYSTEM_DEMO_USER",
      boxId || `BOX-${Date.now()}`,
      originalOrderId || `ORD-${Date.now()}`
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Transfer Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
