/**
 * Refurbishment & Repair Work Order System
 * Multi-step workflows, QA gates, parts tracking, cost management
 */

export type RWOStatus = 'CREATED' | 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'QA_PENDING' | 'QA_PASS' | 'QA_FAIL' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type RefurbOutcome = 'RESTOCK_A' | 'RESTOCK_B' | 'RESTOCK_C' | 'RESALE' | 'SCRAP' | 'RTV' | 'QUARANTINE';
export type StepType = 'INSPECTION' | 'CLEANING' | 'REPAIR' | 'REPLACEMENT' | 'TESTING' | 'PACKAGING' | 'QA';

export interface RefurbWorkOrder {
  id: string;
  rwoNumber: string; // RWO-YYYYMMDD-XXX
  status: RWOStatus;
  
  // Source
  rmaId?: string;
  receiptLineId: string;
  sku: string;
  serial?: string;
  lot?: string;
  
  // Priority
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  priorityReason?: string;
  
  // Condition
  initialGrade: string; // 'B', 'C', 'D'
  targetGrade: string; // 'A', 'B'
  currentGrade?: string;
  
  // Problem Description
  reportedIssues: string[];
  symptoms: string;
  customerNotes?: string;
  
  // Workflow
  workflowTemplate: string; // Reference to template
  steps: RefurbStep[];
  currentStepIndex: number;
  
  // Assignment
  assignedTo?: string; // technician user ID
  assignedAt?: Date;
  team?: string;
  
  // Parts & Materials
  partsUsed: {
    partSku: string;
    partName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
  
  // Costs
  costs: {
    labor: number; // hours * rate
    parts: number;
    overhead: number;
    total: number;
  };
  laborHours: number;
  laborRate: number; // per hour
  
  // QA
  qaResults?: QAResult[];
  
  // Outcome
  outcome?: RefurbOutcome;
  finalGrade?: string;
  restockLocationId?: string;
  
  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletionAt?: Date;
  
  // SLA
  slaDeadline?: Date;
  slaBreach: boolean;
  
  // Evidence
  photos: {
    stage: string; // 'BEFORE', 'DURING', 'AFTER'
    url: string;
    caption?: string;
    timestamp: Date;
  }[];
  
  // Notes
  notes: {
    timestamp: Date;
    userId: string;
    userName: string;
    note: string;
  }[];
  
  // Metadata
  updatedAt: Date;
}

export interface RefurbStep {
  id: string;
  stepNumber: number;
  name: string;
  description: string;
  type: StepType;
  
  // Requirements
  requiresTools?: string[];
  requiresParts?: string[];
  requiredSkills?: string[];
  estimatedMinutes: number;
  
  // Instructions
  instructions: string;
  safetyNotes?: string;
  qualityChecks: string[];
  
  // Status
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  
  // Execution
  startedAt?: Date;
  completedAt?: Date;
  actualMinutes?: number;
  completedBy?: string;
  
  // Results
  passed: boolean;
  notes?: string;
  photos?: string[];
  
  // Measurements & Tests
  measurements?: {
    name: string;
    value: number;
    unit: string;
    spec?: string; // expected spec
    withinSpec: boolean;
  }[];
  
  // Parts used in this step
  partsUsed?: {
    partSku: string;
    quantity: number;
  }[];
}

export interface QAResult {
  id: string;
  qaAt: Date;
  qaBy: string;
  qaByName: string;
  
  // Inspection
  passed: boolean;
  grade: string; // final condition grade
  
  // Checklist
  checks: {
    category: string; // 'FUNCTIONALITY', 'COSMETIC', 'PACKAGING', 'DOCUMENTATION'
    item: string;
    passed: boolean;
    notes?: string;
  }[];
  
  // Overall Assessment
  overallNotes: string;
  defectsFound: string[];
  
  // Decision
  decision: 'PASS' | 'FAIL_MINOR' | 'FAIL_MAJOR' | 'REWORK';
  reworkRequired?: string[];
  
  // Evidence
  photos: string[];
  
  // Signature
  digitalSignature?: string;
}

export interface RefurbWorkflowTemplate {
  id: string;
  name: string;
  sku?: string; // specific to SKU, or null for category-wide
  category?: string;
  
