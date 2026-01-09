/**
 * Dock Appointment Booking Form
 * Create and schedule new dock appointments
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

const appointmentSchema = z.object({
  appointmentType: z.enum(["INBOUND", "OUTBOUND", "CROSS_DOCK", "RETURN"]),
  yardLocationId: z.string().min(1, "Dock location is required"),
  carrierName: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehiclePlate: z.string().optional(),
  trailerNumber: z.string().optional(),
  scheduledStart: z.string().min(1, "Start time is required"),
  scheduledEnd: z.string().min(1, "End time is required"),
  expectedDuration: z.number().min(15).max(480),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentBookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  dockLocations?: Array<{
    id: string;
    locationName: string;
    locationCode: string;
  }>;
}

export function AppointmentBookingForm({
  open,
  onOpenChange,
  onSuccess,
  dockLocations = [],
}: AppointmentBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      expectedDuration: 60,
    },
  });

  const scheduledStart = watch("scheduledStart");

  // Auto-calculate end time based on start time and duration
  const updateEndTime = (start: string, duration: number) => {
    if (start && duration) {
      const startDate = new Date(start);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      setValue(
        "scheduledEnd",
        endDate.toISOString().slice(0, 16)
      );
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/dock/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create appointment");
      }

      const result = await response.json();
      toast.success(
        `Appointment ${result.appointment.appointmentNumber} created successfully`
      );
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create appointment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Dock Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new dock appointment for inbound or outbound shipments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Appointment Type */}
          <div className="space-y-2">
            <Label htmlFor="appointmentType">Appointment Type *</Label>
            <Select
              onValueChange={(value) =>
                setValue("appointmentType", value as any)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INBOUND">Inbound Delivery</SelectItem>
                <SelectItem value="OUTBOUND">Outbound Shipment</SelectItem>
                <SelectItem value="CROSS_DOCK">Cross-Dock</SelectItem>
                <SelectItem value="RETURN">Return</SelectItem>
              </SelectContent>
            </Select>
            {errors.appointmentType && (
              <p className="text-sm text-red-500">
                {errors.appointmentType.message}
              </p>
            )}
          </div>

          {/* Dock Location */}
          <div className="space-y-2">
            <Label htmlFor="yardLocationId">Dock Location *</Label>
            <Select
              onValueChange={(value) => setValue("yardLocationId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dock door" />
              </SelectTrigger>
              <SelectContent>
                {dockLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.locationName} ({location.locationCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.yardLocationId && (
              <p className="text-sm text-red-500">
                {errors.yardLocationId.message}
              </p>
            )}
          </div>

          {/* Carrier Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carrierName">Carrier Name</Label>
              <Input
                id="carrierName"
                {...register("carrierName")}
                placeholder="e.g., FedEx, UPS"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trailerNumber">Trailer Number</Label>
              <Input
                id="trailerNumber"
                {...register("trailerNumber")}
                placeholder="e.g., TRL-12345"
              />
            </div>
          </div>

          {/* Driver Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name</Label>
              <Input
                id="driverName"
                {...register("driverName")}
                placeholder="Driver's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverPhone">Driver Phone</Label>
              <Input
                id="driverPhone"
                {...register("driverPhone")}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-2">
            <Label htmlFor="vehiclePlate">Vehicle Plate</Label>
            <Input
              id="vehiclePlate"
              {...register("vehiclePlate")}
              placeholder="e.g., ABC-1234"
            />
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledStart">Start Time *</Label>
              <Input
                id="scheduledStart"
                type="datetime-local"
                {...register("scheduledStart")}
                onChange={(e) => {
                  register("scheduledStart").onChange(e);
                  const duration = watch("expectedDuration");
                  updateEndTime(e.target.value, duration);
                }}
              />
              {errors.scheduledStart && (
                <p className="text-sm text-red-500">
                  {errors.scheduledStart.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedDuration">Duration (minutes) *</Label>
              <Input
                id="expectedDuration"
                type="number"
                {...register("expectedDuration", { valueAsNumber: true })}
                placeholder="60"
                onChange={(e) => {
                  register("expectedDuration").onChange(e);
                  if (scheduledStart) {
                    updateEndTime(scheduledStart, parseInt(e.target.value));
                  }
                }}
              />
              {errors.expectedDuration && (
                <p className="text-sm text-red-500">
                  {errors.expectedDuration.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledEnd">End Time *</Label>
            <Input
              id="scheduledEnd"
              type="datetime-local"
              {...register("scheduledEnd")}
              readOnly
              className="bg-gray-50"
            />
            {errors.scheduledEnd && (
              <p className="text-sm text-red-500">
                {errors.scheduledEnd.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Additional information or special instructions..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
