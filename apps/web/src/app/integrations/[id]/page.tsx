"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

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
  syncDirection: string;
  syncFrequency: string;
  autoSync: boolean;
  lastSyncAt?: string;
  lastSuccessfulSyncAt?: string;
  lastErrorAt?: string;
  lastError?: string;
  syncCount: number;
  errorCount: number;
  uptime?: number;
  version?: string;
  apiVersion?: string;
  createdAt: string;
  connections: any[];
  syncs: any[];
  mappings: any[];
  webhooks: any[];
  _count: {
    connections: number;
    syncs: number;
    logs: number;
  };
}

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string>("");
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const deliveryPageSize = 20;
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchIntegration();
      fetchWebhooks();
    }
  }, [params.id]);

  const fetchIntegration = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/integrations/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch integration");
      const data = await response.json();
      setIntegration(data);
    } catch (error) {
      console.error("Error fetching integration:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhooks = async (webhookId?: string, page = deliveryPage) => {
    try {
      const paramsSearch = new URLSearchParams({ integrationId: params.id as string });
      if (webhookId) {
        paramsSearch.set("webhookId", webhookId);
        paramsSearch.set("includeDeliveries", "true");
        paramsSearch.set("page", String(page));
        paramsSearch.set("pageSize", String(deliveryPageSize));
      }

      const response = await fetch(`/api/integrations/webhooks?${paramsSearch.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch webhooks");

      setWebhooks(data.webhooks || []);
      if (webhookId && data.deliveries) {
        setDeliveries(data.deliveries);
        setDeliveryPage(data.deliveriesPage || page);
        setDeliveryTotal(data.deliveriesTotal || 0);
      } else {
        setDeliveries([]);
        setDeliveryPage(1);
        setDeliveryTotal(0);
      }

      if (!selectedWebhookId && (data.webhooks?.length || 0) > 0) {
        setSelectedWebhookId(data.webhooks[0].id);
      }
    } catch (error) {
      console.error("Error fetching webhooks", error);
    }
  };

  const handleSync = async () => {
    try {
      const response = await fetch("/api/integrations/syncs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: params.id,
          syncType: "CUSTOM",
          direction: integration?.syncDirection || "BIDIRECTIONAL",
          entityType: "ALL",
          mode: "INCREMENTAL",
        }),
      });

      if (!response.ok) throw new Error("Failed to start sync");

      alert("Sync started successfully!");
      fetchIntegration();
    } catch (error) {
      console.error("Error starting sync:", error);
      alert("Failed to start sync");
    }
  };

  const handleTestConnection = async () => {
    if (!selectedWebhookId) {
      alert("Select a webhook to test.");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch("/api/integrations/webhooks?action=test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId: selectedWebhookId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Test failed");
      }

      alert(
        result.message ||
          `Webhook test ${result.success ? "succeeded" : "failed"} (status ${result.status})`,
      );

      await fetchWebhooks(selectedWebhookId);
    } catch (error: any) {
      alert(error.message || "Failed to test connection");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">Loading integration...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Integration not found
            </h3>
            <button
              onClick={() => router.push("/integrations")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Integrations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/integrations")}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {integration.name}
              </h1>
              <p className="text-gray-600">{integration.code}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleTestConnection}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              🔍 Test Connection
            </button>
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              🔄 Sync Now
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <p
              className={`text-xl font-bold ${
                integration.status === "ACTIVE"
                  ? "text-green-600"
                  : integration.status === "ERROR"
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {integration.status}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Health</p>
            <p
              className={`text-xl font-bold ${
                integration.healthStatus === "HEALTHY"
                  ? "text-green-600"
                  : integration.healthStatus === "DEGRADED"
                    ? "text-yellow-600"
                    : integration.healthStatus === "UNHEALTHY"
                      ? "text-red-600"
                      : "text-gray-600"
              }`}
            >
              {integration.healthStatus}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Syncs</p>
            <p className="text-xl font-bold text-gray-900">
              {integration.syncCount}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Uptime</p>
            <p className="text-xl font-bold text-gray-900">
              {integration.uptime ? `${integration.uptime}%` : "N/A"}
            </p>
          </div>
        </div>

        {/* Webhook Deliveries */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Webhook Deliveries</h3>
              <p className="text-sm text-gray-600">Latest attempts for the selected webhook</p>
            </div>
            <button
              onClick={() => fetchWebhooks(selectedWebhookId, deliveryPage)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          {selectedWebhookId === "" && (
            <div className="text-sm text-gray-600">Select a webhook to view deliveries.</div>
          )}

          {selectedWebhookId !== "" && deliveries.length === 0 && (
            <div className="text-sm text-gray-600">No deliveries recorded yet.</div>
          )}

          {selectedWebhookId !== "" && deliveries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-700">
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Duration</th>
                    <th className="py-2 pr-4">Response</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 text-gray-700">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className={`py-2 pr-4 ${d.success ? "text-green-600" : "text-red-600"}`}>
                        {d.success ? "Success" : "Failed"}
                      </td>
                      <td className="py-2 pr-4 text-gray-700">{d.statusCode}</td>
                      <td className="py-2 pr-4 text-gray-700">{d.durationMs} ms</td>
                      <td className="py-2 pr-4 text-gray-700 truncate max-w-xs">
                        {d.responseBody || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
                <span>
                  Page {deliveryPage} · {deliveries.length} of {deliveryTotal} deliveries
                </span>
                <div className="space-x-2">
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => {
                      const nextPage = Math.max(deliveryPage - 1, 1);
                      setDeliveryPage(nextPage);
                      fetchWebhooks(selectedWebhookId, nextPage);
                    }}
                    disabled={deliveryPage <= 1}
                  >
                    Prev
                  </button>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => {
                      const maxPage = Math.max(1, Math.ceil(deliveryTotal / deliveryPageSize));
                      const nextPage = Math.min(deliveryPage + 1, maxPage);
                      setDeliveryPage(nextPage);
                      fetchWebhooks(selectedWebhookId, nextPage);
                    }}
                    disabled={deliveryPage * deliveryPageSize >= deliveryTotal}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: "overview", label: "📊 Overview" },
                {
                  id: "connections",
                  label: "🔗 Connections",
                  count: integration._count.connections,
                },
                {
                  id: "syncs",
                  label: "🔄 Syncs",
                  count: integration._count.syncs,
                },
                {
                  id: "mappings",
                  label: "🗺️ Mappings",
                  count: integration.mappings?.length || 0,
                },
                {
                  id: "logs",
                  label: "📝 Logs",
                  count: integration._count.logs,
                },
                {
                  id: "webhooks",
                  label: "🪝 Webhooks",
                  count: integration.webhooks?.length || 0,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
              <div>
                <label className="block text-xs text-gray-500">Webhook</label>
                <select
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  value={selectedWebhookId}
                  onChange={(e) => {
                    setSelectedWebhookId(e.target.value);
                    setDeliveryPage(1);
                    fetchWebhooks(e.target.value, 1);
                  }}
                >
                  <option value="">Select webhook</option>
                  {webhooks.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name || wh.event} ({wh.url})
                    </option>
                  ))}
                </select>
              </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Provider</p>
                      <p className="text-sm font-medium text-gray-900">
                        {integration.provider}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="text-sm font-medium text-gray-900">
                        {integration.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sync Direction</p>
                      <p className="text-sm font-medium text-gray-900">
                        {integration.syncDirection}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sync Frequency</p>
                      <p className="text-sm font-medium text-gray-900">
                        {integration.syncFrequency}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Auto Sync</p>
                      <p className="text-sm font-medium text-gray-900">
                        {integration.autoSync ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">API Version</p>
                      <p className="text-sm font-medium text-gray-900">
                        {integration.apiVersion || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {integration.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700">{integration.description}</p>
                  </div>
                )}

                {integration.lastError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-red-900 mb-2">
                      Last Error
                    </h3>
                    <p className="text-sm text-red-700">
                      {integration.lastError}
                    </p>
                    {integration.lastErrorAt && (
                      <p className="text-xs text-red-600 mt-1">
                        {new Date(integration.lastErrorAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Connections Tab */}
            {activeTab === "connections" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Connections
                  </h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    ➕ Add Connection
                  </button>
                </div>
                {integration.connections &&
                integration.connections.length > 0 ? (
                  <div className="space-y-3">
                    {integration.connections.map((conn: any) => (
                      <div
                        key={conn.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {conn.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {conn.connectionType}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              conn.status === "CONNECTED"
                                ? "bg-green-100 text-green-800"
                                : conn.status === "ERROR"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {conn.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Environment: {conn.environment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No connections configured
                  </div>
                )}
              </div>
            )}

            {/* Syncs Tab */}
            {activeTab === "syncs" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Syncs
                  </h3>
                  <button
                    onClick={handleSync}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    🔄 Start Sync
                  </button>
                </div>
                {integration.syncs && integration.syncs.length > 0 ? (
                  <div className="space-y-3">
                    {integration.syncs.map((sync: any) => (
                      <div
                        key={sync.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {sync.syncNumber}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {sync.syncType} - {sync.direction}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              sync.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : sync.status === "RUNNING"
                                  ? "bg-blue-100 text-blue-800"
                                  : sync.status === "FAILED"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {sync.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total</p>
                            <p className="font-medium">{sync.totalRecords}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Success</p>
                            <p className="font-medium text-green-600">
                              {sync.successfulRecords}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Failed</p>
                            <p className="font-medium text-red-600">
                              {sync.failedRecords}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No syncs yet
                  </div>
                )}
              </div>
            )}

            {/* Mappings Tab */}
            {activeTab === "mappings" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Field Mappings
                  </h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    ➕ Add Mapping
                  </button>
                </div>
                {integration.mappings && integration.mappings.length > 0 ? (
                  <div className="space-y-3">
                    {integration.mappings.map((mapping: any) => (
                      <div
                        key={mapping.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {mapping.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {mapping.entityType} - {mapping.direction}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              mapping.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {mapping.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No mappings configured
                  </div>
                )}
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === "logs" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Activity Logs
                </h3>
                <div className="text-center py-8 text-gray-500">
                  Logs will be displayed here
                </div>
              </div>
            )}

            {/* Webhooks Tab */}
            {activeTab === "webhooks" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Webhooks
                  </h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    ➕ Add Webhook
                  </button>
                </div>
                {integration.webhooks && integration.webhooks.length > 0 ? (
                  <div className="space-y-3">
                    {integration.webhooks.map((webhook: any) => (
                      <div
                        key={webhook.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {webhook.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {webhook.event}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {webhook.url}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              webhook.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {webhook.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No webhooks configured
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
