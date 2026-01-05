/**
 * Serial Number Tracking & Validation Service
 * Prevent serial swap fraud, track lifecycle, validate returns
 * Critical for high-value electronics, tools, and serialized inventory
 */

export type SerialStatus = 'MANUFACTURED' | 'RECEIVED' | 'INSPECTED' | 'AVAILABLE' | 'RESERVED' | 'PICKED' | 'SHIPPED' | 'SOLD' | 'RETURNED' | 'REFURBISHED' | 'SCRAPPED';
export type SerialEvent = 'CREATED' | 'RECEIVED' | 'INSPECTED' | 'PUT_AWAY' | 'PICKED' | 'SHIPPED' | 'SOLD' | 'RETURNED' | 'REFURB_STARTED' | 'REFURB_COMPLETED' | 'SCRAPPED' | 'DONATED';

export interface SerialNumber {
  id: string;
  serialNumber: string;
  
  // Product
  sku: string;
  productName: string;
  upc?: string;
  manufacturerSerialFormat?: string;
  
  // Status
  status: SerialStatus;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DEFECTIVE';
  
  // Current Location
  location: {
    warehouseId: string;
    zone?: string;
    binLocation?: string;
    customerId?: string; // If with customer
  };
  
  // Ownership
  ownerId?: string; // Customer who owns it
  organizationId: string;
  
  // Lifecycle
  lifecycle: SerialLifecycleEvent[];
  
  // Return History
  returnHistory: {
    timesReturned: number;
    lastReturnDate?: Date;
    returnReasons: string[];
  };
  
  // Warranty
  warranty?: {
    startDate: Date;
    endDate: Date;
    warrantyType: 'MANUFACTURER' | 'EXTENDED' | 'STORE';
    covered: boolean;
  };
  
  // Flags
  flags: {
    isCounterfeit: boolean;
    isStolenReported: boolean;
    hasMultipleReturns: boolean;
    requiresInspection: boolean;
    highValue: boolean;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastScannedAt?: Date;
}

export interface SerialLifecycleEvent {
  id: string;
  serialNumber: string;
  
  event: SerialEvent;
  status: SerialStatus;
  
  // Context
  orderId?: string;
  rmaId?: string;
  receiptId?: string;
  shipmentId?: string;
  customerId?: string;
  
  // Location
  warehouseId?: string;
  binLocation?: string;
  
  // User
  performedBy: string;
  performedByName?: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  timestamp: Date;
}

export interface SerialValidationRequest {
  serialNumber: string;
  sku?: string;
  
  // Context
  rmaId?: string;
  orderId?: string;
  customerId?: string;
  
  // Expected values (if validating against specific order)
  expectedSku?: string;
  expectedCondition?: string;
  expectedWarrantyStatus?: boolean;
}

export interface SerialValidationResult {
  serialNumber: string;
  valid: boolean;
  
  // Serial Info
  serialInfo?: {
    sku: string;
    productName: string;
    status: SerialStatus;
    condition: string;
    location: any;
  };
  
  // Validation Checks
  checks: {
    serialFormat: { valid: boolean; message: string };
    serialExists: { valid: boolean; message: string };
    soldToCustomer: { valid: boolean; orderId?: string; soldDate?: Date; message: string };
    alreadyReturned: { returned: boolean; previousRMAId?: string; returnCount: number; message: string };
    counterfeitRisk: { risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; confidence: number; evidence: string[]; message: string };
    serialMismatch: { matches: boolean; expectedSerial?: string; message: string };
    warranty: { inWarranty: boolean; warrantyEndDate?: Date; message: string };
  };
  
  // Lifecycle
  lifecycle: SerialLifecycleEvent[];
  
  // Decision
  recommendation: 'ACCEPT' | 'REVIEW' | 'REJECT';
  requiresPhotos: boolean;
  requiresManagerApproval: boolean;
  requiresInspection: boolean;
  
  // Fraud Indicators
  fraudSignals: Array<{
    signal: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }>;
  
  // Reasoning
  reasoning: string;
  confidence: number; // 0-100
}

export interface SerialSwapDetection {
  swapDetected: boolean;
  confidence: number; // 0-100
  
  // Comparison
  returnedSerial: string;
  expectedSerial: string;
  
  // Evidence
  evidence: {
    formatMismatch: boolean;
    skuMismatch: boolean;
    conditionMismatch: boolean;
    warrantyMismatch: boolean;
    unusualPattern: boolean;
  };
  
