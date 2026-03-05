"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  Truck,
  Plus,
  LogIn,
  LogOut,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  Loader2,
  Calendar as CalendarIcon,
  Map as MapIcon,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

// --- Types ---
interface GateEntry {
  id: string;
  entryNumber: string;
  direction: "INBOUND" | "OUTBOUND";
  vehicleNumber: string;
  trailerNumber?: string;
  driverName?: string;
  entryTime: string;
  gateNumber?: string;
  status: string;
}

interface DockAppointment {
  id: string;
  scheduledStart: string;
  carrierName: string;
  trailerNumber: string;
  status: "SCHEDULED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED";
  yardLocation?: { locationCode: string };
  gateEntries: GateEntry[];
}

interface YardMove {
  id: string;
  trailerNumber: string;
  fromLocation: { locationCode: string };
  toLocation: { locationCode: string };
  status: "PENDING" | "ASSIGNED" | "COMPLETED";
  priority: number;
}

interface YardLocation {
  id: string;
  locationCode: string;
  locationType: string;
  isOccupied: boolean;
  appointments: DockAppointment[];
}

export default function YardDashboardPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  // --- Form State ---
  const [formData, setFormData] = useState({
    direction: "INBOUND",
    vehicleNumber: "",
    trailerNumber: "",
    driverName: "",
    gateNumber: "GATE-1",
    appointmentId: "none",
  });

  // --- Queries ---
  const { data: appointments, isLoading: isLoadingApts } = useQuery<
    DockAppointment[]
  >({
    queryKey: ["yard-appointments"],
    queryFn: async () => (await fetch("/api/yard/appointments")).json(),
  });

  const { data: locations, isLoading: isLoadingLocs } = useQuery<
    YardLocation[]
  >({
    queryKey: ["yard-locations"],
    queryFn: async () => (await fetch("/api/yard/locations")).json(),
  });

  const { data: moves, isLoading: isLoadingMoves } = useQuery<YardMove[]>({
    queryKey: ["yard-moves"],
    queryFn: async () => (await fetch("/api/yard/moves")).json(),
  });

  const { data: gateEntries, isLoading: isLoadingGate } = useQuery<GateEntry[]>(
    {
      queryKey: ["yard-gate"],
      queryFn: async () => (await fetch("/api/yard/gate")).json(),
    },
  );

  // --- Mutations ---
  const checkInMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/yard/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          appointmentId:
            data.appointmentId === "none" ? undefined : data.appointmentId,
        }),
      });
      if (!res.ok) throw new Error("Check-in failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["yard-gate"] });
      qc.invalidateQueries({ queryKey: ["yard-appointments"] }); // Update status
      toast({
        title: "Check-In Successful",
        description: "Vehicle logged at gate.",
      });
      setIsCheckInOpen(false);
      setFormData({
        direction: "INBOUND",
        vehicleNumber: "",
        trailerNumber: "",
        driverName: "",
        gateNumber: "GATE-1",
        appointmentId: "none",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process check-in.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkInMutation.mutate(formData);
  };

  // --- Metrics ---
  const activeCount =
    appointments?.filter((a) =>
      ["CHECKED_IN", "IN_PROGRESS"].includes(a.status),
    ).length || 0;
  const pendingMoves = moves?.filter((m) => m.status === "PENDING").length || 0;

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Yard Management</h1>
        <p className="text-muted-foreground">
          Manage your yard, appointments, and dock schedules from a central hub.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active In Yard
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              Checked-in Appointments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Moves</CardTitle>
            <Move className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingMoves}</div>
            <p className="text-xs text-muted-foreground">
              Trailers waiting for shunter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gate Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gateEntries?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Recent Check-ins</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">
            <CalendarIcon className="mr-2 h-4 w-4" /> Appointments
          </TabsTrigger>
          <TabsTrigger value="gate">
            <LogIn className="mr-2 h-4 w-4" /> Gate Console
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapIcon className="mr-2 h-4 w-4" /> Yard Map
          </TabsTrigger>
          <TabsTrigger value="moves">
            <Move className="mr-2 h-4 w-4" /> Task Queue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Scheduled Appointments</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> New Appointment
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingApts ? (
                <div>Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Trailer</TableHead>
                      <TableHead>Dock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check-In</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments?.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          {new Date(apt.scheduledStart).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>{apt.carrierName}</TableCell>
                        <TableCell>{apt.trailerNumber}</TableCell>
                        <TableCell>
                          {apt.yardLocation?.locationCode || "Unassigned"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              apt.status === "CHECKED_IN"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {apt.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {apt.gateEntries?.[0]
                            ? new Date(
                                apt.gateEntries[0].entryTime,
                              ).toLocaleTimeString()
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gate">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Gate Activity</CardTitle>
              <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Check-In
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Gate Check-In</DialogTitle>
                    <DialogDescription>
                      Log a new vehicle arrival at the gate.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Direction */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="direction" className="text-right">
                        Direction
                      </Label>
                      <Select
                        value={formData.direction}
                        onValueChange={(val) =>
                          setFormData({ ...formData, direction: val })
                        }
                      >
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INBOUND">
                            Inbound (Arrival)
                          </SelectItem>
                          <SelectItem value="OUTBOUND">
                            Outbound (Departure)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Appointment Link */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="appointment" className="text-right">
                        Link Appt
                      </Label>
                      <Select
                        value={formData.appointmentId}
                        onValueChange={(val) =>
                          setFormData({ ...formData, appointmentId: val })
                        }
                      >
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select appointment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            -- No Appointment --
                          </SelectItem>
                          {appointments
                            ?.filter(
                              (a) =>
                                a.status === "SCHEDULED" ||
                                a.status === "CHECKED_IN",
                            )
                            .map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.carrierName} (
                                {new Date(a.scheduledStart).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                                )
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Vehicle Number */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="vehicle" className="text-right">
                        Vehicle #
                      </Label>
                      <Input
                        id="vehicle"
                        value={formData.vehicleNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vehicleNumber: e.target.value,
                          })
                        }
                        className="col-span-3"
                        placeholder="Truck Plate"
                      />
                    </div>

                    {/* Trailer Number */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="trailer" className="text-right">
                        Trailer #
                      </Label>
                      <Input
                        id="trailer"
                        value={formData.trailerNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            trailerNumber: e.target.value,
                          })
                        }
                        className="col-span-3"
                        placeholder="Trailer ID"
                      />
                    </div>

                    {/* Driver Name */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="driver" className="text-right">
                        Driver
                      </Label>
                      <Input
                        id="driver"
                        value={formData.driverName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            driverName: e.target.value,
                          })
                        }
                        className="col-span-3"
                        placeholder="Driver Name"
                      />
                    </div>

                    {/* Gate Number */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="gate" className="text-right">
                        Gate
                      </Label>
                      <Select
                        value={formData.gateNumber}
                        onValueChange={(val) =>
                          setFormData({ ...formData, gateNumber: val })
                        }
                      >
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select Gate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GATE-1">Gate 1 (Main)</SelectItem>
                          <SelectItem value="GATE-2">Gate 2 (Side)</SelectItem>
                          <SelectItem value="GATE-3">
                            Gate 3 (Express)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={checkInMutation.isPending}
                      >
                        {checkInMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Check In
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingGate ? (
                <div>Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Entry #</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Gate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gateEntries?.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {new Date(entry.entryTime).toLocaleString()}
                        </TableCell>
                        <TableCell>{entry.entryNumber}</TableCell>
                        <TableCell>
                          <Badge>{entry.direction}</Badge>
                        </TableCell>
                        <TableCell>
                          {entry.vehicleNumber || entry.trailerNumber}
                        </TableCell>
                        <TableCell>{entry.driverName}</TableCell>
                        <TableCell>{entry.gateNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          {/* DOCK AREA */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-blue-600" />
              Dock Doors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {locations
                ?.filter((l) => l.locationType.includes("DOCK"))
                .map((loc) => (
                  <Card
                    key={loc.id}
                    className={
                      loc.isOccupied ? "bg-blue-50 border-blue-200" : "bg-card"
                    }
                  >
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                      <span className="font-bold text-lg">
                        {loc.locationCode}
                      </span>
                      <Badge
                        variant={
                          loc.locationType.includes("LOADING")
                            ? "default"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {loc.locationType.replace("_", " ")}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 text-sm">
                      {loc.isOccupied ? (
                        <div className="flex flex-col gap-1 items-start text-blue-700">
                          <div className="flex items-center gap-2 font-medium">
                            <Truck className="h-4 w-4" /> Occupied
                          </div>
                          {loc.appointments?.[0] && (
                            <span className="text-xs text-muted-foreground truncate w-full">
                              {loc.appointments[0].carrierName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              {(!locations ||
                locations.filter((l) => l.locationType.includes("DOCK"))
                  .length === 0) && (
                <div className="col-span-full text-sm text-muted-foreground italic">
                  No dock doors found.
                </div>
              )}
            </div>
          </div>

          {/* YARD / PARKING AREA */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-orange-600" />
              Yard Parking & Staging
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {locations
                ?.filter((l) => !l.locationType.includes("DOCK"))
                .map((loc) => (
                  <Card
                    key={loc.id}
                    className={
                      loc.isOccupied
                        ? "bg-orange-50 border-orange-200"
                        : "bg-muted/30"
                    }
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm">
                          {loc.locationCode}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] h-4 px-1"
                        >
                          {loc.locationType.split("_")[0]}
                        </Badge>
                      </div>
                      {loc.isOccupied ? (
                        <div className="text-xs text-orange-800 font-medium flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          <span className="truncate">
                            {loc.appointments?.[0]?.carrierName || "Trailer"}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-green-400" />{" "}
                          Empty
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              {(!locations ||
                locations.filter((l) => !l.locationType.includes("DOCK"))
                  .length === 0) && (
                <div className="col-span-full text-sm text-muted-foreground italic">
                  No yard spaces defined.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="moves">
          <Card>
            <CardHeader>
              <CardTitle>Yard Move Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMoves ? (
                <div>Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead>Trailer</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moves?.map((move) => (
                      <TableRow key={move.id}>
                        <TableCell>{move.priority}</TableCell>
                        <TableCell>{move.trailerNumber}</TableCell>
                        <TableCell>{move.fromLocation.locationCode}</TableCell>
                        <TableCell>{move.toLocation.locationCode}</TableCell>
                        <TableCell>
                          <Badge>{move.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Assign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
