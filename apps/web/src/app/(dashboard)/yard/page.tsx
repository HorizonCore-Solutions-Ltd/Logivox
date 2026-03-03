"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Car, ArrowDownCircle, ArrowUpCircle, Truck, Plus, LogIn, LogOut, Clock, CheckCircle2, AlertTriangle, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface GateEntry {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  vehicleNumber: string;
  trailerNumber?: string;
  driverName?: string;
  carrierName?: string;
  status: string;
  appointmentNumber?: string;
  createdAt: string;
}

interface ShunterTask {
  id: string;
  trailerNumber: string;
  taskType: string;
  fromLocationName?: string;
  toLocationName?: string;
  priority: string;
  status: string;
  assignedTo?: string;
  createdAt: string;
}

interface GateSummary { inboundToday: number; outboundToday: number; onSite: number; pendingCheckIn: number }

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary", CHECKED_IN: "default", ON_SITE: "default", CHECKED_OUT: "outline",
  IN_PROGRESS: "default", COMPLETED: "default", CANCELLED: "destructive",
};
const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  LOW: "outline", NORMAL: "secondary", HIGH: "default", URGENT: "destructive",
};

export default function YardPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: gateData, isLoading: gateLoading } = useQuery<{ entries: GateEntry[]; summary: GateSummary }>({
    queryKey: ["yard-gate-log"],
    queryFn: async () => {
      const res = await fetch("/api/yard/gate-log");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const { data: shunterData, isLoading: shunterLoading } = useQuery<{ tasks: ShunterTask[] }>({
    queryKey: ["yard-shunter"],
    queryFn: async () => {
      const res = await fetch("/api/yard/shunter");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const checkOutMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/yard/gate-log/${id}/checkout`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["yard-gate-log"] }); toast({ title: "Vehicle checked out" }); },
    onError: () => toast({ title: "Checkout failed", variant: "destructive" }),
  });

  const acceptTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/yard/shunter/${id}/accept`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["yard-shunter"] }); toast({ title: "Task accepted" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/yard/shunter/${id}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["yard-shunter"] }); toast({ title: "Task completed" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const entries = gateData?.entries ?? [];
  const tasks = shunterData?.tasks ?? [];
  const summary = gateData?.summary;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Car className="h-6 w-6 text-orange-600" />Yard Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Gate log, trailer movements and shunter tasks</p>
        </div>
        <Button size="sm"><LogIn className="h-4 w-4 mr-2" />Gate Check-In</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "On Site", value: summary?.onSite, icon: Truck, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Pending Arrival", value: summary?.pendingCheckIn, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50" },
          { title: "Inbound Today", value: summary?.inboundToday, icon: ArrowDownCircle, color: "text-green-500", bg: "bg-green-50" },
          { title: "Shunter Tasks", value: tasks.filter(t => t.status === "PENDING").length, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" },
        ].map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                <div>
                  <p className="text-2xl font-bold">{gateLoading ? "—" : (kpi.value ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="gatelog">
        <TabsList>
          <TabsTrigger value="gatelog">Gate Log</TabsTrigger>
          <TabsTrigger value="shunter">Shunter Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="gatelog">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Today&apos;s Gate Log</CardTitle>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />Manual Entry</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {gateLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead><TableHead>Direction</TableHead><TableHead>Carrier</TableHead>
                      <TableHead>Driver</TableHead><TableHead>Status</TableHead><TableHead>Ref</TableHead><TableHead>Time</TableHead><TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No gate entries today.</TableCell></TableRow>
                    ) : entries.map((e) => (
                      <TableRow key={e.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-semibold">{e.vehicleNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {e.direction === "INBOUND" ? <ArrowDownCircle className="h-4 w-4 text-blue-500" /> : <ArrowUpCircle className="h-4 w-4 text-green-500" />}
                            <span className="text-sm">{e.direction}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{e.carrierName ?? "—"}</TableCell>
                        <TableCell className="text-sm">{e.driverName ?? "—"}</TableCell>
                        <TableCell><Badge variant={STATUS_VARIANT[e.status] ?? "secondary"}>{e.status.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell className="text-sm font-mono text-blue-600">{e.appointmentNumber ?? "—"}</TableCell>
                        <TableCell className="text-sm">{new Date(e.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {e.status !== "CHECKED_OUT" && <DropdownMenuItem onClick={() => checkOutMutation.mutate(e.id)}><LogOut className="h-4 w-4 mr-2" />Check Out</DropdownMenuItem>}
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

        <TabsContent value="shunter">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Shunter Tasks</CardTitle>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />New Task</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {shunterLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trailer</TableHead><TableHead>Type</TableHead><TableHead>From → To</TableHead>
                      <TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Assignee</TableHead><TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No shunter tasks.</TableCell></TableRow>
                    ) : tasks.map((t) => (
                      <TableRow key={t.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-semibold">{t.trailerNumber}</TableCell>
                        <TableCell className="text-sm">{t.taskType}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.fromLocationName ?? "—"} → {t.toLocationName ?? "—"}</TableCell>
                        <TableCell><Badge variant={PRIORITY_VARIANT[t.priority] ?? "secondary"}>{t.priority}</Badge></TableCell>
                        <TableCell><Badge variant={STATUS_VARIANT[t.status] ?? "secondary"}>{t.status.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.assignedTo ?? <span className="italic">Unassigned</span>}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {t.status === "PENDING" && <DropdownMenuItem onClick={() => acceptTaskMutation.mutate(t.id)}><CheckCircle2 className="h-4 w-4 mr-2" />Accept</DropdownMenuItem>}
                              {t.status === "IN_PROGRESS" && <DropdownMenuItem onClick={() => completeTaskMutation.mutate(t.id)}><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />Complete</DropdownMenuItem>}
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
      </Tabs>
    </div>
  );
}
