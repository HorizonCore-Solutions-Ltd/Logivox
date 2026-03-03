"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  User,
  Calendar,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  carrierCode: string;
  carrierName: string;
  carrierService: string;
  trackingNumber: string | null;
  shippedDate: string | null;
  estimatedDeliveryDate: string | null;
  deliveredDate: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  weight: number | null;
  weightUnit: string | null;
  signatureRequired: boolean;
  insuranceAmount: number | null;
  notes: string | null;
  trackingEvents: Array<{
    status: string;
    description: string;
    location: string;
    timestamp: string;
  }>;
  salesOrder: {
    id: string;
    soNumber: string;
    status: string;
    customer: {
      name: string;
      email: string | null;
      phone: string | null;
    };
    items: Array<{
      id: string;
      quantity: number;
      quantityShipped: number;
      inventoryItem: { name: string; sku: string };
    }>;
  };
  createdBy: { name: string | null; email: string };
  createdAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Truck }
> = {
  PENDING: {
    label: "Pending",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: Clock,
  },
  LABEL_CREATED: {
    label: "Label Created",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Package,
  },
  PICKED_UP: {
    label: "Picked Up",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    icon: Truck,
  },
  IN_TRANSIT: {
    label: "In Transit",
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    icon: Truck,
  },
  SHIPPED: {
    label: "Shipped",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Truck,
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: CheckCircle,
  },
  EXCEPTION: {
    label: "Exception",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: AlertTriangle,
  },
  RETURNED: {
    label: "Returned",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    icon: AlertTriangle,
  },
};

