"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface BookingDetailPageProps {
  params: {
    id: string;
  };
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch booking details
  const { data: booking, isLoading } = useQuery({
    queryKey: ["bookings", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch booking");
      return res.json();
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", params.id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <>
        <div className="p-6">
          <div className="h-8 w-48 animate-pulse bg-muted rounded mb-6" />
          <div className="space-y-4">
            <div className="h-64 animate-pulse bg-muted rounded" />
            <div className="h-64 animate-pulse bg-muted rounded" />
          </div>
        </div>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <div className="p-6">
          <p>Booking not found</p>
        </div>
      </>
    );
  }

  const getStatusBadge = (status: string) => {
    const config = {
      FULFILLED: {
        variant: "success" as const,
        icon: CheckCircle2,
        color: "text-green-600",
      },
      CONFIRMED: {
        variant: "default" as const,
        icon: CheckCircle2,
        color: "text-blue-600",
      },
      PENDING: {
        variant: "warning" as const,
        icon: Clock,
        color: "text-yellow-600",
      },
      CANCELLED: {
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-red-600",
      },
    };

    const {
      variant,
      icon: Icon,
      color,
    } = config[status as keyof typeof config] || config.PENDING;

    return (
      <Badge variant={variant as any} className="flex items-center w-fit">
        <Icon className={`h-3 w-3 mr-1 ${color}`} />
        {status}
      </Badge>
    );
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/bookings")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Booking #{booking.id.slice(0, 8)}
              </h1>
              <p className="text-muted-foreground">
                Created on {new Date(booking.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(booking.status)}
          </div>
        </div>

        {/* Status Actions */}
        {booking.status !== "CANCELLED" && booking.status !== "FULFILLED" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex space-x-2">
              {booking.status === "PENDING" && (
                <Button
                  onClick={() => updateStatusMutation.mutate("CONFIRMED")}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Booking
                </Button>
              )}
              {booking.status === "CONFIRMED" && (
                <Button
                  onClick={() => updateStatusMutation.mutate("FULFILLED")}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Fulfilled
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => updateStatusMutation.mutate("CANCELLED")}
                disabled={updateStatusMutation.isPending}
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancel Booking
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Details about the customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Name
                </p>
                <p className="text-lg font-semibold">{booking.customer.name}</p>
              </div>
              {booking.customer.email && (
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.customer.email}</span>
                </div>
              )}
              {booking.customer.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.customer.phone}</span>
                </div>
              )}
              {booking.customer.address && (
                <div className="flex items-start space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{booking.customer.address}</span>
                </div>
              )}
              <div>
                <Badge variant="outline">{booking.customer.type}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>Order information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Booking Date:</span>
                </div>
                <span className="text-sm">
                  {new Date(booking.bookingDate).toLocaleDateString()}
                </span>
              </div>
              {booking.deliveryDate && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Delivery Date:</span>
                  </div>
                  <span className="text-sm">
                    {new Date(booking.deliveryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Total Items:</span>
                </div>
                <span className="text-sm">{booking.items.length}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">Total Amount:</span>
                </div>
                <span className="text-2xl font-bold">
                  ${Number(booking.totalAmount).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Items</CardTitle>
            <CardDescription>Products included in this booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Item</th>
                    <th className="text-left py-3 px-4 font-medium">SKU</th>
                    <th className="text-right py-3 px-4 font-medium">
                      Quantity
                    </th>
                    <th className="text-right py-3 px-4 font-medium">
                      Unit Price
                    </th>
                    <th className="text-right py-3 px-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.items.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {item.inventoryItem.name}
                          </p>
                          {item.inventoryItem.warehouse && (
                            <p className="text-xs text-muted-foreground">
                              {item.inventoryItem.warehouse.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">
                        {item.inventoryItem.sku}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.quantity} {item.inventoryItem.unit}
                      </td>
                      <td className="py-3 px-4 text-right">
                        ${Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ${Number(item.totalPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {booking.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm">{booking.notes}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