  // Conditions
  applicableFor: {
    initialGrades: string[]; // ['B', 'C']
    targetGrade: string; // 'A'
    issues?: string[]; // specific problems this template addresses
  };
  
  // Steps
  steps: {
    stepNumber: number;
    name: string;
    description: string;
    type: StepType;
    instructions: string;
    estimatedMinutes: number;
    requiresTools?: string[];
    requiresParts?: string[];
    qualityChecks: string[];
  }[];
  
  // Costs
  estimatedLaborHours: number;
  estimatedPartsCost: number;
  
  // Active
  active: boolean;
  version: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Refurbishment Management Service
 */
export class RefurbishmentService {
  /**
   * Create a new refurb work order
   */
  async createWorkOrder(request: {
    rmaId?: string;
    receiptLineId: string;
    sku: string;
    serial?: string;
    lot?: string;
    initialGrade: string;
    targetGrade: string;
    reportedIssues: string[];
    symptoms: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    photos?: string[];
  }): Promise<RefurbWorkOrder> {
    // Find appropriate workflow template
    const template = await this.findWorkflowTemplate(
      request.sku,
      request.initialGrade,
      request.targetGrade
    );

    if (!template) {
      throw new Error(`No refurbishment workflow found for SKU ${request.sku}`);
    }

    // Generate RWO number
    const rwoNumber = await this.generateRWONumber();

    // Create steps from template
    const steps: RefurbStep[] = template.steps.map((templateStep, index) => ({
      id: `step-${index + 1}`,
      stepNumber: templateStep.stepNumber,
      name: templateStep.name,
      description: templateStep.description,
      type: templateStep.type,
      requiresTools: templateStep.requiresTools,
      requiresParts: templateStep.requiresParts,
      estimatedMinutes: templateStep.estimatedMinutes,
      instructions: templateStep.instructions,
      qualityChecks: templateStep.qualityChecks,
      status: 'PENDING',
      passed: false,
    }));

    // Calculate priority
    const priority = request.priority || this.calculatePriority(request);

    // Calculate SLA deadline
    const slaDeadline = this.calculateSLADeadline(priority, template.estimatedLaborHours);

    const workOrder: RefurbWorkOrder = {
      id: `rwo-${Date.now()}`,
      rwoNumber,
      status: 'CREATED',
      rmaId: request.rmaId,
      receiptLineId: request.receiptLineId,
      sku: request.sku,
      serial: request.serial,
      lot: request.lot,
      priority,
      initialGrade: request.initialGrade,
      targetGrade: request.targetGrade,
      reportedIssues: request.reportedIssues,
      symptoms: request.symptoms,
      workflowTemplate: template.id,
      steps,
      currentStepIndex: 0,
      partsUsed: [],
      costs: {
        labor: 0,
        parts: 0,
        overhead: 0,
        total: 0,
      },
      laborHours: 0,
      laborRate: 25, // $25/hour default
      createdAt: new Date(),
      estimatedCompletionAt: slaDeadline,
      slaDeadline,
      slaBreach: false,
      photos: request.photos?.map((url, index) => ({
        stage: 'BEFORE',
        url,
        caption: `Initial condition ${index + 1}`,
        timestamp: new Date(),
      })) || [],
      notes: [],
      updatedAt: new Date(),
    };

    return workOrder;
  }

  /**
   * Assign work order to technician
   */
  async assignWorkOrder(rwoId: string, technicianId: string, team?: string): Promise<void> {
    // Update work order
    // Send notification to technician
  }

  /**
   * Start a refurb step
   */
  async startStep(rwoId: string, stepId: string, userId: string): Promise<void> {
    // Update step status to IN_PROGRESS
    // Record start time
    // Update work order status if first step
  }

  /**
   * Complete a refurb step
   */
  async completeStep(rwoId: string, stepId: string, result: {
    passed: boolean;
    notes?: string;
    photos?: string[];
    measurements?: any[];
    partsUsed?: { partSku: string; quantity: number }[];
  }): Promise<void> {
    // Update step with results
    // Calculate actual time
    // Update labor hours and costs
    // Move to next step or route to QA
  }