  // Details
  details: {
    returnedSerialInfo?: any;
    expectedSerialInfo?: any;
    discrepancies: string[];
  };
  
  // Recommendation
  action: 'ACCEPT' | 'INVESTIGATE' | 'REJECT' | 'CHARGEBACK';
  reasoning: string;
}

/**
 * Serial Tracking & Validation Service
 */
export class SerialTrackingService {
  
  /**
   * Validate serial number for return
   */
  async validateReturnSerial(request: SerialValidationRequest): Promise<SerialValidationResult> {
    
    const serialNumber = request.serialNumber.trim().toUpperCase();
    
    // Get serial info from database
    const serialInfo = await this.getSerialInfo(serialNumber);
    
    // Initialize validation checks
    const checks: any = {
      serialFormat: await this.validateSerialFormat(serialNumber, request.sku),
      serialExists: { valid: !!serialInfo, message: serialInfo ? 'Serial number found in system' : 'Serial number not found in system' },
      soldToCustomer: { valid: false, message: 'Not sold to this customer' },
      alreadyReturned: { returned: false, returnCount: 0, message: 'No previous returns' },
      counterfeitRisk: { risk: 'LOW', confidence: 0, evidence: [], message: 'No counterfeit indicators detected' },
      serialMismatch: { matches: true, message: 'Serial matches expected value' },
      warranty: { inWarranty: false, message: 'No warranty information' },
    };
    
    let valid = true;
    const fraudSignals: any[] = [];
    let recommendation: 'ACCEPT' | 'REVIEW' | 'REJECT' = 'ACCEPT';
    let requiresPhotos = false;
    let requiresManagerApproval = false;
    let requiresInspection = false;
    
    if (!serialInfo) {
      // Serial not found - high fraud risk
      valid = false;
      recommendation = 'REJECT';
      requiresManagerApproval = true;
      requiresPhotos = true;
      
      fraudSignals.push({
        signal: 'SERIAL_NOT_FOUND',
        severity: 'CRITICAL',
        description: 'Serial number not found in inventory system',
      });
      
      checks.counterfeitRisk = {
        risk: 'CRITICAL',
        confidence: 95,
        evidence: ['Serial not in system'],
        message: 'High risk of counterfeit or fraudulent return',
      };
    } else {
      // Serial exists - perform additional checks
      
      // Check if sold to customer
      if (request.customerId && request.orderId) {
        const soldCheck = await this.checkSerialSoldToCustomer({
          serialNumber,
          customerId: request.customerId,
          orderId: request.orderId,
        });
        
        checks.soldToCustomer = soldCheck;
        
        if (!soldCheck.valid) {
          valid = false;
          recommendation = 'REJECT';
          requiresManagerApproval = true;
          
          fraudSignals.push({
            signal: 'NOT_SOLD_TO_CUSTOMER',
            severity: 'CRITICAL',
            description: 'Serial number was not sold to this customer',
          });
        }
      }
      
      // Check return history
      const returnCheck = await this.checkReturnHistory(serialNumber);
      checks.alreadyReturned = returnCheck;
      
      if (returnCheck.returned) {
        if (returnCheck.returnCount > 2) {
          valid = false;
          recommendation = 'REJECT';
          
          fraudSignals.push({
            signal: 'SERIAL_RETURNER',
            severity: 'HIGH',
            description: `Serial returned ${returnCheck.returnCount} times previously`,
          });
        } else if (returnCheck.returnCount > 0) {
          requiresInspection = true;
          recommendation = 'REVIEW';
          
          fraudSignals.push({
            signal: 'MULTIPLE_RETURNS',
            severity: 'MEDIUM',
            description: `Serial returned ${returnCheck.returnCount} time(s) previously`,
          });
        }
      }
      
      // Check for serial mismatch
      if (request.expectedSku && serialInfo.sku !== request.expectedSku) {
        valid = false;
        recommendation = 'REJECT';
        requiresPhotos = true;
        
        checks.serialMismatch = {
          matches: false,
          message: `Serial belongs to ${serialInfo.sku}, expected ${request.expectedSku}`,
        };
        
        fraudSignals.push({
          signal: 'SKU_MISMATCH',
          severity: 'CRITICAL',
          description: 'Serial number does not match product SKU',
        });
      }
      
      // Check counterfeit risk
      const counterfeitCheck = await this.assessCounterfeitRisk({
        serialNumber,
        sku: serialInfo.sku,
        serialInfo,
      });
      
      checks.counterfeitRisk = counterfeitCheck;
      
      if (counterfeitCheck.risk === 'HIGH' || counterfeitCheck.risk === 'CRITICAL') {
        valid = false;
        recommendation = 'REJECT';
        requiresPhotos = true;
        requiresManagerApproval = true;
        
        fraudSignals.push({
          signal: 'COUNTERFEIT_SUSPECTED',
          severity: 'CRITICAL',
          description: counterfeitCheck.message,
        });
      }
      
      // Check warranty
      if (serialInfo.warranty) {
        const warrantyCheck = await this.checkWarrantyStatus(serialInfo.warranty);
        checks.warranty = warrantyCheck;
      }
    }
    
    // Get lifecycle
    const lifecycle = serialInfo?.lifecycle || [];
    
    // Generate reasoning
    const reasoning = this.generateValidationReasoning({
      valid,
      checks,
      fraudSignals,
    });
    
    // Calculate confidence
    const confidence = this.calculateValidationConfidence({
      checks,
      fraudSignals,
    });
    
    return {
      serialNumber,
      valid,
      serialInfo: serialInfo ? {
        sku: serialInfo.sku,
        productName: serialInfo.productName,
        status: serialInfo.status,
        condition: serialInfo.condition,
        location: serialInfo.location,
      } : undefined,
      checks,
      lifecycle,
      recommendation,
      requiresPhotos,
      requiresManagerApproval,
      requiresInspection,
      fraudSignals,
      reasoning,
      confidence,
    };
  }
  
