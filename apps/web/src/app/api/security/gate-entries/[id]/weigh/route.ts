import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const weighVehicleSchema = z.object({
  direction: z.enum(["IN", "OUT"]),
  weight: z.number().positive(),
  bridgeId: z.string().min(1),
  operatorId: z.string().optional(),
  verified: z.boolean().default(true),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gateEntryId = params.id;

    // Verify gate entry exists and belongs to organization
    const gateEntry = await prisma.gateEntry.findFirst({
      where: {
        id: gateEntryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!gateEntry) {
      return NextResponse.json(
        { error: "Gate entry not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const data = weighVehicleSchema.parse(body);

    // Create weigh bridge record
    const weighRecord = await prisma.gateWeighBridge.create({
      data: {
        gateEntryId,
        direction: data.direction,
        weight: data.weight,
        bridgeId: data.bridgeId,
        operatorId: data.operatorId || session.user.id,
        verified: data.verified,
        notes: data.notes,
      },
    });

    // Get all weigh records for this gate entry
    const allWeighs = await prisma.gateWeighBridge.findMany({
      where: { gateEntryId },
      orderBy: { weighTime: "asc" },
    });

    // Calculate variance if we have both IN and OUT weights
    const inWeight = allWeighs.find((w) => w.direction === "IN");
    const outWeight = allWeighs.find((w) => w.direction === "OUT");

    let variance = null;
    let variancePercentage = null;
    let alert = null;

    if (inWeight && outWeight) {
      variance =
        parseFloat(outWeight.weight.toString()) -
        parseFloat(inWeight.weight.toString());
      variancePercentage =
        (Math.abs(variance) / parseFloat(inWeight.weight.toString())) * 100;

      // Alert if variance is > 5%
      if (variancePercentage > 5) {
        alert = {
          type: "WEIGHT_VARIANCE",
          severity: variancePercentage > 10 ? "HIGH" : "MEDIUM",
          message: `Significant weight variance detected: ${variance.toFixed(2)}kg (${variancePercentage.toFixed(2)}%)`,
        };

        // Create alert in the system
        await prisma.securityAlert.create({
          data: {
            organizationId: session.user.organizationId,
            type: "WEIGHT_VARIANCE",
            severity: variancePercentage > 10 ? "HIGH" : "MEDIUM",
            message: alert.message,
            metadata: {
              gateEntryId,
              inWeight: parseFloat(inWeight.weight.toString()),
              outWeight: parseFloat(outWeight.weight.toString()),
              variance,
              variancePercentage,
            },
          },
        });
      }
    }

    return NextResponse.json(
      {
        weighRecord,
        summary: {
          inWeight: inWeight ? parseFloat(inWeight.weight.toString()) : null,
          outWeight: outWeight ? parseFloat(outWeight.weight.toString()) : null,
          variance,
          variancePercentage,
          alert,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error creating weigh record:", error);
    return NextResponse.json(
      { error: "Failed to create weigh record" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gateEntryId = params.id;

    // Verify gate entry exists and belongs to organization
    const gateEntry = await prisma.gateEntry.findFirst({
      where: {
        id: gateEntryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!gateEntry) {
      return NextResponse.json(
        { error: "Gate entry not found" },
        { status: 404 },
      );
    }

    const weighRecords = await prisma.gateWeighBridge.findMany({
      where: { gateEntryId },
      orderBy: { weighTime: "asc" },
    });

    // Calculate summary
    const inWeight = weighRecords.find((w) => w.direction === "IN");
    const outWeight = weighRecords.find((w) => w.direction === "OUT");

    let variance = null;
    let variancePercentage = null;

    if (inWeight && outWeight) {
      variance =
        parseFloat(outWeight.weight.toString()) -
        parseFloat(inWeight.weight.toString());
      variancePercentage =
        (Math.abs(variance) / parseFloat(inWeight.weight.toString())) * 100;
    }

    return NextResponse.json({
      weighRecords,
      summary: {
        inWeight: inWeight ? parseFloat(inWeight.weight.toString()) : null,
        outWeight: outWeight ? parseFloat(outWeight.weight.toString()) : null,
        variance,
        variancePercentage,
      },
    });
  } catch (error) {
    console.error("Error fetching weigh records:", error);
    return NextResponse.json(
      { error: "Failed to fetch weigh records" },
      { status: 500 },
    );
  }
}
