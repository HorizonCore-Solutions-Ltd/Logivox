// apps/web/src/app/api/fulfillment/orchestrate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fulfillmentBrain } from "@/lib/services/fulfillment-brain";
import { z } from "zod";

const orchestrateSchema = z.object({
  type: z.enum([
    "PICK",
    "PUT",
    "MOVE",
    "COUNT",
    "REPLENISH",
    "RESTOCK",
    "PACK",
    "INSPECT",
    "LABEL",
    "CUSTOM",
  ]),
  workflowType: z.enum(["REPLENISHMENT", "RETURNS", "OUTBOUND", "INVENTORY"]),
  warehouseId: z.string(),
  locationId: z.string().optional(),
  toLocationId: z.string().optional(),
  inventoryItemId: z.string().optional(),
  quantity: z.number().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).optional(),
  title: z.string(),
  description: z.string().optional(),
  value: z.number().optional(), // For value-based triggers
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;

  if (!organizationId) {
    return NextResponse.json(
      { error: "Organization ID missing" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const validated = orchestrateSchema.parse(body);

    const result = await fulfillmentBrain.orchestrateTask(
      {
        organizationId,
        workflowType: validated.workflowType,
        value: validated.value,
      },
      {
        type: validated.type,
        organizationId,
        warehouseId: validated.warehouseId,
        locationId: validated.locationId,
        toLocationId: validated.toLocationId,
        inventoryItemId: validated.inventoryItemId,
        quantity: validated.quantity,
        priority: validated.priority,
        title: validated.title,
        description: validated.description,
        // Assignee is left null for auto-orchestration
      },
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[FulfillmentOrchestrator] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
