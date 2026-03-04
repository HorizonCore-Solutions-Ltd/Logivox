import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// AQL sampling size calculation (ISO 2859-1 simplified)
const AQL_TABLE: Record<string, Record<string, number>> = {
  "0.65": {
    S1: 2,
    S2: 3,
    S3: 5,
    S4: 8,
    A: 13,
    B: 20,
    C: 32,
    D: 50,
    E: 80,
    F: 125,
    G: 200,
    H: 315,
  },
  "1.0": {
    S1: 3,
    S2: 5,
    S3: 8,
    S4: 13,
    A: 20,
    B: 32,
    C: 50,
    D: 80,
    E: 125,
    F: 200,
    G: 315,
    H: 500,
  },
  "1.5": {
    S1: 5,
    S2: 8,
    S3: 13,
    S4: 20,
    A: 32,
    B: 50,
    C: 80,
    D: 125,
    E: 200,
    F: 315,
    G: 500,
    H: 800,
  },
  "2.5": {
    S1: 8,
    S2: 13,
    S3: 20,
    S4: 32,
    A: 50,
    B: 80,
    C: 125,
    D: 200,
    E: 315,
    F: 500,
    G: 800,
    H: 1250,
  },
  "4.0": {
    S1: 13,
    S2: 20,
    S3: 32,
    S4: 50,
    A: 80,
    B: 125,
    C: 200,
    D: 315,
    E: 500,
    F: 800,
    G: 1250,
    H: 2000,
  },
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { lotSize, aql = "1.5", inspectionLevel = "normal" } = body;
    if (!lotSize)
      return NextResponse.json(
        { error: "lotSize is required" },
        { status: 400 },
      );

    // Determine letter code based on lot size
    let code = "A";
    if (lotSize <= 8) code = "S1";
    else if (lotSize <= 15) code = "S2";
    else if (lotSize <= 25) code = "S3";
    else if (lotSize <= 50) code = "S4";
    else if (lotSize <= 90) code = "A";
    else if (lotSize <= 150) code = "B";
    else if (lotSize <= 280) code = "C";
    else if (lotSize <= 500) code = "D";
    else if (lotSize <= 1200) code = "E";
    else if (lotSize <= 3200) code = "F";
    else if (lotSize <= 10000) code = "G";
    else code = "H";

    const sampleSize = AQL_TABLE[aql]?.[code] ?? Math.ceil(Math.sqrt(lotSize));
    return NextResponse.json({
      lotSize,
      aql,
      inspectionLevel,
      letterCode: code,
      sampleSize,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
