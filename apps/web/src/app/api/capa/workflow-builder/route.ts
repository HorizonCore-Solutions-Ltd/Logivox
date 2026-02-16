import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// ============================================
// CAPA SYSTEM 18: NO-CODE WORKFLOW AUTOMATION
// ============================================
// Build custom CAPA workflows without coding
// Drag-and-drop designer, conditional logic, auto-actions

// Workflow Node Types
const NODE_TYPES = {
  START: "START",
  APPROVAL: "APPROVAL",
  NOTIFICATION: "NOTIFICATION",
  AUTO_ACTION: "AUTO_ACTION",
  CONDITION: "CONDITION",
  TRAINING: "TRAINING",
  INSPECTION: "INSPECTION",
  DOCUMENTATION: "DOCUMENTATION",
  DELAY: "DELAY",
  END: "END",
};

// Pre-built Workflow Templates
const WORKFLOW_TEMPLATES = {
  STANDARD_CAPA: {
    name: "Standard CAPA Workflow",
    description:
      "Basic CAPA process: Create → Investigate → Implement → Verify → Close",
    icon: "📋",
    category: "Basic",
    nodes: [
      {
        id: "start",
        type: "START",
        label: "CAPA Created",
        position: { x: 100, y: 100 },
        config: {},
      },
      {
        id: "investigation",
        type: "AUTO_ACTION",
        label: "Auto-Assign to QC Manager",
        position: { x: 100, y: 200 },
        config: {
          action: "ASSIGN_TO_ROLE",
          roleId: "QC_MANAGER",
          sendNotification: true,
        },
      },
      {
        id: "approval1",
        type: "APPROVAL",
        label: "Manager Approval",
        position: { x: 100, y: 300 },
        config: {
          approverRole: "MANAGER",
          requiresComment: true,
        },
      },
      {
        id: "implementation",
        type: "AUTO_ACTION",
        label: "Update Status to In Progress",
        position: { x: 100, y: 400 },
        config: {
          action: "UPDATE_STATUS",
          newStatus: "IN_PROGRESS",
        },
      },
      {
        id: "end",
        type: "END",
        label: "CAPA Closed",
        position: { x: 100, y: 500 },
        config: {},
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "investigation" },
      { id: "e2", source: "investigation", target: "approval1" },
      { id: "e3", source: "approval1", target: "implementation" },
      { id: "e4", source: "implementation", target: "end" },
    ],
  },

  HIGH_PRIORITY_ESCALATION: {
    name: "High Priority Escalation",
    description: "Auto-escalate high-priority CAPAs to executives",
    icon: "🚨",
    category: "Advanced",
    nodes: [
      {
        id: "start",
        type: "START",
        label: "CAPA Created",
        position: { x: 100, y: 100 },
        config: {},
      },
      {
        id: "check_priority",
        type: "CONDITION",
        label: "Is Priority HIGH or CRITICAL?",
        position: { x: 100, y: 200 },
        config: {
          field: "priority",
          operator: "IN",
          value: ["HIGH", "CRITICAL"],
        },
      },
      {
        id: "escalate",
        type: "NOTIFICATION",
        label: "Notify Executive Team",
        position: { x: 100, y: 300 },
        config: {
          recipients: ["EXECUTIVE", "QUALITY_DIRECTOR"],
          messageTemplate: "High priority CAPA requires immediate attention",
          urgency: "HIGH",
        },
      },
      {
        id: "standard_flow",
        type: "AUTO_ACTION",
        label: "Standard Assignment",
        position: { x: 300, y: 300 },
        config: {
          action: "ASSIGN_TO_ROLE",
          roleId: "QC_MANAGER",
        },
      },
      {
        id: "end",
        type: "END",
        label: "Continue CAPA Process",
        position: { x: 200, y: 400 },
        config: {},
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "check_priority" },
      {
        id: "e2",
        source: "check_priority",
        target: "escalate",
        condition: "TRUE",
      },
      {
        id: "e3",
        source: "check_priority",
        target: "standard_flow",
        condition: "FALSE",
      },
      { id: "e4", source: "escalate", target: "end" },
      { id: "e5", source: "standard_flow", target: "end" },
    ],
  },

  SUPPLIER_CAPA: {
    name: "Supplier CAPA Workflow",
    description: "Workflow for supplier-related quality issues",
    icon: "🏭",
    category: "Specialized",
    nodes: [
      {
        id: "start",
        type: "START",
        label: "Supplier Issue Detected",
        position: { x: 100, y: 100 },
        config: {},
      },
      {
        id: "notify_supplier",
        type: "NOTIFICATION",
        label: "Notify Supplier",
        position: { x: 100, y: 200 },
        config: {
          recipients: ["SUPPLIER_CONTACT"],
          messageTemplate: "Quality issue identified in delivered goods",
          includeCAPA: true,
        },
      },
      {
        id: "request_8d",
        type: "AUTO_ACTION",
        label: "Request 8D Report",
        position: { x: 100, y: 300 },
        config: {
          action: "CREATE_TASK",
          taskType: "8D_REPORT",
          dueInDays: 14,
        },
      },
      {
        id: "delay",
        type: "DELAY",
        label: "Wait 14 Days",
        position: { x: 100, y: 400 },
        config: {
          duration: 14,
          unit: "DAYS",
        },
      },
      {
        id: "check_response",
        type: "CONDITION",
        label: "8D Report Received?",
        position: { x: 100, y: 500 },
        config: {
          field: "has8DReport",
          operator: "EQUALS",
          value: true,
        },
      },
      {
        id: "escalate_supplier",
        type: "NOTIFICATION",
        label: "Escalate to Procurement",
        position: { x: 100, y: 600 },
        config: {
          recipients: ["PROCUREMENT_DIRECTOR"],
          messageTemplate: "Supplier has not responded to quality issue",
          urgency: "HIGH",
        },
      },
      {
        id: "end",
        type: "END",
        label: "Continue Resolution",
        position: { x: 200, y: 700 },
        config: {},
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "notify_supplier" },
      { id: "e2", source: "notify_supplier", target: "request_8d" },
      { id: "e3", source: "request_8d", target: "delay" },
      { id: "e4", source: "delay", target: "check_response" },
      {
        id: "e5",
        source: "check_response",
        target: "escalate_supplier",
        condition: "FALSE",
      },
      { id: "e6", source: "check_response", target: "end", condition: "TRUE" },
      { id: "e7", source: "escalate_supplier", target: "end" },
    ],
  },

  TRAINING_INTEGRATION: {
    name: "CAPA with Training",
    description: "Auto-create training when CAPA closed",
    icon: "🎓",
    category: "Integrated",
    nodes: [
      {
        id: "start",
        type: "START",
        label: "CAPA Completed",
        position: { x: 100, y: 100 },
        config: {
          trigger: "STATUS_CHANGED",
          status: "COMPLETED",
        },
      },
      {
        id: "check_training_needed",
        type: "CONDITION",
        label: "Training Required?",
        position: { x: 100, y: 200 },
        config: {
          field: "requiresTraining",
          operator: "EQUALS",
          value: true,
        },
      },
      {
        id: "create_training",
        type: "TRAINING",
        label: "Create Training Course",
        position: { x: 100, y: 300 },
        config: {
          courseTemplate: "CAPA_LESSONS_LEARNED",
          assignToAffectedUsers: true,
          dueInDays: 30,
        },
      },
      {
        id: "notify_team",
        type: "NOTIFICATION",
        label: "Notify Team of Training",
        position: { x: 100, y: 400 },
        config: {
          recipients: ["AFFECTED_USERS"],
          messageTemplate: "New training available based on recent CAPA",
        },
      },
      {
        id: "end",
        type: "END",
        label: "Workflow Complete",
        position: { x: 100, y: 500 },
        config: {},
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "check_training_needed" },
      {
        id: "e2",
        source: "check_training_needed",
        target: "create_training",
        condition: "TRUE",
      },
      {
        id: "e3",
        source: "check_training_needed",
        target: "end",
        condition: "FALSE",
      },
      { id: "e4", source: "create_training", target: "notify_team" },
      { id: "e5", source: "notify_team", target: "end" },
    ],
  },

  MULTI_APPROVAL_CHAIN: {
    name: "Multi-Level Approval",
    description: "Multiple approval stages with conditional routing",
    icon: "✅",
    category: "Advanced",
    nodes: [
      {
        id: "start",
        type: "START",
        label: "CAPA Submitted",
        position: { x: 100, y: 100 },
        config: {},
      },
      {
        id: "supervisor_approval",
        type: "APPROVAL",
        label: "Supervisor Review",
        position: { x: 100, y: 200 },
        config: {
          approverRole: "SUPERVISOR",
          requiresComment: true,
          autoRejectAfterDays: 3,
        },
      },
      {
        id: "check_cost",
        type: "CONDITION",
        label: "Financial Impact > $10K?",
        position: { x: 100, y: 300 },
        config: {
          field: "financialImpact",
          operator: "GREATER_THAN",
          value: 10000,
        },
      },
      {
        id: "director_approval",
        type: "APPROVAL",
        label: "Director Approval",
        position: { x: 100, y: 400 },
        config: {
          approverRole: "DIRECTOR",
          requiresComment: true,
        },
      },
      {
        id: "cfo_approval",
        type: "APPROVAL",
        label: "CFO Approval",
        position: { x: 100, y: 500 },
        config: {
          approverRole: "CFO",
          requiresComment: true,
          reason: "High financial impact",
        },
      },
      {
        id: "approved",
        type: "AUTO_ACTION",
        label: "Update Status: Approved",
        position: { x: 100, y: 600 },
        config: {
          action: "UPDATE_STATUS",
          newStatus: "APPROVED",
        },
      },
      {
        id: "end",
        type: "END",
        label: "Proceed to Implementation",
        position: { x: 100, y: 700 },
        config: {},
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "supervisor_approval" },
      { id: "e2", source: "supervisor_approval", target: "check_cost" },
      {
        id: "e3",
        source: "check_cost",
        target: "director_approval",
        condition: "TRUE",
      },
      {
        id: "e4",
        source: "check_cost",
        target: "approved",
        condition: "FALSE",
      },
      { id: "e5", source: "director_approval", target: "cfo_approval" },
      { id: "e6", source: "cfo_approval", target: "approved" },
      { id: "e7", source: "approved", target: "end" },
    ],
  },
};

