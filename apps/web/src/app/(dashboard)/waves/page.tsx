"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Users,
  TrendingUp,
  Clock,
  Plus,
  Filter,
  Search,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Wave {
  id: string;
  waveNumber: string;
  name: string;
  waveType: string;
  priority: string;
  status: string;
  totalOrders: number;
  totalLines: number;
  pickedLines: number;
  progress: number;
  scheduledFor: string | null;
  assignedTo: {
    id: string;
    name: string;
  } | null;
  warehouse: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Stats {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
  avgPickRate: number;
}

export default function WavesPage() {
  const router = useRouter();
  const [waves, setWaves] = useState<Wave[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    planned: 0,
    inProgress: 0,
    completed: 0,
    avgPickRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    waveType: "",
    search: "",
  });

  useEffect(() => {
    fetchWaves();
  }, [filters]);

  const fetchWaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.waveType) params.append("waveType", filters.waveType);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`/api/waves?${params}`);
      const data = await response.json();
      setWaves(data.waves || []);

      // Calculate stats
      const total = data.waves?.length || 0;
      const planned =
        data.waves?.filter((w: Wave) => w.status === "PLANNED").length || 0;
      const inProgress =
        data.waves?.filter((w: Wave) => w.status === "IN_PROGRESS").length || 0;
      const completed =
        data.waves?.filter((w: Wave) => w.status === "COMPLETED").length || 0;

      setStats({
        total,
        planned,
        inProgress,
        completed,
        avgPickRate: 0,
      });
    } catch (error) {
      console.error("Error fetching waves:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PLANNED":
        return <Clock className="w-4 h-4" />;
      case "RELEASED":
        return <Play className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <TrendingUp className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNED":
        return "bg-gray-100 text-gray-800";
      case "RELEASED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500";
      case "URGENT":
        return "bg-orange-500";
      case "HIGH":
        return "bg-yellow-500";
      case "NORMAL":
        return "bg-blue-500";
      case "LOW":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Wave Picking</h1>
          <p className="text-gray-600 mt-1">
            Batch orders for efficient picking
          </p>
        </div>
        <button
          onClick={() => router.push("/waves/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Wave
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Waves</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Planned</p>
              <p className="text-2xl font-bold mt-1">{stats.planned}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold mt-1">{stats.inProgress}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold mt-1">{stats.completed}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Pick Rate</p>
              <p className="text-2xl font-bold mt-1">
                {stats.avgPickRate.toFixed(0)}/hr
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search waves..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="RELEASED">Released</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filters.waveType}
            onChange={(e) =>
              setFilters({ ...filters, waveType: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="SINGLE_ORDER">Single Order</option>
            <option value="BATCH">Batch</option>
            <option value="ZONE">Zone</option>
            <option value="CARRIER">Carrier</option>
            <option value="PRIORITY">Priority</option>
          </select>
        </div>
      </div>

      {/* Waves Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading waves...</p>
          </div>
        ) : waves.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No waves found
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first wave picking batch
            </p>
            <button
              onClick={() => router.push("/waves/new")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Wave
            </button>
          </div>
        ) : (
          waves.map((wave) => (
            <div
              key={wave.id}
              onClick={() => router.push(`/waves/${wave.id}`)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-1 h-8 rounded-full ${getPriorityColor(
                        wave.priority,
                      )}`}
                    ></div>
                    <div>
                      <h3 className="text-lg font-semibold">{wave.name}</h3>
                      <p className="text-sm text-gray-600">
                        {wave.waveNumber} • {wave.warehouse.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                      wave.status,
                    )}`}
                  >
                    {getStatusIcon(wave.status)}
                    {wave.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Orders</p>
                  <p className="text-lg font-semibold">{wave.totalOrders}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Lines</p>
                  <p className="text-lg font-semibold">{wave.totalLines}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Picked</p>
                  <p className="text-lg font-semibold">{wave.pickedLines}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Progress</p>
                  <p className="text-lg font-semibold">
                    {wave.progress.toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${wave.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  {wave.assignedTo && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      {wave.assignedTo.name}
                    </div>
                  )}
                  {wave.scheduledFor && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      {new Date(wave.scheduledFor).toLocaleString()}
                    </div>
                  )}
                </div>
                <span className="text-gray-500">
                  Created {new Date(wave.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
