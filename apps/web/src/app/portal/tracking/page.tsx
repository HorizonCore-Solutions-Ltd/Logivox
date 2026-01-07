"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  TruckIcon,
  CheckCircle2,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";

interface Shipment {
  id: string;
  shipmentNumber: string;
  trackingNumber: string | null;
  carrierName: string | null;
  status: string;
  shippedDate: string | null;
  estimatedDelivery: string | null;
  deliveredDate: string | null;
  salesOrder: {
    soNumber: string;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
  };
}

export default function TrackingPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingSearch, setTrackingSearch] = useState("");

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/portal/shipments");
      if (response.ok) {
        const data = await response.json();
        setShipments(data.shipments || []);
      }
    } catch (error) {
      console.error("Error fetching shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "text-yellow-600 bg-yellow-50",
      PICKED: "text-blue-600 bg-blue-50",
      PACKED: "text-purple-600 bg-purple-50",
      SHIPPED: "text-green-600 bg-green-50",
      IN_TRANSIT: "text-green-600 bg-green-50",
      OUT_FOR_DELIVERY: "text-green-600 bg-green-50",
      DELIVERED: "text-green-700 bg-green-100",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  };

  const getStatusIcon = (status: string) => {
    if (status === "DELIVERED") return CheckCircle2;
    if (
      status === "SHIPPED" ||
      status === "IN_TRANSIT" ||
      status === "OUT_FOR_DELIVERY"
    )
      return TruckIcon;
    return Package;
  };

  const filteredShipments = trackingSearch
    ? shipments.filter(
        (s) =>
          s.trackingNumber
            ?.toLowerCase()
            .includes(trackingSearch.toLowerCase()) ||
          s.shipmentNumber
            .toLowerCase()
            .includes(trackingSearch.toLowerCase()) ||
          s.salesOrder.soNumber
            .toLowerCase()
            .includes(trackingSearch.toLowerCase()),
      )
    : shipments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Track Shipments</h1>
        <p className="text-gray-600 mt-1">
          Monitor your shipments in real-time
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by tracking number, shipment number, or order number..."
              value={trackingSearch}
              onChange={(e) => setTrackingSearch(e.target.value)}
              className="pl-10 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredShipments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {trackingSearch ? "No shipments found" : "No shipments to track"}
            </p>
            <p className="text-sm text-gray-400">
              Your shipments will appear here once orders are processed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredShipments.map((shipment) => {
            const StatusIcon = getStatusIcon(shipment.status);
            return (
              <Card
                key={shipment.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{shipment.shipmentNumber}</span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            shipment.status,
                          )}`}
                        >
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {shipment.status.replace(/_/g, " ")}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Order: {shipment.salesOrder.soNumber}
                      </CardDescription>
                    </div>
                    {shipment.trackingNumber && (
                      <a
                        href={`https://www.google.com/search?q=${shipment.trackingNumber}+tracking`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Track with Carrier
                        </Button>
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tracking Info */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Tracking Number
                        </p>
                        <p className="font-mono font-medium">
                          {shipment.trackingNumber || "Pending"}
                        </p>
                      </div>
                      {shipment.carrierName && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Carrier</p>
                          <p className="font-medium">{shipment.carrierName}</p>
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="space-y-3">
                      {shipment.shippedDate && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1 flex items-center">
                            <TruckIcon className="h-4 w-4 mr-1" />
                            Shipped
                          </p>
                          <p className="font-medium">
                            {new Date(
                              shipment.shippedDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {shipment.estimatedDelivery && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Estimated Delivery
                          </p>
                          <p className="font-medium">
                            {new Date(
                              shipment.estimatedDelivery,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {shipment.deliveredDate && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1 flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Delivered
                          </p>
                          <p className="font-medium text-green-600">
                            {new Date(
                              shipment.deliveredDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Delivery Address
                      </p>
                      <div className="text-sm">
                        <p className="font-medium">
                          {shipment.salesOrder.shippingAddress}
                        </p>
                        <p className="text-gray-600">
                          {shipment.salesOrder.shippingCity}
                          {shipment.salesOrder.shippingState &&
                            `, ${shipment.salesOrder.shippingState}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
