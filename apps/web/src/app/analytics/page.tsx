"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface KPIMetric {
  id: string;
  metricCode: string;
  metricName: string;
  category: string;
  currentValue: number;
  previousValue: number | null;
  targetValue: number | null;
  unit: string;
  changeAmount: number | null;
  changePercent: number | null;
  trend: 'UP' | 'DOWN' | 'STABLE' | null;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  periodType: string;
}

interface Report {
  id: string;
  name: string;
  description: string | null;
  code: string;
  reportType: string;
  category: string;
  lastRunAt: Date | null;
  _count: {
    executions: number;
  };
}

interface AnalyticsEvent {
  id: string;
  eventType: string;
  eventName: string;
  category: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  success: boolean;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<Record<string, KPIMetric[]>>({});
  const [reports, setReports] = useState<Report[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [kpisRes, reportsRes, eventsRes] = await Promise.all([
        fetch('/api/analytics/kpis?refresh=true'),
        fetch('/api/reports?limit=5'),
        fetch('/api/analytics/events?limit=10'),
      ]);

      const kpisData = await kpisRes.json();
      const reportsData = await reportsRes.json();
      const eventsData = await eventsRes.json();

      setKpis(kpisData.grouped || {});
      setReports(reportsData.reports || []);
      setEvents(eventsData.events || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'NORMAL': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getTrendIcon(trend: string | null): string {
    switch (trend) {
      case 'UP': return '↗';
      case 'DOWN': return '↘';
      case 'STABLE': return '→';
      default: return '';
    }
  }

  function formatValue(value: number, unit: string): string {
    if (unit === 'USD') return `$${value.toLocaleString()}`;
    if (unit === 'percentage') return `${value.toFixed(1)}%`;
    return value.toLocaleString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const categories = Object.keys(kpis);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time insights and performance metrics</p>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-4 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                selectedCategory === null
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Metrics
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  selectedCategory === category
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(selectedCategory ? kpis[selectedCategory] || [] : Object.values(kpis).flat()).map((metric) => (
              <div
                key={metric.id}
                className={`bg-white border-2 rounded-lg p-4 ${getStatusColor(metric.status)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-medium text-gray-700">{metric.metricName}</h3>
                  <span className="text-lg">{getTrendIcon(metric.trend)}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatValue(metric.currentValue, metric.unit)}
                </div>
                {metric.changePercent !== null && (
                  <div className={`text-sm ${
                    metric.changePercent > 0 ? 'text-green-600' : metric.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}% from previous
                  </div>
                )}
                {metric.targetValue !== null && (
                  <div className="text-xs text-gray-500 mt-1">
                    Target: {formatValue(metric.targetValue, metric.unit)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reports Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Reports</h2>
            <button
              onClick={() => router.push('/analytics/reports')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View All Reports
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Run</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.name}</div>
                      <div className="text-sm text-gray-500">{report.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.reportType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.lastRunAt ? new Date(report.lastRunAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report._count.executions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => router.push(`/analytics/reports/${report.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={async () => {
                          await fetch(`/api/reports/${report.id}/execute`, { method: 'POST', body: JSON.stringify({}) });
                          loadData();
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        Run
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Events */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {events.map((event) => (
                <div key={event.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          event.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {event.eventType}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{event.eventName}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {event.user.name || event.user.email}
                        {event.category && ` • ${event.category}`}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
