"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  User,
  Shield,
  Mic,
  Filter,
  Calendar,
  BarChart3,
  Play,
  Pause,
  SkipForward,
  ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type DutyStatus =
  | "PLANNED"
  | "ACTIVE"
  | "PAUSED"
  | "DONE"
  | "CANCELLED"
  | "SKIPPED"
  | "ESCALATED";
type DutyPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface Duty {
  id: string;
  title: string;
  category: string;
  status: DutyStatus;
  priority: DutyPriority;
  zoneName?: string;
  employeeId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  slaBreached: boolean;
  capaId?: string;
  capaStage?: string;
  autoAssigned: boolean;
  dutyType?: { name: string };
}

interface DutyKPIs {
  total: number;
  done: number;
  slaHitRate: number;
  slaBreached: number;
  capaLinked: number;
  avgDurationMinutes: number;
  byStatus: Record<string, number>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DutyStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PLANNED: {
    label: "Planned",
    color: "bg-slate-100 text-slate-700",
    icon: <Clock size={12} />,
  },
  ACTIVE: {
    label: "Active",
    color: "bg-blue-100 text-blue-700",
    icon: <Play size={12} />,
  },
  PAUSED: {
    label: "Paused",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Pause size={12} />,
  },
  DONE: {
    label: "Done",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 size={12} />,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: <SkipForward size={12} />,
  },
  SKIPPED: {
    label: "Skipped",
    color: "bg-orange-100 text-orange-700",
    icon: <SkipForward size={12} />,
  },
  ESCALATED: {
    label: "Escalated",
    color: "bg-purple-100 text-purple-700",
    icon: <AlertTriangle size={12} />,
  },
};

const PRIORITY_COLOR: Record<DutyPriority, string> = {
  LOW: "border-l-slate-300",
  MEDIUM: "border-l-blue-400",
  HIGH: "border-l-orange-400",
  CRITICAL: "border-l-red-500",
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  CAPA_CONTAINMENT: <Shield size={14} className="text-red-500" />,
  CAPA_INVESTIGATION: <Shield size={14} className="text-orange-500" />,
  CAPA_CORRECTIVE: <Shield size={14} className="text-yellow-500" />,
  CAPA_PREVENTIVE: <Shield size={14} className="text-blue-500" />,
  CAPA_VERIFICATION: <Shield size={14} className="text-green-500" />,
  QUALITY_CHECK: <CheckCircle2 size={14} className="text-green-600" />,
  SAFETY_INSPECTION: <AlertTriangle size={14} className="text-orange-600" />,
};

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── DutyCard ────────────────────────────────────────────────────────────────

