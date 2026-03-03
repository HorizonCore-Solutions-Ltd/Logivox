
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Inspect Item (Update Condition & Action)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
        rmaId, 
        itemId, 
        condition, 
        action, 
        notes, 
        quantity, 
        photos 
    } = body;

    if (!rmaId || !itemId || !condition || !action || quantity === undefined) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch Request Item
    const rmaItem = await prisma.rMAItem.findUnique({
        where: { id: itemId }
    });

    if (!rmaItem) {
        return NextResponse.json({ error: "RMA Item not found" }, { status: 404 });
    }

    if (rmaItem.rmaId !== rmaId) {
        return NextResponse.json({ error: "Item does not belong to RMA" }, { status: 400 });
    }
    
    // Check quantity validity
    // Use quantityReceived (what we physically have) as the limit.
    const availableQty = rmaItem.quantityReceived || 0; 

    if (quantity > availableQty) {
        return NextResponse.json({ error: `Cannot inspect more than received quantity (${availableQty})` }, { status: 400 });
    }
    
    if (quantity <= 0) {
        return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
    }

    let resultItemId = itemId;
    let operationSkipped = false;

    // Perform Update or Split Transaction
    await prisma.$transaction(async (tx) => {
        
        // Check current status - if already inspected, we might double count if not careful.
        // But maybe user wants to correct it?
        // If isInspected is true, we should probably deny for now to keep logic simple.
        if (rmaItem.isInspected && quantity !== rmaItem.quantityReceived) {
             throw new Error("Cannot partially inspect an already inspected item. Re-inspect full line only.");
        }

        // CASE A: Exact Match (Inspect All currently held in this line)
        if (quantity === availableQty) {
            // Update existing item
            await tx.rMAItem.update({
                where: { id: itemId },
                data: {
                    condition: condition, 
                    action: action,       
                    isInspected: true,
                    inspectionNotes: notes,
                    photos: photos ? photos : undefined, 
                    quantityAccepted: (action !== 'DISPOSE' && action !== 'REJECTED') ? quantity : 0,
                    quantityRejected: (action === 'DISPOSE' || action === 'REJECTED') ? quantity : 0,
                }
            });
            resultItemId = itemId;
        } 
        // CASE B: Partial Inspection (Split)
        else {
            // Calculate proportional requested quantity to move
            const quantityRequestedMove = Math.min(quantity, rmaItem.quantityRequested); 

            // 1. Create New Item for the Inspection Result
            const newItem = await tx.rMAItem.create({
                data: {
                    rmaId: rmaItem.rmaId,
                    inventoryId: rmaItem.inventoryId,
                    salesOrderItemId: rmaItem.salesOrderItemId,
                    quantityRequested: quantityRequestedMove,
                    quantityReceived: quantity,
                    condition: condition,
                    action: action,
                    isInspected: true,
                    inspectionNotes: notes,
                    photos: photos ? photos : undefined,
                    quantityAccepted: (action !== 'DISPOSE' && action !== 'REJECTED') ? quantity : 0,
                    quantityRejected: (action === 'DISPOSE' || action === 'REJECTED') ? quantity : 0,
                    unitPrice: rmaItem.unitPrice
                }
            });
            resultItemId = newItem.id;

            // 2. Decrement Original Item
            await tx.rMAItem.update({
                where: { id: itemId },
                data: {
                    quantityReceived: availableQty - quantity,
                    quantityRequested: rmaItem.quantityRequested - quantityRequestedMove
                }
            });
        }

        // 3. Update RMA Level Status
        // Mark RMA as INSPECTING if currently RECEIVED or PENDING
        const rma = await tx.rMA.findUnique({ where: { id: rmaId } });
        
        if (rma && (rma.status === 'RECEIVED' || rma.status === 'PENDING')) {
             await tx.rMA.update({
                where: { id: rmaId },
                data: {
                    status: 'INSPECTING',
                    inspectedDate: new Date(),
                    inspectedById: session.user.id
                }
            });
        }

        // 4. Check if ALL items are now inspected (and non-empty)
        // We fetch all items for this RMA to check completion
        const allItems = await tx.rMAItem.findMany({
            where: { rmaId }
        });

        // We only care about items that actually exist (quantityReceived > 0)
        // If a split left an item with 0 received (unlikely with our checks, but possible if exact match split logic was flawed), ignore it.
        // Wait, if we split exact match, availableQty - quantity = 0.
        // So the original item becomes quantityReceived=0.
        // But in CASE A (Exact Match), we update in place, so no 0 item.
        // So splitting only happens if quantity < availableQty, so original item will have > 0 remainder.
        // Unless availableQty was somehow 0 to begin with (guarded above).
        
        const meaningfulItems = allItems.filter(i => (i.quantityReceived ?? 0) > 0);
        const allInspected = meaningfulItems.every(i => i.isInspected);

        if (allInspected && meaningfulItems.length > 0) { 
            // If everything meaningful is inspected, we move to APPROVED (Ready for Disposition)
            // Or use COMPLETED if no disposition step.
            // As per plan, we have a disposition step. So APPROVED ("Inspection Approved") makes sense.
             await tx.rMA.update({
                where: { id: rmaId },
                data: { status: 'APPROVED' } 
            });
        }
    });

    return NextResponse.json({ success: true, itemId: resultItemId });

  } catch (error: any) {
    console.error("Inspection Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