// Auto-Action Configurations
const AUTO_ACTIONS = {
  ASSIGN_TO_ROLE: "Assign CAPA to user with specific role",
  ASSIGN_TO_USER: "Assign CAPA to specific user",
  UPDATE_STATUS: "Change CAPA status",
  ADD_COMMENT: "Add automated comment",
  SEND_EMAIL: "Send email notification",
  CREATE_TASK: "Create follow-up task",
  SCHEDULE_INSPECTION: "Schedule quality inspection",
  GENERATE_REPORT: "Generate automated report",
  UPDATE_PRIORITY: "Change priority level",
  CREATE_TRAINING: "Create training requirement",
  LOCK_CAPA: "Lock CAPA from editing",
  ARCHIVE_CAPA: "Move to archive",
};

// GET: Retrieve workflows and templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const templateId = searchParams.get("templateId");
    const workflowId = searchParams.get("workflowId");

    // Get workflow templates
    if (action === "templates") {
      return NextResponse.json({
        success: true,
        templates: Object.entries(WORKFLOW_TEMPLATES).map(
          ([key, template]) => ({
            id: key,
            ...template,
          }),
        ),
      });
    }

    // Get specific template
    if (templateId) {
      const template =
        WORKFLOW_TEMPLATES[templateId as keyof typeof WORKFLOW_TEMPLATES];
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        template: {
          id: templateId,
          ...template,
        },
      });
    }

    // Get node types and actions
    if (action === "node_types") {
      return NextResponse.json({
        success: true,
        nodeTypes: Object.entries(NODE_TYPES).map(([key, value]) => ({
          id: key,
          type: value,
        })),
        autoActions: Object.entries(AUTO_ACTIONS).map(([key, description]) => ({
          id: key,
          description,
        })),
      });
    }

    // Get specific workflow
    if (workflowId) {
      // @ts-ignore - Model exists but TS needs restart
      const workflow = await prisma.workflowTemplate.findUnique({
        where: { id: workflowId },
        include: {
          instances: {
            include: {
              capa: {
                select: {
                  id: true,
                  capaNumber: true,
                  title: true,
                  status: true,
                },
              },
            },
            orderBy: { startedAt: "desc" },
            take: 10,
          },
        },
      });

      if (!workflow) {
        return NextResponse.json(
          { error: "Workflow not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        workflow,
      });
    }

    // List all workflows for organization
    // @ts-ignore - session.user may have organizationId
    const organizationId = session.user.organizationId;
    // @ts-ignore - Model exists but TS needs restart

    const workflows = await prisma.workflowTemplate.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { instances: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Statistics
    const stats = {
      activeWorkflows: workflows.filter((w: any) => w.isActive).length,
      totalInstances: workflows.reduce(
        (sum: number, w: any) => sum + w._count.instances,
        0,
      ),
      templatesAvailable: Object.keys(WORKFLOW_TEMPLATES).length,
    };

    return NextResponse.json({
      success: true,
      workflows,
      stats,
    });
  } catch (error) {
    console.error("GET /api/capa/workflow-builder error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve workflows" },
      { status: 500 },
    );
  }
}