  /**
   * Detect serial swap fraud
   */
  async detectSerialSwap(params: {
    returnedSerial: string;
    expectedSerial: string;
    rmaId?: string;
  }): Promise<SerialSwapDetection> {
    
    const returnedSerial = params.returnedSerial.trim().toUpperCase();
    const expectedSerial = params.expectedSerial.trim().toUpperCase();
    
    // Get serial info for both
    const returnedInfo = await this.getSerialInfo(returnedSerial);
    const expectedInfo = await this.getSerialInfo(expectedSerial);
    
    // Evidence collection
    const evidence = {
      formatMismatch: false,
      skuMismatch: false,
      conditionMismatch: false,
      warrantyMismatch: false,
      unusualPattern: false,
    };
    
    const discrepancies: string[] = [];
    
    // Check format mismatch
    if (returnedSerial.substring(0, 3) !== expectedSerial.substring(0, 3)) {
      evidence.formatMismatch = true;
      discrepancies.push('Serial format does not match');
    }
    
    // Check SKU mismatch
    if (returnedInfo && expectedInfo && returnedInfo.sku !== expectedInfo.sku) {
      evidence.skuMismatch = true;
      discrepancies.push(`Returned serial belongs to ${returnedInfo.sku}, expected ${expectedInfo.sku}`);
    }
    
    // Check condition mismatch
    if (returnedInfo && expectedInfo) {
      if (returnedInfo.condition === 'DEFECTIVE' && expectedInfo.condition === 'NEW') {
        evidence.conditionMismatch = true;
        discrepancies.push('Condition mismatch suggests swap');
      }
    }
    
    // Check warranty mismatch
    if (returnedInfo?.warranty && expectedInfo?.warranty) {
      if (returnedInfo.warranty.endDate < expectedInfo.warranty.endDate) {
        evidence.warrantyMismatch = true;
        discrepancies.push('Warranty end date is earlier than expected');
      }
    }
    
    // Check unusual pattern
    if (returnedInfo) {
      if (returnedInfo.returnHistory.timesReturned > 2) {
        evidence.unusualPattern = true;
        discrepancies.push(`Returned serial has been returned ${returnedInfo.returnHistory.timesReturned} times`);
      }
    }
    
    // Calculate confidence
    const evidenceCount = Object.values(evidence).filter(v => v).length;
    const confidence = Math.min(evidenceCount * 25, 100);
    
    const swapDetected = evidenceCount >= 2; // 2+ pieces of evidence
    
    // Determine action
    let action: 'ACCEPT' | 'INVESTIGATE' | 'REJECT' | 'CHARGEBACK' = 'ACCEPT';
    if (swapDetected) {
      if (confidence >= 75) {
        action = 'CHARGEBACK';
      } else if (confidence >= 50) {
        action = 'REJECT';
      } else {
        action = 'INVESTIGATE';
      }
    }
    
    const reasoning = swapDetected
      ? `Serial swap detected with ${confidence}% confidence. ${discrepancies.join('. ')}`
      : 'No serial swap detected';
    
    return {
      swapDetected,
      confidence,
      returnedSerial,
      expectedSerial,
      evidence,
      details: {
        returnedSerialInfo: returnedInfo,
        expectedSerialInfo: expectedInfo,
        discrepancies,
      },
      action,
      reasoning,
    };
  }
  
