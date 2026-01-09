/**
 * Customer Portal - Public Load Sheet Tracking
 * Customers can track their shipments in real-time
 */

"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  Camera,
  Download,
  AlertCircle,
} from "lucide-react";

interface TrackingResult {
  loadSheet: {
    id: string;
    loadSheetNumber: string;
    status: string;
    shipmentDate: string;
    actualDepartureTime?: string;
    estimatedArrival?: string;
    carrierName?: string;
    driverName?: string;
    trailerNumber?: string;
    totalContainers: number;
    totalWeight: number;
    totalVolume: number;
    customer: {
      name: string;
    };
    bayDoor?: {
      doorNumber: string;
    };
    containers: Array<{
      id: string;
      containerNumber: string;
      weight: number;
      volume: number;
      status: string;
      containerItems: Array<{
        productName: string;
        quantity: number;
        sku: string;
      }>;
    }>;
    events: Array<{
      eventType: string;
      timestamp: string;
      description: string;
    }>;
  };
}

export default function CustomerPortal() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const trackShipment = async () => {
    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `/api/customer/track?number=${encodeURIComponent(trackingNumber)}`,
      );
      const data = await response.json();

      if (data.loadSheet) {
        setResult(data);
      } else {
        setError("Tracking number not found. Please check and try again.");
      }
    } catch (err) {
      setError("Error tracking shipment. Please try again.");
      console.error("Track error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !result) return;

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("loadSheetId", result.loadSheet.id);

      const response = await fetch("/api/customer/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Photo uploaded successfully!");
      } else {
        alert("Failed to upload photo");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const downloadPOD = async () => {
    if (!result) return;

    try {
      const response = await fetch(
        `/api/customer/download-pod?loadSheetId=${result.loadSheet.id}`,
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `POD-${result.loadSheet.loadSheetNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      alert("Error downloading proof of delivery");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      BUILDING: "bg-blue-100 text-blue-800",
      READY: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-purple-100 text-purple-800",
      DISTRIBUTED: "bg-indigo-100 text-indigo-800",
      DEPARTED: "bg-green-100 text-green-800",
      DELIVERED: "bg-green-600 text-white",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    if (status === "DELIVERED")
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (status === "DEPARTED")
      return <Truck className="w-6 h-6 text-green-600" />;
    if (status === "CONFIRMED")
      return <Package className="w-6 h-6 text-purple-600" />;
    return <Clock className="w-6 h-6 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Track Your Shipment
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Enter your load sheet or tracking number to view real-time
                status
              </p>
            </div>
            <Package className="w-12 h-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter Load Sheet Number (e.g., LS-2026-0001)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && trackShipment()}
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={trackShipment}
              disabled={loading}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Tracking..." : "Track"}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {result.loadSheet.loadSheetNumber}
                  </h2>
                  <p className="text-gray-600">
                    {result.loadSheet.customer.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  {getStatusIcon(result.loadSheet.status)}
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(result.loadSheet.status)}`}
                  >
                    {result.loadSheet.status}
                  </span>
                </div>
              </div>

              {/* Key Info */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {result.loadSheet.totalContainers}
                  </div>
                  <div className="text-sm text-gray-600">Containers</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {(result.loadSheet.totalWeight / 1000).toFixed(1)}t
                  </div>
                  <div className="text-sm text-gray-600">Total Weight</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.loadSheet.totalVolume.toFixed(1)}m³
                  </div>
                  <div className="text-sm text-gray-600">Total Volume</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Shipment Timeline
                </h3>
                <div className="space-y-4">
                  {result.loadSheet.events.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-blue-600 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {event.eventType.replace(/_/g, " ")}
                        </div>
                        <div className="text-sm text-gray-600">
                          {event.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Details */}
              {(result.loadSheet.carrierName ||
                result.loadSheet.driverName) && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Shipping Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {result.loadSheet.carrierName && (
                      <div>
                        <div className="text-sm text-gray-600">Carrier</div>
                        <div className="font-medium text-gray-900">
                          {result.loadSheet.carrierName}
                        </div>
                      </div>
                    )}
                    {result.loadSheet.driverName && (
                      <div>
                        <div className="text-sm text-gray-600">Driver</div>
                        <div className="font-medium text-gray-900">
                          {result.loadSheet.driverName}
                        </div>
                      </div>
                    )}
                    {result.loadSheet.trailerNumber && (
                      <div>
                        <div className="text-sm text-gray-600">Trailer</div>
                        <div className="font-medium text-gray-900">
                          {result.loadSheet.trailerNumber}
                        </div>
                      </div>
                    )}
                    {result.loadSheet.bayDoor && (
                      <div>
                        <div className="text-sm text-gray-600">Bay Door</div>
                        <div className="font-medium text-gray-900">
                          {result.loadSheet.bayDoor.doorNumber}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Important Dates
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">
                      Scheduled Shipment
                    </div>
                    <div className="font-medium text-gray-900">
                      {new Date(result.loadSheet.shipmentDate).toLocaleString()}
                    </div>
                  </div>
                  {result.loadSheet.actualDepartureTime && (
                    <div>
                      <div className="text-sm text-gray-600">
                        Actual Departure
                      </div>
                      <div className="font-medium text-gray-900">
                        {new Date(
                          result.loadSheet.actualDepartureTime,
                        ).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {result.loadSheet.estimatedArrival && (
                    <div>
                      <div className="text-sm text-gray-600">
                        Estimated Arrival
                      </div>
                      <div className="font-medium text-gray-900">
                        {new Date(
                          result.loadSheet.estimatedArrival,
                        ).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-6 mt-6 flex gap-3">
                <button
                  onClick={downloadPOD}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  Download Proof of Delivery
                </button>

                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition">
                  <Camera className="w-4 h-4" />
                  {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Container Details */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Container Details
              </h3>
              <div className="space-y-4">
                {result.loadSheet.containers.map((container) => (
                  <div key={container.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-lg text-gray-900">
                        {container.containerNumber}
                      </h4>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(container.status)}`}
                      >
                        {container.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <span className="text-gray-600">Weight:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {container.weight}kg
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Volume:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {container.volume.toFixed(2)}m³
                        </span>
                      </div>
                    </div>

                    {container.containerItems.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                          Items ({container.containerItems.length}):
                        </div>
                        <div className="space-y-1">
                          {container.containerItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm text-gray-600"
                            >
                              <span>
                                {item.productName} (SKU: {item.sku})
                              </span>
                              <span className="font-medium">
                                Qty: {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
