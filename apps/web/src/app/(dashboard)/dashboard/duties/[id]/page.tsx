"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Shield,
  Mic,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  SkipForward,
  Camera,
  FileText,
  Thermometer,
  Hash,
  ChevronRight,
  Zap,
  RefreshCw,
} from "lucide-react";

interface Duty {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  priority: string;
  zoneName?: string;
  warehouseId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  durationMinutes?: number;
  slaMinutes?: number;
  slaBreached: boolean;
  capaId?: string;
  capaStage?: string;
  ncrId?: string;
  employeeId?: string;
  autoAssigned: boolean;
  assignmentRule?: string;
  completionNotes?: string;
  checklistItems?: Array<{ step: string; required: boolean; done: boolean; doneAt?: string }>;
  voiceScriptRef?: string;
  evidence: Evidence[];
  dutyType?: { name: string; category: string; voiceTemplate?: any };
}

interface Evidence {
  id: string;
  evidenceType: string;
  label?: string;
  value?: string;
  capturedAt: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  SKIPPED: "bg-orange-100 text-orange-700",
  ESCALATED: "bg-purple-100 text-purple-700",
};

const EVIDENCE_ICONS: Record<string, React.ReactNode> = {
  PHOTO: <Camera size={14} />,
  TEXT_NOTE: <FileText size={14} />,
  VOICE_NOTE: <Mic size={14} />,
  TEMPERATURE: <Thermometer size={14} />,
  BARCODE_SCAN: <Hash size={14} />,
  NUMERIC_READING: <Hash size={14} />,
};