// POST: Create workflow, execute workflow actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // @ts-ignore
    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    // CREATE WORKFLOW FROM TEMPLATE
    if (action === "CREATE_FROM_TEMPLATE") {
      const { templateId, name, description } = body;

      const template =
        WORKFLOW_TEMPLATES[templateId as keyof typeof WORKFLOW_TEMPLATES];
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 },
        );
        // @ts-ignore - Model exists but TS needs restart
      }

      const workflow = await prisma.workflowTemplate.create({
        data: {
          organizationId,
          name: name || template.name,
          description: description || template.description,
          category: template.category,
          icon: template.icon,
          nodes: template.nodes,
          edges: template.edges,
          isActive: true,
          createdBy: userId,
          createdAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Workflow created from template",
        workflow,
      });
    }

    // CREATE CUSTOM WORKFLOW
    if (action === "CREATE_CUSTOM") {
      const { name, description, category, icon, nodes, edges } = body;

      if (!name || !nodes || !edges) {
        return NextResponse.json(
          { error: "Missing required fields: name, nodes, edges" },
          { status: 400 },
        );
        // @ts-ignore - Model exists but TS needs restart
      }

      const workflow = await prisma.workflowTemplate.create({
        data: {
          organizationId,
          name,
          description,
          category: category || "Custom",
          icon: icon || "⚙️",
          nodes,
          edges,
          isActive: true,
          createdBy: userId,
          createdAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Custom workflow created",
        workflow,
      });
    }

    // UPDATE WORKFLOW
    if (action === "UPDATE_WORKFLOW") {
      const { workflowId, name, description, nodes, edges, isActive } = body;

      if (!workflowId) {
        return NextResponse.json(
          { error: "workflowId required" },
          { status: 400 },
        );
        // @ts-ignore - Model exists but TS needs restart
      }

      const workflow = await prisma.workflowTemplate.update({
        where: { id: workflowId },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(nodes && { nodes }),
          ...(edges && { edges }),
          ...(typeof isActive === "boolean" && { isActive }),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Workflow updated",
        workflow,
      });
    }

    // START WORKFLOW INSTANCE FOR CAPA
    if (action === "START_WORKFLOW") {
      const { workflowId, capaId } = body;

      if (!workflowId || !capaId) {
        return NextResponse.json(
          { error: "workflowId and capaId required" },
          { status: 400 },
        );
      }
      // @ts-ignore - Model exists but TS needs restart

      // Get workflow template
      const workflow = await prisma.workflowTemplate.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        return NextResponse.json(
          { error: "Workflow not found" },
          { status: 404 },
        );
      }
      // @ts-ignore - Model exists but TS needs restart

      // Create instance
      const instance = await prisma.workflowInstance.create({
        data: {
          workflowId,
          capaId,
          currentNodeId: (workflow.nodes as any[])[0]?.id || "start",
          status: "ACTIVE",
          progress: 0,
          startedAt: new Date(),
        },
      });

      // Execute first node (START node)
      const firstNode = (workflow.nodes as any[])[0];
      await executeWorkflowNode(instance.id, firstNode, capaId);

      return NextResponse.json({
        success: true,
        message: "Workflow started",
        instance,
      });
    }

    // ADVANCE WORKFLOW TO NEXT NODE
    if (action === "ADVANCE_WORKFLOW") {
      const { instanceId, decisionResult } = body;

      if (!instanceId) {
        return NextResponse.json(
          { error: "instanceId required" },
          { status: 400 },
        );
        // @ts-ignore - Model exists but TS needs restart
      }

      const instance = await prisma.workflowInstance.findUnique({
        where: { id: instanceId },
        include: {
          workflow: true,
          capa: true,
        },
      });

      if (!instance) {
        return NextResponse.json(
          { error: "Instance not found" },
          { status: 404 },
        );
      }

      // Find next node based on edges
      const edges = instance.workflow.edges as any[];
      const nextEdge = edges.find((e) => {
        if (e.source === instance.currentNodeId) {
          // If condition-based edge, check decision result
          if (e.condition) {
            return e.condition === decisionResult;
          }
          return true;
        }
        return false;
      });

      if (
        // @ts-ignore - Model exists but TS needs restart
        !nextEdge
      ) {
        // No next node = workflow complete
        await prisma.workflowInstance.update({
          where: { id: instanceId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            progress: 100,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Workflow completed",
        });
      }

      // Move to next node
      const nextNode = (instance.workflow.nodes as any[]).find(
        (n) => n.id === nextEdge.target,
      );

      if (!nextNode) {
        return NextResponse.json(
          { error: "Next node not found" },
          { status: 404 },
        );
      }

      // Calculate progress
      const totalNodes = (instance.workflow.nodes as any[]).length;
      const currentNodeIndex = (instance.workflow.nodes as any[]).findIndex(
        (n) => n.id === nextNode.id,
      );
      // @ts-ignore - Model exists but TS needs restart
      const progress = Math.round((currentNodeIndex / totalNodes) * 100);

      await prisma.workflowInstance.update({
        where: { id: instanceId },
        data: {
          currentNodeId: nextNode.id,
          progress,
        },
      });

      // Execute node action
      await executeWorkflowNode(instanceId, nextNode, instance.capaId);

      return NextResponse.json({
        success: true,
        message: "Workflow advanced",
        currentNode: nextNode,
        progress,
      });
    }

    // DELETE WORKFLOW
    if (action === "DELETE_WORKFLOW") {
      const { workflowId } = body;

      if (!workflowId) {
        return NextResponse.json(
          { error: "workflowId required" },
          { status: 400 },
        );
        // @ts-ignore - Model exists but TS needs restart
      }

      await prisma.workflowTemplate.delete({
        where: { id: workflowId },
      });

      return NextResponse.json({
        success: true,
        message: "Workflow deleted",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/capa/workflow-builder error:", error);
    return NextResponse.json(
      { error: "Failed to process workflow action" },
      { status: 500 },
    );
  }
}

// Helper: Execute workflow node action
async function executeWorkflowNode(
  instanceId: string,
  node: any,
  capaId: string,
) {
  try {
    const { type, config } = node;
    // @ts-ignore - Model exists but TS needs restart

    // Log execution
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        executionLog: {
          push: {
            nodeId: node.id,
            nodeType: type,
            executedAt: new Date(),
            result: "SUCCESS",
          },
        },
      },
    });

    // Execute based on node type
    switch (type) {
      case "AUTO_ACTION":
        await executeAutoAction(config, capaId);
        break;

      case "NOTIFICATION":
        await sendWorkflowNotification(config, capaId);
        break;

      case "TRAINING":
        await createWorkflowTraining(config, capaId);
        break;

      case "DELAY":
        // Delays are handled by scheduler (not implemented in this demo)
        console.log(`DELAY node: Wait ${config.duration} ${config.unit}`);
        break;

      case "START":
      case "END":
      case "APPROVAL":
      case "CONDITION":
      case "INSPECTION":
      case "DOCUMENTATION":
        // These nodes require manual interaction or external triggers
        console.log(`${type} node executed (manual action may be required)`);
        break;
    }
  } catch (error) {
    console.error("executeWorkflowNode error:", error);
    throw error;
  }
}

// Execute auto-action
async function executeAutoAction(config: any, capaId: string) {
  const { action } = config;

  switch (action) {
    case "UPDATE_STATUS":
      await prisma.correctivePreventiveAction.update({
        where: { id: capaId },
        data: { status: config.newStatus },
      });
      break;

    case "UPDATE_PRIORITY":
      await prisma.correctivePreventiveAction.update({
        where: { id: capaId },
        data: { priority: config.newPriority },
      });
      break;

    case "ASSIGN_TO_ROLE":
      // Find first user with role (simplified)
      console.log(`Assign to role: ${config.roleId}`);
      break;

    case "ADD_COMMENT":
      console.log(`Add comment: ${config.comment}`);
      break;
  }
}

// Send workflow notification
async function sendWorkflowNotification(config: any, capaId: string) {
  console.log(`Sending notification to: ${config.recipients}`);
  console.log(`Message: ${config.messageTemplate}`);
  // Actual email sending would be implemented here
}

// Create training from workflow
async function createWorkflowTraining(config: any, capaId: string) {
  console.log(`Creating training: ${config.courseTemplate}`);
  // Training creation logic
}
