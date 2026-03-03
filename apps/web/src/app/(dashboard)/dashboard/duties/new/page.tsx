"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, ClipboardList, Plus, Trash2 } from "lucide-react";

interface Warehouse {
  id: string;
  name: string;
}

export default function NewDutyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [warehouseId, setWarehouseId] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [slaMinutes, setSlaMinutes] = useState("");
  const [checklistItems, setChecklistItems] = useState<
    { step: string; required: boolean }[]
  >([]);

  useEffect(() => {
    fetch("/api/warehouses")
      .then((r) => r.json())
      .then((d) => setWarehouses(d.warehouses || d.data || []));
  }, []);

  const addChecklistItem = () =>
    setChecklistItems((prev) => [...prev, { step: "", required: false }]);
  const removeChecklistItem = (i: number) =>
    setChecklistItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateChecklistItem = (
    i: number,
    field: "step" | "required",
    value: string | boolean,
  ) => {
    setChecklistItems((prev) => {
      const u = [...prev];
      (u[i] as any)[field] = value;
      return u;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/duties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || undefined,
          category: category || undefined,
          priority: priority || undefined,
          warehouseId: warehouseId || undefined,
          scheduledStart: scheduledStart || undefined,
          scheduledEnd: scheduledEnd || undefined,
          slaMinutes: slaMinutes ? parseInt(slaMinutes) : undefined,
          checklistItems: checklistItems
            .filter((c) => c.step.trim())
            .map(({ step, required }) => ({ step, required })),
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      const data = await res.json();
      toast({ title: "Duty created", description: data.duty?.title });
      router.push("/dashboard/duties");
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/duties">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-7 w-7" />
            New Duty
          </h1>
          <p className="text-muted-foreground mt-1">
            Schedule a new warehouse duty or task
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Duty Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Cycle Count — Zone A"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "RECEIVING",
                      "PUTAWAY",
                      "PICKING",
                      "PACKING",
                      "SHIPPING",
                      "CYCLE_COUNT",
                      "CLEANING",
                      "MAINTENANCE",
                      "SAFETY",
                      "OTHER",
                    ].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SLA (minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  value={slaMinutes}
                  onChange={(e) => setSlaMinutes(e.target.value)}
                  placeholder="e.g., 60"
                />
              </div>
              <div className="space-y-2">
                <Label>Scheduled Start</Label>
                <Input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Scheduled End</Label>
                <Input
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about this duty..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Checklist Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addChecklistItem}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Step
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {checklistItems.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No checklist items. Click "Add Step" to add steps for this duty.
              </p>
            )}
            {checklistItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={item.step}
                  onChange={(e) =>
                    updateChecklistItem(i, "step", e.target.value)
                  }
                  placeholder={`Step ${i + 1}...`}
                  className="flex-1"
                />
                <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={item.required}
                    onChange={(e) =>
                      updateChecklistItem(i, "required", e.target.checked)
                    }
                  />
                  Required
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChecklistItem(i)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/duties">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ClipboardList className="h-4 w-4 mr-2" />
            )}
            {saving ? "Creating..." : "Create Duty"}
          </Button>
        </div>
      </form>
    </div>
  );
}