  /**
   * Add parts to work order
   */
  async addParts(rwoId: string, parts: { partSku: string; quantity: number; unitCost: number }[]): Promise<void> {
    // Add parts to partsUsed array
    // Update costs
    // Check if waiting for parts - if so, resume
  }

  /**
   * Route to QA
   */
  async routeToQA(rwoId: string): Promise<void> {
    // Update status to QA_PENDING
    // Notify QA team
  }

  /**
   * Perform QA inspection
   */
  async performQA(rwoId: string, qa: {
    qaBy: string;
    passed: boolean;
    grade: string;
    checks: { category: string; item: string; passed: boolean; notes?: string }[];
    overallNotes: string;
    defectsFound?: string[];
    decision: 'PASS' | 'FAIL_MINOR' | 'FAIL_MAJOR' | 'REWORK';
    reworkRequired?: string[];
    photos: string[];
  }): Promise<QAResult> {
    const qaResult: QAResult = {
      id: `qa-${Date.now()}`,
      qaAt: new Date(),
      qaBy: qa.qaBy,
      qaByName: 'QA Inspector', // lookup from user ID
      passed: qa.passed,
      grade: qa.grade,
      checks: qa.checks,
      overallNotes: qa.overallNotes,
      defectsFound: qa.defectsFound || [],
      decision: qa.decision,
      reworkRequired: qa.reworkRequired,
      photos: qa.photos,
    };

    // Update work order with QA result
    // If passed, move to completion
    // If failed, create rework steps
    // If fail major, mark as failed

    return qaResult;
  }

  /**
   * Complete work order
   */
  async completeWorkOrder(rwoId: string, outcome: {
    outcome: RefurbOutcome;
    finalGrade: string;
    restockLocationId?: string;
  }): Promise<void> {
    // Update work order status to COMPLETED
    // Record final outcome
    // Update inventory if restocking
    // Close associated RMA line
    // Calculate final costs
  }

  /**
   * Get refurb queue
   */
  async getQueue(filters?: {
    status?: RWOStatus[];
    priority?: string[];
    assignedTo?: string;
    sku?: string;
  }): Promise<RefurbWorkOrder[]> {
    // Query and return work orders matching filters
    return [];
  }

  /**
   * Get refurb metrics
   */
  async getMetrics(period: { start: Date; end: Date }): Promise<RefurbMetrics> {
    return {
      period,
      totalWorkOrders: 156,
      completed: 142,
      inProgress: 12,
      failed: 2,
      completionRate: 91.0,
      avgCompletionTime: 3.2, // days
      avgCost: 45.80,
      totalCostSaved: 12450.00, // value recovered - refurb cost
      qcPassRate: 94.5,
      topIssues: [
        { issue: 'Battery replacement', count: 45, avgCost: 35.00 },
        { issue: 'Screen repair', count: 38, avgCost: 65.00 },
        { issue: 'Cleaning/cosmetic', count: 32, avgCost: 15.00 },
      ],
    };
  }

  // Helper methods
  private async findWorkflowTemplate(
    sku: string,
    initialGrade: string,
    targetGrade: string
  ): Promise<RefurbWorkflowTemplate | null> {
    // Query database for matching template
    // Return most specific match (SKU-specific > category > generic)
    return null;
  }

  private async generateRWONumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    // Query for last number today and increment
    const sequence = 1;
    return `RWO-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  }

  private calculatePriority(request: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    // Base on value, customer tier, age, etc.
    return 'MEDIUM';
  }

  private calculateSLADeadline(priority: string, estimatedHours: number): Date {
    const hoursToAdd = priority === 'URGENT' ? 24 : priority === 'HIGH' ? 48 : priority === 'MEDIUM' ? 72 : 120;
    return new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);
  }
}

export interface RefurbMetrics {
  period: { start: Date; end: Date };
  totalWorkOrders: number;
  completed: number;
  inProgress: number;
  failed: number;
  completionRate: number; // %
  avgCompletionTime: number; // days
  avgCost: number;
  totalCostSaved: number;
  qcPassRate: number; // %
  topIssues: {
    issue: string;
    count: number;
    avgCost: number;
  }[];
}
