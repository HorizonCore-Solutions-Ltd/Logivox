"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Integration {
  id: string;
  name: string;
  type: string;
  status: string;
  lastSync: string;
}

interface IntegrationStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  todaySyncs: number;
  avgLatency: number;
  lastSyncTime: string;
  uptime: number;
}

interface WebhookLog {
  id: string;
  event: string;
  status: string;
  timestamp: string;
  attempts: number;
  responseCode: number;
}

export default function ReceivingIntegration() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewIntegration, setShowNewIntegration] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [integrationsRes, statsRes, logsRes] = await Promise.all([
        fetch("/api/receiving/integration?action=list_integrations"),
        fetch("/api/receiving/integration?action=integration_stats"),
        fetch("/api/receiving/integration?action=webhook_logs"),
      ]);

      const integrationsData = await integrationsRes.json();
      const statsData = await statsRes.json();
      const logsData = await logsRes.json();

      setIntegrations(integrationsData.integrations || []);
      setStats(statsData.stats);
      setWebhookLogs(logsData.logs || []);
    } catch (error) {
      console.error("Failed to fetch integration data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    try {
      const response = await fetch("/api/receiving/integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_connection",
          integrationId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Connection successful! Latency: ${data.result.latency}ms`);
      } else {
        alert(`Connection failed: ${data.result.message}`);
      }
    } catch (error) {
      alert("Test failed");
    }
  };

  const handleSyncNow = async (integrationId: string) => {
    try {
      const response = await fetch("/api/receiving/integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_data",
          integrationId,
          direction: "BIDIRECTIONAL",
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Sync completed successfully!");
        fetchData();
      }
    } catch (error) {
      alert("Sync failed");
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      const response = await fetch(
        "/api/receiving/integration?action=generate_api_key",
      );
      const data = await response.json();

      if (data.apiKey) {
        prompt("Your API Key (save it securely):", data.apiKey);
      }
    } catch (error) {
      alert("Failed to generate API key");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "ERROR":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ERP":
        return "🏢";
      case "WMS":
        return "📦";
      case "TMS":
        return "🚚";
      case "SUPPLIER_PORTAL":
        return "🤝";
      default:
        return "🔌";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Integration Hub</h1>
          <p className="text-gray-600">
            Connect with WMS, ERP, TMS, and supplier systems
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateApiKey}>
            🔑 Generate API Key
          </Button>
          <Button onClick={() => setShowNewIntegration(true)}>
            ➕ New Integration
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Syncs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSyncs}</div>
              <div className="text-sm text-gray-600 mt-1">
                {stats.todaySyncs} today
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {Math.round((stats.successfulSyncs / stats.totalSyncs) * 100)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {stats.failedSyncs} failures
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Latency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.avgLatency}ms
              </div>
              <div className="text-sm text-gray-600 mt-1">Response time</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {stats.uptime}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Last 30 days</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">
            🔌 Integrations ({integrations.length})
          </TabsTrigger>
          <TabsTrigger value="webhooks">🔔 Webhooks</TabsTrigger>
          <TabsTrigger value="api">📡 API</TabsTrigger>
          <TabsTrigger value="docs">📚 Documentation</TabsTrigger>
          <TabsTrigger value="roi">💰 ROI</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          {integrations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-3">🔌</div>
                <p className="text-gray-600 mb-4">No integrations configured</p>
                <Button onClick={() => setShowNewIntegration(true)}>
                  Create First Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {getTypeIcon(integration.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {integration.name}
                          </CardTitle>
                          <div className="text-sm text-gray-600">
                            {integration.type}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        Last sync:{" "}
                        {new Date(integration.lastSync).toLocaleString()}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleTestConnection(integration.id)}
                        >
                          🔍 Test
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSyncNow(integration.id)}
                        >
                          🔄 Sync Now
                        </Button>
                        <Button size="sm" variant="outline">
                          ⚙️
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* New Integration Form */}
          {showNewIntegration && (
            <Card className="border-blue-500 border-2">
              <CardHeader>
                <CardTitle>Create New Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Integration Type
                    </label>
                    <select className="w-full border rounded p-2">
                      <option>WMS (Warehouse Management System)</option>
                      <option>ERP (Enterprise Resource Planning)</option>
                      <option>TMS (Transportation Management)</option>
                      <option>Supplier Portal</option>
                      <option>Custom API</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Integration Name
                    </label>
                    <Input placeholder="e.g., NetSuite ERP" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      API Endpoint
                    </label>
                    <Input placeholder="https://api.example.com/v1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Authentication Type
                    </label>
                    <select className="w-full border rounded p-2">
                      <option>API Key</option>
                      <option>OAuth 2.0</option>
                      <option>Basic Auth</option>
                      <option>Bearer Token</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">Create Integration</Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewIntegration(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Webhook URL
                  </label>
                  <Input placeholder="https://your-app.com/webhooks/receiving" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Events to Subscribe
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "RECEIPT_STARTED",
                      "RECEIPT_COMPLETED",
                      "QUALITY_INSPECTION",
                      "DAMAGE_FOUND",
                      "PUTAWAY_COMPLETE",
                      "DOCUMENT_UPLOADED",
                    ].map((event) => (
                      <label key={event} className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span className="text-sm">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button>Configure Webhook</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Webhook Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-medium">
                        Event
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Status
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Time
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Response
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Attempts
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-sm">{log.event}</td>
                        <td className="p-2">
                          <Badge
                            className={
                              log.status === "DELIVERED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-2 text-sm">{log.responseCode}</td>
                        <td className="p-2 text-sm">{log.attempts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <div className="font-medium mb-2">Base URL</div>
                  <code className="text-sm">https://api.logivox.com/v1</code>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">API Keys</div>
                    <Button size="sm" onClick={handleGenerateApiKey}>
                      + Generate New Key
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <div className="font-mono text-sm">fsk_****...****</div>
                        <div className="text-xs text-gray-600">
                          Last used 2 hours ago
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">Sample Request</div>
                  <pre className="p-4 bg-gray-900 text-gray-100 rounded overflow-x-auto text-xs">
                    {`curl -X POST https://api.logivox.com/v1/receiving/shipments \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "shipmentNumber": "SHP-2024-001",
    "supplier": "ACME Corp",
    "expectedDate": "2024-01-15",
    "items": [
      {
        "sku": "PROD-001",
        "quantity": 100
      }
    ]
  }'`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {[
                  {
                    method: "GET",
                    path: "/receiving/shipments",
                    desc: "List shipments",
                  },
                  {
                    method: "POST",
                    path: "/receiving/shipments",
                    desc: "Create shipment",
                  },
                  {
                    method: "GET",
                    path: "/receiving/shipments/:id",
                    desc: "Get shipment details",
                  },
                  {
                    method: "PUT",
                    path: "/receiving/shipments/:id",
                    desc: "Update shipment",
                  },
                  {
                    method: "POST",
                    path: "/receiving/asn",
                    desc: "Import ASN",
                  },
                  {
                    method: "GET",
                    path: "/receiving/stats",
                    desc: "Get statistics",
                  },
                ].map((endpoint, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 border rounded hover:bg-gray-50"
                  >
                    <Badge
                      className={
                        endpoint.method === "GET"
                          ? "bg-green-100 text-green-800"
                          : endpoint.method === "POST"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="font-mono">{endpoint.path}</code>
                    <span className="text-gray-600 ml-auto">
                      {endpoint.desc}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">📖 Getting Started</h3>
                  <p className="text-sm text-gray-700">
                    Learn how to integrate your systems with LogiVox's receiving
                    platform. Our RESTful API provides comprehensive access to
                    all receiving operations.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                  >
                    <span className="text-2xl">📘</span>
                    <span>API Reference</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                  >
                    <span className="text-2xl">🔌</span>
                    <span>Integration Guide</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                  >
                    <span className="text-2xl">💡</span>
                    <span>Code Examples</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                  >
                    <span className="text-2xl">🔐</span>
                    <span>Authentication</span>
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-3">
                    Common Integration Patterns
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>
                        <strong>ASN Import:</strong> Automatically import
                        advance shipment notices from suppliers or TMS
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>
                        <strong>Receipt Confirmation:</strong> Send receipt data
                        to ERP/WMS systems in real-time
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>
                        <strong>Quality Alerts:</strong> Trigger webhooks for
                        quality issues to notify stakeholders
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>
                        <strong>Inventory Updates:</strong> Sync inventory
                        levels with WMS after putaway completion
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROI Tab */}
        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">API Development</span>
                    <span className="font-medium">$52,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Integration Setup</span>
                    <span className="font-medium">$15,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Testing</span>
                    <span className="font-medium">$8,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Documentation</span>
                    <span className="font-medium">$5,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Maintenance (Annual)</span>
                    <span className="font-medium">$6,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4">
                    <span className="font-bold">Total Investment</span>
                    <span className="font-bold text-lg">$86,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annual Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Manual Data Entry</span>
                    <span className="font-medium text-green-600">$112,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Data Accuracy</span>
                    <span className="font-medium text-green-600">$68,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Real-time Sync</span>
                    <span className="font-medium text-green-600">$54,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Vendor Collaboration</span>
                    <span className="font-medium text-green-600">$42,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 -mx-4 px-4">
                    <span className="font-bold">Total Annual Savings</span>
                    <span className="font-bold text-lg text-green-600">
                      $276,000
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ROI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-3xl font-bold text-green-600">321%</div>
                  <div className="text-sm text-gray-600 mt-1">ROI</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-3xl font-bold text-blue-600">3.7</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Payback (months)
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-3xl font-bold text-purple-600">100%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Automated data flow
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-3xl font-bold text-orange-600">
                    99.5%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Data accuracy
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-3">Key Impacts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>100% automated data flow</strong> - Zero manual
                      data entry between systems
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>99.5% data accuracy</strong> - Eliminated
                      transcription errors
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>Real-time synchronization</strong> - Instant data
                      updates across all systems
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>95% vendor satisfaction</strong> - Better
                      collaboration through portal access
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
