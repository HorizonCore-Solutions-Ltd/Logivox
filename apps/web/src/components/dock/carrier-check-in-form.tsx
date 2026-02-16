/**
 * Carrier Check-In Form
 * Quick check-in interface for dock appointments
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Clock, MapPin } from "lucide-react";

const checkInSchema = z.object({
  carrierName: z.string().optional(),
  driverName: z.string().optional(),
  vehicleNumber: z.string().optional(),
});

type CheckInFormData = z.infer<typeof checkInSchema>;

interface CarrierCheckInFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    appointmentNumber: string;
    appointmentType: string;
    scheduledStart: string;
    scheduledEnd: string;
    carrierName?: string | null;
    driverName?: string | null;
    yardLocation?: {
      locationName: string;
      locationCode: string;
    } | null;
  } | null;
  onSuccess?: () => void;
}

export function CarrierCheckInForm({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: CarrierCheckInFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      carrierName: appointment?.carrierName || "",
      driverName: appointment?.driverName || "",
    },
  });

  const onSubmit = async (data: CheckInFormData) => {
    if (!appointment) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/dock/appointments/${appointment.id}/check-in`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to check in");
      }

      toast.success(
        `Checked in appointment ${appointment.appointmentNumber} successfully`,
      );
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error checking in:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to check in",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appointment) return null;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Carrier Check-In</DialogTitle>
          <DialogDescription>
            Check in for appointment {appointment.appointmentNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Appointment Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Appointment Type
              </span>
              <Badge>{appointment.appointmentType}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                {formatTime(appointment.scheduledStart)} -{" "}
                {formatTime(appointment.scheduledEnd)}
              </span>
            </div>
            {appointment.yardLocation && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  {appointment.yardLocation.locationName} (
                  {appointment.yardLocation.locationCode})
                </span>
              </div>
            )}
          </div>

          {/* Check-In Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carrierName">Carrier Name</Label>
              <Input
                id="carrierName"
                {...register("carrierName")}
                placeholder="Enter carrier name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name</Label>
              <Input
                id="driverName"
                {...register("driverName")}
                placeholder="Enter driver name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle/Plate Number</Label>
              <Input
                id="vehicleNumber"
                {...register("vehicleNumber")}
                placeholder="Enter vehicle or plate number"
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
                <CheckCircle className="mr-2 h-4 w-4" />
                {isSubmitting ? "Checking In..." : "Check In"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
