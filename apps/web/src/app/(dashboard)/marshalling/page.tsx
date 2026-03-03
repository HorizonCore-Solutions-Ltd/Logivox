"use client";

import { useState } from "react";
import {
  GitMerge,
  Plus,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ClipboardList,
  Truck,
  Share2,
  MoreHorizontal,
  RefreshCw,
  Package,
  SendHorizonal,
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

const BAY_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  FREE: { bg: "bg-green-100", text: "text-green-700", label: "Free" },
  LOADING: { bg: "bg-blue-100", text: "text-blue-700", label: "Loading" },
  STAGED: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Staged" },
  BLOCKED: { bg: "bg-red-100", text: "text-red-700", label: "Blocked" },
  MAINTENANCE: { bg: "bg-gray-100", text: "text-gray-700", label: "Maintenance" },
};

const MOCK_BAYS = [
  { id: "B01", status: "LOADING", trailer: "TR22 XYZ", loadSheet: "LS-0045", progress: 65 },
  { id: "B02", status: "STAGED", trailer: "WH20 ABC", loadSheet: "LS-0044", progress: 100 },
  { id: "B03", status: "FREE", trailer: null, loadSheet: null, progress: 0 },
  { id: "B04", status: "LOADING", trailer: "LV24 DEF", loadSheet: "LS-0046", progress: 30 },
  { id: "B05", status: "BLOCKED", trailer: "MT18 GHI", loadSheet: null, progress: 0 },
  { id: "B06", status: "FREE", trailer: null, loadSheet: null, progress: 0 },
  { id: "B07", status: "LOADING", trailer: "FT21 JKL", loadSheet: "LS-0047", progress: 80 },
  { id: "B08", status: "MAINTENANCE", trailer: null, loadSheet: null, progress: 0 },
];

const MOCK_LOAD_SHEETS = [
  {
    id: "1",
    reference: "LS-0047",
    route: "London North Run",
    trailer: "FT21 JKL",
    bay: "B07",
    status: "LOADING",
    unitLabel: "Box",
    totalBoxes: 120,
    loaded: 96,
    stops: 8,
    dispatchEta: "2026-03-03T14:00:00Z",
  },
  {
    id: "2",
    reference: "LS-0046",
    route: "Midlands Circuit",
    trailer: "LV24 DEF",
    bay: "B04",
    status: "LOADING",
    unitLabel: "Pallet",
    totalBoxes: 24,
    loaded: 7,
    stops: 5,
    dispatchEta: "2026-03-03T15:30:00Z",
  },
  {
    id: "3",
    reference: "LS-0045",
    route: "South West Loop",
    trailer: "TR22 XYZ",
    bay: "B01",
    status: "STAGED",
    unitLabel: "Box",
    totalBoxes: 85,
    loaded: 85,
    stops: 6,
    dispatchEta: "2026-03-03T12:00:00Z",
  },
  {
    id: "4",
    reference: "LS-0044",
    route: "Scotland Express",
    trailer: "WH20 ABC",
    bay: "B02",
    status: "DISPATCHED",
    unitLabel: "Box",
    totalBoxes: 60,
    loaded: 60,
    stops: 4,
    dispatchEta: "2026-03-03T08:00:00Z",
  },
];

const MOCK_PICK_TASKS = [
  { id: "1", sku: "SK-1001", name: "Widget A", qty: 20, bay: "B07", status: "PENDING", assignee: null },
  { id: "2", sku: "SK-1042", name: "Gadget Pro", qty: 8, bay: "B04", status: "IN_PROGRESS", assignee: "Dave P." },
  { id: "3", sku: "SK-2011", name: "Component X", qty: 50, bay: "B07", status: "AT_BAY", assignee: "Steve M." },
  { id: "4", sku: "SK-3300", name: "Unit Y", qty: 15, bay: "B01", status: "LOADED", assignee: "Anna K." },
];

