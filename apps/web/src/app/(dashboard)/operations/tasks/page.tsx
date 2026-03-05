"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  ChevronRight, 
  MapPin, 
  BarChart, 
  CheckSquare, 
  Clock, 
  Play, 
  Pause,
  AlertOctagon,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  type: string;
  priority: number;
  status: string;
  zone: string;
}

export default function TaskOrchestration() {
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['ops-tasks'],
    queryFn: async () => {
      const res = await fetch('/api/operations/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    }
  });

  const [filter, setFilter] = useState("ALL");

  const filteredTasks = tasks.filter(t => filter === "ALL" || t.status === filter);

  const getPriorityColor = (p: number) => {
      if (p >= 9) return "text-red-600 bg-red-50 border-red-200";
      if (p >= 5) return "text-amber-600 bg-amber-50 border-amber-200";
      return "text-green-600 bg-green-50 border-green-200";
  };

  return (
    <div className="flex flex-col space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Orchestration</h1>
          <p className="text-muted-foreground">Manage and prioritize active warehouse tasks.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <BarChart className="mr-2 h-4 w-4" /> Load Balancing
            </Button>
            <Button>
                <Play className="mr-2 h-4 w-4" /> Auto-Assign
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
          <Card>
              <CardHeader className="py-4"><CardTitle className="text-sm">High Priority</CardTitle></CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-red-600">{tasks.filter(t => t.priority >= 9).length}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="py-4"><CardTitle className="text-sm">Blocked Tasks</CardTitle></CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{tasks.filter(t => t.status === 'BLOCKED').length}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="py-4"><CardTitle className="text-sm">In Progress</CardTitle></CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="py-4"><CardTitle className="text-sm">Avg Cycle Time</CardTitle></CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">4m 12s</div>
              </CardContent>
          </Card>
      </div>

      <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle>Active Task Queue</CardTitle>
                  <Tabs value={filter} onValueChange={setFilter}>
                      <TabsList>
                          <TabsTrigger value="ALL">All Tasks</TabsTrigger>
                          <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
                          <TabsTrigger value="PENDING">Pending</TabsTrigger>
                          <TabsTrigger value="BLOCKED">Blocked</TabsTrigger>
                      </TabsList>
                  </Tabs>
              </div>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {filteredTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No tasks match current filter.</div>
                  ) : (
                      filteredTasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-4">
                                  <Badge variant="outline" className={`${getPriorityColor(task.priority)} font-mono`}>
                                      P{task.priority}
                                  </Badge>
                                  <div>
                                      <div className="font-semibold">{task.type} Task <span className="text-muted-foreground font-normal ml-2 text-xs">#{task.id}</span></div>
                                      <div className="text-xs text-muted-foreground flex gap-2">
                                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {task.zone}</span>
                                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 2m ago</span>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                  <Badge variant={task.status === 'BLOCKED' ? 'destructive' : task.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                                      {task.status}
                                  </Badge>
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                          <DropdownMenuItem>Elevate Priority</DropdownMenuItem>
                                          <DropdownMenuItem>Reassign</DropdownMenuItem>
                                          <DropdownMenuItem className="text-red-600">Cancel Task</DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
