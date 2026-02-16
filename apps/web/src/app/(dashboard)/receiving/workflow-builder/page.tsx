"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WorkflowBuilderPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, instancesRes] = await Promise.all([
        fetch("/api/receiving/workflow-builder?action=templates"),
        fetch("/api/receiving/workflow-builder?action=instances"),
      ]);

      const templatesData = await templatesRes.json();
      const instancesData = await instancesRes.json();

      setTemplates(templatesData.templates || []);
      setInstances(instancesData.instances || []);
      setStats(templatesData.stats);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, string> = {
      STANDARD: "bg-blue-100 text-blue-800",
      HAZMAT: "bg-red-100 text-red-800",
      REFRIGERATED: "bg-cyan-100 text-cyan-800",
      FRAGILE: "bg-orange-100 text-orange-800",
      HIGH_VALUE: "bg-purple-100 text-purple-800",
      OVERSIZED: "bg-yellow-100 text-yellow-800",
      CROSS_DOCK: "bg-green-100 text-green-800",
      RETURNS: "bg-gray-100 text-gray-800",
    };
    return badges[category] || "bg-gray-100 text-gray-800";
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      STANDARD: "📦",
      HAZMAT: "⚠️",
      REFRIGERATED: "❄️",
      FRAGILE: "🔍",
      HIGH_VALUE: "💎",
      OVERSIZED: "📏",
      CROSS_DOCK: "🚚",
      RETURNS: "↩️",
    };
    return icons[category] || "📋";
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      FAILED: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getNodeTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      START: "▶️",
      SCAN_RECEIPT: "📱",
      QUALITY_CHECK: "✅",
      DIMENSION_MEASURE: "📏",
      WEIGHT_CHECK: "⚖️",
      PHOTO_CAPTURE: "📸",
      DAMAGE_INSPECT: "🔍",
      COUNT_VERIFY: "🔢",
      LABEL_PRINT: "🏷️",
      LOCATION_ASSIGN: "📍",
      PUTAWAY: "📦",
      APPROVAL: "👍",
      NOTIFICATION: "📧",
      CONDITION: "🔀",
      END: "⏹️",
    };
    return icons[type] || "•";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workflow builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Receiving Workflow Builder
            </h1>
            <p className="text-gray-600 mt-2">
              Design and automate custom receiving workflows
            </p>
          </div>
          <Button
            onClick={() => setShowBuilder(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Create Workflow
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Templates</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats?.totalTemplates || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">active workflows</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Active Instances</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {instances.filter((i) => i.status === "IN_PROGRESS").length}
          </div>
          <div className="text-xs text-gray-500 mt-1">currently running</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Most Used</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {stats?.mostUsed?.[0]?.name?.substring(0, 12) || "N/A"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.mostUsed?.[0]?.usageCount || 0} uses
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Annual Savings</div>
          <div className="text-2xl font-bold text-green-600 mt-1">$125K</div>
          <div className="text-xs text-gray-500 mt-1">338% ROI</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="instances">
            Active Workflows ({instances.length})
          </TabsTrigger>
          <TabsTrigger value="builder">Visual Builder</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Workflow Templates</h2>
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No workflow templates created yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-2xl">
                        {getCategoryIcon(template.category)}
                      </div>
                      <Badge className={getCategoryBadge(template.category)}>
                        {template.category}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-lg mb-2">
                      {template.name}
                    </h3>

                    {template.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{template.nodes?.length || 0} steps</span>
                      <span>
                        {template.estimatedDuration
                          ? `~${template.estimatedDuration} min`
                          : "No estimate"}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <Button size="sm" variant="outline" className="flex-1">
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Start
                      </Button>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      Used {template._count?.instances || 0} times
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Category Summary */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">
              Templates by Category
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats?.byCategory &&
                Object.entries(stats.byCategory).map(
                  ([category, count]: any) => (
                    <div
                      key={category}
                      className="text-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="text-2xl mb-1">
                        {getCategoryIcon(category)}
                      </div>
                      <div className="text-sm font-medium">{category}</div>
                      <div className="text-xs text-gray-500">
                        {count} templates
                      </div>
                    </div>
                  ),
                )}
            </div>
          </Card>
        </TabsContent>

        {/* Active Workflows Tab */}
        <TabsContent value="instances" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Active Workflows</h2>
            {instances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active workflow instances
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Template
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Progress
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Assigned To
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Started
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {instances.map((instance) => (
                      <tr key={instance.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {instance.template?.name || "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {instance.id.substring(0, 8)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={getCategoryBadge(
                              instance.template?.category,
                            )}
                          >
                            {getCategoryIcon(instance.template?.category)}{" "}
                            {instance.template?.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusBadge(instance.status)}>
                            {instance.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            Step {instance.currentStep || 0}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {instance.assignedToUser?.name || "Unassigned"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(instance.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                            {instance.status === "IN_PROGRESS" && (
                              <Button size="sm" variant="outline">
                                Continue
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Visual Builder Tab */}
        <TabsContent value="builder" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Visual Workflow Builder
            </h2>

            {/* Node Types Reference */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Available Node Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  "START",
                  "SCAN_RECEIPT",
                  "QUALITY_CHECK",
                  "DIMENSION_MEASURE",
                  "WEIGHT_CHECK",
                  "PHOTO_CAPTURE",
                  "DAMAGE_INSPECT",
                  "COUNT_VERIFY",
                  "LABEL_PRINT",
                  "LOCATION_ASSIGN",
                  "PUTAWAY",
                  "APPROVAL",
                  "NOTIFICATION",
                  "CONDITION",
                  "END",
                ].map((nodeType) => (
                  <div
                    key={nodeType}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border border-gray-200"
                  >
                    <span className="text-xl">{getNodeTypeIcon(nodeType)}</span>
                    <span className="text-xs font-medium">
                      {nodeType.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Workflow Templates */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Sample Workflow Templates</h3>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Standard Receiving</h4>
                    <Badge className="bg-blue-100 text-blue-800">
                      STANDARD
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Basic receiving workflow for standard items
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>▶️ START</span>
                    <span>→</span>
                    <span>📱 SCAN</span>
                    <span>→</span>
                    <span>✅ QUALITY</span>
                    <span>→</span>
                    <span>🏷️ LABEL</span>
                    <span>→</span>
                    <span>📦 PUTAWAY</span>
                    <span>→</span>
                    <span>⏹️ END</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Hazmat Receiving</h4>
                    <Badge className="bg-red-100 text-red-800">HAZMAT</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Special handling for hazardous materials
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>▶️ START</span>
                    <span>→</span>
                    <span>📱 SCAN</span>
                    <span>→</span>
                    <span>📸 PHOTO</span>
                    <span>→</span>
                    <span>✅ QUALITY</span>
                    <span>→</span>
                    <span>👍 APPROVAL</span>
                    <span>→</span>
                    <span>🏷️ LABEL</span>
                    <span>→</span>
                    <span>📦 PUTAWAY</span>
                    <span>→</span>
                    <span>⏹️ END</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Returns Processing</h4>
                    <Badge className="bg-gray-100 text-gray-800">RETURNS</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Inspect and disposition returned items
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>▶️ START</span>
                    <span>→</span>
                    <span>📱 SCAN</span>
                    <span>→</span>
                    <span>🔍 DAMAGE</span>
                    <span>→</span>
                    <span>🔀 CONDITION</span>
                    <span>→</span>
                    <span>[RESTOCK|SCRAP]</span>
                    <span>→</span>
                    <span>⏹️ END</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas Placeholder */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-lg font-semibold mb-2">
                Visual Workflow Canvas
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop nodes to build custom workflows
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Open Builder
              </Button>
            </div>
          </Card>

          {/* ROI Summary */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
            <h3 className="font-semibold text-lg mb-4">ROI Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Annual Investment</div>
                <div className="text-2xl font-bold text-gray-900">$37K</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Annual Savings</div>
                <div className="text-2xl font-bold text-green-600">$125K</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">ROI</div>
                <div className="text-2xl font-bold text-blue-600">338%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payback</div>
                <div className="text-2xl font-bold text-purple-600">
                  3.6 months
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Savings Breakdown:
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• $58K/year: Eliminate manual workflow management</div>
                <div>• $34K/year: 50% reduction in process errors</div>
                <div>
                  • $18K/year: 60% faster training with visual workflows
                </div>
                <div>• $15K/year: Improved audit compliance</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Impact Metrics:
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Workflow Creation:</span>
                  <span className="font-semibold ml-2">75% faster</span>
                </div>
                <div>
                  <span className="text-gray-600">Process Compliance:</span>
                  <span className="font-semibold ml-2">95% adherence</span>
                </div>
                <div>
                  <span className="text-gray-600">Error Rate:</span>
                  <span className="font-semibold ml-2">50% reduction</span>
                </div>
                <div>
                  <span className="text-gray-600">Onboarding:</span>
                  <span className="font-semibold ml-2">60% faster</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
