"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SalesOrder {
  id: string;
  orderNumber: string;
  status: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  items: Array<{
    id: string;
    quantityPacked: number;
    inventory: {
      productName: string;
      sku: string;
    };
  }>;
}

interface ShippingRate {
  carrier: string;
  carrierName: string;
  service: string;
  serviceName: string;
  cost: number;
  estimatedDelivery: string;
  available: boolean;
}

export default function CreateShipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sales Orders
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Form state
  const [salesOrderId, setSalesOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Shipping details
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");

  // Package details
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("lb");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [dimensionUnit, setDimensionUnit] = useState("in");

  // Delivery options
  const [insuranceAmount, setInsuranceAmount] = useState("");
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [saturdayDelivery, setSaturdayDelivery] = useState(false);

  // Rate shopping
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  useEffect(() => {
    if (salesOrderId) {
      const order = salesOrders.find((o) => o.id === salesOrderId);
      setSelectedOrder(order || null);

      // Auto-populate recipient info from customer
      if (order) {
        setRecipientName(order.customer.name);
        setRecipientEmail(order.customer.email || "");
        setRecipientPhone(order.customer.phone || "");
        setAddressLine1(order.customer.address || "");
        setCity(order.customer.city || "");
        setState(order.customer.state || "");
        setPostalCode(order.customer.postalCode || "");
        setCountry(order.customer.country || "US");
      }
    }
  }, [salesOrderId, salesOrders]);

  const fetchSalesOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch(
        "/api/sales-orders?status=PACKED&status=PACKING&status=SHIPPING&limit=100",
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sales orders");
      }

      setSalesOrders(data.salesOrders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchRates = async () => {
    if (!salesOrderId || !weight) {
      setError("Please select a sales order and enter package weight");
      return;
    }

    try {
      setLoadingRates(true);
      setError("");

      const body: any = {
        salesOrderId,
        weight: parseFloat(weight),
        weightUnit,
      };

      if (length && width && height) {
        body.dimensions = {
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          unit: dimensionUnit,
        };
      }

      const response = await fetch("/api/shipments/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch rates");
      }

      setRates(data.rates || []);
      setSelectedRate(null); // Reset selection
    } catch (err: any) {
      setError(err.message);
      setRates([]);
    } finally {
      setLoadingRates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRate) {
      setError("Please select a shipping rate");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const body: any = {
        salesOrderId,
        carrierCode: selectedRate.carrier,
        carrierService: selectedRate.service,
        recipientName,
        recipientEmail: recipientEmail || undefined,
        recipientPhone: recipientPhone || undefined,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        state,
        postalCode,
        country,
        weight: parseFloat(weight),
        weightUnit,
      };

      if (length && width && height) {
        body.length = parseFloat(length);
        body.width = parseFloat(width);
        body.height = parseFloat(height);
        body.dimensionUnit = dimensionUnit;
      }

      if (insuranceAmount) {
        body.insuranceAmount = parseFloat(insuranceAmount);
      }

      body.signatureRequired = signatureRequired;
      body.saturdayDelivery = saturdayDelivery;

      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create shipment");
      }

      setSuccess("Shipment created successfully!");
      setTimeout(() => {
        router.push(`/shipments/${data.id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/shipments"
          className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
        >
          ← Back to Shipments
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create Shipment</h1>
        <p className="text-gray-600 mt-1">
          Create a new shipment from a packed sales order
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sales Order Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Sales Order
          </h2>

          {loadingOrders ? (
            <div className="text-gray-500">Loading sales orders...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Order <span className="text-red-500">*</span>
                </label>
                <select
                  value={salesOrderId}
                  onChange={(e) => setSalesOrderId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a sales order...</option>
                  {salesOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customer.name} (
                      {order.items.length} items)
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrder && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700">
                    <strong>Customer:</strong> {selectedOrder.customer.name}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    <strong>Items:</strong>{" "}
                    {selectedOrder.items
                      .map(
                        (item) =>
                          `${item.inventory.productName} (${item.quantityPacked})`,
                      )
                      .join(", ")}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Recipient Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recipient Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State/Province <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Package Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimension Unit
              </label>
              <select
                value={dimensionUnit}
                onChange={(e) => setDimensionUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="in">Inches</option>
                <option value="cm">Centimeters</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Length
              </label>
              <input
                type="number"
                step="0.01"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width
              </label>
              <input
                type="number"
                step="0.01"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height
              </label>
              <input
                type="number"
                step="0.01"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={fetchRates}
            disabled={loadingRates || !salesOrderId || !weight}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingRates ? "Fetching Rates..." : "Get Shipping Rates"}
          </button>
        </div>

        {/* Shipping Rates */}
        {rates.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Shipping Rate
            </h2>

            <div className="space-y-3">
              {rates.map((rate, index) => (
                <div
                  key={index}
                  onClick={() => rate.available && setSelectedRate(rate)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedRate === rate
                      ? "border-blue-500 bg-blue-50"
                      : rate.available
                        ? "border-gray-200 hover:border-gray-300"
                        : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {rate.carrierName} - {rate.serviceName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Estimated Delivery: {rate.estimatedDelivery}
                      </div>
                      {!rate.available && (
                        <div className="text-sm text-red-600 mt-1">
                          Not available for this shipment
                        </div>
                      )}
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      ${rate.cost.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Options */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Delivery Options
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={insuranceAmount}
                onChange={(e) => setInsuranceAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="signatureRequired"
                checked={signatureRequired}
                onChange={(e) => setSignatureRequired(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="signatureRequired"
                className="text-sm font-medium text-gray-700"
              >
                Signature Required
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saturdayDelivery"
                checked={saturdayDelivery}
                onChange={(e) => setSaturdayDelivery(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="saturdayDelivery"
                className="text-sm font-medium text-gray-700"
              >
                Saturday Delivery
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href="/shipments"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !selectedRate}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating..." : "Create Shipment"}
          </button>
        </div>
      </form>
    </div>
  );
}
