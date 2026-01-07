"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface TrackingEvent {
  status: string;
  description: string;
  location: string | null;
  timestamp: string;
}

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  carrierCode: string;
  carrierName: string;
  carrierService: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  labelFormat: string | null;
  recipientName: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  weight: number;
  weightUnit: string;
  length: number | null;
  width: number | null;
  height: number | null;
  dimensionUnit: string | null;
  insuranceAmount: number | null;
  signatureRequired: boolean;
  saturdayDelivery: boolean;
  shippingCost: number | null;
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
  shippedDate: Date | null;
  exceptionReason: string | null;
  exceptionDate: Date | null;
  trackingEvents: TrackingEvent[];
  createdAt: Date;
  salesOrder: {
    orderNumber: string;
    status: string;
    customer: {
      name: string;
      email: string | null;
    };
    items: Array<{
      quantityOrdered: number;
      quantityPacked: number;
      inventory: {
        productName: string;
        sku: string;
      };
    }>;
  };
  pack: {
    packNumber: string;
    packages: Array<{
      packageNumber: string;
      weight: number;
      weightUnit: string;
      items: Array<{
        quantity: number;
        salesOrderItem: {
          inventory: {
            productName: string;
            sku: string;
          };
        };
      }>;
    }>;
  } | null;
  createdBy: {
    name: string | null;
    email: string;
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-green-100 text-green-800",
  IN_TRANSIT: "bg-purple-100 text-purple-800",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  EXCEPTION: "bg-red-100 text-red-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  RETURNED: "bg-orange-100 text-orange-800",
};

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    if (shipmentId) {
      fetchShipment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentId]);

  const fetchShipment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shipments/${shipmentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch shipment");
      }

      setShipment(data);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateLabel = async () => {
    try {
      setActionLoading("label");
      const response = await fetch(`/api/shipments/${shipmentId}/label`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate label");
      }

      // Refresh shipment data
      await fetchShipment();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading("");
    }
  };

  const confirmShipment = async () => {
    try {
      setActionLoading("ship");
      const response = await fetch(`/api/shipments/${shipmentId}/ship`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to confirm shipment");
      }

      // Refresh shipment data
      await fetchShipment();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading("");
    }
  };

  const refreshTracking = async () => {
    try {
      setActionLoading("track");
      const response = await fetch(`/api/shipments/${shipmentId}/track`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tracking");
      }

      setShipment(data);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading("");
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading shipment...</div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error || "Shipment not found"}
        </div>
        <Link
          href="/shipments"
          className="text-blue-600 hover:text-blue-700 text-sm mt-4 inline-block"
        >
          ← Back to Shipments
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/shipments"
          className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
        >
          ← Back to Shipments
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {shipment.shipmentNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              Order: {shipment.salesOrder.orderNumber} •{" "}
              {shipment.salesOrder.customer.name}
            </p>
          </div>
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              statusColors[shipment.status]
            }`}
          >
            {shipment.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-3">
        {!shipment.trackingNumber && shipment.status === "PENDING" && (
          <button
            onClick={generateLabel}
            disabled={actionLoading === "label"}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === "label" ? "Generating..." : "Generate Label"}
          </button>
        )}

        {shipment.trackingNumber &&
          shipment.status !== "SHIPPED" &&
          shipment.status !== "IN_TRANSIT" &&
          shipment.status !== "DELIVERED" && (
            <button
              onClick={confirmShipment}
              disabled={actionLoading === "ship"}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading === "ship" ? "Confirming..." : "Confirm Shipment"}
            </button>
          )}

        {shipment.labelUrl && (
          <a
            href={shipment.labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Print Label
          </a>
        )}

        {shipment.trackingNumber && (
          <button
            onClick={refreshTracking}
            disabled={actionLoading === "track"}
            className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {actionLoading === "track" ? "Refreshing..." : "Refresh Tracking"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carrier & Tracking */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Carrier & Tracking
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Carrier</div>
                <div className="font-medium text-gray-900">
                  {shipment.carrierName}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Service</div>
                <div className="font-medium text-gray-900">
                  {shipment.carrierService}
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-sm text-gray-600">Tracking Number</div>
                {shipment.trackingNumber ? (
                  shipment.trackingUrl ? (
                    <a
                      href={shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 font-mono"
                    >
                      {shipment.trackingNumber}
                    </a>
                  ) : (
                    <div className="font-medium text-gray-900 font-mono">
                      {shipment.trackingNumber}
                    </div>
                  )
                ) : (
                  <div className="text-gray-400">Not generated yet</div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-600">Shipping Cost</div>
                <div className="font-medium text-gray-900">
                  {formatCurrency(shipment.shippingCost)}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Insurance</div>
                <div className="font-medium text-gray-900">
                  {formatCurrency(shipment.insuranceAmount)}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Estimated Delivery</div>
                <div className="font-medium text-gray-900">
                  {formatDate(shipment.estimatedDelivery)}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Actual Delivery</div>
                <div className="font-medium text-gray-900">
                  {formatDate(shipment.actualDelivery)}
                </div>
              </div>

              {shipment.signatureRequired && (
                <div className="col-span-2">
                  <div className="text-sm text-amber-600 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Signature Required
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recipient Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recipient Information
            </h2>

            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Name</div>
                <div className="font-medium text-gray-900">
                  {shipment.recipientName}
                </div>
              </div>

              {shipment.recipientEmail && (
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium text-gray-900">
                    {shipment.recipientEmail}
                  </div>
                </div>
              )}

              {shipment.recipientPhone && (
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-medium text-gray-900">
                    {shipment.recipientPhone}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm text-gray-600">Shipping Address</div>
                <div className="font-medium text-gray-900">
                  {shipment.addressLine1}
                  {shipment.addressLine2 && (
                    <>
                      <br />
                      {shipment.addressLine2}
                    </>
                  )}
                  <br />
                  {shipment.city}, {shipment.state} {shipment.postalCode}
                  <br />
                  {shipment.country}
                </div>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Package Details
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Weight</div>
                <div className="font-medium text-gray-900">
                  {shipment.weight} {shipment.weightUnit}
                </div>
              </div>

              {shipment.length && shipment.width && shipment.height && (
                <div>
                  <div className="text-sm text-gray-600">
                    Dimensions (L×W×H)
                  </div>
                  <div className="font-medium text-gray-900">
                    {shipment.length} × {shipment.width} × {shipment.height}{" "}
                    {shipment.dimensionUnit}
                  </div>
                </div>
              )}
            </div>

            {shipment.pack && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Pack Items</div>
                {shipment.pack.packages.map((pkg) => (
                  <div key={pkg.packageNumber} className="mb-2">
                    <div className="text-sm font-medium text-gray-700">
                      {pkg.packageNumber}
                    </div>
                    <ul className="ml-4 text-sm text-gray-600">
                      {pkg.items.map((item, idx) => (
                        <li key={idx}>
                          {item.quantity}×{" "}
                          {item.salesOrderItem.inventory.productName} (
                          {item.salesOrderItem.inventory.sku})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exception Details */}
          {shipment.exceptionReason && (
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Exception
              </h2>
              <div className="text-sm text-red-700">
                {shipment.exceptionReason}
              </div>
              {shipment.exceptionDate && (
                <div className="text-sm text-red-600 mt-1">
                  {formatDate(shipment.exceptionDate)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tracking Timeline */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tracking Timeline
            </h2>

            {shipment.trackingEvents && shipment.trackingEvents.length > 0 ? (
              <div className="space-y-4">
                {shipment.trackingEvents
                  .slice()
                  .reverse()
                  .map((event, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="flex-1 pb-4 border-b border-gray-100 last:border-0">
                        <div className="font-medium text-gray-900 text-sm">
                          {event.description}
                        </div>
                        {event.location && (
                          <div className="text-sm text-gray-600">
                            {event.location}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(new Date(event.timestamp))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No tracking events yet
              </div>
            )}
          </div>

          {/* Order Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Information
            </h2>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Order Number</div>
                <Link
                  href={`/sales-orders/${shipment.salesOrder.orderNumber}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {shipment.salesOrder.orderNumber}
                </Link>
              </div>

              <div>
                <div className="text-sm text-gray-600">Customer</div>
                <div className="font-medium text-gray-900">
                  {shipment.salesOrder.customer.name}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Items</div>
                <ul className="text-sm text-gray-700 space-y-1">
                  {shipment.salesOrder.items.map((item) => (
                    <li key={item.inventory.sku}>
                      {item.quantityPacked}× {item.inventory.productName}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">Created By</div>
                <div className="font-medium text-gray-900">
                  {shipment.createdBy.name || shipment.createdBy.email}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(shipment.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
