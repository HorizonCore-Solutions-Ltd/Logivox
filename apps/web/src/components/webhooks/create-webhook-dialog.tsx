"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Globe, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const webhookSchema = z.object({
  url: z.string().url("Invalid URL"),
  description: z.string().optional(),
  secret: z.string().optional(),
  events: z.array(z.string()).min(1, "Select at least one event"),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const availableEvents = [
  { value: "inventory.created", label: "Inventory Created" },
  { value: "inventory.updated", label: "Inventory Updated" },
  { value: "inventory.deleted", label: "Inventory Deleted" },
  { value: "inventory.low_stock", label: "Low Stock Alert" },
  { value: "booking.created", label: "Booking Created" },
  { value: "booking.updated", label: "Booking Updated" },
  { value: "booking.fulfilled", label: "Booking Fulfilled" },
  { value: "booking.cancelled", label: "Booking Cancelled" },
  { value: "customer.created", label: "Customer Created" },
  { value: "customer.updated", label: "Customer Updated" },
];

export function CreateWebhookDialog({
  open,
  onOpenChange,
}: CreateWebhookDialogProps) {
  const queryClient = useQueryClient();
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      url: "",
      description: "",
      secret: "",
      events: [],
    },
  });

  React.useEffect(() => {
    setValue("events", selectedEvents);
  }, [selectedEvents, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: WebhookFormData) => {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create webhook");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook created successfully");
      reset();
      setSelectedEvents([]);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: WebhookFormData) => {
    createMutation.mutate(data);
  };

  const toggleEvent = (eventValue: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventValue)
        ? prev.filter((e) => e !== eventValue)
        : [...prev, eventValue],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Configure a webhook endpoint to receive real-time event
            notifications
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Endpoint URL</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="url"
                type="url"
                placeholder="https://api.example.com/webhooks"
                className="pl-9"
                {...register("url")}
              />
            </div>
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Production API webhook"
              rows={2}
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret">Webhook Secret (Optional)</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="secret"
                type="password"
                placeholder="Used to sign webhook payloads"
                className="pl-9"
                {...register("secret")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              If provided, we'll sign requests with HMAC SHA-256
            </p>
          </div>

          <div className="space-y-2">
            <Label>Event Subscriptions</Label>
            <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
              {availableEvents.map((event) => (
                <div key={event.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={event.value}
                    checked={selectedEvents.includes(event.value)}
                    onCheckedChange={() => toggleEvent(event.value)}
                  />
                  <label
                    htmlFor={event.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {event.label}
                  </label>
                </div>
              ))}
            </div>
            {errors.events && (
              <p className="text-sm text-destructive">
                {errors.events.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Selected {selectedEvents.length} event
              {selectedEvents.length !== 1 ? "s" : ""}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Webhook"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
