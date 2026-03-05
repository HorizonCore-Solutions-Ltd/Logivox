"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewCAPAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Pre-fill from query params if available (e.g. from failed inspection)
  const sourceId = searchParams.get("sourceId");
  const sourceType = searchParams.get("sourceType") || "MANUAL";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("PRODUCT_NONCONFORMANCE");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/capa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create CAPA");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("CAPA record created successfully");
      queryClient.invalidateQueries({ queryKey: ["qc-capas"] });
      router.push("/quality/capa");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      title,
      description,
      category,
      priority,
      dueDate,
      sourceType,
      sourceId,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex items-center space-x-4">
        <Link href="/quality/capa">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            New CAPA Request
          </h1>
          <p className="text-muted-foreground">
            Initiate a Corrective and Preventive Action.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>
              Describe the non-conformance or issue requiring action.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title *</Label>
              <Input
                id="title"
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCT_NONCONFORMANCE">
                      Product Non-Conformance
                    </SelectItem>
                    <SelectItem value="PROCESS_DEVIATION">
                      Process Deviation
                    </SelectItem>
                    <SelectItem value="AUDIT_FINDING">Audit Finding</SelectItem>
                    <SelectItem value="CUSTOMER_COMPLAINT">
                      Customer Complaint
                    </SelectItem>
                    <SelectItem value="SAFETY_INCIDENT">
                      Safety Incident
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what happened, where, and the impact..."
                className="min-h-[120px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Target Resolution Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {sourceId && (
              <div className="p-4 bg-muted/50 rounded text-sm text-muted-foreground">
                Linked from {sourceType} ID:{" "}
                <span className="font-mono">{sourceId}</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Create CAPA
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
