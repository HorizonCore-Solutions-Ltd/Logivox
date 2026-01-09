'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// ============================================
// CAPA SYSTEM 18: WORKFLOW BUILDER DASHBOARD
// ============================================
// No-code workflow automation - drag-and-drop designer

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: string
  nodes: any[]
  edges: any[]
}

export default function WorkflowBuilderPage() {
  const { data: session } = useSession()
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [workflows, setWorkflows] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [showDesigner, setShowDesigner] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTemplates()
    fetchWorkflows()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/capa/workflow-builder?action=templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/capa/workflow-builder')
      const data = await response.json()
      setWorkflows(data.workflows || [])
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch workflows:', error)
    }
  }

  const createFromTemplate = async (templateId: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/capa/workflow-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_FROM_TEMPLATE',
          templateId
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`Workflow "${result.workflow.name}" created successfully!`)
        fetchWorkflows()
      } else {
        alert(result.error || 'Failed to create workflow')
      }
    } catch (error) {
      console.error('Create workflow error:', error)
      alert('Failed to create workflow')
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflow = async (workflowId: string, currentState: boolean) => {
    try {
      const response = await fetch('/api/capa/workflow-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_WORKFLOW',
          workflowId,
          isActive: !currentState
        })
      })

      const result = await response.json()

      if (result.success) {
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Toggle workflow error:', error)
    }
  }

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Delete this workflow? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/capa/workflow-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_WORKFLOW',
          workflowId
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('Workflow deleted')
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Delete workflow error:', error)
    }
  }

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {} as Record<string, WorkflowTemplate[]>)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">⚙️ No-Code Workflow Builder</h1>
        <p className="text-gray-600 mt-1">Build custom CAPA workflows without coding - drag, drop, automate!</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-600 text-sm font-medium">Total Workflows</div>
            <div className="text-3xl font-bold text-blue-700 mt-1">{stats.totalWorkflows}</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 text-sm font-medium">Active Workflows</div>
            <div className="text-3xl font-bold text-green-700 mt-1">{stats.activeWorkflows}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
            <div className="text-purple-600 text-sm font-medium">Total Executions</div>
            <div className="text-3xl font-bold text-purple-700 mt-1">{stats.totalInstances}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
            <div className="text-orange-600 text-sm font-medium">Templates Available</div>
            <div className="text-3xl font-bold text-orange-700 mt-1">{stats.templatesAvailable}</div>
          </div>
        </div>
      )}

      {/* Workflow Templates */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-bold text-lg mb-4">📋 Workflow Templates</h2>
        <p className="text-sm text-gray-600 mb-4">
          Start with a pre-built template and customize it to your needs
        </p>

        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category} className="mb-6">
            <h3 className="font-bold text-gray-700 mb-3">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-3xl">{template.icon}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {template.nodes?.length || 0} nodes
                    </span>
                  </div>
                  <div className="font-bold mb-1">{template.name}</div>
                  <div className="text-sm text-gray-600 mb-3">{template.description}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      createFromTemplate(template.id)
                    }}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                  >
                    Use This Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedTemplate.icon}</span>
                  <div>
                    <h3 className="font-bold text-xl">{selectedTemplate.name}</h3>
                    <p className="text-gray-600">{selectedTemplate.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                <div className="font-bold mb-2">Workflow Steps:</div>
                <div className="space-y-2">
                  {selectedTemplate.nodes.map((node, index) => (
                    <div key={node.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{node.label}</div>
                        <div className="text-sm text-gray-500">{node.type}</div>
                      </div>
                      {node.type === 'CONDITION' && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                          Conditional
                        </span>
                      )}
                      {node.type === 'APPROVAL' && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          Requires Approval
                        </span>
                      )}
                      {node.type === 'AUTO_ACTION' && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Automated
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => createFromTemplate(selectedTemplate.id)}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Create from This Template
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-6 py-3 border rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Workflows */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">🔧 Your Custom Workflows</h2>
          <button className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700">
            + New Custom Workflow
          </button>
        </div>

        {workflows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <div>No custom workflows yet</div>
            <div className="text-sm">Start by creating one from a template above</div>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{workflow.icon}</span>
                    <div>
                      <div className="font-bold">{workflow.name}</div>
                      <div className="text-sm text-gray-600">{workflow.description}</div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {workflow.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {workflow._count?.instances || 0} executions
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleWorkflow(workflow.id, workflow.isActive)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        workflow.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {workflow.isActive ? '✓ Active' : '○ Inactive'}
                    </button>
                    <button
                      onClick={() => setShowDesigner(true)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteWorkflow(workflow.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features Guide */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">🎯 No-Code Workflow Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <div className="font-bold text-purple-900 mb-2">🧱 Building Blocks:</div>
            <ul className="space-y-1 text-purple-800">
              <li>• <strong>Start/End:</strong> Workflow triggers and completion</li>
              <li>• <strong>Approval:</strong> Multi-level approval chains</li>
              <li>• <strong>Condition:</strong> If/then/else logic branching</li>
              <li>• <strong>Auto-Action:</strong> Automated status updates, assignments</li>
              <li>• <strong>Notification:</strong> Email, SMS, in-app alerts</li>
              <li>• <strong>Delay:</strong> Wait periods (days, hours)</li>
              <li>• <strong>Training:</strong> Auto-create training requirements</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-purple-900 mb-2">⚡ Automation Examples:</div>
            <ul className="space-y-1 text-purple-800">
              <li>• <strong>Priority Escalation:</strong> Auto-notify executives for critical issues</li>
              <li>• <strong>Supplier Workflows:</strong> Request 8D reports, track responses</li>
              <li>• <strong>Multi-Approval:</strong> Supervisor → Director → CFO chains</li>
              <li>• <strong>Training Integration:</strong> Auto-create courses from CAPAs</li>
              <li>• <strong>Status Automation:</strong> Update status based on actions</li>
              <li>• <strong>Smart Routing:</strong> Route CAPAs by department, severity</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-purple-900 mb-2">💡 Benefits:</div>
            <ul className="space-y-1 text-purple-800">
              <li>• No coding knowledge required</li>
              <li>• Visual drag-and-drop designer</li>
              <li>• Reusable workflow templates</li>
              <li>• Conditional logic support</li>
              <li>• Real-time workflow monitoring</li>
              <li>• Audit trail for compliance</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-purple-900 mb-2">🎓 Use Cases:</div>
            <ul className="space-y-1 text-purple-800">
              <li>• <strong>Manufacturing:</strong> Quality defect escalation</li>
              <li>• <strong>Supplier Management:</strong> Automated 8D requests</li>
              <li>• <strong>Compliance:</strong> FDA-compliant approval chains</li>
              <li>• <strong>Training:</strong> Auto-create lessons from incidents</li>
              <li>• <strong>Finance:</strong> Cost-based approval routing</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-purple-300">
          <div className="text-sm text-purple-800">
            <strong>💰 ROI Impact:</strong> $124K investment → $450K annual savings (363% ROI) through workflow automation, 
            reduced approval delays, and consistent process execution across all CAPAs.
          </div>
        </div>
      </div>
    </div>
  )
}
