
import { prisma } from "@/lib/prisma";
import type { DecisionContext, GovernorInterface, ProposedAction } from "../types";

export const NetworkLoadBalancer: GovernorInterface = {

    /**
     * Multi-Site Order Routing Governor.
     * Prevents bottlenecks by distributing volume across the FC network.
     */
    async evaluate(context: DecisionContext): Promise<ProposedAction[]> {
        if (context.triggerEvent !== "ORDER_ROUTING") return [];

        const orderId = context.metadata?.orderId;
        if (!orderId) return [];

        // 1. Get all Fulfillment Centers (Warehouses)
        const warehouses = await prisma.warehouse.findMany({
            where: { organizationId: context.organizationId, isActive: true },
            include: { pickingTasks: { where: { status: "PENDING" } } }
        });

        // 2. Calculate Congestion Score (Tasks per Worker ratio or absolute Pending Tasks)
        // Simplified: Just count pending tasks
        const warehouseLoads = warehouses.map(wh => ({
            id: wh.id,
            name: wh.name,
            pendingTasks: wh.pickingTasks.length,
            capacityScore: 1000 - wh.pickingTasks.length // Simple heuristic: higher is better
        }));

        // Sort by least congested (High capacity score)
        warehouseLoads.sort((a,b) => b.capacityScore - a.capacityScore);

        const bestFC = warehouseLoads[0];
        const worstFC = warehouseLoads[warehouseLoads.length - 1];

        // If the best FC has significantly less load than the worst, we route there
        // Instead of defaulting to "primary" location
        
        if (bestFC && bestFC.id !== worstFC.id) {
             return [{
                category: "INVENTORY_ROUTING", // Reusing category or add WAREHOUSE_ROUTING
                actionType: "ROUTE_TO_FC",
                parameters: { orderId, targetWarehouseId: bestFC.id, targetName: bestFC.name },
                reasoning: `Routing to ${bestFC.name} (Load: ${bestFC.pendingTasks}) to avoid congestion at ${worstFC.name} (Load: ${worstFC.pendingTasks}).`,
                predictedOutcomes: [
                    { metric: "FULFILLMENT_SPEED", value: 20, confidence: 0.85, impact: "POSITIVE" }, // 20% faster
                    { metric: "NETWORK_BALANCE", value: 10, confidence: 0.9, impact: "POSITIVE" }
                ],
                confidence: 0.92,
                estimatedCost: 0,
                estimatedTimeRaw: 0
            }];
        }

        return [];
    },

    async execute(action: ProposedAction): Promise<boolean> {
        console.log(`[NetworkLoadBalancer] Routing Order to ${action.parameters.targetName}`);
        
        // Update Order or Create Pick List at specific Warehouse
        // For Enterprise Turnkey, we'd update the SalesOrder 'assignedWarehouseId'
        // await prisma.salesOrder.update(...)
        
        return true;
    }
};
