"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export default function NewCycleCountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "ADHOC", // SCHEDULED, ADHOC, SPOT
    scheduledDate: new Date().toISOString().split("T")[0],
    warehouseId: "", // Should confirm if multi-warehouse
    categoryId: "ALL", // Specific category or ALL
    locationId: "",
    includeZeroQty: false,
    notes: "",
    assigneeId: "",
  });

  // Mock data for dropdowns
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [employees, setEmployees] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    // In a real app, fetch these from APIs
    setLocations([
        { id: "loc-1", name: "Zone A - High Velocity" },
        { id: "loc-2", name: "Zone B - Bulk Storage" },
        { id: "loc-3", name: "Zone C - Cold Chain" },
    ]);
    setCategories([
        { id: "cat-1", name: "Electronics" },
        { id: "cat-2", name: "Apparel" },
        { id: "cat-3", name: "Perishables" },
    ]);
    setEmployees([
        { id: "emp-1", name: "John Doe" },
        { id: "emp-2", name: "Jane Smith" },
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/cycle-counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create cycle count");

      toast({
        title: "Cycle Count Scheduled",
        description: "The count collection task has been created.",
      });

      router.push("/dashboard/cycle-counts");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule cycle count.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Cycle Count</h1>
          <p className="text-muted-foreground mt-1">
            Configure a new inventory counting session.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Count Configuration</CardTitle>
          <CardDescription>Define the scope and assignment for this count.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <Label>Count Type</Label>
                <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({...formData, type: v})}
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADHOC">Ad-Hoc (Immediate)</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="SPOT">Spot Check (Specific Location)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <div className="relative">
                    <Input 
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category Filter</Label>
                <Select 
                    value={formData.categoryId}
                    onValueChange={(v) => setFormData({...formData, categoryId: v})}
                >
                    <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Categories</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location / Zone</Label>
                <Select 
                     value={formData.locationId}
                     onValueChange={(v) => setFormData({...formData, locationId: v})}
                >
                    <SelectTrigger><SelectValue placeholder="Select location (Optional)" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_NONE_">Entire Warehouse</SelectItem>
                        {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>

             <div className="space-y-2">
                <Label>Assign To</Label>
                <Select 
                     value={formData.assigneeId}
                     onValueChange={(v) => setFormData({...formData, assigneeId: v})}
                >
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                        {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="includeZero" 
                    checked={formData.includeZeroQty}
                    onCheckedChange={(c) => setFormData({...formData, includeZeroQty: c === true})}
                />
                <Label htmlFor="includeZero" className="cursor-pointer">
                    Include products with zero system quantity?
                </Label>
            </div>

            <div className="space-y-2">
                <Label>Notes / Instructions</Label>
                <Textarea 
                    placeholder="Special instructions for counters..." 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Count Session
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
