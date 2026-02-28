import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DutyService } from "@/lib/services/duties/duty-service";
import { z } from "zod";

const Schema = z.object({
  evidenceType: z.enum([
    "PHOTO",
    "VOICE_NOTE",
    "TEXT_NOTE",
    "NUMERIC_READING",
    "SIGNATURE",
    "BARCODE_SCAN",
    "TEMPERATURE",
    "CHECKLIST",
  ]),
  label: z.string().optional(),
  value: z.string().optional(),
  fileKey: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const evidence = await DutyService.addEvidence({
    dutyId: params.id,
    ...parsed.data,
    capturedBy: session.user.id,
  });

  return NextResponse.json({ evidence }, { status: 201 });
}
