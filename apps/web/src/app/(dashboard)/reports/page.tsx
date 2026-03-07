"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  TruckIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

export default function ReportingHub() {
  const router = useRouter();
  const [forecast, setForecast] = useState<any>(null);
  const [loadingForecast, setLoadingForecast] = useState(true);

  // Fetch forecast on load
  useEffect(() => {
    fetch("/api/reports/outbound-forecast")
      .then((res) => res.json())
      .then((data) => {
        setForecast(data);
        setLoadingForecast(false);
      })
      .catch((err) => {
        console.error("Failed to load forecast", err);
        setLoadingForecast(false);
      });
  }, []);

  const handleDownloadReport = (type: string) => {
    // Trigger actual browser download from our new API
    window.open(`/api/reports/download?type=${type}`, "_blank");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Enterprise Reporting Hub
          </h1>
          <p className="text-slate-500">
            Access operational reports, forecasts, and analytics.
          </p>
        </div>
        <button
          onClick={() => router.push("/reports/advanced")}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <ChartBarIcon className="w-5 h-5" />
          <span>Advanced Custom Builder</span>
        </button>
      </div>

      {/* 1. Outbound Pick Trajectory Widget (The "Predictive" Feature) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Outbound Pick Trajectory (Next 4 Hours)
            </h2>
          </div>
          <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
            Live Prediction
          </span>
        </div>

        {loadingForecast ? (
          <div className="animate-pulse h-32 bg-slate-100 rounded-lg"></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Active Pickers</p>
                <p className="text-2xl font-bold text-slate-900">
                  {forecast?.activePickers || 0}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Throughput Rate</p>
                <p className="text-2xl font-bold text-slate-900">
                  {forecast?.hourlyThroughputRate || 0} / hr
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg col-span-2">
                <p className="text-sm text-slate-500">Total Backlog</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {forecast?.totalBacklog || 0} items
                </p>
              </div>
            </div>

            {/* Right: Hourly Projections Table */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                Projected Completion
              </h3>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                        Time
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                        Projected Done
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {forecast?.projections?.map((proj: any) => (
                      <tr key={proj.hour}>
                        <td className="px-3 py-2 text-sm text-slate-900 font-medium">
                          {proj.timeLabel}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-600">
                          {proj.projectedItemsByUser} items
                        </td>
                        <td className="px-3 py-2">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-emerald-500 h-2 rounded-full"
                              style={{ width: `${proj.percentComplete}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">
                            {proj.percentComplete}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom: Wave Estimates for Trailer Planning */}
            <div className="col-span-1 lg:col-span-2 mt-4 pt-4 border-t border-slate-100">
              <h3 className="flex items-center text-sm font-semibold text-slate-800 mb-3">
                <TruckIcon className="w-4 h-4 mr-2" />
                Trailer Loading Planner (Wave Estimates)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forecast?.waveEstimates?.map((wave: any) => (
                  <div
                    key={wave.waveId}
                    className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {wave.waveName}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: {wave.waveId}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                        {new Date(wave.estimatedCompletion).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Est. {wave.hoursCurrentLoad} hours remaining
                    </div>
                  </div>
                ))}
                {(!forecast?.waveEstimates ||
                  forecast?.waveEstimates.length === 0) && (
                  <p className="text-sm text-slate-400 italic">
                    No active waves found.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Download Center (Standard Reports) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          Standard Reports Download
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReportCard
            title="Inventory Snapshot"
            desc="Current stock levels, locations, and valuation."
            icon={<TableCellsIcon className="w-8 h-8 text-blue-500" />}
            onDownload={() => handleDownloadReport("inventory")}
          />
          <ReportCard
            title="Picking Efficiency"
            desc="Worker productivity, pick rates, and error logs."
            icon={
              <PresentationChartLineIcon className="w-8 h-8 text-purple-500" />
            }
            onDownload={() => handleDownloadReport("picking")}
          />
          <ReportCard
            title="Shipping Manifests"
            desc="Daily outbound shipments and carrier data."
            icon={<TruckIcon className="w-8 h-8 text-orange-500" />}
            onDownload={() => handleDownloadReport("shipping")}
          />
          <ReportCard
            title="Receiving Logs"
            desc="Inbound ASN vs Actual receipt discrepancies."
            icon={<DocumentTextIcon className="w-8 h-8 text-teal-500" />}
            onDownload={() => handleDownloadReport("receiving")}
          />
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, desc, icon, onDownload }: any) {
  return (
    <div className="border border-slate-100 bg-slate-50 rounded-lg p-5 hover:border-indigo-200 hover:bg-white transition group">
      <div className="flex items-start space-x-4">
        <div className="bg-white p-2 rounded-lg shadow-sm group-hover:shadow-md transition">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
            {title}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">{desc}</p>
          <button
            onClick={onDownload}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            Download CSV <ArrowDownTrayIcon className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
