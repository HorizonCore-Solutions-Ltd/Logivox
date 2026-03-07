import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  // Basic Auth
  if (!session?.user?.email) {
    // return new NextResponse("Unauthorized", { status: 401 });
  }

  const loadSheetId = params.id;

  try {
    const loadSheet = await prisma.loadSheet.findUnique({
      where: { id: loadSheetId },
      include: {
        customer: true,
        containers: {
          include: {
            containerItems: true,
          },
        },
        vehicleType: true,
      },
    });

    if (!loadSheet) {
      return new NextResponse("Load Sheet Not Found", { status: 404 });
    }

    // Transform for UI/PDF if needed, but raw is fine
    return NextResponse.json(loadSheet);
  } catch (error: any) {
    console.error("LoadSheet Detail Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
