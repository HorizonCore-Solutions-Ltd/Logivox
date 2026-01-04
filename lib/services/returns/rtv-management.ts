/**
 * Return-to-Vendor (RTV) Management System
 * Vendor claims, authorizations, packing, shipping, credit tracking
 */

export type RTVStatus = 'DRAFT' | 'PENDING_AUTH' | 'AUTHORIZED' | 'REJECTED' | 'PACKED' | 'SHIPPED' | 'RECEIVED_BY_VENDOR' | 'CREDITED' | 'CLOSED' | 'DISPUTED';
export type ClaimType = 'DEFECTIVE' | 'DAMAGED' | 'WARRANTY' | 'OVERSHIP' | 'EXPIRED' | 'RECALL' | 'OTHER';

export interface RTVRequest {
  id: string;
  rtvNumber: string; // RTV-YYYYMMDD-XXX
  status: RTVStatus;
  
  // Vendor
  vendorId: string;
  vendorName: string;
  vendorContact?: {
    name: string;
    email: string;
    phone?: string;
  };
  
  // Claim Details
  claimType: ClaimType;
  reason: string;
  description: string;
  
  // Items
  lines: RTVLine[];
  
  // Authorization
  vendorRMA?: string; // vendor's RMA/RA number
  authorizedBy?: string;
  authorizedAt?: Date;
  authorizationNotes?: string;
  
  // Financial
  claimAmount: number;
  expectedCredit: number;
  actualCredit?: number;
  currency: string;
  creditMethod?: 'ACCOUNT_CREDIT' | 'REFUND' | 'REPLACEMENT' | 'REPAIR';
  
  // Shipping
  carrier?: string;
  trackingNumber?: string;
  shippingCost?: number;
  prepaidLabel?: boolean;
  labelUrl?: string;
  
  // Packing
  packingListUrl?: string;
  packagedBy?: string;
  packagedAt?: Date;
  
  // Timing
  requestedDate: Date;
  approvalDeadline?: Date;
  shipByDate?: Date;
  shippedDate?: Date;
  deliveredDate?: Date;
  creditedDate?: Date;
  
  // Evidence
  photos: string[];
  documents: string[];
  
  // Notes & Communication
  notes: {
    timestamp: Date;
    userId: string;
    userName: string;
    note: string;
    type: 'INTERNAL' | 'VENDOR_COMMUNICATION';
  }[];
  
  // Dispute
  disputed: boolean;
  disputeReason?: string;
  disputeResolvedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface RTVLine {
  id: string;
  rmaLineId?: string; // link back to original return
  
  // Product
  sku: string;
  productName: string;
  vendorSKU?: string; // vendor's SKU if different
  
  // Quantity
  quantityReturning: number;
  quantityAccepted?: number; // by vendor
  quantityRejected?: number; // by vendor
  
  // Identification
  serial?: string;
  lot?: string;
  purchaseOrderNumber?: string;
  invoiceNumber?: string;
  
  // Condition
  condition: string;
  defectDescription?: string;
  
  // Financial
  unitCost: number;
  totalCost: number;
  creditAmount?: number;
  
  // Evidence
  photos: string[];
  
  // Vendor Response
  vendorNotes?: string;
  vendorDecision?: 'ACCEPT' | 'REJECT' | 'PARTIAL';
}

export interface VendorReturnPolicy {
  vendorId: string;
  vendorName: string;
  
  // Policy Details
  returnWindow: number; // days
  requiresRMA: boolean;
  rmaRequestMethod: 'EMAIL' | 'PORTAL' | 'PHONE' | 'API';
  rmaContact: {
    name?: string;
    email?: string;
    phone?: string;
    url?: string;
  };
  
  // Accepted Reasons
  acceptedReasons: ClaimType[];
  
  // Requirements
  requirements: {
    requiresPhotos: boolean;
    requiresSerials: boolean;
    requiresPONumber: boolean;
    requiresOriginalPackaging: boolean;
    requiresDefectDescription: boolean;
  };
  