  /**
   * Track serial throughout lifecycle
   */
  async trackSerial(serialNumber: string): Promise<{
    serialNumber: string;
    currentStatus: SerialStatus;
    currentLocation: any;
    lifecycle: SerialLifecycleEvent[];
    stats: {
      daysInSystem: number;
      timesShipped: number;
      timesReturned: number;
      currentOwner?: string;
    };
  }> {
    
    const serialInfo = await this.getSerialInfo(serialNumber);
    
    if (!serialInfo) {
      throw new Error(`Serial ${serialNumber} not found`);
    }
    
    const daysInSystem = Math.floor((Date.now() - serialInfo.createdAt.getTime()) / 86400000);
    const timesShipped = serialInfo.lifecycle.filter(e => e.event === 'SHIPPED').length;
    const timesReturned = serialInfo.returnHistory.timesReturned;
    
    return {
      serialNumber,
      currentStatus: serialInfo.status,
      currentLocation: serialInfo.location,
      lifecycle: serialInfo.lifecycle,
      stats: {
        daysInSystem,
        timesShipped,
        timesReturned,
        currentOwner: serialInfo.ownerId,
      },
    };
  }
  
  /**
   * Record serial event
   */
  async recordSerialEvent(event: {
    serialNumber: string;
    event: SerialEvent;
    status: SerialStatus;
    orderId?: string;
    rmaId?: string;
    customerId?: string;
    warehouseId?: string;
    binLocation?: string;
    performedBy: string;
    notes?: string;
  }): Promise<void> {
    
    const serialInfo = await this.getSerialInfo(event.serialNumber);
    
    if (!serialInfo) {
      throw new Error(`Serial ${event.serialNumber} not found`);
    }
    
    const lifecycleEvent: SerialLifecycleEvent = {
      id: `EVT-${Date.now()}`,
      serialNumber: event.serialNumber,
      event: event.event,
      status: event.status,
      orderId: event.orderId,
      rmaId: event.rmaId,
      customerId: event.customerId,
      warehouseId: event.warehouseId,
      binLocation: event.binLocation,
      performedBy: event.performedBy,
      notes: event.notes,
      timestamp: new Date(),
    };
    
    // Add to lifecycle
    serialInfo.lifecycle.push(lifecycleEvent);
    serialInfo.status = event.status;
    serialInfo.lastScannedAt = new Date();
    serialInfo.updatedAt = new Date();
    
    // Update location if provided
    if (event.warehouseId || event.binLocation) {
      serialInfo.location = {
        warehouseId: event.warehouseId || serialInfo.location.warehouseId,
        binLocation: event.binLocation || serialInfo.location.binLocation,
      };
    }
    
    // Update owner if customer provided
    if (event.customerId && event.event === 'SOLD') {
      serialInfo.ownerId = event.customerId;
    } else if (event.event === 'RETURNED') {
      serialInfo.ownerId = undefined;
    }
    
    // Update return history if return event
    if (event.event === 'RETURNED') {
      serialInfo.returnHistory.timesReturned++;
      serialInfo.returnHistory.lastReturnDate = new Date();
      
      if (serialInfo.returnHistory.timesReturned > 1) {
        serialInfo.flags.hasMultipleReturns = true;
        serialInfo.flags.requiresInspection = true;
      }
    }
    
    // Save updated serial info
    await this.saveSerialInfo(serialInfo);
  }
  
  /**
   * Get serial statistics for organization
   */
  async getSerialStats(params: {
    organizationId: string;
    period: { start: Date; end: Date };
  }): Promise<{
    totalSerials: number;
    serialsShipped: number;
    serialsReturned: number;
    returnRate: number;
    counterfeitDetected: number;
    serialSwapsDetected: number;
    avgReturnsPerSerial: number;
  }> {
    // TODO: Implement stats calculation
    return {
      totalSerials: 0,
      serialsShipped: 0,
      serialsReturned: 0,
      returnRate: 0,
      counterfeitDetected: 0,
      serialSwapsDetected: 0,
      avgReturnsPerSerial: 0,
    };
  }
  
