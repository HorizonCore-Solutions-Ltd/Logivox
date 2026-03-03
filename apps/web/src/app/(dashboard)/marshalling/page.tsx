"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, Package, ClipboardList, Truck, CheckCircle2, MoreHorizontal, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface DockBay {
  id: string;
  doorNumber: string;
  status: string;
  trailerNumber?: string;
  loadSheetId?: string;
  loadSheetNumber?: string;
}

interface LoadSheet {
  id: string;
  loadSheetNumber: string;
  status: string;
  trailerNumber?: string;
  bayDoor?: { doorNumber: string };
  routeCode?: string;
  totalBoxes: number;
  loadedBoxes: number;
  completionPct: number;
  dispatchedAt?: string;
}

interface PickTask {
  id: string;
  taskNumber: string;
  status: string;
  title: string;
  sku?: string;
  productName?: string;
  fromLocationCode?: string;
  quantity: number;
  completedQuantity: number;
  assignedToName?: string;
}

const BAY_STATUS_COLOR: Record<string, string> = {
  EMPTY: "bg-gray-100 border-gray-300 text-gray-600",
  SPOTTED: "bg-blue-100 border-blue-400 text-blue-800",
  LOADING: "bg-yellow-100 border-yellow-400 text-yellow-800",
  SEALED: "bg-green-100 border-green-400 text-green-800",
  DEPARTING: "bg-purple-100 border-purple-400 text-purple-800",
  OUT_OF_USE: "bg-red-100 border-red-300 text-red-600",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary", PICKING: "default", LOADING: "default", SEALED: "default",
  DISPATCHED: "default", COMPLETED: "outline",
};

export default function MarshallingPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: bayData, isLoading: bayLoading } = useQuery<{ bays: DockBay[] }>({
    queryKey: ["dock-bays"],
    queryFn: async () => {
      const res = await fetch("/api/dock/status");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 20_000,
  });

  const { data: loadSheetData, isLoading: lsLoading } = useQuery<{ loadSheets: LoadSheet[]; count: number }>({
    queryKey: ["loadsheets"],
    queryFn: async () => {
      const res = await fetch("/api/loadsheets?limit=50");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 20_000,
  });

  const { data: pickData, isLoading: pickLoading } = useQuery<{ tasks: PickTask[]; total: number }>({
    queryKey: ["pick-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/picking-tasks?limit=50");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 20_000,
  });

  const advanceMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await fetch(`/api/loadsheets/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loadsheets"] }); qc.invalidateQueries({ queryKey: ["dock-bays"] }); toast({ title: "Load sheet updated" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const completePickMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/picking-tasks/${id}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pick-tasks"] }); toast({ title: "Pick completed" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const bays = bayData?.bays ?? [];
  const loadSheets = loadSheetData?.loadSheets ?? [];
  const picks = pickData?.tasks ?? [];

  const activeBays = bays.filter(b => b.status !== "EMPTY" && b.status !== "OUT_OF_USE").length;
  const activeLoads = loadSheets.filter(ls => ls.status !== "DISPATCHED" && ls.status !== "COMPLETED").length;
  const openPicks = picks.filter(p => p.status === "PENDING" || p.status === "IN_PROGRESS").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><LayoutGrid className="h-6 w-6 text-teal-600" />Marshalling</h1>
          <p className="text-sm text-muted-foreground mt-1">Bay board, load sheets and pick task management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Total Bays", value: bays.length, icon: Truck, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Active Bays", value: activeBays, icon: LayoutGrid, color: "text-teal-500", bg: "bg-teal-50" },
          { title: "Open Loads", value: activeLoads, icon: Package, color: "text-yellow-500", bg: "bg-yellow-50" },
          { title: "Open Picks", value: openPicks, icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-50" },
        ].map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                <div>
                  <p className="text-2xl font-bold">{bayLoading ? "—" : kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="bayboard">
        <TabsList>
          <TabsTrigger value="bayboard">Bay Board</TabsTrigger>
          <TabsTrigger value="loadsheets">Load Sheets</TabsTrigger>
          <TabsTrigger value="picks">Pick Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="bayboard">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Dock Bay Status</CardTitle></CardHeader>
            <CardContent>
              {bayLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {bays.length === 0 ? <p className="col-span-full text-center py-8 text-muted-foreground">No dock bays configured.</p> : bays.map((bay) => (
                    <div key={bay.id} className={`border-2 rounded-lg p-3 text-center ${BAY_STATUS_COLOR[bay.status] ?? "bg-gray-50 border-gray-200"}`}>
                      <p className="font-bold text-lg">Door {bay.doorNumber}</p>
                      <p className="text-xs font-medium mt-1">{bay.status.replace(/_/g, " ")}</p>
                      {bay.trailerNumber && <p className="text-xs mt-1 font-mono">{bay.trailerNumber}</p>}
                      {bay.loadSheetNumber && <p className="text-xs text-blue-600">{bay.loadSheetNumber}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loadsheets">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Load Sheets</CardTitle></CardHeader>
            <CardContent className="p-0">
              {lsLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Load #</TableHead><TableHead>Route</TableHead><TableHead>Status</TableHead>
                      <TableHead>Bay</TableHead><TableHead>Trailer</TableHead><TableHead>Progress</TableHead><TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadSheets.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No load sheets.</TableCell></TableRow>
                    ) : loadSheets.map((ls) => (
                      <TableRow key={ls.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-semibold text-blue-700">{ls.loadSheetNumber}</TableCell>
                        <TableCell className="text-sm">{ls.routeCode ?? "—"}</TableCell>
                        <TableCell><Badge variant={STATUS_VARIANT[ls.status] ?? "secondary"}>{ls.status}</Badge></TableCell>
                        <TableCell className="text-sm font-mono">{ls.bayDoor?.doorNumber ?? "—"}</TableCell>
                        <TableCell className="text-sm font-mono">{ls.trailerNumber ?? "—"}</TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <Progress value={ls.completionPct} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{ls.loadedBoxes}/{ls.totalBoxes}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => advanceMutation.mutate({ id: ls.id, action: "advance" })}><ArrowRight className="h-4 w-4 mr-2" />Advance Status</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => advanceMutation.mutate({ id: ls.id, action: "dispatch" })}><Truck className="h-4 w-4 mr-2" />Dispatch</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="picks">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Pick Tasks</CardTitle></CardHeader>
            <CardContent className="p-0">
              {pickLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task #</TableHead><TableHead>Item</TableHead><TableHead>From</TableHead>
                      <TableHead>Qty</TableHead><TableHead>Status</TableHead><TableHead>Assignee</TableHead><TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {picks.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pick tasks.</TableCell></TableRow>
                    ) : picks.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-semibold text-sm">{p.taskNumber}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{p.productName ?? p.title}</p>
                          {p.sku && <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>}
                        </TableCell>
                        <TableCell className="text-sm font-mono">{p.fromLocationCode ?? "—"}</TableCell>
                        <TableCell className="text-sm">{p.completedQuantity}/{p.quantity}</TableCell>
                        <TableCell><Badge variant={STATUS_VARIANT[p.status] ?? "secondary"}>{p.status}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.assignedToName ?? <span className="italic">Unassigned</span>}</TableCell>
                        <TableCell>
                          {(p.status === "PENDING" || p.status === "IN_PROGRESS") && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => completePickMutation.mutate(p.id)}><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />Complete Pick</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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