const KPI_CARDS = [
  { title: "Active Bays", value: "3", icon: Truck, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "Load Sheets Open", value: "2", icon: ClipboardList, color: "text-purple-500", bg: "bg-purple-50" },
  { title: "Picks Remaining", value: "28", icon: Package, color: "text-orange-500", bg: "bg-orange-50" },
  { title: "Ready to Dispatch", value: "1", icon: SendHorizonal, color: "text-green-500", bg: "bg-green-50" },
];

export default function MarshallingPage() {
  const [activeTab, setActiveTab] = useState("bays");

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitMerge className="h-6 w-6 text-indigo-600" />
            Marshalling
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bay board, load sheets, pick tasks and trailer loading optimisation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Load Sheet
          </Button>
        </div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bays">Bay Board</TabsTrigger>
          <TabsTrigger value="loadsheets">Load Sheets</TabsTrigger>
          <TabsTrigger value="picks">Pick Tasks</TabsTrigger>
        </TabsList>

        {/* Bay Board */}
        <TabsContent value="bays">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Live Bay Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MOCK_BAYS.map((bay) => {
                  const style = BAY_STATUS_STYLES[bay.status] ?? BAY_STATUS_STYLES.FREE;
                  return (
                    <div
                      key={bay.id}
                      className={`rounded-lg border-2 p-4 cursor-pointer hover:shadow-md transition-shadow ${bay.status === "FREE" ? "border-green-200" : bay.status === "BLOCKED" || bay.status === "MAINTENANCE" ? "border-red-200" : "border-blue-200"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">{bay.id}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      {bay.trailer ? (
                        <>
                          <p className="text-sm font-mono text-muted-foreground">{bay.trailer}</p>
                          <p className="text-xs text-muted-foreground">{bay.loadSheet}</p>
                          {bay.progress > 0 && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Loading</span>
                                <span>{bay.progress}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${bay.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {bay.status === "FREE" ? "Available" : bay.status}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Load Sheets */}
        <TabsContent value="loadsheets">
          <Card>
            <CardContent className="p-0 mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Trailer</TableHead>
                    <TableHead>Bay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Stops</TableHead>
                    <TableHead>Dispatch ETA</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_LOAD_SHEETS.map((ls) => (
                    <TableRow key={ls.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="font-mono font-semibold text-indigo-600">{ls.reference}</TableCell>
                      <TableCell className="font-medium">{ls.route}</TableCell>
                      <TableCell className="text-sm font-mono">{ls.trailer}</TableCell>
                      <TableCell className="text-sm">{ls.bay}</TableCell>
                      <TableCell>
                        <Badge variant={ls.status === "DISPATCHED" ? "outline" : ls.status === "LOADING" ? "default" : "secondary"}>
                          {ls.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.round((ls.loaded / ls.totalBoxes) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {ls.loaded}/{ls.totalBoxes} {ls.unitLabel}s
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-center">{ls.stops}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(ls.dispatchEta).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Lines</DropdownMenuItem>
                            <DropdownMenuItem><Share2 className="h-4 w-4 mr-2" />Email Driver</DropdownMenuItem>
                            <DropdownMenuItem><CheckCircle2 className="h-4 w-4 mr-2" />Dispatch</DropdownMenuItem>
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

        {/* Pick Tasks */}
        <TabsContent value="picks">
          <Card>
            <CardContent className="p-0 mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Target Bay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_PICK_TASKS.map((task) => (
                    <TableRow key={task.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{task.sku}</TableCell>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell className="text-right font-semibold">{task.qty}</TableCell>
                      <TableCell className="font-semibold">{task.bay}</TableCell>
                      <TableCell>
                        <Badge variant={task.status === "LOADED" ? "default" : task.status === "AT_BAY" ? "secondary" : "outline"}>
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
                            <DropdownMenuItem><CheckCircle2 className="h-4 w-4 mr-2" />Mark at Bay</DropdownMenuItem>
                            <DropdownMenuItem><Layers className="h-4 w-4 mr-2" />Mark Loaded</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive"><AlertTriangle className="h-4 w-4 mr-2" />Short Pick</DropdownMenuItem>
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
