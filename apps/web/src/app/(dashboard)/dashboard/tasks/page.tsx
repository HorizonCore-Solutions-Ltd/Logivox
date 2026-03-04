"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  ArrowRight,
  MapPin,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?status=${filter}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const completeTask = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/tasks/${id}/complete`, { method: "POST" });
      if (res.ok) {
        // Remove from list if viewing pending, otherwise just refresh to show completed status
        if (filter !== "COMPLETED") {
          setTasks((prev) => prev.filter((t) => t.id !== id));
        } else {
          fetchTasks();
        }
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Tasks</h1>
          <p className="text-muted-foreground">
            Manage your putaway and replenishment queue.
          </p>
        </div>
        <Button onClick={fetchTasks} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b pb-4 overflow-x-auto">
        <Button
          variant={filter === "PENDING" ? "default" : "ghost"}
          onClick={() => setFilter("PENDING")}
          size="sm"
        >
          Pending
        </Button>
        <Button
          variant={filter === "IN_PROGRESS" ? "default" : "ghost"}
          onClick={() => setFilter("IN_PROGRESS")}
          size="sm"
        >
          In Progress
        </Button>
        <Button
          variant={filter === "COMPLETED" ? "default" : "ghost"}
          onClick={() => setFilter("COMPLETED")}
          size="sm"
        >
          Completed
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">
          No tasks found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border rounded-xl p-4 bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <Badge
                  variant={
                    task.taskType === "PUT"
                      ? "default"
                      : task.taskType === "REPLENISH"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {task.taskType}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  {task.taskNumber}
                </span>
              </div>

              <h3 className="font-semibold mb-1 truncate" title={task.title}>
                {task.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">
                {task.description}
              </p>

              <div className="flex items-center gap-2 text-sm mb-4 bg-muted/50 p-2 rounded justify-between">
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span
                    className="font-medium truncate block max-w-[80px]"
                    title={task.fromLocation?.locationCode}
                  >
                    {task.fromLocation?.locationCode || "Source"}
                  </span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span
                    className="font-medium truncate block max-w-[80px]"
                    title={task.toLocation?.locationCode}
                  >
                    {task.toLocation?.locationCode || "Dest"}
                  </span>
                </div>
              </div>

              {task.status !== "COMPLETED" && (
                <Button
                  className="w-full"
                  onClick={() => completeTask(task.id)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === task.id ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Complete Task
                </Button>
              )}
              {task.status === "COMPLETED" && (
                <div className="w-full p-2 bg-green-50 text-green-700 text-center rounded text-sm font-medium border border-green-200">
                  Completed
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
