"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface BOM {
  id: string;
  bomNumber: string;
  name: string;
  version: string;
  bomType: string;
  status: string;
  isActive: boolean;
  productQuantity: number;
  standardYield: number;
  totalCost: number | null;
  product: {
    sku: string;
    name: string;
  };
  _count: {
    components: number;
    assemblyOrders: number;
  };
  createdAt: string;
}

interface AssemblyOrder {
  id: string;
  orderNumber: string;
  status: string;
  priority: number;
  plannedQuantity: number;
  producedQuantity: number;
  scrapQuantity: number;
  actualYield: number | null;
  componentsIssued: boolean;
  scheduledStart: string | null;
  actualStart: string | null;
  bom: {
    bomNumber: string;
    name: string;
  };
  product: {
    sku: string;
    name: string;
  };
  assignedTo: {
    name: string | null;
  } | null;
  _count: {
    componentIssues: number;
    productionLogs: number;
  };
  createdAt: string;
}

export default function AssemblyDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [orders, setOrders] = useState<AssemblyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"boms" | "orders">("boms");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bomTypeFilter, setBOMTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchBOMs();
    fetchOrders();
  }, [statusFilter, bomTypeFilter]);

  const fetchBOMs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (bomTypeFilter !== "all") params.append("bomType", bomTypeFilter);

      const response = await fetch(`/api/boms?${params}`);
      const data = await response.json();
      setBOMs(data.boms || []);
    } catch (error) {
      console.error("Failed to fetch BOMs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/assembly-orders?${params}`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Failed to fetch assembly orders:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-800",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      OBSOLETE: "bg-red-100 text-red-800",
      ARCHIVED: "bg-gray-100 text-gray-600",
      PENDING: "bg-gray-100 text-gray-800",
      READY: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      ON_HOLD: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      FAILED: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getBOMTypeBadge = (type: string) => {
    const colors = {
      ASSEMBLY: "bg-blue-100 text-blue-800",
      DISASSEMBLY: "bg-orange-100 text-orange-800",
      KIT: "bg-purple-100 text-purple-800",
      RECIPE: "bg-green-100 text-green-800",
      CONFIGURATION: "bg-indigo-100 text-indigo-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "text-red-600 font-bold";
    if (priority >= 5) return "text-orange-600 font-semibold";
    if (priority >= 3) return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Kitting & Assembly</h1>
          <p className="mt-2 text-gray-600">
            Manage BOMs, assembly orders, and production
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("boms")}
              className={`${
                activeTab === "boms"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Bills of Materials
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`${
                activeTab === "orders"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Assembly Orders
            </button>
          </nav>
        </div>

        {/* BOMs Tab */}
        {activeTab === "boms" && (
          <div>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BOM Type
                </label>
                <select
                  value={bomTypeFilter}
                  onChange={(e) => setBOMTypeFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Types</option>
                  <option value="ASSEMBLY">Assembly</option>
                  <option value="DISASSEMBLY">Disassembly</option>
                  <option value="KIT">Kit</option>
                  <option value="RECIPE">Recipe</option>
                  <option value="CONFIGURATION">Configuration</option>
                </select>
              </div>
              <div className="flex-1 flex items-end">
                <button
                  onClick={() => router.push("/assembly/boms/new")}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  New BOM
                </button>
              </div>
            </div>

            {/* BOMs List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading BOMs...
                </div>
              ) : boms.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No BOMs found
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        BOM Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Components
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yield
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {boms.map((bom) => (
                      <tr
                        key={bom.id}
                        onClick={() => router.push(`/assembly/boms/${bom.id}`)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bom.bomNumber}
                          <div className="text-xs text-gray-500">v{bom.version}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bom.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">{bom.product.sku}</div>
                          <div className="text-gray-500">{bom.product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBOMTypeBadge(
                              bom.bomType
                            )}`}
                          >
                            {bom.bomType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                              bom.status
                            )}`}
                          >
                            {bom.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bom._count.components} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bom.standardYield}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bom.totalCost !== null ? `$${Number(bom.totalCost).toFixed(2)}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Assembly Orders Tab */}
        {activeTab === "orders" && (
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
                  <option value="READY">Ready</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex-1 flex items-end">
                <button
                  onClick={() => router.push("/assembly/orders/new")}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  New Assembly Order
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No assembly orders found
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        BOM
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yield
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/assembly/orders/${order.id}`)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">{order.product.sku}</div>
                          <div className="text-gray-500">{order.product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.bom.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={getPriorityColor(order.priority)}>
                            {order.priority > 0 ? `P${order.priority}` : "Normal"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.producedQuantity} / {order.plannedQuantity}
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  (order.producedQuantity / order.plannedQuantity) * 100,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.actualYield !== null ? `${order.actualYield.toFixed(1)}%` : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.assignedTo?.name || "Unassigned"}
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
