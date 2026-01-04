/**
 * Integration Dashboard - Manage ERP, TMS, Carrier connections
 */

'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Trash2, CheckCircle, XCircle, Play, Settings, Link as LinkIcon } from 'lucide-react';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: string;
  lastTriggered?: string;
  createdAt: string;
}

export default function IntegrationDashboard() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ url: '', events: [] as string[] });

  const availableEvents = [
    'loadsheet.created',
    'loadsheet.approved',
    'loadsheet.departed',
    'container.created',
    'container.assigned',
    'order.created',
    'wave.created',
    'wave.released',
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations');
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createWebhook',
          ...newWebhook,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewWebhook({ url: '', events: [] });
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const testWebhook = async (webhookId: string) => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'testWebhook',
          webhookId,
        }),
      });

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error('Test error:', error);
      alert('Test failed');
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    if (!confirm('Delete this webhook?')) return;

    try {
      await fetch(`/api/integrations?webhookId=${webhookId}`, {
        method: 'DELETE',
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const toggleWebhookStatus = async (webhookId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await fetch('/api/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookId,
          status: newStatus,
        }),
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const toggleEvent = (event: string) => {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integration Manager</h1>
            <p className="text-gray-600 mt-2">Connect to ERP, TMS, and carrier systems</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchWebhooks}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Create Webhook
            </button>
          </div>
        </div>
      </div>

      {/* Pre-configured Integrations */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">SAP ERP</h3>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Sync load sheets and inventory data with SAP
          </p>
          <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Oracle ERP</h3>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Real-time order and shipment synchronization
          </p>
          <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Carrier APIs</h3>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            FedEx, UPS, DHL automated dispatch
          </p>
          <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Active Webhooks</h2>
          <p className="text-sm text-gray-600 mt-1">
            Receive real-time events from the warehouse system
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading webhooks...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No webhooks configured</p>
              <p className="text-sm text-gray-400 mt-2">Create a webhook to receive real-time events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                          {webhook.url}
                        </code>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            webhook.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {webhook.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>

                      <div className="text-xs text-gray-500">
                        Created: {new Date(webhook.createdAt).toLocaleString()}
                        {webhook.lastTriggered && (
                          <> • Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}</>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => testWebhook(webhook.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Test webhook"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleWebhookStatus(webhook.id, webhook.status)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition"
                        title={webhook.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {webhook.status === 'ACTIVE' ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteWebhook(webhook.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete webhook"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create Webhook</h2>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-server.com/webhook"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Events to Subscribe
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availableEvents.map((event) => (
                    <label
                      key={event}
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createWebhook}
                disabled={!newWebhook.url || newWebhook.events.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
