import { NextResponse } from "next/server";

export async function GET() {
  // Mock data for sustainability metrics
  const esgData = {
    carbonFootprint: {
      total: 12.4, // tons
      change: -0.05,
      breakdown: {
        transportation: 0.45,
        facilities: 0.3,
        packaging: 0.25,
      },
    },
    energyEfficiency: 98.2, // kWh/unit
    recyclingRate: 0.85,
    costSavings: 4500,
    initiatives: [
      {
        id: "solar-array",
        name: "Solar Array Installation",
        status: "active",
        progress: 100,
        description: "Generating 15% of facility power.",
      },
      {
        id: "ev-fleet",
        name: "EV Fleet Transition",
        status: "planning",
        progress: 20,
        description: "Deployment of 5 electric forklifts scheduled for Q3.",
      },
    ],
  };

  return NextResponse.json(esgData);
}

export async function POST(req: Request) {
  // Handle manual ESG data entry
  return NextResponse.json(
    { message: "Sustainability record added" },
    { status: 201 },
  );
}
