"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ListTodo,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Play,
  Square,
  XCircle,
  Mic,
} from "lucide-react";

interface Task {
  id: string;
  taskNumber: string;
  title: string;
  taskType: string;
  priority: string;
  status: string;
  assignedTo: {
    id: string;
    name: string;
  } | null;
  warehouse: {
    id: string;
    name: string;
  };
  scheduledFor: string | null;
  dueBy: string | null;
  progress: number;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
}

export default function PickingTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    taskType: "",
    priority: "",
    search: "",
  });

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.taskType) params.append("taskType", filters.taskType);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`/api/picking-tasks?${params}`);
      const data = await response.json();
      setTasks(data.tasks || []);

      // Calculate stats
      const total = data.tasks?.length || 0;
      const pending =
        data.tasks?.filter((t: Task) => t.status === "PENDING").length || 0;
      const assigned =
        data.tasks?.filter((t: Task) => t.status === "ASSIGNED").length || 0;
      const inProgress =
        data.tasks?.filter((t: Task) => t.status === "IN_PROGRESS").length || 0;
      const completed =
        data.tasks?.filter((t: Task) => t.status === "COMPLETED").length || 0;

      setStats({ total, pending, assigned, inProgress, completed });
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "ASSIGNED":
        return <User className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Play className="w-4 h-4" />;
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
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      case "ASSIGNED":
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
          <h1 className="text-3xl font-bold">Picking Tasks</h1>
          <p className="text-gray-600 mt-1">
            Manage and track warehouse picking tasks
          </p>
        </div>
        <button
          onClick={() => router.push("/picking-tasks/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <ListTodo className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned</p>
              <p className="text-2xl font-bold mt-1">{stats.assigned}</p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold mt-1">{stats.inProgress}</p>
            </div>
            <Play className="w-8 h-8 text-yellow-600" />
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
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks..."
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
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={filters.taskType}
            onChange={(e) =>
              setFilters({ ...filters, taskType: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="PICK">Pick</option>
            <option value="PUT">Put Away</option>
            <option value="MOVE">Move</option>
            <option value="COUNT">Count</option>
            <option value="REPLENISH">Replenish</option>
            <option value="RESTOCK">Restock</option>
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
        </div>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-600 mb-6">
              Create picking tasks to manage warehouse operations
            </p>
            <button
              onClick={() => router.push("/picking-tasks/new")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Task
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => router.push(`/picking-tasks/${task.id}`)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-1 h-full rounded-full ${getPriorityColor(
                      task.priority,
                    )}`}
                  ></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <span className="text-xs text-gray-500">
                        {task.taskNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{task.taskType}</span>
                      <span>•</span>
                      <span>{task.warehouse.name}</span>
                      {task.assignedTo && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {task.assignedTo.name}
                          </div>
                        </>
                      )}
                    </div>
                    {task.dueBy && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        Due: {new Date(task.dueBy).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                      task.status,
                    )}`}
                  >
                    {getStatusIcon(task.status)}
                    {task.status.replace("_", " ")}
                  </span>
                  
                  {/* Start Voice Mode Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/picking-tasks/${task.id}/execute`);
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Mic className="w-3 h-3" />
                    Start Voice
                  </button>

                  <span className="text-sm text-gray-500">
                    {task.progress.toFixed(0)}% Complete
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {task.progress > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
