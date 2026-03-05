"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function CAPADetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [resolutionNotes, setResolutionNotes] = useState("");

  const {
    data: capa,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["capa", id],
    queryFn: async () => {
      const res = await fetch(`/api/capa/${id}`);
      if (!res.ok) throw new Error("Failed to fetch CAPA details");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch(`/api/capa/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update CAPA");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capa", id] });
      toast.success("CAPA updated successfully");
    },
    onError: (err) => {
      toast.error("Failed to update CAPA status");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !capa) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-destructive font-medium">
          Error loading CAPA details
        </p>
        <Link href="/quality/capa">
          <Button variant="outline">Back to List</Button>
        </Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({ status: newStatus });
  };

  const statusColors: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    OPEN: "destructive",
    IN_PROGRESS: "secondary",
    RESOLVED: "default",
    CLOSED: "outline",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/quality/capa">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {capa.capaNumber}
              </h1>
              <Badge variant={statusColors[capa.status] || "outline"}>
                {capa.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Created on {new Date(capa.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {capa.status === "OPEN" && (
            <Button onClick={() => handleStatusChange("IN_PROGRESS")}>
              Start Investigation
            </Button>
          )}
          {capa.status === "IN_PROGRESS" && (
            <Button
              onClick={() => handleStatusChange("RESOLVED")}
              variant="default"
            >
              Mark Resolved
            </Button>
          )}
          {capa.status === "RESOLVED" && (
            <Button
              onClick={() => handleStatusChange("CLOSED")}
              variant="outline"
            >
              Close CAPA
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issue Description</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-lg mb-2">{capa.title}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {capa.description}
              </p>
            </CardContent>
            <CardFooter className="bg-muted/50 p-4 text-sm text-muted-foreground flex justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Category:{" "}
                <span className="font-medium text-foreground">
                  {capa.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                Priority: <Badge variant="outline">{capa.priority}</Badge>
              </div>
            </CardFooter>
          </Card>

          {/* Investigation / Resolution Section */}
          <Card>
            <CardHeader>
              <CardTitle>Resolution & Action Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter investigation notes or resolution details..."
                className="min-h-[150px]"
                defaultValue={capa.resolutionNotes || ""}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => updateMutation.mutate({ resolutionNotes })}
                  disabled={updateMutation.isPending}
                >
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Assigned To</div>
                  <div className="text-sm text-muted-foreground">
                    {capa.assignedTo?.name || "Unassigned"}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Due Date</div>
                  <div className="text-sm text-muted-foreground">
                    {capa.dueDate
                      ? new Date(capa.dueDate).toLocaleDateString()
                      : "No due date"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Source Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <span className="text-muted-foreground">Source Type:</span> Use{" "}
                {capa.sourceType}
              </div>
              {capa.sourceId && (
                <div>
                  <span className="text-muted-foreground">ID:</span>{" "}
                  <span className="font-mono">{capa.sourceId}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
