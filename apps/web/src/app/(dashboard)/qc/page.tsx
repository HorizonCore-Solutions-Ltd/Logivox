"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface QCInspection {
  id: string;
  inspectionNumber: string;
  category: string;
  status: string;
  result: string | null;
  qualityScore: number | null;
  createdAt: string;
  template: {
    name: string;
    code: string;
  };
  inventoryItem: {
    sku: string;
    name: string;
  };
  inspectedBy: {
    name: string | null;
  };
  _count: {
    checkpoints: number;
    approvals: number;
  };
}

interface InspectionTemplate {
  id: string;
  name: string;
  code: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export default function QCDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [inspections, setInspections] = useState<QCInspection[]>([]);
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"inspections" | "templates">(
    "inspections",
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");

  useEffect(() => {
    fetchInspections();
    fetchTemplates();
  }, [statusFilter, resultFilter]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (resultFilter !== "all") params.append("result", resultFilter);

      const response = await fetch(`/api/qc-inspections?${params}`);
      const data = await response.json();
      setInspections(data.inspections || []);
    } catch (error) {
      console.error("Failed to fetch inspections:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/inspection-templates");
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: "bg-gray-100 text-gray-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      AWAITING_APPROVAL: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return "bg-gray-100 text-gray-800";
    const colors = {
      PASS: "bg-green-100 text-green-800",
      PASS_WITH_NOTES: "bg-yellow-100 text-yellow-800",
      FAIL: "bg-red-100 text-red-800",
      CONDITIONAL: "bg-orange-100 text-orange-800",
    };
    return colors[result as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
          <p className="mt-2 text-gray-600">
            Manage inspections, templates, and quality standards
          </p>
        </div>

        {/* Sub-module Navigation */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            QC Modules
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { label: "Calibration", href: "/qc/calibration" },
              { label: "Non-Conformance", href: "/qc/ncr" },
              { label: "FMEA", href: "/qc/fmea" },
              { label: "Quality Holds", href: "/qc/quality-holds" },
              { label: "Complaints", href: "/qc/complaints" },
              { label: "Material Review", href: "/qc/mrb" },
              { label: "SPC", href: "/qc/spc" },
              { label: "Documents", href: "/qc/documents" },
              { label: "Training", href: "/qc/training" },
              { label: "Supplier Quality", href: "/qc/supplier-quality" },
              { label: "Measurements", href: "/qc/measurements" },
              { label: "Risk", href: "/qc/risk" },
              { label: "Debit Memos", href: "/qc/debit-memos" },
              { label: "Change Control", href: "/qc/changes" },
              { label: "Return to Vendor", href: "/qc/rtv" },
              { label: "Concessions", href: "/qc/concessions" },
              { label: "Reports", href: "/qc/reports" },
              { label: "Analytics", href: "/qc/analytics" },
              { label: "Audits", href: "/qc/audits" },
            ].map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-md border border-gray-200 hover:border-blue-300 transition-colors"
              >
                {m.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("inspections")}
              className={`${
                activeTab === "inspections"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Inspections
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`${
                activeTab === "templates"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Templates
            </button>
          </nav>
        </div>

        {/* Inspections Tab */}
        {activeTab === "inspections" && (
          <div>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result
                </label>
                <select
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Results</option>
                  <option value="PASS">Pass</option>
                  <option value="PASS_WITH_NOTES">Pass with Notes</option>
                  <option value="FAIL">Fail</option>
                  <option value="CONDITIONAL">Conditional</option>
                </select>
              </div>
              <div className="flex-1 flex items-end">
                <button
                  onClick={() => router.push("/qc/inspections/new")}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  New Inspection
                </button>
              </div>
            </div>

            {/* Inspections List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading inspections...
                </div>
              ) : inspections.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No inspections found
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inspection #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Result
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Checkpoints
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inspections.map((inspection) => (
                      <tr
                        key={inspection.id}
                        onClick={() =>
                          router.push(`/qc/inspections/${inspection.id}`)
                        }
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {inspection.inspectionNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">
                            {inspection.inventoryItem.sku}
                          </div>
                          <div className="text-gray-500">
                            {inspection.inventoryItem.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {inspection.template.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                              inspection.status,
                            )}`}
                          >
                            {inspection.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {inspection.result ? (
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getResultBadge(
                                inspection.result,
                              )}`}
                            >
                              {inspection.result.replace(/_/g, " ")}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {inspection.qualityScore !== null ? (
                            <div className="flex items-center">
                              <span className="font-medium">
                                {inspection.qualityScore}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {inspection._count.checkpoints} points
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(inspection.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div>
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => router.push("/qc/templates/new")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                New Template
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {templates.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No templates found
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {templates.map((template) => (
                      <tr
                        key={template.id}
                        onClick={() =>
                          router.push(`/qc/templates/${template.id}`)
                        }
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {template.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {template.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {template.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              template.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