function DutyCard({
  duty,
  onStatusChange,
}: {
  duty: Duty;
  onStatusChange: (id: string, status: string) => void;
}) {
  const sc = STATUS_CONFIG[duty.status];
  const pc = PRIORITY_COLOR[duty.priority];

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 border-l-4 ${pc} shadow-sm hover:shadow-md transition-shadow p-3`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {CATEGORY_ICON[duty.category] ?? (
            <ClipboardList size={14} className="text-gray-400" />
          )}
          <Link
            href={`/dashboard/duties/${duty.id}`}
            className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
          >
            {duty.title}
          </Link>
        </div>
        {duty.slaBreached && (
          <span className="flex-shrink-0 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
            SLA ⚠
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}
        >
          {sc.icon}
          {sc.label}
        </span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {duty.priority}
        </span>
        {duty.capaId && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
            CAPA
          </span>
        )}
        {duty.autoAssigned && (
          <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
            <Zap size={10} className="inline mr-0.5" />
            Auto
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar size={10} />
          {formatTime(duty.scheduledStart)} – {formatTime(duty.scheduledEnd)}
        </span>
        {duty.zoneName && (
          <span className="truncate max-w-[80px]">{duty.zoneName}</span>
        )}
      </div>

      <div className="mt-2 flex gap-1">
        {duty.status === "PLANNED" && (
          <button
            onClick={() => onStatusChange(duty.id, "ACTIVE")}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Start
          </button>
        )}
        {duty.status === "ACTIVE" && (
          <>
            <button
              onClick={() => onStatusChange(duty.id, "DONE")}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
            >
              Done
            </button>
            <button
              onClick={() => onStatusChange(duty.id, "PAUSED")}
              className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors"
            >
              Pause
            </button>
          </>
        )}
        {duty.status === "PAUSED" && (
          <button
            onClick={() => onStatusChange(duty.id, "ACTIVE")}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Resume
          </button>
        )}
        <Link
          href={`/dashboard/duties/${duty.id}`}
          className="ml-auto text-xs text-gray-500 hover:text-gray-700 flex items-center gap-0.5"
        >
          Details <ChevronRight size={10} />
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DutiesPage() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [kpis, setKPIs] = useState<DutyKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);

    const [dutiesRes, kpisRes] = await Promise.all([
      fetch(`/api/duties?${params}`),
      fetch("/api/duties/kpis?days=7"),
    ]);
    const [dutiesData, kpisData] = await Promise.all([
      dutiesRes.json(),
      kpisRes.json(),
    ]);
    setDuties(dutiesData.duties ?? []);
    setKPIs(kpisData);
    setLoading(false);
  }, [filterStatus, filterCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/duties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadData();
  };

  // Group by status for board view
  const boardColumns: DutyStatus[] = [
    "PLANNED",
    "ACTIVE",
    "PAUSED",
    "DONE",
    "ESCALATED",
  ];
  const grouped = boardColumns.reduce(
    (acc, s) => {
      acc[s] = duties.filter((d) => d.status === s);
      return acc;
    },
    {} as Record<string, Duty[]>,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="text-blue-600" size={24} />
            Duty Board
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            WMS task assignment · CAPA-aware · Voice-ready
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg border border-gray-200 transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <Link
            href="/dashboard/duties/planner"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Zap size={14} /> Auto-Planner
          </Link>
          <Link
            href="/dashboard/duties/new"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} /> New Duty
          </Link>
        </div>
      </div>

      {/* KPI Bar */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            {
              label: "Total Duties",
              value: kpis.total,
              color: "text-gray-900",
            },
            { label: "Completed", value: kpis.done, color: "text-green-600" },
            {
              label: "SLA Hit Rate",
              value: `${kpis.slaHitRate}%`,
              color:
                kpis.slaHitRate >= 90
                  ? "text-green-600"
                  : kpis.slaHitRate >= 70
                    ? "text-yellow-600"
                    : "text-red-600",
            },
            {
              label: "SLA Breaches",
              value: kpis.slaBreached,
              color: kpis.slaBreached > 0 ? "text-red-600" : "text-green-600",
            },
            {
              label: "CAPA Duties",
              value: kpis.capaLinked,
              color: "text-purple-600",
            },
            {
              label: "Avg Duration",
              value: `${kpis.avgDurationMinutes}m`,
              color: "text-gray-700",
            },
          ].map((k) => (
            <div
              key={k.label}
              className="bg-white rounded-xl border border-gray-200 p-3 text-center"
            >
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + View Toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode("board")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === "board" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Board
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            List
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm py-2 bg-transparent focus:outline-none text-gray-700"
          >
            <option value="">All statuses</option>
            {Object.keys(STATUS_CONFIG).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s as DutyStatus].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2">
          <Shield size={14} className="text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm py-2 bg-transparent focus:outline-none text-gray-700"
          >
            <option value="">All categories</option>
            {[
              "RECEIVING",
              "PICKING",
              "PACKING",
              "QUALITY_CHECK",
              "SAFETY_INSPECTION",
              "CAPA_CONTAINMENT",
              "CAPA_INVESTIGATION",
              "CAPA_CORRECTIVE",
              "CAPA_PREVENTIVE",
              "CAPA_VERIFICATION",
              "MAINTENANCE",
              "OTHER",
            ].map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Board View */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {boardColumns.map((status) => {
            const sc = STATUS_CONFIG[status];
            const col = grouped[status] ?? [];
            return (
              <div key={status} className="flex flex-col gap-3">
                <div
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${sc.color}`}
                >
                  <span className="text-xs font-semibold flex items-center gap-1">
                    {sc.icon} {sc.label}
                  </span>
                  <span className="text-xs font-bold">{col.length}</span>
                </div>
                <div className="flex flex-col gap-2 min-h-[100px]">
                  {col.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-6 bg-white rounded-lg border border-dashed border-gray-200">
                      No duties
                    </div>
                  )}
                  {col.map((d) => (
                    <DutyCard
                      key={d.id}
                      duty={d}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Title",
                  "Category",
                  "Status",
                  "Priority",
                  "Zone",
                  "Scheduled",
                  "SLA",
                  "CAPA",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-gray-600 px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    Loading duties...
                  </td>
                </tr>
              ) : duties.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    No duties found
                  </td>
                </tr>
              ) : (
                duties.map((d) => {
                  const sc = STATUS_CONFIG[d.status];
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                        <Link
                          href={`/dashboard/duties/${d.id}`}
                          className="hover:text-blue-600"
                        >
                          {d.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        <span className="flex items-center gap-1">
                          {CATEGORY_ICON[d.category]}
                          {d.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}
                        >
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${d.priority === "CRITICAL" ? "text-red-600" : d.priority === "HIGH" ? "text-orange-600" : "text-gray-600"}`}
                        >
                          {d.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {d.zoneName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {d.scheduledStart ? formatTime(d.scheduledStart) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {d.slaBreached ? (
                          <span className="text-xs text-red-600 font-medium">
                            Breached
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {d.capaId ? (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {d.capaStage?.replace(/_/g, " ") ?? "Linked"}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/duties/${d.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
