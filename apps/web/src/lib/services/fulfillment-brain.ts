// apps/web/src/lib/services/fulfillment-brain.ts

import { prisma } from "@/lib/prisma";
import { type TaskType, TaskStatus, TaskPriority } from "@prisma/client";
import { taskInterleavingService } from "./task-interleaving";

// Define Governance Modes based on config
export type GovernanceMode = "ADMIN_CONTROLLED" | "ADMIN_ASSISTED" | "AUTONOMOUS";

interface WorkflowContext {
  organizationId: string;
  workflowType: "REPLENISHMENT" | "RETURNS" | "OUTBOUND" | "INVENTORY";
  value?: number; // Order value, inventory value, etc.
}

interface TaskCreationData {
  type: TaskType;
  organizationId: string;
  warehouseId: string;
  locationId?: string; // fromLocationId
  toLocationId?: string;
  inventoryItemId?: string;
  quantity?: number;
  priority?: TaskPriority;
  title: string;
  description?: string;
  assigneeId?: string;
  metadata?: any;
}

export class FulfillmentBrain {
  
  /**
   * Determine the Governance Mode for a specific workflow based on Organization settings.
   */
  async getGovernanceMode(context: WorkflowContext): Promise<GovernanceMode> {
    const config = await prisma.autonomousConfig.findUnique({
      where: { organizationId: context.organizationId },
    });

    if (!config) return "ADMIN_CONTROLLED"; // Default to safest mode

    // Check specific flags based on workflow
    let isAutoEnabled = false;
    switch (context.workflowType) {
      case "REPLENISHMENT":
        isAutoEnabled = config.enableAutoReorders; // Mapping closely to reorder logic
        break;
      case "INVENTORY": 
        isAutoEnabled = config.enableAutoAdjustments;
        break;
      case "OUTBOUND":
        // Check if order value exceeds auto-approval threshold
        if (context.value && context.value > Number(config.maxOrderValue)) {
            return "ADMIN_ASSISTED"; // High value requires human eye
        }
        // Assume outbound is generally assisted unless fully autonomous flag (future)
        return "ADMIN_ASSISTED"; 
      case "RETURNS":
         // Returns logic usually defaults to Assisted unless specific config
         return "ADMIN_ASSISTED";
      default:
        return "ADMIN_CONTROLLED";
    }

    if (isAutoEnabled) return "AUTONOMOUS";

    // Fallback: Check global trust score
    if (config.minTrustScore > 90) return "ADMIN_ASSISTED";

    return "ADMIN_CONTROLLED";
  }

  /**
   * Orchestrate a fulfillment task based on the determined mode.
   * - Admin: Create as PENDING_APPROVAL (mapped to ON_HOLD or PENDING without assignee).
   * - Assisted: Create as PENDING (Open for pool).
   * - Autonomous: Create as PENDING and attempt Auto-Assign.
   */
  async orchestrateTask(
    context: WorkflowContext,
    taskData: TaskCreationData
  ) {
    const mode = await this.getGovernanceMode(context);
    console.log(`[FulfillmentBrain] Orchestrating ${taskData.type} in ${mode} mode.`);

    let status: TaskStatus = "PENDING";
    let assigneeId = taskData.assigneeId;

    switch (mode) {
      case "ADMIN_CONTROLLED":
        status = "ON_HOLD"; // Explicitly waiting for approval
        break;
      case "ADMIN_ASSISTED":
        status = "PENDING"; // Released to pool
        break;
      case "AUTONOMOUS":
        status = "PENDING";
        // Attempt immediate interleaved assignment if location is known
        if (taskData.locationId && !assigneeId) {
            const bestWorker = await taskInterleavingService.findBestWorkerForTask(
                context.organizationId,
                taskData.locationId,
                taskData.type
            );
            if (bestWorker) {
                assigneeId = bestWorker.id;
                status = "ASSIGNED"; // Auto-assign!
            }
        }
        break;
    }

    // Create the PickingTask in database
    const task = await prisma.pickingTask.create({
        data: {
            organizationId: taskData.organizationId,
            warehouseId: taskData.warehouseId,
            taskNumber: `TASK-${Date.now()}`, // Simple generator
            taskType: taskData.type,
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority || "NORMAL",
            status: status,
            assignedToId: assigneeId,
            fromLocationId: taskData.locationId,
            toLocationId: taskData.toLocationId,
            inventoryItemId: taskData.inventoryItemId,
            quantity: taskData.quantity,
            // metadata could be stored in a JSON field if schema supported it, currently skipped
        }
    });
    
    return {
        task,
        mode,
        autoAssigned: !!assigneeId
    };
  }
}

export const fulfillmentBrain = new FulfillmentBrain();
