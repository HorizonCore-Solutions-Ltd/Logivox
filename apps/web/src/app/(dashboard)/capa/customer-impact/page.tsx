"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  AlertTriangle,
  DollarSign,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Bell,
  MessageSquare,
  Filter,
  Search,
} from "lucide-react";

// ============================================
// CAPA SYSTEM 11: CUSTOMER IMPACT ANALYSIS
// ============================================

interface CustomerImpact {
  id: string;
  capaId: string;
  customerId: string;
  affectedQuantity: number;
  estimatedValue: number;
  impactSeverity: string;
  impactDescription: string;
  notificationStatus: string;
  lastNotificationAt?: string;
  customerResponse?: string;
  customerResponseAt?: string;
  identifiedAt: string;
  capa: {
    capaNumber: string;
    title: string;
    severity: string;
  };
  customer: {
    name: string;
    email: string;
  };
  notifications: any[];
  compensation: any[];
}

interface ImpactStats {
  totalImpacts: number;
  customersAffected: number;
  unitsAffected: number;
  notificationsPending: number;
  notificationsSent: number;
  responsesReceived: number;
  compensationTotal: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export default function CustomerImpactPage() {
  const { data: session } = useSession();
  const [impacts, setImpacts] = useState<CustomerImpact[]>([]);
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [notificationFilter, setNotificationFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchImpactData();
  }, [severityFilter, notificationFilter]);

  const fetchImpactData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (severityFilter !== "all") {
        params.append("severity", severityFilter.toUpperCase());
      }
      if (notificationFilter !== "all") {
        params.append("notificationStatus", notificationFilter.toUpperCase());
      }

      const response = await fetch(`/api/capa/customer-impact?${params}`);
      const data = await response.json();

      setImpacts(data.impacts || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Failed to fetch customer impact data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-700 bg-red-100";
      case "HIGH":
        return "text-orange-700 bg-orange-100";
      case "MEDIUM":
        return "text-yellow-700 bg-yellow-100";
      case "LOW":
        return "text-blue-700 bg-blue-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getNotificationStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-700 bg-yellow-100";
      case "SENT":
        return "text-blue-700 bg-blue-100";
      case "ACKNOWLEDGED":
        return "text-green-700 bg-green-100";
      case "FAILED":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const filteredImpacts = impacts.filter((impact) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      impact.customer.name.toLowerCase().includes(searchLower) ||
      impact.capa.capaNumber.toLowerCase().includes(searchLower) ||
      impact.capa.title.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading customer impact data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Impact Analysis
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track affected customers, send notifications, and manage
            compensation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchImpactData}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.totalImpacts || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
            <Users className="w-4 h-4" />
            <span>Customers</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.customersAffected || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
            <Package className="w-4 h-4" />
            <span>Units</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {stats?.unitsAffected || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center gap-2 text-yellow-700 text-sm mb-1">
            <Clock className="w-4 h-4" />
            <span>Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700">
            {stats?.notificationsPending || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-blue-200 p-4">
          <div className="flex items-center gap-2 text-blue-700 text-sm mb-1">
            <Send className="w-4 h-4" />
            <span>Sent</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {stats?.notificationsSent || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-2 text-green-700 text-sm mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Responses</span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {stats?.responsesReceived || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="flex items-center gap-2 text-red-700 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Compensation</span>
          </div>
          <div className="text-xl font-bold text-red-700">
            ${(stats?.compensationTotal || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Severity Breakdown */}
      {stats && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Impact Severity Distribution
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.severityBreakdown.critical}
              </div>
              <div className="text-xs text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.severityBreakdown.high}
              </div>
              <div className="text-xs text-gray-600">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.severityBreakdown.medium}
              </div>
              <div className="text-xs text-gray-600">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.severityBreakdown.low}
              </div>
              <div className="text-xs text-gray-600">Low</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, CAPA number, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Notification Filter */}
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-600" />
            <select
              value={notificationFilter}
              onChange={(e) => setNotificationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Notifications</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Impact Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CAPA
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affected Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notification
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compensation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredImpacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No customer impacts found
                  </td>
                </tr>
              ) : (
                filteredImpacts.map((impact) => (
                  <tr key={impact.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {impact.customer.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {impact.customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-mono text-blue-600">
                          {impact.capa.capaNumber}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {impact.capa.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${getSeverityColor(impact.impactSeverity)}`}
                      >
                        {impact.impactSeverity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {impact.affectedQuantity.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">units</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">
                        $
                        {parseFloat(
                          impact.estimatedValue.toString(),
                        ).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getNotificationStatusColor(impact.notificationStatus)}`}
                        >
                          {impact.notificationStatus}
                        </span>
                        {impact.lastNotificationAt && (
                          <div className="text-xs text-gray-500">
                            {new Date(
                              impact.lastNotificationAt,
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {impact.customerResponse ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Received</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {impact.compensation && impact.compensation.length > 0 ? (
                        <div>
                          <div className="text-sm font-semibold text-red-600">
                            $
                            {impact.compensation
                              .reduce(
                                (sum, c) =>
                                  sum + parseFloat(c.amount.toString()),
                                0,
                              )
                              .toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {impact.compensation[0].compensationType}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => {
                          // Open detail modal (to be implemented)
                          alert("View impact details");
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Information Panel */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Customer Impact Response Workflow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">5-Step Process</h4>
            <ol className="space-y-1 text-gray-700">
              <li>
                1. <strong>Identify:</strong> Analyze shipments with affected
                lots/serials
              </li>
              <li>
                2. <strong>Notify:</strong> Send customer notifications
                (email/phone/letter)
              </li>
              <li>
                3. <strong>Track:</strong> Monitor customer responses and
                actions
              </li>
              <li>
                4. <strong>Compensate:</strong> Issue refunds, credits, or
                replacements
              </li>
              <li>
                5. <strong>Recall:</strong> Initiate product recall if severity
                warrants
              </li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Severity-Based Actions
            </h4>
            <ul className="space-y-1 text-gray-700">
              <li>
                • <strong>CRITICAL:</strong> Immediate notification + mandatory
                recall
              </li>
              <li>
                • <strong>HIGH:</strong> 24-hour notification + recall
                evaluation
              </li>
              <li>
                • <strong>MEDIUM:</strong> 3-day notification + compensation
                review
              </li>
              <li>
                • <strong>LOW:</strong> 7-day notification + customer discretion
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-orange-200">
          <h4 className="font-semibold text-gray-900 mb-2">
            Compensation Types
          </h4>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
              REFUND: Full or partial money back
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
              CREDIT: Future purchase credit
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              REPLACEMENT: Free replacement units
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
              DISCOUNT: Discount on next order
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