  // ===== PRIVATE HELPER METHODS =====
  
  private async getSerialInfo(serialNumber: string): Promise<SerialNumber | null> {
    // TODO: Implement actual database query
    return null;
  }
  
  private async validateSerialFormat(serialNumber: string, sku?: string): Promise<{
    valid: boolean;
    message: string;
  }> {
    
    // Check basic format (alphanumeric, length)
    if (serialNumber.length < 6 || serialNumber.length > 30) {
      return {
        valid: false,
        message: 'Serial number length invalid (must be 6-30 characters)',
      };
    }
    
    // Check if alphanumeric
    if (!/^[A-Z0-9-]+$/.test(serialNumber)) {
      return {
        valid: false,
        message: 'Serial number format invalid (must be alphanumeric)',
      };
    }
    
    return {
      valid: true,
      message: 'Serial number format valid',
    };
  }
  
  private async checkSerialSoldToCustomer(params: {
    serialNumber: string;
    customerId: string;
    orderId: string;
  }): Promise<{
    valid: boolean;
    orderId?: string;
    soldDate?: Date;
    message: string;
  }> {
    // TODO: Implement actual order/serial linkage check
    return {
      valid: true,
      orderId: params.orderId,
      soldDate: new Date(),
      message: 'Serial sold to customer on this order',
    };
  }
  
  private async checkReturnHistory(serialNumber: string): Promise<{
    returned: boolean;
    previousRMAId?: string;
    returnCount: number;
    message: string;
  }> {
    // TODO: Implement actual return history check
    return {
      returned: false,
      returnCount: 0,
      message: 'No previous returns for this serial',
    };
  }
  
  private async assessCounterfeitRisk(params: {
    serialNumber: string;
    sku: string;
    serialInfo: any;
  }): Promise<{
    risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    evidence: string[];
    message: string;
  }> {
    
    const evidence: string[] = [];
    let risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let confidence = 0;
    
    // Check if serial format matches manufacturer pattern
    // TODO: Implement manufacturer serial pattern validation
    
    // Check if multiple returns
    if (params.serialInfo.returnHistory.timesReturned > 2) {
      evidence.push('Multiple returns');
      risk = 'MEDIUM';
      confidence += 20;
    }
    
    // Check if counterfeit flag
    if (params.serialInfo.flags.isCounterfeit) {
      evidence.push('Previously flagged as counterfeit');
      risk = 'CRITICAL';
      confidence += 50;
    }
    
    const message = evidence.length > 0
      ? `Counterfeit risk: ${evidence.join(', ')}`
      : 'No counterfeit indicators detected';
    
    return {
      risk,
      confidence,
      evidence,
      message,
    };
  }
  
  private async checkWarrantyStatus(warranty: any): Promise<{
    inWarranty: boolean;
    warrantyEndDate?: Date;
    message: string;
  }> {
    
    const now = new Date();
    const inWarranty = warranty.endDate > now;
    
    return {
      inWarranty,
      warrantyEndDate: warranty.endDate,
      message: inWarranty
        ? `In warranty until ${warranty.endDate.toLocaleDateString()}`
        : 'Warranty expired',
    };
  }
  
  private generateValidationReasoning(params: {
    valid: boolean;
    checks: any;
    fraudSignals: any[];
  }): string {
    
    if (!params.valid) {
      const reasons = params.fraudSignals.map(s => s.description).join('; ');
      return `Serial validation failed: ${reasons}`;
    }
    
    return 'Serial validated successfully';
  }
  
  private calculateValidationConfidence(params: {
    checks: any;
    fraudSignals: any[];
  }): number {
    
    let confidence = 100;
    
    // Reduce confidence for each fraud signal
    for (const signal of params.fraudSignals) {
      if (signal.severity === 'CRITICAL') confidence -= 30;
      else if (signal.severity === 'HIGH') confidence -= 20;
      else if (signal.severity === 'MEDIUM') confidence -= 10;
      else confidence -= 5;
    }
    
    return Math.max(0, confidence);
  }
  
  private async saveSerialInfo(serialInfo: SerialNumber): Promise<void> {
    // TODO: Save to database
    console.log(`Saved serial info: ${serialInfo.serialNumber}`);
  }
}

export const serialTrackingService = new SerialTrackingService();
