"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Plus,
  Trash,
  Save,
  ArrowLeft,
  Loader2,
  GripVertical,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

interface Checkpoint {
  id: string;
  label: string;
  type: "BOOLEAN" | "NUMERIC" | "TEXT" | "OPTION" | "PHOTO";
  required: boolean;
  options?: string[]; // For OPTION type
}

export default function NewTemplatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("INCOMING");
  const [samplingType, setSamplingType] = useState("FULL");
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([
    { id: "1", label: "Visual Inspection", type: "BOOLEAN", required: true },
  ]);

  const addCheckpoint = () => {
    setCheckpoints([
      ...checkpoints,
      {
        id: crypto.randomUUID(),
        label: "",
        type: "BOOLEAN",
        required: true,
      },
    ]);
  };

  const removeCheckpoint = (id: string) => {
    setCheckpoints(checkpoints.filter((cp) => cp.id !== id));
  };

  const updateCheckpoint = (id: string, updates: Partial<Checkpoint>) => {
    setCheckpoints(
      checkpoints.map((cp) => (cp.id === id ? { ...cp, ...updates } : cp)),
    );
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/qc/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create template");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Template created successfully");
      queryClient.invalidateQueries({ queryKey: ["qc-templates"] });
      router.push("/quality/templates");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || checkpoints.length === 0) {
      toast.error(
        "Please fill in all required fields and add at least one checkpoint",
      );
      return;
    }

    // Validate checkpoints have labels
    if (checkpoints.some((cp) => !cp.label.trim())) {
      toast.error("All checkpoints must have a label");
      return;
    }

    createMutation.mutate({
      name,
      code,
      description,
      category,
      samplingType,
      checkpoints,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center space-x-4">
        <Link href="/quality/templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create QC Template
          </h1>
          <p className="text-muted-foreground">
            Define a standard set of checks for inspections.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>
              Basic information about this inspection template.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Standard Incoming Electronics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Template Code *</Label>
              <Input
                id="code"
                placeholder="e.g. QC-ELEC-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOMING">Incoming</SelectItem>
                  <SelectItem value="IN_PROCESS">In-Process</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                  <SelectItem value="OUTGOING">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sampling">Sampling Type</Label>
              <Select value={samplingType} onValueChange={setSamplingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sampling type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL">100% Inspection</SelectItem>
                  <SelectItem value="AQL_LEVEL_I">Level I (Reduced)</SelectItem>
                  <SelectItem value="AQL_LEVEL_II">
                    Level II (Normal)
                  </SelectItem>
                  <SelectItem value="AQL_LEVEL_III">
                    Level III (Tightened)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe when to use this template..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Checkpoints</CardTitle>
              <CardDescription>
                Add the criteria to be checked during inspection.
              </CardDescription>
            </div>
            <Button
              type="button"
              onClick={addCheckpoint}
              variant="outline"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Checkpoint
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkpoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No checkpoints added. Click "Add Checkpoint" to start.
              </div>
            ) : (
              checkpoints.map((cp, index) => (
                <div
                  key={cp.id}
                  className="flex gap-4 items-start p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors group relative"
                >
                  <div className="mt-3 text-muted-foreground cursor-move">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
                      <div className="space-y-2">
                        <Label>Check Label</Label>
                        <Input
                          value={cp.label}
                          onChange={(e) =>
                            updateCheckpoint(cp.id, { label: e.target.value })
                          }
                          placeholder="e.g. Check for scratches"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Result Type</Label>
                        <Select
                          value={cp.type}
                          onValueChange={(val: any) =>
                            updateCheckpoint(cp.id, { type: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BOOLEAN">Pass / Fail</SelectItem>
                            <SelectItem value="NUMERIC">
                              Numeric Measurement
                            </SelectItem>
                            <SelectItem value="TEXT">
                              Text Observation
                            </SelectItem>
                            <SelectItem value="OPTION">
                              Multiple Choice (TODO)
                            </SelectItem>
                            <SelectItem value="PHOTO">
                              Photo Required
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive mt-8"
                    onClick={() => removeCheckpoint(cp.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="justify-end border-t pt-6 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/quality/templates")}
              className="mr-4"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
