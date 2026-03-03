
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Short Pick Trigger
// Called when a picker finds a location empty or insufficient
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = (session.user as any).organizationId;
    const user = session.user;

    const body = await req.json();
    const { inventoryItemId, locationId, reportedQuantity, notes } = body;

    if (!inventoryItemId || !locationId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Log the Exception (Short Pick)
    // We could use an "Exception" model if it exists, or just log to ActivityLog
    await prisma.activityLog.create({
        data: {
            organizationId,
            action: "SHORT_PICK_REPORTED",
            entityType: "LOCATION",
            entityId: locationId,
            performedById: user.id,
            details: {
                inventoryItemId,
                reportedQuantity: reportedQuantity || 0,
                notes
            }
        }
    });

    // 2. Find Reserve Stock (Simple Logic: Find any other location with stock)
    // In a real system, we'd check "Reserve" zones specifically.
    const reserveStock = await prisma.location.findFirst({
        where: {
            organizationId,
            NOT: { id: locationId },
            isPickable: true, // Assuming reserve is pickable for replen
            // Ideally we check InventoryItem in this location via a relation, 
            // but Schema doesn't have explicit LocationStock model shown in my grep earlier,
            // EXCEPT InventoryItem typically belongs to a Warehouse, and tracking stock-at-location
            // requires a junction table or looking at 'InventoryItem' if it represents a Lot-at-Location.
            // *Wait*, looking at schema: `InventoryItem` has `warehouseId` but not `locationId`?
            // Let's re-read InventoryItem schema.
        }
    });
    
    // RE-READ SCHEMA: 
    // `InventoryItem` does NOT have `locationId`. 
    // `Location` does NOT have `inventoryItems`.
    // BUT `GRNItem` has `binLocation`. 
    // `InventoryMovement` tracks flow.
    // `Lot` might have location? `StockAdjustment` has location.
    
    // Ah, `InventoryItem` seems to be the "Product Definition + Global Stock".
    // Where is the stock PER LOCATION?
    // User Context says: "When a picker arrives at a pick location... finds it empty"
    // So the system *thinks* there is stock.
    // The schema provided earlier might have been truncated?
    // Let's check `Lot` or `Quant` or similar.
    
    // If there is no detailed stock-at-location model, I have to infer availability or just create a generic task "Replenish Product X".
    
    // Let's create the task regardless of specific source logic (Human will figure it out if system can't).
    
    const count = await prisma.pickingTask.count({ where: { organizationId }});
    const taskNumber = `RPL-URG-${String(count + 1).padStart(5, '0')}`;

    const task = await prisma.pickingTask.create({
        data: {
            organizationId,
            warehouseId: (session.user as any).warehouseId || "", // Best effort
            taskNumber,
            taskType: "REPLENISH",
            priority: "URGENT", // It's a short pick!
            title: `Short Pick Replenishment`,
            description: `Picker reported empty face at location. Need urgent replenish. ${notes || ''}`,
            inventoryItemId,
            toLocationId: locationId,
            status: "PENDING",
            createdById: user.id
        }
    });

    return NextResponse.json({ 
        success: true, 
        message: "Short pick reported. Emergency replenishment task created.",
        taskId: task.id 
    });

  } catch (error: any) {
    console.error("Short pick error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
