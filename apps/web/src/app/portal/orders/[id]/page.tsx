"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  DollarSign,
  Truck,
  FileText,
  ExternalLink,
} from "lucide-react";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    inventory: {
      sku: string;
      name: string;
      description: string | null;
    };
  }>;
  shipments: Array<{
    id: string;
    shipmentNumber: string;
    trackingNumber: string | null;
    status: string;
    shippedDate: string | null;
    deliveredDate: string | null;
    carrier: {
      name: string;
      code: string;
    } | null;
  }>;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingCountry: string | null;
}

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  PICKING: "bg-purple-100 text-purple-800",
  PACKING: "bg-indigo-100 text-indigo-800",
  READY_TO_SHIP: "bg-green-100 text-green-800",
  SHIPPED: "bg-green-100 text-green-800",
  DELIVERED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const orderId = params.id as string;

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(`/api/portal/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        });
        router.push("/portal/orders");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    return `https://www.google.com/search?q=${carrier}+tracking+${trackingNumber}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Order not found</p>
          <Button variant="outline" onClick={() => router.push("/portal/orders")} className="mt-4">
            Back to Orders
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/portal/orders")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order {order.orderNumber}</h1>
            <p className="text-gray-600 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Items */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-gray-600" />
                <CardTitle>Order Items</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between pb-4 border-b last:border-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.inventory.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.inventory.sku}</p>
                      {item.inventory.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.inventory.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Quantity: {item.quantity}</span>
                        <span>•</span>
                        <span>Unit Price: ${item.unitPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900">${item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Shipments */}
          {order.shipments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-gray-600" />
                  <CardTitle>Shipments</CardTitle>
                </div>
                <CardDescription>Track your order shipments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.shipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {shipment.shipmentNumber}
                            </h3>
                            <Badge className={statusColors[shipment.status] || "bg-gray-100 text-gray-800"}>
                              {shipment.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          {shipment.carrier && (
                            <p className="text-sm text-gray-600 mb-2">
                              Carrier: {shipment.carrier.name}
                            </p>
                          )}
                          {shipment.trackingNumber && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">
                                Tracking: {shipment.trackingNumber}
                              </span>
                              <a
                                href={getTrackingUrl(
                                  shipment.carrier?.name || "Carrier",
                                  shipment.trackingNumber
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            {shipment.shippedDate && (
                              <span>
                                Shipped: {new Date(shipment.shippedDate).toLocaleDateString()}
                              </span>
                            )}
                            {shipment.deliveredDate && (
                              <span>
                                Delivered: {new Date(shipment.deliveredDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg">Shipping Address</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 space-y-1">
                {order.shippingAddress && <p>{order.shippingAddress}</p>}
                {order.shippingCity && (
                  <p>
                    {order.shippingCity}
                    {order.shippingCountry && `, ${order.shippingCountry}`}
                  </p>
                )}
                {!order.shippingAddress && !order.shippingCity && (
                  <p className="text-gray-500">No address specified</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg">Order Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                  {order.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-sm">{new Date(order.updatedAt).toLocaleString()}</p>
              </div>
              {order.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                    {order.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg">Order Total</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                ${order.totalAmount.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
