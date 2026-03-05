// Digital Twin Simulation Trigger
// POST /api/simulation/run

import { NextResponse } from "next/server";
import { SimulationEngine } from "@/lib/simulation/engine";
import { type ScenarioType } from "@/lib/simulation/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      organizationId, 
      scenarioType, 
      parameters 
    } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    const result = await SimulationEngine.runSimulation(
      organizationId,
      (scenarioType as ScenarioType) || "BASELINE",
      parameters || { durationMinutes: 60, timeStepMinutes: 5 }
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Simulation Execution Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Simulation Error" },
      { status: 500 }
    );
  }
}