function formatDT(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

export default function DutyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [duty, setDuty] = useState<Duty | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [voiceScript, setVoiceScript] = useState<any>(null);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({ evidenceType: "TEXT_NOTE", label: "", value: "" });
  const [checklistItems, setChecklistItems] = useState<Duty["checklistItems"]>([]);

  const loadDuty = async () => {
    const res = await fetch(`/api/duties/${id}`);
    const data = await res.json();
    setDuty(data.duty);
    setEmployee(data.employee);
    setChecklistItems(data.duty?.checklistItems ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadDuty();
  }, [id]);

  const transition = async (status: string, extra?: object) => {
    setActionLoading(true);
    await fetch(`/api/duties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    await loadDuty();
    setActionLoading(false);
  };

  const compileVoice = async () => {
    const res = await fetch(`/api/duties/${id}/voice`, { method: "POST" });
    const data = await res.json();
    setVoiceScript(data.script);
  };

  const submitEvidence = async () => {
    await fetch(`/api/duties/${id}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evidenceForm),
    });
    setShowEvidenceForm(false);
    loadDuty();
  };

  const toggleChecklist = async (idx: number) => {
    if (!checklistItems) return;
    const updated = checklistItems.map((item, i) =>
      i === idx ? { ...item, done: !item.done, doneAt: new Date().toISOString() } : item
    );
    setChecklistItems(updated);
    await fetch(`/api/duties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklistItems: updated }),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!duty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={40} className="text-red-400 mx-auto mb-2" />
          <p className="text-gray-600">Duty not found</p>
          <Link href="/dashboard/duties" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            ← Back to board
          </Link>
        </div>
      </div>
    );
  }

  const isActive = duty.status === "ACTIVE";
  const isDone = duty.status === "DONE" || duty.status === "CANCELLED";
  const checklistDone = (checklistItems ?? []).filter((c) => c.done).length;
  const checklistTotal = (checklistItems ?? []).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back */}
      <Link
        href="/dashboard/duties"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Duty Board
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[duty.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {duty.status}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${duty.priority === "CRITICAL" ? "bg-red-100 text-red-700" : duty.priority === "HIGH" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                    {duty.priority}
                  </span>
                  {duty.slaBreached && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <AlertTriangle size={10} /> SLA Breached
                    </span>
                  )}
                  {duty.capaId && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Shield size={10} /> CAPA — {duty.capaStage?.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900">{duty.title}</h1>
                {duty.description && (
                  <p className="text-sm text-gray-500 mt-2">{duty.description}</p>
                )}
              </div>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              {[
                { label: "Scheduled Start", value: formatDT(duty.scheduledStart) },
                { label: "Scheduled End", value: formatDT(duty.scheduledEnd) },
                { label: "Actual Start", value: formatDT(duty.actualStart) },
                { label: "Duration", value: duty.durationMinutes ? `${duty.durationMinutes}m` : "—" },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-gray-500">{f.label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            {!isDone && (
              <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100">
                {duty.status === "PLANNED" && (
                  <button
                    onClick={() => transition("ACTIVE")}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    <Play size={14} /> Start Duty
                  </button>
                )}
                {isActive && (
                  <>
                    <button
                      onClick={() => transition("DONE")}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                    >
                      <CheckCircle2 size={14} /> Mark Done
                    </button>
                    <button
                      onClick={() => transition("PAUSED")}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      <Pause size={14} /> Pause
                    </button>
                    <button
                      onClick={() => transition("ESCALATED")}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <AlertTriangle size={14} /> Escalate
                    </button>
                  </>
                )}
                {duty.status === "PAUSED" && (
                  <button
                    onClick={() => transition("ACTIVE")}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play size={14} /> Resume
                  </button>
                )}
                <button
                  onClick={() => transition("CANCELLED")}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <SkipForward size={14} /> Cancel
                </button>
              </div>
            )}

            {duty.status === "DONE" && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <p className="text-sm text-green-800 font-medium">
                  Duty completed at {formatDT(duty.actualEnd)}
                  {duty.completionNotes && ` — ${duty.completionNotes}`}
                </p>
              </div>
            )}
          </div>

          {/* Checklist */}
          {checklistItems && checklistItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardList size={16} className="text-blue-500" /> Checklist
                </h2>
                <span className="text-xs text-gray-500">
                  {checklistDone}/{checklistTotal} completed
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${checklistTotal > 0 ? (checklistDone / checklistTotal) * 100 : 0}%` }}
                />
              </div>
              <div className="space-y-2">
                {checklistItems.map((item, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${item.done ? "bg-green-50" : "bg-gray-50 hover:bg-gray-100"}`}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleChecklist(idx)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className={`text-sm flex-1 ${item.done ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {item.step}
                    </span>
                    {item.required && !item.done && (
                      <span className="text-xs text-red-500 font-medium">Required</span>
                    )}
                    {item.done && item.doneAt && (
                      <span className="text-xs text-gray-400">{formatDT(item.doneAt)}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Camera size={16} className="text-blue-500" /> Evidence Captured
              </h2>
              <button
                onClick={() => setShowEvidenceForm(!showEvidenceForm)}
                className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
              >
                + Add evidence
              </button>
            </div>

            {showEvidenceForm && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Type</label>
                    <select
                      value={evidenceForm.evidenceType}
                      onChange={(e) => setEvidenceForm((f) => ({ ...f, evidenceType: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {["TEXT_NOTE","VOICE_NOTE","NUMERIC_READING","TEMPERATURE","BARCODE_SCAN","CHECKLIST"].map((t) => (
                        <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Label</label>
                    <input
                      value={evidenceForm.label}
                      onChange={(e) => setEvidenceForm((f) => ({ ...f, label: e.target.value }))}
                      placeholder="e.g. Temperature reading"
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-gray-600 mb-1 block">Value / Note</label>
                  <textarea
                    value={evidenceForm.value}
                    onChange={(e) => setEvidenceForm((f) => ({ ...f, value: e.target.value }))}
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={submitEvidence}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Evidence
                  </button>
                  <button
                    onClick={() => setShowEvidenceForm(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {duty.evidence.length === 0 && !showEvidenceForm && (
              <p className="text-xs text-gray-400 italic">No evidence captured yet.</p>
            )}

            <div className="space-y-2">
              {duty.evidence.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500">{EVIDENCE_ICONS[ev.evidenceType] ?? <FileText size={14} />}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700">{ev.label ?? ev.evidenceType.replace(/_/g, " ")}</p>
                    {ev.value && <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.value}</p>}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDT(ev.capturedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Assignment */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User size={14} className="text-blue-500" /> Assigned To
            </h3>
            {employee ? (
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {employee.firstName} {employee.lastName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{employee.position ?? "—"}</p>
                <p className="text-xs text-gray-400">{employee.department ?? "—"}</p>
              </div>
            ) : (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <AlertTriangle size={12} /> Unassigned
              </p>
            )}
            {duty.autoAssigned && (
              <p className="text-xs text-cyan-600 mt-2 flex items-center gap-1">
                <Zap size={10} /> Auto-assigned ({duty.assignmentRule})
              </p>
            )}
          </div>

          {/* CAPA Link */}
          {duty.capaId && (
            <div className="bg-white rounded-xl border border-purple-200 p-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Shield size={14} className="text-purple-500" /> CAPA Linked
              </h3>
              <p className="text-xs text-purple-700 font-medium mb-1">
                Stage: {duty.capaStage?.replace(/_/g, " ")}
              </p>
              <Link
                href={`/capa/hub`}
                className="text-xs text-purple-600 hover:underline flex items-center gap-1"
              >
                View CAPA <ChevronRight size={10} />
              </Link>
              {duty.ncrId && (
                <p className="text-xs text-gray-500 mt-1">NCR: {duty.ncrId.slice(-8)}</p>
              )}
            </div>
          )}

          {/* Voice Script */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mic size={14} className="text-green-500" /> Voice Workflow
            </h3>
            {!voiceScript ? (
              <button
                onClick={compileVoice}
                className="w-full text-sm flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Mic size={14} /> Compile Voice Script
              </button>
            ) : (
              <div className="space-y-2">
                {voiceScript.steps?.map((step: any) => (
                  <div key={step.seq} className="flex gap-2.5 items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold">
                      {step.seq}
                    </span>
                    <div>
                      <p className="text-xs text-gray-800">{step.prompt}</p>
                      {step.checkDigit && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Check digit: <code className="font-mono">{step.checkDigit}</code>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SLA info */}
          {duty.slaMinutes && (
            <div className={`rounded-xl border p-4 ${duty.slaBreached ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock size={14} className={duty.slaBreached ? "text-red-500" : "text-blue-500"} />
                SLA Window
              </h3>
              <p className={`text-sm font-medium ${duty.slaBreached ? "text-red-700" : "text-gray-900"}`}>
                {duty.slaMinutes >= 60
                  ? `${Math.round(duty.slaMinutes / 60)}h`
                  : `${duty.slaMinutes}m`}
              </p>
              {duty.slaBreached && (
                <p className="text-xs text-red-600 mt-1 font-medium">⚠ SLA exceeded</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
