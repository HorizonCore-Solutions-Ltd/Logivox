"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Building2, 
  Map as MapIcon, 
  Truck, 
  Users, 
  AlertTriangle,
  GitMerge,
  Waves,
  PlayCircle,
  Construction,
  Award,
  Zap,
  Clock,
  Battery,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Package,
  Recycle,
  Settings2,
  Undo2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTerminology } from "@/hooks/use-terminology";

interface BayDoor {
  id: string;
  name: string;
  doorType: "INBOUND" | "OUTBOUND";
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
}

interface LeaderboardUser {
    id: string;
    name: string;
    role: string;
    image?: string;
    score: number;
    picksPerHour: number;
    accuracy: number;
}

interface UserLocation {
    id: string;
    name: string;
    role: string;
    image?: string;
    currentZone: string;
}

interface QualityIncident {
    id: string;
    alertNumber: string;
    title: string;
    message: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    triggeredAt: string;
    data: any;
}

interface OpsDashboardData {
  summary: {
    activePickers: number;
    activeReplen: number;
    activePutaway: number;
    wavesReleased: number;
    wavesPending: number;
    loadSheetsReady: number;
    congestionZones: number;
  };
  returns: {
      pendingTrailers: number;
      tippedCount: number;
      reusables: {
          pallets: { onHand: number; dispatched: number; damaged: number };
          totes: { onHand: number; dispatched: number; damaged: number };
          cages: { onHand: number; dispatched: number; damaged: number };
      }
  };
  alerts: {
    id: string;
    type: "SLA" | "CONGESTION" | "EQUIPMENT" | "LABOR" | "INVENTORY";
    message: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    timestamp: string;
  }[];
  waveProgress: {
    id: string;
    name: string;
    status: string;
    progress: number;
    totalTasks: number;
    completedTasks: number;
  }[];
  dockStatus: {
    inboundTotal: number;
    inboundOccupied: number;
    outboundTotal: number;
    outboundOccupied: number;
  };
  doors: BayDoor[];
  laborMap: UserLocation[];
  leaderboard: LeaderboardUser[];
}

