"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from "date-fns";

interface CalendarAppointment {
  id: string;
  appointmentNumber: string;
  type: string;
  status: string;
  priority: string;
  expectedArrival: string;
  targetShipDate: string;
  inboundCarrier?: string;
  outboundCarrier?: string;
  totalUnits: number;
  supplierName?: string;
  customerName?: string;
}

export default function CrossDockCalendar() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "DIRECT",
    priority: "MEDIUM",
    expectedArrival: "",
    targetShipDate: "",
    inboundCarrier: "",
    outboundCarrier: "",
    sortingMethod: "SCAN_SORT",
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    loadCalendarData();
  }, [currentWeek]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const startDate = weekStart.toISOString();
      const endDate = addDays(weekStart, 7).toISOString();

      const res = await fetch(
        `/api/cross-dock/appointments/calendar?startDate=${startDate}&endDate=${endDate}`,
      );

      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error("Failed to load calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleToday = () => {
    setCurrentWeek(new Date());
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/cross-dock/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        loadCalendarData();
        setFormData({
          type: "DIRECT",
          priority: "MEDIUM",
          expectedArrival: "",
          targetShipDate: "",
          inboundCarrier: "",
          outboundCarrier: "",
          sortingMethod: "SCAN_SORT",
        });
      }
    } catch (error) {
      console.error("Failed to create appointment:", error);
    }
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) =>
      isSameDay(parseISO(apt.expectedArrival), date),
    );
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: "border-blue-500",
      RECEIVING: "border-yellow-500",
      SORTING: "border-purple-500",
      LOADING: "border-orange-500",
      COMPLETED: "border-green-500",
      CANCELLED: "border-gray-500",
    };
    return colors[status] || "border-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Appointment Calendar</h1>
          <p className="text-muted-foreground">
            Schedule cross-docking operations
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Appointment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIRECT">Direct Transfer</SelectItem>
                      <SelectItem value="MERGE">
                        Merge (Multiple to One)
                      </SelectItem>
                      <SelectItem value="SPLIT">
                        Split (One to Multiple)
                      </SelectItem>
                      <SelectItem value="TRANSLOAD">Transload</SelectItem>
                      <SelectItem value="CONSOLIDATION">
                        Consolidation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedArrival">Expected Arrival</Label>
                  <Input
                    id="expectedArrival"
                    type="datetime-local"
                    value={formData.expectedArrival}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedArrival: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetShipDate">Target Ship Date</Label>
                  <Input
                    id="targetShipDate"
                    type="datetime-local"
                    value={formData.targetShipDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetShipDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inboundCarrier">Inbound Carrier</Label>
                  <Input
                    id="inboundCarrier"
                    value={formData.inboundCarrier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inboundCarrier: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outboundCarrier">Outbound Carrier</Label>
                  <Input
                    id="outboundCarrier"
                    value={formData.outboundCarrier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        outboundCarrier: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortingMethod">Sorting Method</Label>
                <Select
                  value={formData.sortingMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sortingMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="SCAN_SORT">Scan & Sort</SelectItem>
                    <SelectItem value="CONVEYOR">Conveyor</SelectItem>
                    <SelectItem value="VOICE">Voice Directed</SelectItem>
                    <SelectItem value="PUT_WALL">Put Wall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Appointment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(weekStart, "MMMM d")} -{" "}
              {format(addDays(weekStart, 6), "MMMM d, yyyy")}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading calendar...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="text-center font-semibold p-2 border-b"
                >
                  <div className="text-sm">{format(day, "EEE")}</div>
                  <div
                    className={`text-lg ${
                      isSameDay(day, new Date()) ? "text-primary font-bold" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>
              ))}

              {/* Day Cells */}
              {weekDays.map((day) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[200px] p-2 border rounded-lg ${
                      isToday ? "bg-accent/20 border-primary" : "bg-card"
                    }`}
                  >
                    <div className="space-y-1">
                      {dayAppointments.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-4">
                          No appointments
                        </div>
                      ) : (
                        dayAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className={`p-2 rounded border-l-4 ${getStatusColor(
                              apt.status,
                            )} bg-card hover:bg-accent/50 cursor-pointer transition-colors text-xs`}
                          >
                            <div className="font-semibold truncate">
                              {apt.appointmentNumber}
                            </div>
                            <div className="text-muted-foreground truncate">
                              {format(parseISO(apt.expectedArrival), "HH:mm")}
                            </div>
                            <Badge
                              variant="outline"
                              className="mt-1 text-[10px] h-4 px-1"
                            >
                              {apt.type}
                            </Badge>
                            <div className="text-[10px] text-muted-foreground mt-1 truncate">
                              {apt.totalUnits} units
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {[
              { status: "SCHEDULED", label: "Scheduled" },
              { status: "RECEIVING", label: "Receiving" },
              { status: "SORTING", label: "Sorting" },
              { status: "LOADING", label: "Loading" },
              { status: "COMPLETED", label: "Completed" },
              { status: "CANCELLED", label: "Cancelled" },
            ].map(({ status, label }) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 border-l-4 ${getStatusColor(status)}`}
                />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
