"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  notificationNumber: string;
  category: string;
  notificationType: string;
  priority: string;
  subject: string | null;
  body: string;
  status: string;
  createdAt: Date;
  sentAt: Date | null;
  readAt: Date | null;
  relatedEntityType: string | null;
  actionUrl: string | null;
  actionLabel: string | null;
}

interface Alert {
  id: string;
  alertNumber: string;
  category: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  triggeredAt: Date;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'notifications' | 'alerts'>('notifications');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  async function loadData() {
    try {
      setLoading(true);
      const [notificationsRes, alertsRes] = await Promise.all([
        fetch(`/api/notifications${filterStatus !== 'all' ? `?unreadOnly=${filterStatus === 'unread'}` : ''}`),
        fetch('/api/alerts?status=ACTIVE'),
      ]);

      const notificationsData = await notificationsRes.json();
      const alertsData = await alertsRes.json();

      setNotifications(notificationsData.notifications || []);
      setUnreadCount(notificationsData.unreadCount || 0);
      setAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAsRead: true }),
      });
      loadData();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  async function acknowledgeAlert(id: string) {
    try {
      await fetch(`/api/notifications/alerts/${id}/acknowledge`, {
        method: 'POST',
      });
      loadData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications & Alerts</h1>
            <p className="text-gray-600">Stay updated with your warehouse activities</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/notifications/preferences')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ⚙️ Preferences
            </button>
            <button
              onClick={() => router.push('/notifications/templates')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              📝 Templates
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread Notifications</p>
                <p className="text-3xl font-bold text-gray-900">{unreadCount}</p>
              </div>
              <div className="text-4xl">🔔</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{alerts.length}</p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-3xl font-bold text-red-600">
                  {alerts.filter(a => a.severity === 'CRITICAL').length}
                </p>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Alerts ({alerts.length})
            </button>
          </div>
        </div>

        {/* Filter */}
        {activeTab === 'notifications' && (
          <div className="mb-4 flex space-x-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('unread')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              Unread
            </button>
          </div>
        )}

        {/* Notifications List */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.readAt ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {notification.category.replace('_', ' ')}
                        </span>
                        {!notification.readAt && (
                          <span className="px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      {notification.subject && (
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{notification.subject}</h3>
                      )}
                      <p className="text-gray-700 mb-2">{notification.body}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        {notification.relatedEntityType && (
                          <span>• {notification.relatedEntityType}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      {!notification.readAt && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          Mark as Read
                        </button>
                      )}
                      {notification.actionUrl && (
                        <button
                          onClick={() => router.push(notification.actionUrl!)}
                          className="px-4 py-2 bg-white border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                        >
                          {notification.actionLabel || 'View'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-6xl mb-4">📭</div>
                  <p>No notifications to display</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alerts List */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {alert.category}
                        </span>
                        <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          {alert.alertType.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{alert.title}</h3>
                      <p className="text-gray-700 mb-2">{alert.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{new Date(alert.triggeredAt).toLocaleString()}</span>
                        <span>• {alert.alertNumber}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      {alert.status === 'ACTIVE' && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/alerts/${alert.id}`)}
                        className="px-4 py-2 bg-white border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-6xl mb-4">✅</div>
                  <p>No active alerts</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
