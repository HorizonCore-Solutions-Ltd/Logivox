"use client";

import { useState } from "react";
import {
  MapPin,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Package,
  Navigation,
  Phone,
  Camera,
  MoreHorizontal,
  Play,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STOP_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  ARRIVED: "default",
  DELIVERED: "default",
  FAILED: "destructive",
  OFF_ROUTE: "outline",
};

const RUN_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PLANNED: "outline",
  IN_PROGRESS: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

const MOCK_RUNS = [
  {
    id: "1",
    reference: "RUN-2026-0088",
    driver: "James Wilson",
    vehicle: "LV24 ABC",
    route: "London North",
    status: "IN_PROGRESS",
    stops: 8,
    deliveredStops: 5,
    failedStops: 0,
    totalParcels: 48,
    deliveredParcels: 30,
    startTime: "2026-03-03T07:00:00Z",
    etaComplete: "2026-03-03T14:00:00Z",
  },
  {
    id: "2",
    reference: "RUN-2026-0087",
    driver: "Maria Garcia",
    vehicle: "TR22 XYZ",
    route: "Midlands Circuit",
    status: "PLANNED",
    stops: 5,
    deliveredStops: 0,
    failedStops: 0,
    totalParcels: 32,
    deliveredParcels: 0,
    startTime: "2026-03-03T09:00:00Z",
    etaComplete: "2026-03-03T16:00:00Z",
  },
  {
    id: "3",
    reference: "RUN-2026-0086",
    driver: "Peter Brown",
    vehicle: "WH21 DEF",
    route: "South West Loop",
    status: "COMPLETED",
    stops: 6,
    deliveredStops: 5,
    failedStops: 1,
    totalParcels: 40,
    deliveredParcels: 33,
    startTime: "2026-03-03T05:30:00Z",
    etaComplete: "2026-03-03T11:00:00Z",
  },
];

const MOCK_STOPS = [
  {
    id: "1",
    runRef: "RUN-2026-0088",
    sequence: 1,
    customerName: "Acme Corp",
    address: "42 Industrial Estate, London N1 7AB",
    status: "DELIVERED",
    parcels: 6,
    deliveredParcels: 6,
    podSigned: true,
    arrivedAt: "2026-03-03T08:15:00Z",
    completedAt: "2026-03-03T08:30:00Z",
  },
  {
    id: "2",
    runRef: "RUN-2026-0088",
    sequence: 2,
    customerName: "TechFlow Ltd",
    address: "88 Business Park, London N4 2CD",
    status: "DELIVERED",
    parcels: 3,
    deliveredParcels: 3,
    podSigned: true,
    arrivedAt: "2026-03-03T09:00:00Z",
    completedAt: "2026-03-03T09:10:00Z",
  },
  {
    id: "3",
    runRef: "RUN-2026-0088",
    sequence: 3,
    customerName: "MegaMart Holloway",
    address: "101 Holloway Rd, London N7 8EF",
    status: "ARRIVED",
    parcels: 12,
    deliveredParcels: 0,
    podSigned: false,
    arrivedAt: "2026-03-03T09:45:00Z",
    completedAt: null,
  },
  {
    id: "4",
    runRef: "RUN-2026-0088",
    sequence: 4,
    customerName: "HealthCare Plus",
    address: "5 Medical Way, London N8 1GH",
    status: "PENDING",
    parcels: 4,
    deliveredParcels: 0,
    podSigned: false,
    arrivedAt: null,
    completedAt: null,
  },
  {
    id: "5",
    runRef: "RUN-2026-0088",
    sequence: 5,
    customerName: "ElectroParts Depot",
    address: "222 Tottenham Rd, London N17 0IJ",
    status: "PENDING",
    parcels: 8,
    deliveredParcels: 0,
    podSigned: false,
    arrivedAt: null,
    completedAt: null,
  },
];

const KPI_CARDS = [
  { title: "Runs Today", value: "3", icon: Truck, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "In Progress", value: "1", icon: Navigation, color: "text-orange-500", bg: "bg-orange-50" },
  { title: "Delivered Today", value: "38", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
  { title: "Failed Deliveries", value: "1", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
];

export default function DeliveryPage() {
  const [selectedRun, setSelectedRun] = useState<string>(MOCK_RUNS[0].id);

  const run = MOCK_RUNS.find((r) => r.id === selectedRun);
  const stops = MOCK_STOPS.filter((s) => s.runRef === (run?.reference ?? ""));

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-teal-600" />
            Delivery Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track driver runs, stop status and proof of delivery
          </p>
        </div>
        <Button size="sm">
          <Play className="h-4 w-4 mr-2" />
          Start New Run
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Runs Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Today&apos;s Delivery Runs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run Ref</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress (Stops)</TableHead>
                <TableHead>Progress (Parcels)</TableHead>
                <TableHead>ETA Complete</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_RUNS.map((r) => (
                <TableRow
                  key={r.id}
                  className={`cursor-pointer hover:bg-muted/50 ${selectedRun === r.id ? "bg-muted/30" : ""}`}
                  onClick={() => setSelectedRun(r.id)}
                >
                  <TableCell className="font-mono font-semibold text-teal-600">
                    {r.reference}
                  </TableCell>
                  <TableCell>{r.driver}</TableCell>
                  <TableCell className="font-mono text-sm">{r.vehicle}</TableCell>
                  <TableCell>{r.route}</TableCell>
                  <TableCell>
                    <Badge variant={RUN_STATUS_VARIANT[r.status] ?? "secondary"}>
                      {r.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${Math.round((r.deliveredStops / r.stops) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {r.deliveredStops}/{r.stops}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${Math.round((r.deliveredParcels / r.totalParcels) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {r.deliveredParcels}/{r.totalParcels}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(r.etaComplete).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Stops
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="h-4 w-4 mr-2" />
                          Call Driver
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stop Detail */}
      {run && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Stop Detail — {run.reference} ({run.route})
              </CardTitle>
              <Badge variant={RUN_STATUS_VARIANT[run.status] ?? "secondary"}>
                {run.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Parcels</TableHead>
                  <TableHead>POD</TableHead>
                  <TableHead>Arrived</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {stops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No stops found for this run.
                    </TableCell>
                  </TableRow>
                ) : (
                  stops.map((stop) => (
                    <TableRow key={stop.id} className="hover:bg-muted/50">
                      <TableCell className="font-bold text-center">{stop.sequence}</TableCell>
                      <TableCell className="font-medium">{stop.customerName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {stop.address}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STOP_STATUS_VARIANT[stop.status] ?? "secondary"}>
                          {stop.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-center">
                        {stop.deliveredParcels}/{stop.parcels}
                      </TableCell>
                      <TableCell>
                        {stop.podSigned ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {stop.arrivedAt
                          ? new Date(stop.arrivedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                          : "–"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {stop.completedAt
                          ? new Date(stop.completedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                          : "–"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Package className="h-4 w-4 mr-2" />
                              View Items
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Camera className="h-4 w-4 mr-2" />
                              View POD Photo
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <XCircle className="h-4 w-4 mr-2" />
                              Mark Failed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