export default function OperationsCockpit() {
  const { terms, updateTerm } = useTerminology();
  const { data, isLoading, isError } = useQuery<OpsDashboardData>({
    queryKey: ['ops-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/operations/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      return res.json();
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  const { data: qualityData } = useQuery<{ incidents: QualityIncident[] }>({
    queryKey: ['ops-quality'],
    queryFn: async () => {
      const res = await fetch('/api/operations/quality?limit=20');
      if (!res.ok) return { incidents: [] };
      return res.json();
    },
    refetchInterval: 30000 
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading Operations Center...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500">Failed to load operations data. Please check connection.</div>;
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations Cockpit</h1>
          <p className="text-muted-foreground">Real-time control center for floor operations, planning, and marshalling.</p>
        </div>
        <div className="flex gap-2">
            <Link href="/operations/planning">
                <Button variant="outline">
                    <Waves className="mr-2 h-4 w-4" /> Wave Planning
                </Button>
            </Link>
            <Link href="/operations/marshalling">
                <Button variant="outline">
                    <GitMerge className="mr-2 h-4 w-4" /> Load Sheets
                </Button>
            </Link>
          <Button>
            <PlayCircle className="mr-2 h-4 w-4" /> Operations Mode
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Customize Terminology">
                    <Settings2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Customize Terminology</DialogTitle>
                    <DialogDescription>
                        Adapt the system language to match your floor operations.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pallet-term" className="text-right">Pallet</Label>
                        <Input 
                            id="pallet-term" 
                            value={terms.pallet} 
                            onChange={(e) => updateTerm('pallet', e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tote-term" className="text-right">Container/Tote</Label>
                        <Input 
                            id="tote-term" 
                            value={terms.container} 
                            onChange={(e) => updateTerm('container', e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tipping-term" className="text-right">Unloading</Label>
                        <Input 
                            id="tipping-term" 
                            value={terms.tipping} 
                            onChange={(e) => updateTerm('tipping', e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Labor Force</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.activePickers || 0} Pickers</div>
            <p className="text-xs text-muted-foreground">
              + {data?.summary.activeReplen || 0} Replen / {data?.summary.activePutaway || 0} Putaway
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wave Status</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.wavesReleased || 0} Active</div>
            <p className="text-xs text-muted-foreground">
              {data?.summary.wavesPending || 0} Pending Release
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marshalling Ready</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.loadSheetsReady || 0} Loads</div>
            <p className="text-xs text-muted-foreground">
              Ready for dispatch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dock Utilization</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {Math.round(((data?.dockStatus.inboundOccupied ?? 0) + (data?.dockStatus.outboundOccupied ?? 0)) / 
                Math.max(1, (data?.dockStatus.inboundTotal ?? 0) + (data?.dockStatus.outboundTotal ?? 0)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.dockStatus.outboundOccupied} Outbound / {data?.dockStatus.inboundOccupied} Inbound Active
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Main Operational View / Map Placeholder */}
        <Card className="col-span-4 md:col-span-5 h-full">
           <CardHeader>
             <CardTitle className="flex justify-between items-center">
                <span>Floor Map & Real-Time Status</span>
                <Badge variant="outline" className="text-green-600 bg-green-50">Live Data</Badge>
             </CardTitle>
             <CardDescription>
                Visual representation of Bay Doors {data?.doors?.length ? `(${data.doors.length} Active)` : ''}, Zones, and Staff.
             </CardDescription>
           </CardHeader>
           <CardContent className="min-h-[400px] bg-slate-50 border-2 border-dashed rounded-md relative m-4 p-6">
              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="labor">Staff & Allocation</TabsTrigger>
                    <TabsTrigger value="leaderboard">High Performers</TabsTrigger>
                    <TabsTrigger value="quality">Quality & Compliance</TabsTrigger>
                    <TabsTrigger value="returns">Returns & {terms.pallet}s</TabsTrigger>
                    <TabsTrigger value="measure">Measurements</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="h-[400px]">
                  {/* Warehouse Layout Representation */}
                  <div className="grid grid-cols-12 gap-4 h-full">
                      
                      {/* Left Side: INBOUND DOCKS */}
                      <div className="col-span-2 flex flex-col gap-2 border-r pr-4">
                          <div className="text-xs font-bold text-slate-400 mb-2">INBOUND DOCKS</div>
                          {data?.doors?.filter(d => d.doorType === 'INBOUND').map(door => (
                              <div key={door.id} className={`p-3 rounded border text-center ${
                                  door.status === 'OCCUPIED' ? 'bg-red-100 border-red-300 text-red-800' :
                                  door.status === 'MAINTENANCE' ? 'bg-orange-100 border-orange-300 text-orange-800' :
                                  'bg-green-100 border-green-300 text-green-800'
                              }`}>
                                  <div className="font-bold text-sm">{door.name}</div>
                                  <div className="text-[10px] uppercase mt-1 flex justify-center items-center gap-1">
                                      {door.status === 'MAINTENANCE' && <Construction className="h-3 w-3" />}
                                      {door.status}
                                  </div>
                              </div>
                          ))}
                          {(!data?.doors?.filter(d => d.doorType === 'INBOUND').length) && (
                              <div className="text-xs text-slate-400 italic">No Inbound Doors Configured</div>
                          )}
                      </div>

                      {/* Middle: ZONES & FLOOR */}
                      <div className="col-span-8 relative">
                          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                              <MapIcon className="h-32 w-32" />
                          </div>

                          {/* Dynamic Zones could be placed here if coordinates existed. For now using static + data overlay */}
                          <div className="grid grid-cols-2 gap-8 mt-10">
                              <div className="h-24 bg-blue-50 border border-blue-200 rounded p-2 flex flex-col justify-between group cursor-pointer hover:border-blue-400">
                                  <span className="text-xs font-bold text-blue-700">ZONE-A (Picking)</span>
                                  <div className="text-right text-xs text-blue-500">{data?.laborMap?.filter(u => u.currentZone === 'ZONE-A').length || 0} Staff Active</div>
                              </div>
                              <div className="h-24 bg-amber-50 border border-amber-200 rounded p-2 flex flex-col justify-between group cursor-pointer hover:border-amber-400">
                                  <span className="text-xs font-bold text-amber-700">STAGING-IN (Receiving)</span>
                                  <div className="text-right text-xs text-amber-500">{data?.laborMap?.filter(u => u.currentZone === 'RECEIVING').length || 0} Staff Active</div>
                              </div>
                              
                              <div className="col-span-2 h-24 bg-green-50 border border-green-200 rounded p-2 flex flex-col justify-between group cursor-pointer hover:border-green-400">
                                  <span className="text-xs font-bold text-green-700">MARSHALLING / OUTBOUND STAGING</span>
                                  <div className="flex justify-between items-end">
                                    <div className="flex gap-2">
                                        {Array.from({ length: Math.min(5, data?.summary.loadSheetsReady || 0) }).map((_, i) => (
                                            <Truck key={i} className="h-5 w-5 text-green-600" />
                                        ))}
                                        {(data?.summary.loadSheetsReady || 0) > 5 && <span className="text-xs text-green-600 self-center">+{ (data?.summary.loadSheetsReady || 0) - 5 } more</span>}
                                    </div>
                                    <div className="text-xs text-green-600">{data?.laborMap?.filter(u => u.currentZone === 'MARSHALLING').length || 0} Staff</div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Right Side: OUTBOUND DOCKS */}
                      <div className="col-span-2 flex flex-col gap-2 border-l pl-4">
                          <div className="text-xs font-bold text-slate-400 mb-2 text-right">OUTBOUND DOCKS</div>
                          {data?.doors?.filter(d => d.doorType === 'OUTBOUND').map(door => (
                              <div key={door.id} className={`p-3 rounded border text-center ${
                                  door.status === 'OCCUPIED' ? 'bg-red-100 border-red-300 text-red-800' :
                                  door.status === 'MAINTENANCE' ? 'bg-orange-100 border-orange-300 text-orange-800' :
                                  'bg-green-100 border-green-300 text-green-800'
                              }`}>
                                  <div className="font-bold text-sm">{door.name}</div>
                                  <div className="text-[10px] uppercase mt-1 flex justify-center items-center gap-1">
                                      {door.status === 'MAINTENANCE' && <Construction className="h-3 w-3" />}
                                      {door.status}
                                  </div>
                              </div>
                          ))}
                          {(!data?.doors?.filter(d => d.doorType === 'OUTBOUND').length) && (
                              <div className="text-xs text-slate-400 italic text-right">No Outbound Doors Configured</div>
                          )}
                      </div>
                  </div>
                </TabsContent>

                <TabsContent value="labor" className="h-[400px] overflow-y-auto">
                    <div className="grid grid-cols-3 gap-6">
                        {["ZONE-A", "RECEIVING", "MARSHALLING", "PACKING", "ZONE-B"].map(zone => (
                            <div key={zone} className="border rounded-lg bg-white p-3 shadow-sm min-h-[150px]">
                                <div className="flex justify-between items-center mb-2 border-b pb-2">
                                    <span className="font-bold text-sm">{zone}</span>
                                    <Badge variant="secondary">{data?.laborMap?.filter(u => u.currentZone === zone).length} Active</Badge>
                                </div>
                                <div className="space-y-2">
                                    {data?.laborMap?.filter(u => u.currentZone === zone).map(u => (
                                        <div key={u.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-move">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={u.image} />
                                                <AvatarFallback>{u.name?.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-xs">
                                                <div className="font-medium">{u.name}</div>
                                                <div className="text-[10px] text-muted-foreground">{u.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {data?.laborMap?.filter(u => u.currentZone === zone).length === 0 && (
                                        <div className="text-xs text-slate-400 italic py-4 text-center">No staff assigned</div>
                                    )}
                                </div>
                                <Button variant="ghost" size="sm" className="w-full mt-2 text-xs border border-dashed text-slate-400 hover:text-slate-600">
                                    + Assign Staff
                                </Button>
                            </div>
                        ))}
                    </div>
                </TabsContent>
                
                {/* Gamification Tab */}
                <TabsContent value="leaderboard" className="h-[400px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                        <div className="space-y-4 pr-2 overflow-y-auto">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Award className="h-5 w-5 text-amber-500" /> Top Performers (Shift)
                            </h3>
                            {data?.leaderboard?.map((user, i) => (
                                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                            ${i === 0 ? 'bg-amber-100 text-amber-700' : 
                                              i === 1 ? 'bg-slate-200 text-slate-700' : 
                                              i === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-50 text-slate-500'}
                                        `}>
                                            {i + 1}
                                        </div>
                                        <Avatar className="h-9 w-9 border-2 border-background">
                                            <AvatarImage src={user.image} />
                                            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-sm">{user.name}</div>
                                            <div className="text-xs text-muted-foreground">{user.picksPerHour} picks/hr</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg text-primary">{user.score}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Flow Score</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg flex flex-col justify-between">
                            <div>
                                <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-purple-500" /> Current Shift Stats
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Team Accuracy Goal</span>
                                            <span className="font-bold text-green-600">99.8%</span>
                                        </div>
                                        <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div className="absolute top-0 left-0 h-full bg-green-500 w-[99.2%]"></div>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1">Current: 99.2%</div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <div className="bg-white p-3 rounded border text-center">
                                            <div className="text-2xl font-bold text-blue-600">1,240</div>
                                            <div className="text-xs text-muted-foreground">Total Picks</div>
                                        </div>
                                        <div className="bg-white p-3 rounded border text-center">
                                            <div className="text-2xl font-bold text-amber-600">12</div>
                                            <div className="text-xs text-muted-foreground">Exceptions</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full text-xs">
                                View Full Team Performance Report
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="quality" className="h-[400px] gap-4 grid grid-cols-1 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-4 h-24">
                        <div className="bg-red-50 border border-red-200 rounded p-4 flex flex-col justify-between">
                             <div className="text-xs font-bold text-red-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> SAFETY</div>
                             <div className="text-2xl font-bold text-red-800">
                                {qualityData?.incidents?.filter(i => i.data?.incidentType === 'Safety').length || 0}
                             </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded p-4 flex flex-col justify-between">
                             <div className="text-xs font-bold text-blue-700 flex items-center gap-2"><Construction className="h-4 w-4"/> DAMAGED</div>
                             <div className="text-2xl font-bold text-blue-800">
                                {qualityData?.incidents?.filter(i => i.data?.incidentType === 'Damaged').length || 0}
                             </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded p-4 flex flex-col justify-between">
                             <div className="text-xs font-bold text-amber-700 flex items-center gap-2"><AlertOctagon className="h-4 w-4"/> LABELING</div>
                             <div className="text-2xl font-bold text-amber-800">
                                {qualityData?.incidents?.filter(i => i.data?.incidentType === 'Labeling').length || 0}
                             </div>
                        </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b text-xs font-semibold text-slate-500 flex justify-between">
                            <span>RECENT INCIDENT REPORTS</span>
                            <span className="text-slate-400">Live Feed</span>
                        </div>
                        <div className="bg-white divide-y max-h-[250px] overflow-y-auto">
                           {qualityData?.incidents?.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No incidents reported recently.</div>}
                           {qualityData?.incidents?.map((incident: QualityIncident) => (
                               <div key={incident.id} className="p-3 flex justify-between hover:bg-slate-50">
                                   <div>
                                       <div className="flex items-center gap-2">
                                           <Badge variant="outline" className={
                                               incident.severity === 'HIGH' ? 'border-red-500 text-red-700 bg-red-50' : 
                                               incident.severity === 'MEDIUM' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'text-blue-700 bg-blue-50'
                                           }>{incident.data?.incidentType || 'General'}</Badge>
                                           <span className="font-medium text-sm">{incident.message}</span>
                                       </div>
                                       <div className="text-xs text-muted-foreground mt-1 flex gap-4">
                                            <span>Reported by: {incident.data?.reportedBy ? 'Staff' : 'System'}</span>
                                            <span>Location: {incident.data?.location || 'N/A'}</span>
                                       </div>
                                   </div>
                                   <div className="text-xs text-muted-foreground whitespace-nowrap">
                                       {new Date(incident.triggeredAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                </TabsContent>

                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="returns" className="h-[400px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        {/* Left: Tipping / Processing Status */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Undo2 className="h-5 w-5 text-blue-500" /> Inbound {terms.returns} Flow
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white border rounded shadow-sm">
                                    <div className="text-xs text-muted-foreground font-medium uppercase">{terms.tipping} Queue</div>
                                    <div className="text-3xl font-bold mt-2">{data?.returns?.pendingTrailers || 0}</div>
                                    <div className="text-xs text-slate-500">Trailers waiting</div>
                                </div>
                                <div className="p-4 bg-white border rounded shadow-sm">
                                     <div className="text-xs text-muted-foreground font-medium uppercase">Throughput</div>
                                    <div className="text-3xl font-bold mt-2">{data?.returns?.tippedCount || 0}</div>
                                    <div className="text-xs text-slate-500">Units processed today</div>
                                </div>
                            </div>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Active Returns Processing</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                                                <div>
                                                    <div className="font-medium text-sm">Trailer #{3902 + i}</div>
                                                    <div className="text-xs text-muted-foreground">Dock {8+i} • {terms.tipping} in progress</div>
                                                </div>
                                                <Badge variant="outline" className="animate-pulse bg-green-50 text-green-700">Active</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right: Asset Tracking / Reusables */}
                        <div className="bg-slate-50 p-4 rounded border">
                            <h3 className="font-semibold flex items-center gap-2 mb-4">
                                <Recycle className="h-5 w-5 text-green-600" /> Reusable Assets (Empties)
                            </h3>
                            
                            <div className="space-y-4">
                                {/* Pallets */}
                                <div className="bg-white p-3 rounded shadow-sm border-l-4 border-l-amber-500">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold">{terms.pallet}s</span>
                                        <Badge variant="secondary">{data?.returns.reusables.pallets.onHand} On Floor</Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="bg-slate-50 p-2 rounded">
                                            <div className="font-bold text-slate-700">{data?.returns.reusables.pallets.dispatched}</div>
                                            <div className="text-slate-400">Dispatched</div>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded">
                                            <div className="font-bold text-slate-700">{data?.returns.reusables.pallets.damaged}</div>
                                            <div className="text-red-400">Damaged</div>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded">
                                            <div className="font-bold text-green-700">High</div>
                                            <div className="text-slate-400">Stock Level</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Totes */}
                                <div className="bg-white p-3 rounded shadow-sm border-l-4 border-l-blue-500">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold">{terms.container}s / Totes</span>
                                        <Badge variant="secondary">{data?.returns.reusables.totes.onHand} On Floor</Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="bg-slate-50 p-2 rounded">
                                            <div className="font-bold text-slate-700">{data?.returns.reusables.totes.dispatched}</div>
                                            <div className="text-slate-400">Dispatched</div>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded">
                                            <div className="font-bold text-slate-700">{data?.returns.reusables.totes.damaged}</div>
                                            <div className="text-red-400">Damaged</div>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded">
                                             <div className="font-bold text-green-700">OK</div>
                                             <div className="text-slate-400">Stock Level</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="measure" className="h-[400px] flex items-center justify-center bg-slate-100 rounded">
                    <div className="text-center space-y-4">
                        <div className="bg-white p-4 rounded shadow-sm max-w-md mx-auto">
                            <h3 className="font-bold mb-2">Distance Calculator</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div className="p-2 border rounded">
                                    <span className="text-muted-foreground block text-xs">Origin</span>
                                    <select className="w-full mt-1"><option>Dock 1</option><option>Zone A</option></select>
                                </div>
                                <div className="p-2 border rounded">
                                    <span className="text-muted-foreground block text-xs">Destination</span>
                                    <select className="w-full mt-1"><option>Pack Station</option><option>Zone B</option></select>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-blue-600">45 ft</div>
                            <p className="text-xs text-muted-foreground mt-1">Est. Travel Time: 15s</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Select two points on the map to measure linear distance.</p>
                    </div>
                </TabsContent>
              </Tabs>
           </CardContent>
        </Card>

        {/* Alerts & Exceptions Side Panel */}
        <Card className="col-span-3 md:col-span-2">
            <CardHeader>
                <CardTitle>Andon Board (Live Issues)</CardTitle>
                <CardDescription>Real-time blocker feed from the floor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {data?.alerts.length === 0 && (
                    <div className="text-sm text-muted-foreground italic">No active alerts. Operations normal.</div>
                )}
                {data?.alerts.map((alert, i) => (
                    <div key={alert.id || i} className={`p-3 rounded-lg border-l-4 text-sm shadow-sm animate-in fade-in slide-in-from-right-4 duration-300 ${
                        alert.severity === 'HIGH' ? 'bg-red-50 border-red-500' : 
                        alert.severity === 'MEDIUM' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'
                    }`}>
                        <div className="font-semibold flex items-center gap-2">
                             {alert.type === 'LABOR' ? <Users className="h-3 w-3" /> :
                              alert.type === 'EQUIPMENT' ? <Battery className="h-3 w-3" /> :
                              alert.type === 'INVENTORY' ? <Construction className="h-3 w-3" /> :
                              <AlertTriangle className="h-3 w-3" />}
                            {alert.type} Alert
                        </div>
                        <div className="mt-1 font-medium">{alert.message}</div>
                        <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                            <Button size="sm" variant="ghost" className="h-6 text-xs hover:bg-white">Resolve</Button>
                        </div>
                    </div>
                ))}
                
                <div className="pt-4 mt-6 border-t">
                    <h4 className="font-semibold mb-3 text-sm">Wave Progress</h4>
                    <div className="space-y-4">
                        {data?.waveProgress.length === 0 && (
                             <div className="text-xs text-muted-foreground italic">No waves in progress.</div>
                        )}
                        {data?.waveProgress.map(wave => (
                            <div key={wave.id}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium">{wave.name}</span>
                                    <span>{wave.progress}%</span>
                                </div>
                                <Progress value={wave.progress} className="h-2" />
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}