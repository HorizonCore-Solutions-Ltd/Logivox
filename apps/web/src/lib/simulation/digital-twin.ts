
import { prisma } from "@/lib/prisma";
import type { TwinState, TwinResource, TwinTask } from "./types";

/**
 * The State Builder operates as the bridge between the Static Database
 * and the Dynamic Simulation Engine. It hydrates the "Digital Twin"
 * with real-time data from Prisma.
 */
export const DigitalTwinBuilder = {

    /**
     * Snapshots the current operational state of a specific Organization/Warehouse.
     */
    async buildCurrentState(organizationId: string, warehouseId?: string): Promise<TwinState> {
        console.log(`[DigitalTwin] Building snapshot for Org: ${organizationId}`);

        // 1. Fetch Active Resources (Workers)
        const activeUsers = await prisma.user.findMany({
            where: { 
                isActive: true,
                // In a real app, filters by current shift or logged-in status
            }
        });

        const resources = new Map<string, TwinResource>();
        
        activeUsers.forEach(u => {
            resources.set(u.id, {
                id: u.id,
                type: "WORKER",
                status: "IDLE", // Default state, refined by task check next
                capacity: 60, // Default pick rate
                costRatePerHour: 25, // Default labor cost
                locationId: "UNKNOWN"
            });
        });

        // 2. Fetch Pending/Active Tasks
        const tasksQuery: any = {
            organizationId,
            status: { in: ["PENDING", "IN_PROGRESS"] }
        };
        if (warehouseId) tasksQuery.warehouseId = warehouseId;

        const dbTasks = await prisma.pickingTask.findMany({
            where: tasksQuery,
            orderBy: { priority: 'desc' }
        });

        const tasks: TwinTask[] = dbTasks.map(t => ({
            id: t.id,
            type: "PICK", // Simplified mapping
            status: t.status === "PENDING" ? "PENDING" : "IN_PROGRESS",
            priority: t.priority === "URGENT" ? 10 : 5,
            estimatedDuration: 5, // Placeholder: should come from ML model
            assignedResourceId: t.assignedToId || undefined
        }));

        // 3. Update Resource Status based on Tasks
        tasks.forEach(t => {
            if (t.assignedResourceId && resources.has(t.assignedResourceId)) {
                const r = resources.get(t.assignedResourceId)!;
                r.status = "BUSY";
                resources.set(r.id, r);
            }
        });

        // 4. Return the Graph
        return {
            timestamp: new Date(),
            resources,
            tasks,
            inventorySnapshot: {}, // Can be populated if simulation needs granular stock
            activeCongestionZones: []
        };
    }
};
