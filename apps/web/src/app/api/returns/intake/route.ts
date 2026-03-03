
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns Intake (Scan & Identify)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = (session.user as any).organizationId;
    const body = await req.json();
    const { query } = body; // Tracking number, Order ID, or RMA Number

    if (!query) {
        return NextResponse.json({ error: "Search query required" }, { status: 400 });
    }

    // 1. Search for RMA (Pre-Advised)
    let rma = await prisma.rMA.findFirst({
        where: {
            organizationId,
            OR: [
                { rmaNumber: query },
                { returnTrackingNumber: query },
                { salesOrderId: query } // Or partial match?
            ]
        },
        include: {
            items: {
                include: { inventoryItem: true }
            }, // Show expected items
            customer: true,
            salesOrder: true
        }
    });

    // 2. If valid search but no pre-advised RMA, check Sales Order directly?
    // Usually we require RMA first, or create one on the fly from Order.
    // For MVP, focus on existing RMA lookup or creating one from Order.

    if (!rma) {
         // Try finding by Order ID to create Ad-Hoc Return?
         const order = await prisma.salesOrder.findUnique({
             where: { id: query }, // Assuming query is ID? Probably not.
             // In real app, search by Order Number
         });
         
         if (!order) {
            // Try searching by order number string
            const orderByNum = await prisma.salesOrder.findFirst({
                where: { organizationId, orderNumber: query }
            });
            
            if (orderByNum) {
                return NextResponse.json({ 
                    found: false, 
                    order: orderByNum, 
                    message: "Order found, but no RMA exists. Create new return?" 
                });
            }
            
            return NextResponse.json({ error: "Return/Order not found" }, { status: 404 });
         }
    }

    // 3. Auto-Receive? Or just return details for UI to confirm items?
    // UI needs to confirm which items are actually in the box.
    
    return NextResponse.json({ found: true, rma });

  } catch (error: any) {
    console.error("Intake Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
