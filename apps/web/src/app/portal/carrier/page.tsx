"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function CarrierPortalPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [docks, setDocks] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Booking Modal State
  const [selectedSlot, setSelectedSlot] = useState<{
    dockId: string;
    time: string;
    dockName: string;
  } | null>(null);
  const [loadRef, setLoadRef] = useState("");
  const [duration, setDuration] = useState(60);

  // Initial Load
  useEffect(() => {
    fetch("/api/portal/carrier/warehouses")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setWarehouses(data);
      })
      .catch(console.error);
  }, []);

  // Load Docks when Warehouse changes
  useEffect(() => {
    if (!selectedWarehouse) return;
    setDocks([]);
    setAppointments([]);

    fetch(`/api/portal/carrier/docks?warehouseId=${selectedWarehouse}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDocks(data);
      })
      .catch(console.error);
  }, [selectedWarehouse]);

  // Load Appointments when Date or Warehouse changes
  useEffect(() => {
    if (!selectedWarehouse || !selectedDate) return;
    setLoading(true);

    fetch(
      `/api/portal/carrier/appointments?warehouseId=${selectedWarehouse}&date=${selectedDate}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedWarehouse, selectedDate]);

  const handleBook = async () => {
    if (!selectedSlot || !loadRef) return;
    setBooking(true);
    setError("");

    try {
      // Construct start time
      // selectedDate is "YYYY-MM-DD", selectedSlot.time is "HH:MM"
      const start = new Date(`${selectedDate}T${selectedSlot.time}:00`);

      const res = await fetch("/api/portal/carrier/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          dockId: selectedSlot.dockId,
          startTime: start.toISOString(),
          durationMinutes: duration,
          loadRef,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Booking failed");
      }

      setSuccess("Appointment Confirmed!");
      setSelectedSlot(null);
      setLoadRef("");
      // Refresh schedule
      const newAppts = await fetch(
        `/api/portal/carrier/appointments?warehouseId=${selectedWarehouse}&date=${selectedDate}`,
      ).then((r) => r.json());
      setAppointments(newAppts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  // Helper to check availability
  const isSlotBooked = (dockId: string, hour: number) => {
    const slotStart = new Date(
      `${selectedDate}T${hour.toString().padStart(2, "0")}:00:00`,
    ).getTime();
    const slotEnd = slotStart + 60 * 60 * 1000; // Assuming 1 hour slots for display

    return appointments.some((appt) => {
      if (appt.dockId !== dockId) return false;
      const apptStart = new Date(appt.start).getTime();
      const apptEnd = new Date(appt.end).getTime();

      // Check overlap
      return slotStart < apptEnd && slotEnd > apptStart;
    });
  };

  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 to 18:00

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Carrier Portal
          </h1>
          <p className="text-gray-500">
            Book dock appointments and manage deliveries.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select
                onValueChange={setSelectedWarehouse}
                value={selectedWarehouse}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      {selectedWarehouse && (
        <Card>
          <CardHeader>
            <CardTitle>Dock Availability</CardTitle>
            <CardDescription>
              Click on an available slot to book.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading schedule...</div>
            ) : docks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No docks found for this warehouse.
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="flex border-b">
                    <div className="w-32 p-2 font-semibold">Dock</div>
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="flex-1 p-2 text-center font-medium text-sm"
                      >
                        {h}:00
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  {docks.map((dock) => (
                    <div
                      key={dock.id}
                      className="flex border-b hover:bg-gray-50"
                    >
                      <div className="w-32 p-2 font-medium flex items-center border-r">
                        {dock.name}
                      </div>
                      {hours.map((h) => {
                        const booked = isSlotBooked(dock.id, h);
                        const timeString = `${h.toString().padStart(2, "0")}:00`;

                        if (booked) {
                          return (
                            <div key={h} className="flex-1 p-1">
                              <div className="h-full bg-red-100 border border-red-200 rounded text-xs text-red-700 flex items-center justify-center">
                                Booked
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={h} className="flex-1 p-1">
                            <button
                              className="w-full h-full bg-green-50 hover:bg-green-100 border border-green-200 rounded text-xs text-green-700 flex items-center justify-center transition-colors"
                              onClick={() =>
                                setSelectedSlot({
                                  dockId: dock.id,
                                  dockName: dock.name,
                                  time: timeString,
                                })
                              }
                            >
                              Available
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Modal */}
      <Dialog
        open={!!selectedSlot}
        onOpenChange={(open) => !open && setSelectedSlot(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              {selectedSlot &&
                `Dock: ${selectedSlot.dockName} | Date: ${selectedDate} | Time: ${selectedSlot.time}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Load Reference / SO #</Label>
              <Input
                placeholder="Enter Reference"
                value={loadRef}
                onChange={(e) => setLoadRef(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (Minutes)</Label>
              <Select
                value={duration.toString()}
                onValueChange={(v) => setDuration(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="60">60 Minutes</SelectItem>
                  <SelectItem value="90">90 Minutes</SelectItem>
                  <SelectItem value="120">2 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSlot(null)}>
              Cancel
            </Button>
            <Button onClick={handleBook} disabled={booking || !loadRef}>
              {booking ? "Confirming..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Alert */}
      <Dialog open={!!success} onOpenChange={(open) => !open && setSuccess("")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-6 w-6" /> Success
            </DialogTitle>
            <DialogDescription>{success}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccess("")}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
