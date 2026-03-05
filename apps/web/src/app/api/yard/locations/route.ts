import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const locations = await prisma.yardLocation.findMany({
      include: {
        appointments: {
          where: {
            status: { in: ["SCHEDULED", "CHECKED_IN", "IN_PROGRESS"] },
          },
          take: 1,
        },
      },
      orderBy: {
        locationCode: "asc",
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("[YARD_LOCATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
