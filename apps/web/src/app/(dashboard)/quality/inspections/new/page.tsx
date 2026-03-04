"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea"; 
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner"; // Assuming sonner or similar toaster is available, if not I'll just alert or console log

export default function NewInspectionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    templateId: "",
    inventoryId: "",
    quantity: "",
    category: "INCOMING",
    referenceType: "PO",
    referenceId: "",
    notes: ""
  });

  // Fetch Inventory Items
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory-list', 'limit-50'],
    queryFn: async () => {
      const res = await fetch('/api/inventory?limit=50');
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const json = await res.json();
      return json.data || [];
    }
  });

  // Fetch Inspection Templates
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['inspection-templates'],
    queryFn: async () => {
      const res = await fetch('/api/inspection-templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const json = await res.json();
      return json.templates || [];
    }
  });

  // Create Inspection Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/qc/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create inspection');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Inspection Created Successfully");
      queryClient.invalidateQueries({ queryKey: ['qc-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['qc-dashboard'] });
      router.push('/quality/inspections');
    },
    onError: (error: Error) => {
      console.error(error);
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.inventoryId || !formData.quantity) {
      toast.error("Please select an inventory item and enter quantity");
      return;
    }

    createMutation.mutate({
      ...formData,
      quantity: parseInt(formData.quantity)
    });
  };

  const isLoading = isLoadingInventory || isLoadingTemplates;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/quality/inspections"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Inspection</h1>
          <p className="text-muted-foreground">Initiate a quality control check for inbound or existing inventory.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
            <CardDescription>Select the item to inspect and the protocol to follow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* INVENTORY ITEM SELECTION */}
            <div className="space-y-2">
              <Label htmlFor="inventory">Inventory Item <span className="text-red-500">*</span></Label>
              {isLoadingInventory ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin"/> Loading inventory...</div>
              ) : (
                <Select 
                  value={formData.inventoryId} 
                  onValueChange={(val) => setFormData({...formData, inventoryId: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item to inspect..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryData?.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.sku} - {item.name} ({item.quantity} units)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               {/* QUANTITY */}
               <div className="space-y-2">
                 <Label htmlFor="quantity">Quantity to Inspect <span className="text-red-500">*</span></Label>
                 <Input 
                   id="quantity" 
                   type="number" 
                   min="1"
                   placeholder="e.g. 100"
                   value={formData.quantity}
                   onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                   required 
                 />
               </div>
               
               {/* CATEGORY */}
               <div className="space-y-2">
                 <Label htmlFor="category">Inspection Type</Label>
                 <Select 
                    value={formData.category} 
                    onValueChange={(val) => setFormData({...formData, category: val})}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="INCOMING">Incoming Receipt</SelectItem>
                     <SelectItem value="IN_PROCESS">In-Process Check</SelectItem>
                     <SelectItem value="FINAL">Final Outbound</SelectItem>
                     <SelectItem value="RANDOM">Random Audit</SelectItem>
                     <SelectItem value="COMPLAINT">Customer Complaint</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            </div>

            {/* TEMPLATE SELECTION */}
            <div className="space-y-2">
              <Label htmlFor="template">Inspection Protocol / Template</Label>
              {isLoadingTemplates ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin"/> Loading templates...</div>
              ) : (
                <Select 
                  value={formData.templateId} 
                  onValueChange={(val) => setFormData({...formData, templateId: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template (Optional - will use default if empty)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templatesData?.map((tmpl: any) => (
                      <SelectItem key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} ({tmpl.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">If no template is selected, the system default will be applied.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
               {/* REFERENCE TYPE */}
               <div className="space-y-2">
                 <Label htmlFor="refType">Reference Type</Label>
                 <Select 
                    value={formData.referenceType} 
                    onValueChange={(val) => setFormData({...formData, referenceType: val})}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="PO">Purchase Order</SelectItem>
                     <SelectItem value="SO">Sales Order</SelectItem>
                     <SelectItem value="RMA">RMA (Return)</SelectItem>
                     <SelectItem value="WO">Work Order</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               
               {/* REFERENCE ID */}
               <div className="space-y-2 col-span-2">
                 <Label htmlFor="refId">Reference ID</Label>
                 <Input 
                   id="refId" 
                   placeholder="e.g. PO-2024-001"
                   value={formData.referenceId}
                   onChange={(e) => setFormData({...formData, referenceId: e.target.value})}
                 />
               </div>
            </div>

            {/* NOTES */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Instructions</Label>
              <Textarea 
                id="notes" 
                placeholder="Any specific instructions for the inspector..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
             <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
             <Button type="submit" disabled={createMutation.isPending}>
               {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Create Inspection
             </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
