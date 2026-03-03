
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Process Disposition (Generate Work Tasks)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rmaId, itemIds } = await req.json();

    if (!rmaId) {
        return NextResponse.json({ error: "Missing rmaId" }, { status: 400 });
    }

    // 1. Fetch RMA Items
    const whereClause: any = {
        rmaId: rmaId,
        isInspected: true, // Must be inspected
        // We want items that do NOT have a task generated yet.
        // But checking external table in 'where' is hard. We'll filter later or use sourceId check.
    };

    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
        whereClause.id = { in: itemIds };
    }

    const items = await prisma.rMAItem.findMany({
        where: whereClause,
        include: {
            inventoryItem: true,
            rma: true
        }
    });

    if (items.length === 0) {
        return NextResponse.json({ message: "No eligible items found for disposition." });
    }

    const organizationId = items[0].rma.organizationId;
    const warehouseId = items[0].inventoryItem.warehouseId; // Assume single warehouse for RMA item context?

    const generatedTasks = [];

    // 2. Process Items
    for (const item of items) {
        // Check if task already exists
        const existingTask = await prisma.pickingTask.findFirst({
            where: {
                sourceId: item.id,
                sourceType: 'RMA_ITEM'
            }
        });

        if (existingTask) {
            continue; // Skip
        }

        // Determine Disposition Logic
        // Task Type & Destination
        let taskType: 'RESTOCK' | 'MOVE' | 'DISPOSE' | null = null; // DISPOSE not in TaskType? 
        // TaskTypes: PICK, PUT, MOVE, COUNT, REPLENISH, RESTOCK, PACK, INSPECT, LABEL, CUSTOM
        let prismaTaskType: any = 'MOVE'; 
        let updatedAction = item.action;
        let destinationZone = "Returns Zone"; // Default source? No, destination.

        // Logic Table
        if (item.action === 'DISPOSE') {
            prismaTaskType = 'MOVE';
            destinationZone = 'SCRAP_CAGE'; // Placeholder for location lookup ID
        } else if (item.action === 'REPAIR') {
            prismaTaskType = 'MOVE';
            destinationZone = 'REFURB_AREA';
        } else if (['REFUND', 'EXCHANGE', 'STORE_CREDIT'].includes(item.action)) {
            // Check condition
            if (['NEW', 'GOOD'].includes(item.condition || '')) {
                prismaTaskType = 'RESTOCK';
                // Destination is System Directed (Primary Bin). We leave toLocationId null or find it.
                destinationZone = 'PRIMARY_STORAGE';
            } else if (['DAMAGED', 'DESTROYED', 'DEFECTIVE'].includes(item.condition || '')) {
                // Even if we refund, if it's damaged, we scrap/refurb it.
                prismaTaskType = 'MOVE';
                destinationZone = 'SCRAP_CAGE'; // Or Check/Sort
            } else {
                // Fair?
                prismaTaskType = 'RESTOCK'; // Or specific 'Discount' area.
                destinationZone = 'SECONDARY_STORAGE';
            }
        }

        // Determine To Location ID (Mock Logic)
        // ideally we search for a Location with zone code.
        // For MVP, we'll just set a text description in instructions or metadata
        // pickingTasks have fromLocationId and toLocationId.
        
        // Find a placeholder location for returns?
        // We'll skip exact ID lookup to avoid failures and put it in instructions.

        const newTask = await prisma.pickingTask.create({
            data: {
                organizationId,
                warehouseId,
                taskNumber: `TASK-${item.rma.rmaNumber}-${item.id.slice(-4)}`,
                taskType: prismaTaskType,
                status: 'PENDING',
                priority: 'NORMAL',
                title: `Disposition: ${item.inventoryItem.name}`,
                description: `Move ${item.quantityReceived} units to ${destinationZone}. Condition: ${item.condition}. Action: ${item.action}`,
                instructions: `Scan item ${item.inventoryItem.sku} and verify count.`,
                sourceType: 'RMA_ITEM',
                sourceId: item.id,
                inventoryItemId: item.inventoryId,
                quantity: item.quantityReceived || 0,
                createdById: session.user.id
            }
        });

        generatedTasks.push(newTask);
    }

    // 3. Update RMA Status?
    // If tasks are generated, maybe we are "COMPLETED" in terms of "Office Work"?
    // The physical work is now pending in the warehouse.
    // Let's set RMA to COMPLETED if ALL items have tasks?
    
    // Check if all items in RMA have tasks
    // (Optimization: We can do this check separately or assume if we processed remaining items, we are done).
    
    const allRmaItems = await prisma.rMAItem.findMany({ where: { rmaId: rmaId } });
    const allTasks = await prisma.pickingTask.findMany({ 
        where: { 
            sourceType: 'RMA_ITEM',
            sourceId: { in: allRmaItems.map(i => i.id) }
        }
    });
    
    // If every item has a task (or is zero quantity), we are done.
    const meaningfulItems = allRmaItems.filter(i => (i.quantityReceived ?? 0) > 0);
    const allCovered = meaningfulItems.every(i => allTasks.some(t => t.sourceId === i.id));

    if (allCovered) {
         await prisma.rMA.update({
            where: { id: rmaId },
            data: { 
                status: 'COMPLETED',
                completedDate: new Date()
            }
        });
    }

    return NextResponse.json({ success: true, tasksGenerated: generatedTasks.length });
  } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
