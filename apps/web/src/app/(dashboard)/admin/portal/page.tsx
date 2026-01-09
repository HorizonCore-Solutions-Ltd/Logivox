/**
 * Admin Override Portal
 * Full CRUD interface for all LogiVox entities
 */

"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Package,
  Truck,
  Users,
  Activity,
  MessageSquare,
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

type EntityType =
  | "loadsheets"
  | "containers"
  | "baydoors"
  | "voices"
  | "supervision"
  | "collaboration";

export default function AdminPortal() {
  const [selectedEntity, setSelectedEntity] =
    useState<EntityType>("loadsheets");
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const entityConfig: Record<
    EntityType,
    {
      label: string;
      icon: any;
      endpoint: string;
      fields: string[];
    }
  > = {
    loadsheets: {
      label: "Load Sheets",
      icon: FileText,
      endpoint: "/api/loadsheets",
      fields: ["loadSheetNumber", "status", "customer", "shipmentDate"],
    },
    containers: {
      label: "Containers",
      icon: Package,
      endpoint: "/api/containers",
      fields: ["containerNumber", "status", "weight", "volume"],
    },
    baydoors: {
      label: "Bay Doors",
      icon: Truck,
      endpoint: "/api/bay-doors",
      fields: ["doorNumber", "doorType", "status", "maxWeight"],
    },
    voices: {
      label: "Voice Sessions",
      icon: Activity,
      endpoint: "/api/voice/session",
      fields: ["sessionType", "status", "accuracy", "commandCount"],
    },
    supervision: {
      label: "AI Supervision",
      icon: Users,
      endpoint: "/api/ai-supervision",
      fields: ["worker", "productivityScore", "accuracyScore", "status"],
    },
    collaboration: {
      label: "Collaboration",
      icon: MessageSquare,
      endpoint: "/api/collaboration",
      fields: ["requestType", "taskType", "status", "priority"],
    },
  };

  useEffect(() => {
    fetchEntities();
  }, [selectedEntity]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const config = entityConfig[selectedEntity];
      const response = await fetch(config.endpoint);
      const data = await response.json();

      // Extract entities from response (different APIs return different keys)
      const extractedEntities =
        data.loadSheets ||
        data.doors ||
        data.containers ||
        data.sessions ||
        data.requests ||
        [];

      setEntities(extractedEntities);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntity = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const config = entityConfig[selectedEntity];
      const response = await fetch(`${config.endpoint}?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Deleted successfully");
        fetchEntities();
      } else {
        alert("Failed to delete");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting item");
    }
  };

  const filteredEntities = entities.filter((entity) => {
    const searchLower = searchQuery.toLowerCase();
    return Object.values(entity).some((value) =>
      String(value).toLowerCase().includes(searchLower),
    );
  });

  const config = entityConfig[selectedEntity];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Override Portal
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Full CRUD access to all LogiVox entities
              </p>
            </div>
            <Settings className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-bold text-gray-900">Entities</h2>
              </div>
              <nav className="p-2">
                {Object.entries(entityConfig).map(([key, cfg]) => {
                  const NavIcon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedEntity(key as EntityType)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                        selectedEntity === key
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <NavIcon className="w-5 h-5" />
                      {cfg.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow">
              {/* Toolbar */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-gray-600" />
                  <h2 className="text-lg font-bold text-gray-900">
                    {config.label}
                  </h2>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm font-medium">
                    {filteredEntities.length}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Create Button */}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    <Plus className="w-4 h-4" />
                    Create New
                  </button>
                </div>
              </div>

              {/* Entity Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredEntities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Icon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>No {config.label.toLowerCase()} found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {config.fields.map((field) => (
                          <th
                            key={field}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {field.replace(/([A-Z])/g, " $1").trim()}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEntities.map((entity) => (
                        <tr
                          key={entity.id}
                          className="hover:bg-gray-50 transition"
                        >
                          {config.fields.map((field) => (
                            <td
                              key={field}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {typeof entity[field] === "object"
                                ? entity[field]?.name ||
                                  JSON.stringify(entity[field])
                                : String(entity[field] || "-")}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedItem(entity)}
                                className="text-blue-600 hover:text-blue-900 transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedItem(entity);
                                  setShowCreateModal(true);
                                }}
                                className="text-green-600 hover:text-green-900 transition"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteEntity(entity.id)}
                                className="text-red-600 hover:text-red-900 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedItem && !showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Entity Details</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(selectedItem, null, 2)}
              </pre>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedItem ? "Edit" : "Create"} {config.label}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedItem(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Use the API directly or implement form fields here based on
                entity type.
              </p>

              {/* TODO: Implement dynamic form based on selectedEntity */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                Form fields for {config.label} would go here. For now, use API
                endpoints directly.
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
