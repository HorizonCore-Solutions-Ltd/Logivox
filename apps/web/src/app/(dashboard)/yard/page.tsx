"use client";

import { useState } from "react";
import {
  Car,
  ArrowDownCircle,
  ArrowUpCircle,
  Truck,
  Plus,
  LogIn,
  LogOut,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CHECKED_IN: "default",
  ON_SITE: "default",
  CHECKED_OUT: "outline",
  IN_PROGRESS: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  LOW: "outline",
  NORMAL: "secondary",
  HIGH: "default",
  URGENT: "destructive",
};

const MOCK_GATE_LOG = [
  {
    id: "1",
    vehicleReg: "LV24 ABC",
    direction: "INBOUND",
    carrier: "DHL Express",
    driver: "James Wilson",
    status: "ON_SITE",
    bay: "Bay 4",
    arrivedAt: "2026-03-03T07:30:00Z",
    departedAt: null,
    reference: "ASN-2026-0412",
  },
  {
    id: "2",
    vehicleReg: "TR22 XYZ",
    direction: "OUTBOUND",
    carrier: "FedEx",
    driver: "Maria Garcia",
    status: "CHECKED_IN",
    bay: "Bay 7",
    arrivedAt: "2026-03-03T08:15:00Z",
    departedAt: null,
    reference: "SO-2026-0405",
  },
  {
    id: "3",
    vehicleReg: "WH21 DEF",
    direction: "INBOUND",
    carrier: "Own Fleet",
    driver: "Peter Brown",
    status: "CHECKED_OUT",
    bay: "Bay 2",
    arrivedAt: "2026-03-03T06:00:00Z",
    departedAt: "2026-03-03T07:45:00Z",
    reference: "ASN-2026-0411",
  },
  {
    id: "4",
    vehicleReg: "LG23 GHI",
    direction: "INBOUND",
    carrier: "UPS",
    driver: "Susan Clark",
    status: "PENDING",
    bay: null,
    arrivedAt: null,
    departedAt: null,
    reference: "ASN-2026-0413",
  },
  {
    id: "5",
    vehicleReg: "FT20 JKL",
    direction: "OUTBOUND",
    carrier: "TNT",
    driver: "David Lee",
    status: "CHECKED_OUT",
    bay: "Bay 1",
    arrivedAt: "2026-03-03T05:30:00Z",
    departedAt: "2026-03-03T06:20:00Z",
    reference: "SO-2026-0401",
  },
];

const MOCK_SHUNTER_TASKS = [
  {
    id: "1",
    task: "Move trailer to cold store bay",
    vehicleReg: "TR22 XYZ",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignee: "Tom Shunter",
    from: "Gate 2",
    to: "Bay 12 (Cold)",
    createdAt: "2026-03-03T08:00:00Z",
  },
  {
    id: "2",
    task: "Reposition empty trailer",
    vehicleReg: "MT19 ABC",
    priority: "NORMAL",
    status: "PENDING",
    assignee: null,
    from: "Bay 5",
    to: "Trailer Park A",
    createdAt: "2026-03-03T08:30:00Z",
  },
  {
    id: "3",
    task: "Bring trailer for loading",
    vehicleReg: "LG20 PQR",
    priority: "URGENT",
    status: "PENDING",
    assignee: null,
    from: "Trailer Park B",
    to: "Bay 7",
    createdAt: "2026-03-03T08:45:00Z",
  },
  {
    id: "4",
    task: "Return empty to yard",
    vehicleReg: "WH22 STU",
    priority: "LOW",
    status: "COMPLETED",
    assignee: "Jon Yard",
    from: "Bay 3",
    to: "Trailer Park A",
    createdAt: "2026-03-03T06:00:00Z",
  },
];

const KPI_CARDS = [
  {
    title: "On Site",
    value: "8",
    icon: Truck,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    title: "Awaiting Arrival",
    value: "5",
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    title: "Checked Out Today",
    value: "12",
    icon: LogOut,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    title: "Shunter Tasks",
    value: "3",
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

export default function YardPage() {
  const [activeTab, setActiveTab] = useState("gatelog");

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6 text-orange-600" />
            Yard Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gate log, trailer movements and shunter task management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-2" />
            Yard Map
          </Button>
          <Button size="sm">
            <LogIn className="h-4 w-4 mr-2" />
            Gate Check-In
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="gatelog">Gate Log</TabsTrigger>
          <TabsTrigger value="shunter">Shunter Tasks</TabsTrigger>
        </TabsList>

        {/* Gate Log Tab */}
        <TabsContent value="gatelog">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Today&apos;s Gate Log</CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Reg</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bay</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Arrived</TableHead>
                    <TableHead>Departed</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_GATE_LOG.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-semibold">
                        {entry.vehicleReg}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {entry.direction === "INBOUND" ? (
                            <ArrowDownCircle className="h-4 w-4 text-blue-500" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm">{entry.direction}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{entry.carrier}</TableCell>
                      <TableCell className="text-sm">{entry.driver}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[entry.status] ?? "secondary"}>
                          {entry.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.bay ?? "–"}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-blue-600">
                        {entry.reference}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.arrivedAt
                          ? new Date(entry.arrivedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                          : "–"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.departedAt
                          ? new Date(entry.departedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
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
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <LogOut className="h-4 w-4 mr-2" />
                              Check Out
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
        </TabsContent>

        {/* Shunter Tasks Tab */}
        <TabsContent value="shunter">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Shunter Tasks</CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_SHUNTER_TASKS.map((task) => (
                    <TableRow key={task.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{task.task}</TableCell>
                      <TableCell className="font-mono text-sm">{task.vehicleReg}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {task.from} → {task.to}
                      </TableCell>
                      <TableCell>
                        <Badge variant={PRIORITY_VARIANT[task.priority] ?? "secondary"}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[task.status] ?? "secondary"}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {task.assignee ?? <span className="italic">Unassigned</span>}
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
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Accept Task
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                              Mark Complete
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
