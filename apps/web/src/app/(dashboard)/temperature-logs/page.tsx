"use client";

import { useState, useEffect } from "react";
import {
  Thermometer,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface TempLog {
  id: string;
  temperature: number;
  humidity?: number;
  timestamp: string;
  warehouse: { name: string };
  location?: { name: string };
  recordedBy: { name: string };
  isViolation: boolean;
  sensorType: string;
}

export default function TemperatureLogsPage() {
  const [logs, setLogs] = useState<TempLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    fetchLogs();
  }, [selectedDate]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      params.append("startDate", selectedDate);
      params.append("endDate", selectedDate);

      const res = await fetch(`/api/temperature-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Error fetching temperature logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const violations = logs.filter((log) => log.isViolation);
  const avgTemp =
    logs.length > 0
      ? (
          logs.reduce((sum, log) => sum + log.temperature, 0) / logs.length
        ).toFixed(1)
      : "0";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Temperature Monitoring
          </h1>
          <p className="text-gray-600 mt-1">Cold chain compliance tracking</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Readings</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
            <Thermometer className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Temperature</p>
              <p className="text-2xl font-bold">{avgTemp}°C</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Violations</p>
              <p className="text-2xl font-bold text-red-600">
                {violations.length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliance Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {logs.length > 0
                  ? ((1 - violations.length / logs.length) * 100).toFixed(1)
                  : "100"}
                %
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Temperature Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Warehouse
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Temperature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Humidity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Recorded By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No temperature logs for this date
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className={log.isViolation ? "bg-red-50" : "hover:bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.warehouse.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.location?.name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-medium ${log.isViolation ? "text-red-600" : "text-gray-900"}`}
                    >
                      {log.temperature}°C
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.humidity ? `${log.humidity}%` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.recordedBy.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.isViolation ? (
                      <span className="flex items-center text-xs text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Violation
                      </span>
                    ) : (
                      <span className="text-xs text-green-600">✓ Normal</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
