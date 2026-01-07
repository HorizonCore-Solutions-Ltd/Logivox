"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Location {
  id: string;
  locationCode: string;
  name: string;
  type: string;
  barcode: string | null;
  capacity: number | null;
  maxWeight: number | null;
  isActive: boolean;
  isPickable: boolean;
  isPutaway: boolean;
  parent: {
    id: string;
    locationCode: string;
    name: string;
    type: string;
  } | null;
  _count: {
    children: number;
    transfersFrom: number;
    transfersTo: number;
    adjustments: number;
  };
}

interface LocationsResponse {
  locations: Location[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

const locationTypeColors: Record<string, string> = {
  WAREHOUSE: "bg-blue-100 text-blue-800",
  ZONE: "bg-green-100 text-green-800",
  AISLE: "bg-purple-100 text-purple-800",
  RACK: "bg-yellow-100 text-yellow-800",
  SHELF: "bg-pink-100 text-pink-800",
  BIN: "bg-indigo-100 text-indigo-800",
  STAGING: "bg-orange-100 text-orange-800",
  SHIPPING: "bg-teal-100 text-teal-800",
  RECEIVING: "bg-cyan-100 text-cyan-800",
  QUARANTINE: "bg-red-100 text-red-800",
};

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const [typeFilter, setTypeFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, isActiveFilter, debouncedSearch]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (typeFilter) params.append("type", typeFilter);
      if (isActiveFilter) params.append("isActive", isActiveFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await fetch(`/api/locations?${params}`);
      const data: LocationsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch locations");
      }

      setLocations(data.locations);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setTypeFilter(type);
    setPage(1);
  };

  const handleActiveChange = (isActive: string) => {
    setIsActiveFilter(isActive);
    setPage(1);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Warehouse Locations
          </h1>
          <p className="text-gray-600 mt-1">
            Manage bin locations and warehouse hierarchy ({total} total)
          </p>
        </div>
        <button
          onClick={() => router.push("/warehouse/locations/create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Location
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Location code, name, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="WAREHOUSE">Warehouse</option>
              <option value="ZONE">Zone</option>
              <option value="AISLE">Aisle</option>
              <option value="RACK">Rack</option>
              <option value="SHELF">Shelf</option>
              <option value="BIN">Bin</option>
              <option value="STAGING">Staging</option>
              <option value="SHIPPING">Shipping</option>
              <option value="RECEIVING">Receiving</option>
              <option value="QUARANTINE">Quarantine</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={isActiveFilter}
              onChange={(e) => handleActiveChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading locations...
          </div>
        ) : locations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No locations found. Create your first warehouse location to get
            started.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Children
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location) => (
                    <tr
                      key={location.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {location.locationCode}
                        </div>
                        {location.barcode && (
                          <div className="text-xs text-gray-500 font-mono">
                            {location.barcode}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {location.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            locationTypeColors[location.type]
                          }`}
                        >
                          {location.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {location.parent ? (
                          <div className="text-sm text-gray-900">
                            {location.parent.locationCode}
                            <div className="text-xs text-gray-500">
                              {location.parent.type}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {location.capacity ? (
                          <div className="text-sm text-gray-900">
                            {location.capacity} units
                            {location.maxWeight && (
                              <div className="text-xs text-gray-500">
                                {location.maxWeight} kg max
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {location._count.children > 0 ? (
                            <span className="font-medium">
                              {location._count.children}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-xs ${
                              location.isActive
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            {location.isActive ? "✓ Active" : "✗ Inactive"}
                          </span>
                          <div className="flex gap-2 text-xs">
                            {location.isPickable && (
                              <span className="text-blue-600">Pick</span>
                            )}
                            {location.isPutaway && (
                              <span className="text-purple-600">Put</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/warehouse/locations/${location.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, total)} of {total} locations
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