export default function ShipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    fetchShipment();
  }, [params.id]);

  const fetchShipment = async () => {
    try {
      const res = await fetch(`/api/shipments/${params.id}`);
      if (!res.ok) throw new Error("Shipment not found");
      const data = await res.json();
      setShipment(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load shipment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkShipped = async () => {
    if (!shipment) return;
    setMarking(true);
    try {
      const res = await fetch(`/api/shipments/${shipment.id}/ship`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to mark as shipped");
      }
      toast({
        title: "Shipped!",
        description: "Inventory updated and order marked as shipped.",
      });
      fetchShipment();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setMarking(false);
    }
  };

  const handleTrackingRefresh = async () => {
    if (!shipment) return;
    setTracking(true);
    try {
      const res = await fetch(`/api/shipments/${shipment.id}/track`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Track request failed");
      const data = await res.json();
      if (data.shipment) setShipment(data.shipment);
      toast({
        title: "Tracking Updated",
        description: "Latest carrier status retrieved.",
      });
    } catch {
      toast({
        title: "Note",
        description: "Carrier tracking unavailable — check carrier website.",
        variant: "default",
      });
    } finally {
      setTracking(false);
    }
  };

  const cfg = shipment
    ? (STATUS_CONFIG[shipment.status] ?? STATUS_CONFIG.PENDING)
    : STATUS_CONFIG.PENDING;

  return (
    <>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/shipments")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Shipments
          </Button>
          <Separator orientation="vertical" className="h-6" />
          {loading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <div className="flex items-center gap-3 flex-1">
              <h1 className="text-xl font-bold">{shipment?.shipmentNumber}</h1>
              <Badge className={cfg.color} variant="secondary">
                <cfg.icon className="h-3 w-3 mr-1" />
                {cfg.label}
              </Badge>
            </div>
          )}
          {!loading && shipment && (
            <div className="flex items-center gap-2 ml-auto">
              {shipment.trackingNumber && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTrackingRefresh}
                  disabled={tracking}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${tracking ? "animate-spin" : ""}`}
                  />
                  Refresh Tracking
                </Button>
              )}
              {shipment.trackingNumber && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://www.google.com/search?q=${shipment.carrierCode}+tracking+${shipment.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Track on Carrier
                  </a>
                </Button>
              )}
              {["PENDING", "LABEL_CREATED", "PICKED_UP"].includes(
                shipment.status,
              ) && (
                <Button
                  onClick={handleMarkShipped}
                  disabled={marking || !shipment.trackingNumber}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  {marking ? "Marking..." : "Mark as Shipped"}
                </Button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Skeleton key={n} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : shipment ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" /> Carrier Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Carrier</p>
                    <p className="font-semibold">
                      {shipment.carrierName || shipment.carrierCode}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Service</p>
                    <p className="font-semibold">{shipment.carrierService}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Tracking Number
                    </p>
                    <p className="font-mono font-semibold">
                      {shipment.trackingNumber || "Not yet generated"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="font-semibold">
                      {shipment.weight
                        ? `${shipment.weight} ${shipment.weightUnit || "kg"}`
                        : "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Shipped Date
                    </p>
                    <p className="font-semibold">
                      {shipment.shippedDate
                        ? new Date(shipment.shippedDate).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Est. Delivery
                    </p>
                    <p className="font-semibold">
                      {shipment.estimatedDeliveryDate
                        ? new Date(
                            shipment.estimatedDeliveryDate,
                          ).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  {shipment.signatureRequired && (
                    <div className="col-span-2">
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800"
                      >
                        Signature Required
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" /> Items Shipped
                  </CardTitle>
                  <CardDescription>
                    From Sales Order{" "}
                    <button
                      className="text-primary underline"
                      onClick={() =>
                        router.push(
                          `/dashboard/sales-orders/${shipment.salesOrder.id}`,
                        )
                      }
                    >
                      {shipment.salesOrder.soNumber}
                    </button>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {shipment.salesOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {item.inventoryItem.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.inventoryItem.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {item.quantityShipped || item.quantity} units
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ordered: {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tracking Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> Tracking Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!shipment.trackingEvents ||
                  shipment.trackingEvents.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">No tracking events yet.</p>
                      <p className="text-xs mt-1">
                        Events appear once the carrier scans the package.
                      </p>
                    </div>
                  ) : (
                    <div className="relative space-y-0">
                      {[...shipment.trackingEvents]
                        .reverse()
                        .map((event, idx) => (
                          <div key={idx} className="flex gap-4 pb-6 last:pb-0">
                            <div className="flex flex-col items-center">
                              <div
                                className={`h-3 w-3 rounded-full mt-1 flex-shrink-0 ${idx === 0 ? "bg-primary" : "bg-muted-foreground/30"}`}
                              />
                              {idx < shipment.trackingEvents.length - 1 && (
                                <div className="w-px bg-border flex-1 mt-1" />
                              )}
                            </div>
                            <div className="pb-1">
                              <p className="font-medium text-sm">
                                {event.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {event.location} &bull;{" "}
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Recipient */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Ship To
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">
                      {shipment.recipientName ||
                        shipment.salesOrder.customer.name}
                    </p>
                    {shipment.recipientPhone && (
                      <p className="text-sm text-muted-foreground">
                        {shipment.recipientPhone}
                      </p>
                    )}
                    {shipment.recipientEmail && (
                      <p className="text-sm text-muted-foreground">
                        {shipment.recipientEmail}
                      </p>
                    )}
                  </div>
                  <Separator />
                  <div className="text-sm space-y-0.5">
                    {shipment.addressLine1 && <p>{shipment.addressLine1}</p>}
                    {shipment.addressLine2 && <p>{shipment.addressLine2}</p>}
                    {(shipment.city ||
                      shipment.state ||
                      shipment.postalCode) && (
                      <p>
                        {[shipment.city, shipment.state, shipment.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {shipment.country && <p>{shipment.country}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Sales Order */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold">
                    {shipment.salesOrder.customer.name}
                  </p>
                  {shipment.salesOrder.customer.email && (
                    <p className="text-sm text-muted-foreground">
                      {shipment.salesOrder.customer.email}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() =>
                      router.push(
                        `/dashboard/sales-orders/${shipment.salesOrder.id}`,
                      )
                    }
                  >
                    View Sales Order
                  </Button>
                </CardContent>
              </Card>

              {/* Meta */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>
                      {new Date(shipment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By</span>
                    <span>
                      {shipment.createdBy.name || shipment.createdBy.email}
                    </span>
                  </div>
                  {shipment.shippedDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipped</span>
                      <span>
                        {new Date(shipment.shippedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {shipment.estimatedDeliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Est. Delivery
                      </span>
                      <span>
                        {new Date(
                          shipment.estimatedDeliveryDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {shipment.deliveredDate && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Delivered</span>
                      <span>
                        {new Date(shipment.deliveredDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Shipment not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/dashboard/shipments")}
            >
              Back to Shipments
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
