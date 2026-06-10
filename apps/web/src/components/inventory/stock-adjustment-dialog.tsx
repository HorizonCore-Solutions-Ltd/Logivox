"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Form schema
const adjustmentSchema = z.object({
  movementType: z.enum([
    "PURCHASE",
    "SALE",
    "RETURN",
    "DAMAGE",
    "TRANSFER",
    "ADJUSTMENT",
  ]),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  capaId: z.string().optional(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  currentQuantity: number;
  unit: string;
  onSuccess?: () => void;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  currentQuantity,
  unit,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const { toast } = useToast();

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      movementType: "PURCHASE",
      quantity: 0,
      reference: "",
      notes: "",
      capaId: "",
    },
  });

  // Calculate new quantity preview
  const watchedType = form.watch("movementType");
  const watchedQuantity = form.watch("quantity");

  const newQuantity = React.useMemo(() => {
    const qty = Number(watchedQuantity) || 0;
    const isAddition = ["PURCHASE", "RETURN", "ADJUSTMENT"].includes(
      watchedType,
    );
    return isAddition ? currentQuantity + qty : currentQuantity - qty;
  }, [watchedType, watchedQuantity, currentQuantity]);

  // Adjust mutation
  const adjustMutation = useMutation({
    mutationFn: async (values: AdjustmentFormValues) => {
      const res = await fetch(`/api/inventory/${itemId}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to adjust stock");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock adjusted successfully",
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AdjustmentFormValues) => {
    adjustMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Adjust the stock level for {itemName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Stock Info */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Current Stock</p>
                  <p className="text-2xl font-bold">
                    {currentQuantity} {unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">New Stock</p>
                  <p
                    className={`text-2xl font-bold ${
                      newQuantity < 0
                        ? "text-red-600"
                        : newQuantity > currentQuantity
                          ? "text-green-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {newQuantity} {unit}
                  </p>
                </div>
              </div>
              {newQuantity < 0 && (
                <p className="text-sm text-red-600 mt-2">
                  Warning: This will result in negative stock
                </p>
              )}
            </div>

            {/* Movement Type */}
            <FormField
              control={form.control}
              name="movementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movement Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select movement type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PURCHASE">
                        Purchase (Add Stock)
                      </SelectItem>
                      <SelectItem value="SALE">Sale (Remove Stock)</SelectItem>
                      <SelectItem value="RETURN">Return (Add Stock)</SelectItem>
                      <SelectItem value="DAMAGE">
                        Damage (Remove Stock)
                      </SelectItem>
                      <SelectItem value="TRANSFER">
                        Transfer (Remove Stock)
                      </SelectItem>
                      <SelectItem value="ADJUSTMENT">
                        Adjustment (Add Stock)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {["PURCHASE", "RETURN", "ADJUSTMENT"].includes(watchedType)
                      ? "This will increase the stock level"
                      : "This will decrease the stock level"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of {unit} to{" "}
                    {["PURCHASE", "RETURN", "ADJUSTMENT"].includes(watchedType)
                      ? "add"
                      : "remove"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reference */}
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., PO-12345, SO-67890" {...field} />
                  </FormControl>
                  <FormDescription>
                    Purchase order, sales order, or other reference
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CAPA Link */}
            <FormField
              control={form.control}
              name="capaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked CAPA ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., cm123abc456def" {...field} />
                  </FormControl>
                  <FormDescription>
                    Link this stock movement to an existing CAPA for full
                    cross-module traceability.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={adjustMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending ? "Adjusting..." : "Adjust Stock"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
