import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { recipients } = body;

    console.log(`Sending Load Sheet ${id} to:`, recipients);

    // Mock email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({ success: true, sentTo: recipients });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
