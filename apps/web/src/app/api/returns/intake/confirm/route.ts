import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Confirm Receipt (Intake -> Warehouse)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = (session.user as any).organizationId;
    const body = await req.json();
    const { rmaId, itemsReceived, photos } = body; // itemsReceived: [{ inventoryItemId, quantity }]

    // 1. Update RMA
    const rma = await prisma.rMA.update({
      where: { id: rmaId },
      data: {
        status: "RECEIVED",
        receivedDate: new Date(),
        attachments: photos ? JSON.stringify(photos) : undefined,
      },
    });

    // 2. Update RMA Items (Quantity Received)
    for (const line of itemsReceived) {
      await prisma.rMAItem.updateMany({
        where: {
          rmaId,
          inventoryId: line.inventoryItemId,
          action: "REFUND", // Naive selection if multiple lines
        },
        data: {
          quantityReceived: line.quantity,
          // Assume default 'CONDITION' until inspection (Or received as PENDING)
          condition: "PENDING",
        },
      });
    }

    // 3. Trigger Credit? (Optional, configurable rule)
    // E.g. "Instant Refund on Scan" for low risk
    // We'll skip for MVP and stick to "Inspect First".

    return NextResponse.json({ success: true, rma });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
