
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const warehouseId = searchParams.get("warehouseId");

  // Fetch Inbound (POs)
  const incomingPOs = await prisma.purchaseOrder.findMany({
    where: {
      status: { in: ["APPROVED", "PARTIALLY_RECEIVED", "SENT"] as any },
      ...(warehouseId && { 
        // Note: Check if warehouseId is valid on PO. Schema says yes.
        warehouseId: warehouseId // Assuming PO has destination warehouse
      })
    },
    include: {
      supplier: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
    take: 100 // Limit for performance
  });

  // Fetch Outbound (SOs)
  const outgoingSOs = await prisma.salesOrder.findMany({
    where: {
      status: { in: ["PENDING", "BACKORDERED", "APPROVED"] as any },
      ...(warehouseId && { warehouseId })
    },
    include: {
      customer: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
    take: 100
  });

  const crossDockOpportunities: any[] = [];
  
  // Map Inventory ID -> List of Outbound Requirement Items
  // We match by `inventoryItemId`.
  const demandMap = new Map<string, any[]>();
  
  outgoingSOs.forEach(so => {
    so.items.forEach(item => {
      // Logic: Only consider items not fully processed.
      // Schema SOItem: quantity, quantityPicked, quantityPacked, quantityShipped.
      const quantityPending = item.quantity - (item.quantityPicked || 0); 
      
      if (quantityPending > 0) {
        const key = item.inventoryItemId; 
        const list = demandMap.get(key) || [];
        list.push({ 
            item, 
            so, 
            needed: quantityPending 
        });
        demandMap.set(key, list);
      }
    });
  });

  // Check Inbound Supply
  incomingPOs.forEach(po => {
    po.items.forEach(inItem => {
       // Logic: Only consider items not fully received.
       // Schema POItem: quantityOrdered, quantityReceived.
       const quantityInbound = inItem.quantityOrdered - (inItem.quantityReceived || 0);

       if (quantityInbound <= 0) return;

       const demands = demandMap.get(inItem.inventoryItemId || "");
       
       if (demands && demands.length > 0) {
         demands.forEach(d => {
            const matchQty = Math.min(quantityInbound, d.needed);
            
            if (matchQty > 0) {
                // Optimization Score Logic (Mock)
                // e.g. Due Date proximity
                let score = 50;
                if (d.so.priority > 0) score += 20;

                crossDockOpportunities.push({
                    id: `XD-${po.poNumber}-${d.item.id}`,
                    sku: inItem.inventoryItem?.sku,
                    productName: inItem.inventoryItem?.name,
                    quantity: matchQty,
                    inbound: {
                        id: po.id,
                        reference: po.poNumber,
                        type: 'PO',
                        eta: po.expectedDate,
                        supplier: po.supplier.name
                    },
                    outbound: {
                        id: d.so.id,
                        reference: d.so.soNumber, 
                        type: 'SO',
                        requiredDate: d.so.requestedDate || d.so.promisedDate,
                        customer: d.so.customer.name,
                        priority: d.so.priority // Using priority if available
                    },
                    status: 'PENDING',
                    score: score
                });
            }
         });
       }
    });
  });
  
  // Sort by Score/Priority
  crossDockOpportunities.sort((a, b) => b.score - a.score);

  return NextResponse.json({ items: crossDockOpportunities });
}
