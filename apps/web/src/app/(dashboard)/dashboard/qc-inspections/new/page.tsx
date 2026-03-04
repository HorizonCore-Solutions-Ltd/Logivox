"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewQCInspectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "INBOUND", // INBOUND, FAI (First Article), RANDOM, RETURN
    status: "SCHEDULED",
    priority: "NORMAL",
    referenceType: "PURCHASE_ORDER", // PURCHASE_ORDER, HELD_ITEM
    referenceId: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real implementation, we would validate referenceId against actual POs or Inventory Items
      const res = await fetch("/api/qc/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          warehouseId: "default-warehouse", // Should come from context
        }),
      });

      if (!res.ok) throw new Error("Failed to create inspection");

      toast({
        title: "Inspection Scheduled",
        description: "New QC inspection has been created successfully.",
      });

      router.push("/dashboard/qc-inspections");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create inspection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            New QC Inspection
          </h1>
          <p className="text-muted-foreground mt-1">
            Schedule a quality control check for inbound or inventory items.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inspection Details</CardTitle>
          <CardDescription>
            Configure the parameters for the quality inspection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type">Inspection Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INBOUND">Inbound (GRN)</SelectItem>
                    <SelectItem value="FAI">
                      First Article Inspection
                    </SelectItem>
                    <SelectItem value="RANDOM">Random Sampling</SelectItem>
                    <SelectItem value="RETURN">Return (RMA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceType">Reference Type</Label>
                <Select
                  value={formData.referenceType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, referenceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PURCHASE_ORDER">
                      Purchase Order
                    </SelectItem>
                    <SelectItem value="HELD_ITEM">
                      Held Inventory Item
                    </SelectItem>
                    <SelectItem value="PRODUCTION_ORDER">
                      Production Order
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceId">Reference ID / Number</Label>
                <Input
                  id="referenceId"
                  placeholder="e.g. PO-2024-001"
                  value={formData.referenceId}
                  onChange={(e) =>
                    setFormData({ ...formData, referenceId: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule Inspection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
