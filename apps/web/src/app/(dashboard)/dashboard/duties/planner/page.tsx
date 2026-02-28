"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, Plus, Trash2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface DutyType {
  id: string;
  name: string;
  category: string;
  defaultDuration: number;
  requiredSkills: string[];
  requiredCerts: string[];
}

interface Shift {
  id: string;
  shiftCode: string;
  shiftName: string;
  shiftType: string;
  startTime: string;
  endTime: string;
}

interface PlanLine {
  id: string;
  dutyTypeId: string;
  quantity: number;
  zoneId: string;
  scheduledStart: string;
}

interface PlanResult {
  dutyId: string;
  employeeId: string | null;
  employeeName: string | null;
  rule: string;
  confidence: number;
}

interface PlanSummary {
  total: number;
  assigned: number;
  unassigned: number;
  assignmentRate: number;
}

export default function DutyPlannerPage() {
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftId, setShiftId] = useState("");
  const [lines, setLines] = useState<PlanLine[]>([
    { id: crypto.randomUUID(), dutyTypeId: "", quantity: 1, zoneId: "", scheduledStart: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlanResult[] | null>(null);
  const [summary, setSummary] = useState<PlanSummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/duties-types?limit=200").then((r) => r.json()).catch(() => ({ dutyTypes: [] })),
      fetch("/api/shifts?limit=100").then((r) => r.json()).catch(() => ({ shifts: [] })),
    ]).then(([dt, sh]) => {
      setDutyTypes(dt.dutyTypes ?? dt.data ?? []);
      setShifts(sh.shifts ?? sh.data ?? []);
    });
  }, []);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), dutyTypeId: "", quantity: 1, zoneId: "", scheduledStart: "" },
    ]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof PlanLine, value: string | number) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const runPlanner = async () => {
    const errs: string[] = [];
    if (!shiftId) errs.push("Please select a shift.");
    const validLines = lines.filter((l) => l.dutyTypeId);
    if (validLines.length === 0) errs.push("Add at least one duty type.");
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setLoading(true);
    setResults(null);

    const res = await fetch("/api/duties/planner/auto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shiftId,
        duties: validLines.map((l) => ({
          dutyTypeId: l.dutyTypeId,
          quantity: Number(l.quantity),
          zoneId: l.zoneId || undefined,
          scheduledStart: l.scheduledStart || undefined,
        })),
      }),
    });

    const data = await res.json();
    setResults(data.results ?? []);
    setSummary(data.summary ?? null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link
        href="/dashboard/duties"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Duty Board
      </Link>

      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="text-yellow-500" size={24} />
            Auto-Planner
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Rule-based auto-assignment: skills, certs, zone preference, fatigue avoidance.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          {/* Shift select */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Shift <span className="text-red-500">*</span>
            </label>
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select shift —</option>
              {shifts.length === 0 && (
                <option disabled>No shifts loaded</option>
              )}
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shiftName} ({s.shiftCode}) · {s.startTime}–{s.endTime}
                </option>
              ))}
            </select>
          </div>

          {/* Duty lines */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duties to plan
            </label>
            <div className="space-y-3">
              {lines.map((line, idx) => {
                const dt = dutyTypes.find((d) => d.id === line.dutyTypeId);
                return (
                  <div key={line.id} className="flex gap-2 items-start bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-400 mt-2.5 w-4">{idx + 1}</span>
                    {/* Duty type */}
                    <div className="flex-1">
                      <select
                        value={line.dutyTypeId}
                        onChange={(e) => updateLine(line.id, "dutyTypeId", e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Duty type —</option>
                        {dutyTypes.length === 0 && <option disabled>No duty types</option>}
                        {dutyTypes.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.category.replace(/_/g, " ")}) · {d.defaultDuration}min
                          </option>
                        ))}
                      </select>
                      {dt && (dt.requiredSkills.length > 0 || dt.requiredCerts.length > 0) && (
                        <p className="text-xs text-blue-600 mt-1">
                          Needs: {[...dt.requiredSkills, ...dt.requiredCerts].join(", ")}
                        </p>
                      )}
                    </div>
                    {/* Qty */}
                    <div className="w-20">
                      <label className="text-xs text-gray-500 block mb-1">Qty</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      />
                    </div>
                    {/* Zone */}
                    <div className="w-28">
                      <label className="text-xs text-gray-500 block mb-1">Zone (opt.)</label>
                      <input
                        type="text"
                        value={line.zoneId}
                        onChange={(e) => updateLine(line.id, "zoneId", e.target.value)}
                        placeholder="Zone A"
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {/* Start */}
                    <div className="w-36">
                      <label className="text-xs text-gray-500 block mb-1">Start (opt.)</label>
                      <input
                        type="datetime-local"
                        value={line.scheduledStart}
                        onChange={(e) => updateLine(line.id, "scheduledStart", e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {/* Remove */}
                    {lines.length > 1 && (
                      <button
                        onClick={() => removeLine(line.id)}
                        className="mt-6 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={addLine}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> Add duty
            </button>
          </div>

          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              {errors.map((e, i) => (
                <p key={i} className="text-sm text-red-700 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> {e}
                </p>
              ))}
            </div>
          )}

          <button
            onClick={runPlanner}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {loading ? "Planning..." : "Run Auto-Planner"}
          </button>
        </div>

        {/* Results */}
        {summary && results && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Summary bar */}
            <div className={`flex items-center gap-3 p-4 rounded-lg mb-5 ${summary.unassigned === 0 ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
              {summary.unassigned === 0 ? (
                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0" />
              )}
              <div>
                <p className={`text-sm font-semibold ${summary.unassigned === 0 ? "text-green-800" : "text-yellow-800"}`}>
                  {summary.assignmentRate}% assignment rate — {summary.assigned}/{summary.total} duties filled
                </p>
                {summary.unassigned > 0 && (
                  <p className="text-xs text-yellow-700 mt-0.5">
                    {summary.unassigned} duties unassigned — insufficient eligible staff for those skills/certs.
                  </p>
                )}
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-3">Assignment Results</h3>
            <div className="space-y-2">
              {results.map((r, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-mono text-gray-400 w-6">{idx + 1}</span>
                  <div className="flex-1">
                    <Link href={`/dashboard/duties/${r.dutyId}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {r.dutyId.slice(-8)}...
                    </Link>
                  </div>
                  {r.employeeId ? (
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-800">{r.employeeName}</p>
                      <p className="text-xs text-gray-500">{r.rule} · {Math.round(r.confidence * 100)}% match</p>
                    </div>
                  ) : (
                    <span className="text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle size={10} /> Unassigned
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href="/dashboard/duties"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                View all duties on board →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