  // Shipping
  shipping: {
    prepaidLabels: boolean;
    shippingCostCovered: boolean;
    preferredCarrier?: string;
    returnAddress: {
      name: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  
  // Credit Terms
  credit: {
    methods: string[];
    restockingFee: boolean;
    restockingFeePercent?: number;
    creditTiming: number; // days
    partialCreditsAllowed: boolean;
  };
  
  // SLA
  sla: {
    responseTime: number; // hours
    processingTime: number; // days
  };
  
  // Metadata
  active: boolean;
  lastUpdated: Date;
}

/**
 * RTV Management Service
 */
export class RTVService {
  /**
   * Create RTV request
   */
  async createRTVRequest(request: {
    vendorId: string;
    claimType: ClaimType;
    reason: string;
    description: string;
    lines: {
      rmaLineId?: string;
      sku: string;
      quantityReturning: number;
      serial?: string;
      lot?: string;
      poNumber?: string;
      unitCost: number;
      condition: string;
      defectDescription?: string;
      photos?: string[];
    }[];
    photos?: string[];
    documents?: string[];
  }): Promise<RTVRequest> {
    // Get vendor policy
    const policy = await this.getVendorPolicy(request.vendorId);
    
    if (!policy) {
      throw new Error(`No return policy found for vendor ${request.vendorId}`);
    }
    
    // Validate request against policy
    await this.validateRequest(request, policy);
    
    // Generate RTV number
    const rtvNumber = await this.generateRTVNumber();
    
    // Calculate claim amount
    const claimAmount = request.lines.reduce((sum, line) => 
      sum + (line.unitCost * line.quantityReturning), 0
    );
    
    const rtv: RTVRequest = {
      id: `rtv-${Date.now()}`,
      rtvNumber,
      status: policy.requiresRMA ? 'PENDING_AUTH' : 'AUTHORIZED',
      vendorId: request.vendorId,
      vendorName: policy.vendorName,
      vendorContact: {
        email: policy.rmaContact.email || '',
        phone: policy.rmaContact.phone,
        name: policy.rmaContact.name || '',
      },
      claimType: request.claimType,
      reason: request.reason,
      description: request.description,
      lines: request.lines.map((line, index) => ({
        id: `line-${index + 1}`,
        rmaLineId: line.rmaLineId,
        sku: line.sku,
        productName: '', // lookup
        vendorSKU: line.sku,
        quantityReturning: line.quantityReturning,
        serial: line.serial,
        lot: line.lot,
        purchaseOrderNumber: line.poNumber,
        condition: line.condition,
        defectDescription: line.defectDescription,
        unitCost: line.unitCost,
        totalCost: line.unitCost * line.quantityReturning,
        photos: line.photos || [],
      })),
      claimAmount,
      expectedCredit: claimAmount * (policy.credit.restockingFee ? (1 - (policy.credit.restockingFeePercent || 0) / 100) : 1),
      currency: 'USD',
      requestedDate: new Date(),
      approvalDeadline: new Date(Date.now() + policy.sla.responseTime * 60 * 60 * 1000),
      photos: request.photos || [],
      documents: request.documents || [],
      notes: [],
      disputed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    };
    
    // If requires RMA, initiate authorization request
    if (policy.requiresRMA) {
      await this.requestVendorAuthorization(rtv, policy);
    }
    
    return rtv;
  }

  /**
   * Record vendor authorization
   */
  async recordAuthorization(rtvId: string, authorization: {
    vendorRMA: string;
    authorizedBy: string;
    authorizationNotes?: string;
    expectedCredit?: number;
    creditMethod?: string;
    shipByDate?: Date;
  }): Promise<void> {
    // Update RTV with authorization details
    // Change status to AUTHORIZED
    // Generate packing list
    // If vendor provides prepaid label, attach it
  }

  /**
   * Pack RTV
   */
  async packRTV(rtvId: string, packing: {
    packagedBy: string;
    boxes: {
      boxNumber: number;
      weight: number;
      dimensions: { length: number; width: number; height: number };
      contents: string[];
    }[];
  }): Promise<void> {
    // Generate packing list
    // Update status to PACKED
    // Ready for shipping
  }

  /**
   * Ship RTV
   */
  async shipRTV(rtvId: string, shipping: {
    carrier: string;
    trackingNumber: string;
    shippingCost: number;
    labelUrl?: string;
  }): Promise<void> {
    // Update shipping details
    // Change status to SHIPPED
    // Send notification to vendor
    // Setup tracking monitoring
  }

  /**
   * Record vendor receipt
   */
  async recordVendorReceipt(rtvId: string, receipt: {
    receivedDate: Date;
    inspectionResults?: {
      lineId: string;
      quantityAccepted: number;
      quantityRejected: number;
      vendorNotes?: string;
      vendorDecision: 'ACCEPT' | 'REJECT' | 'PARTIAL';
    }[];
  }): Promise<void> {
    // Update lines with vendor decisions
    // If any rejections, calculate adjusted credit
    // Change status to RECEIVED_BY_VENDOR
  }

  /**
   * Record credit received
   */
  async recordCredit(rtvId: string, credit: {
    creditAmount: number;
    creditDate: Date;
    creditMethod: string;
    creditReference?: string;
    notes?: string;
  }): Promise<void> {
    // Update actual credit amount
    // Change status to CREDITED
    // If credit doesn't match expected, flag for review
    // Update accounting
  }

  /**
   * Open dispute
   */
  async openDispute(rtvId: string, dispute: {
    reason: string;
    evidence: string[];
    requestedResolution: string;
  }): Promise<void> {
    // Change status to DISPUTED
    // Create dispute record
    // Notify vendor and management
    // Setup escalation workflow
  }

  /**
   * Get RTV metrics
   */
  async getMetrics(period: { start: Date; end: Date }): Promise<RTVMetrics> {
    return {
      period,
      totalRTVs: 45,
      authorized: 42,
      rejected: 3,
      shipped: 38,
      credited: 35,
      authorizationRate: 93.3,
      avgAuthorizationTime: 1.8, // days
      avgCreditTime: 14.5, // days
      totalClaimAmount: 18750.00,
      totalCreditReceived: 17235.00,
      creditRecoveryRate: 91.9,
      byVendor: [
        { vendorId: 'V001', vendorName: 'Vendor A', rtvCount: 23, claimAmount: 9500, creditReceived: 8740, recoveryRate: 92.0 },
        { vendorId: 'V002', vendorName: 'Vendor B', rtvCount: 15, claimAmount: 6250, creditReceived: 5895, recoveryRate: 94.3 },
        { vendorId: 'V003', vendorName: 'Vendor C', rtvCount: 7, claimAmount: 3000, creditReceived: 2600, recoveryRate: 86.7 },
      ],
      byClaimType: [
        { type: 'DEFECTIVE', count: 28, amount: 11200, avgCreditTime: 12.3 },
        { type: 'DAMAGED', count: 10, amount: 4500, avgCreditTime: 15.8 },
        { type: 'WARRANTY', count: 7, amount: 3050, avgCreditTime: 18.2 },
      ],
    };
  }

  /**
   * Get vendor return policy
   */
  async getVendorPolicy(vendorId: string): Promise<VendorReturnPolicy | null> {
    // Query database for vendor policy
    return null;
  }

  /**
   * Bulk create RTVs from eligible returns
   */
  async createBulkRTV(vendorId: string, filters: {
    defectiveOnly?: boolean;
    minQuantity?: number;
    dateRange?: { start: Date; end: Date };
  }): Promise<RTVRequest[]> {
    // Find all eligible returns for vendor
    // Group by policy requirements
    // Create RTV requests
    return [];
  }

  // Helper methods
  private async validateRequest(request: any, policy: VendorReturnPolicy): Promise<void> {
    // Check if claim type is accepted
    if (!policy.acceptedReasons.includes(request.claimType)) {
      throw new Error(`Vendor does not accept ${request.claimType} returns`);
    }
    
    // Check requirements
    if (policy.requirements.requiresPhotos && (!request.photos || request.photos.length === 0)) {
      throw new Error('Vendor requires photos for returns');
    }
    
    // Additional validation
  }

  private async generateRTVNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = 1; // increment from DB
    return `RTV-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  }

  private async requestVendorAuthorization(rtv: RTVRequest, policy: VendorReturnPolicy): Promise<void> {
    // Send authorization request via configured method
    switch (policy.rmaRequestMethod) {
      case 'EMAIL':
        await this.sendAuthorizationEmail(rtv, policy);
        break;
      case 'API':
        await this.callVendorAPI(rtv, policy);
        break;
      case 'PORTAL':
        // Generate portal link for manual submission
        break;
      default:
        // Log for manual handling
        break;
    }
  }

  private async sendAuthorizationEmail(rtv: RTVRequest, policy: VendorReturnPolicy): Promise<void> {
    // Compose and send email to vendor
  }

  private async callVendorAPI(rtv: RTVRequest, policy: VendorReturnPolicy): Promise<void> {
    // Call vendor's RMA API if integrated
  }
}

export interface RTVMetrics {
  period: { start: Date; end: Date };
  totalRTVs: number;
  authorized: number;
  rejected: number;
  shipped: number;
  credited: number;
  authorizationRate: number; // %
  avgAuthorizationTime: number; // days
  avgCreditTime: number; // days
  totalClaimAmount: number;
  totalCreditReceived: number;
  creditRecoveryRate: number; // %
  byVendor: {
    vendorId: string;
    vendorName: string;
    rtvCount: number;
    claimAmount: number;
    creditReceived: number;
    recoveryRate: number;
  }[];
  byClaimType: {
    type: string;
    count: number;
    amount: number;
    avgCreditTime: number;
  }[];
}
