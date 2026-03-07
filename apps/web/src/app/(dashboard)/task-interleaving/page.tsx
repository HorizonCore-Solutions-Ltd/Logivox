"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shuffle, CheckCircle, ArrowRightLeft, Layers } from "lucide-react";

interface InterleavedTask {
  id: string;
  type: "putaway" | "picking" | "replenishment";
  location: string;
  worker: string;
  priority: number;
  status: "pending" | "in-progress" | "completed";
}

export default function TaskInterleavingPage() {
  const [tasks, setTasks] = useState<InterleavedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setTasks([
        {
          id: "T-1001",
          type: "putaway",
          location: "A-01-02",
          worker: "John Doe",
          priority: 1,
          status: "in-progress",
        },
        {
          id: "T-1002",
          type: "picking",
          location: "A-01-05",
          worker: "John Doe",
          priority: 2,
          status: "pending",
        },
        {
          id: "T-1003",
          type: "replenishment",
          location: "B-03-01",
          worker: "Jane Smith",
          priority: 1,
          status: "in-progress",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Task Interleaving</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">Settings</Button>
          <Button>Optimize Queue</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Interleaving Ratio
            </CardTitle>
            <Shuffle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.8</div>
            <p className="text-xs text-muted-foreground">
              Tasks per travel leg
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Travel Saved</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34 km</div>
            <p className="text-xs text-muted-foreground">This shift</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Batched</CardTitle>
            <Layers className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">Optimization rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+18%</div>
            <p className="text-xs text-muted-foreground">Efficiency gain</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Active Task Queue</CardTitle>
            <CardDescription>
              Smart queue prioritization based on location and priority.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {task.type.toUpperCase()} - {task.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Location: {task.location} | Assigned to: {task.worker}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          task.status === "in-progress"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Optimization Strategy</CardTitle>
            <CardDescription>Current algorithm settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <p className="text-sm font-medium">Mixing Rules</p>
                <p className="text-xs text-muted-foreground">
                  Combine Putaway + Picking in same aisle.
                </p>
              </div>
              <div className="grid gap-2">
                <p className="text-sm font-medium">Max Batch Size</p>
                <p className="text-xs text-muted-foreground">
                  4 tasks per operator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
