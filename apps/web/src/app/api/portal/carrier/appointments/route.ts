import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CarrierPortal } from "@/lib/portals/portalService";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "CARRIER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");
    const dateStr = searchParams.get("date");

    if (!warehouseId || !dateStr) {
        return NextResponse.json({ error: "warehouseId and date required" }, { status: 400 });
    }

    try {
        const slots = await CarrierPortal.getAvailableSlots(warehouseId, new Date(dateStr));
        // Project to safe view
        const availability = slots.map(s => ({
            id: s.id, // Only for reference if needed
            start: s.scheduledStart,
            end: s.scheduledEnd,
            dockId: s.yardLocationId,
            status: "BOOKED" // Abstract status
        }));
        return NextResponse.json(availability);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "CARRIER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const body = await req.json();
        // Validation: warehouseId, dockId, startTime, durationMinutes, loadRef
        if (!body.warehouseId || !body.dockId || !body.startTime || !body.durationMinutes) {
             return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const appointment = await CarrierPortal.bookAppointment((session.user as any).id, {
            ...body,
            startTime: new Date(body.startTime)
        });

        return NextResponse.json(appointment);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
