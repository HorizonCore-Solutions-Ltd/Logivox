"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Integration {
  id: string;
  name: string;
  code: string;
  description?: string;
  provider: string;
  category: string;
  status: string;
  healthStatus: string;
  isActive: boolean;
  lastSyncAt?: string;
  syncCount: number;
  errorCount: number;
  uptime?: number;
  createdAt: string;
  _count: {
    connections: number;
    syncs: number;
    logs: number;
  };
}

interface Stats {
  total: number;
  active: number;
  healthy: number;
  errors: number;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    healthy: 0,
    errors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: "",
    status: "",
    healthStatus: "",
    search: "",
  });

  useEffect(() => {
    fetchIntegrations();
  }, [filter]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.category) params.append("category", filter.category);
      if (filter.status) params.append("status", filter.status);
      if (filter.healthStatus)
        params.append("healthStatus", filter.healthStatus);
      if (filter.search) params.append("search", filter.search);

      const response = await fetch(`/api/integrations?${params}`);
      if (!response.ok) throw new Error("Failed to fetch integrations");

      const data = await response.json();
      setIntegrations(data);

      // Calculate stats
      setStats({
        total: data.length,
        active: data.filter((i: Integration) => i.status === "ACTIVE").length,
        healthy: data.filter((i: Integration) => i.healthStatus === "HEALTHY")
          .length,
        errors: data.filter((i: Integration) => i.status === "ERROR").length,
      });
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      QUICKBOOKS_ONLINE: "💼",
      SHOPIFY: "🛍️",
      STRIPE: "💳",
      FEDEX: "📦",
      SALESFORCE: "☁️",
      TWILIO: "📱",
      SENDGRID: "📧",
    };
    return icons[provider] || "🔌";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ACCOUNTING: "bg-blue-100 text-blue-800",
      ECOMMERCE: "bg-purple-100 text-purple-800",
      SHIPPING: "bg-orange-100 text-orange-800",
      PAYMENT: "bg-green-100 text-green-800",
      CRM: "bg-indigo-100 text-indigo-800",
      COMMUNICATION: "bg-pink-100 text-pink-800",
      CUSTOM: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      ERROR: "bg-red-100 text-red-800",
      CONFIGURING: "bg-yellow-100 text-yellow-800",
      TESTING: "bg-blue-100 text-blue-800",
      PAUSED: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getHealthColor = (health: string) => {
    const colors: Record<string, string> = {
      HEALTHY: "text-green-600",
      DEGRADED: "text-yellow-600",
      UNHEALTHY: "text-red-600",
      UNKNOWN: "text-gray-600",
    };
    return colors[health] || "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔌 External Integrations
          </h1>
          <p className="text-gray-600">
            Connect your WMS with external systems like QuickBooks, Shopify, and
            shipping carriers
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Integrations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="text-3xl">🔌</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Healthy</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.healthy}
                </p>
              </div>
              <div className="text-3xl">💚</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.errors}
                </p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search integrations..."
                value={filter.search}
                onChange={(e) =>
                  setFilter({ ...filter, search: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filter.category}
                onChange={(e) =>
                  setFilter({ ...filter, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="ACCOUNTING">Accounting</option>
                <option value="ECOMMERCE">E-commerce</option>
                <option value="SHIPPING">Shipping</option>
                <option value="PAYMENT">Payment</option>
                <option value="CRM">CRM</option>
                <option value="COMMUNICATION">Communication</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filter.status}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ERROR">Error</option>
                <option value="CONFIGURING">Configuring</option>
                <option value="TESTING">Testing</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Health
              </label>
              <select
                value={filter.healthStatus}
                onChange={(e) =>
                  setFilter({ ...filter, healthStatus: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Health</option>
                <option value="HEALTHY">Healthy</option>
                <option value="DEGRADED">Degraded</option>
                <option value="UNHEALTHY">Unhealthy</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => router.push("/integrations/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              ➕ Add Integration
            </button>
          </div>
        </div>

        {/* Integrations List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">Loading integrations...</div>
          </div>
        ) : integrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-5xl mb-4">🔌</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No integrations found
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first integration
            </p>
            <button
              onClick={() => router.push("/integrations/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Integration
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                onClick={() => router.push(`/integrations/${integration.id}`)}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">
                      {getProviderIcon(integration.provider)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {integration.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {integration.code}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-2xl ${getHealthColor(integration.healthStatus)}`}
                  >
                    {integration.healthStatus === "HEALTHY" && "💚"}
                    {integration.healthStatus === "DEGRADED" && "💛"}
                    {integration.healthStatus === "UNHEALTHY" && "❤️"}
                    {integration.healthStatus === "UNKNOWN" && "❓"}
                  </div>
                </div>

                {/* Description */}
                {integration.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {integration.description}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(integration.category)}`}
                  >
                    {integration.category}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(integration.status)}`}
                  >
                    {integration.status}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Connections</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {integration._count.connections}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Syncs</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {integration._count.syncs}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Errors</p>
                    <p
                      className={`text-sm font-semibold ${integration.errorCount > 0 ? "text-red-600" : "text-gray-900"}`}
                    >
                      {integration.errorCount}
                    </p>
                  </div>
                </div>

                {/* Uptime */}
                {integration.uptime !== null &&
                  integration.uptime !== undefined && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uptime</span>
                        <span>{integration.uptime}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            integration.uptime >= 99
                              ? "bg-green-500"
                              : integration.uptime >= 95
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${integration.uptime}%` }}
                        />
                      </div>
                    </div>
                  )}

                {/* Last Sync */}
                {integration.lastSyncAt && (
                  <div className="mt-3 text-xs text-gray-500">
                    Last synced:{" "}
                    {new Date(integration.lastSyncAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
